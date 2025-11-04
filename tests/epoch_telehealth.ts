import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { EpochTelehealth } from "../target/types/epoch_telehealth";
import { randomBytes, randomUUID, createHash } from "crypto";
import {
  awaitComputationFinalization,
  getArciumEnv,
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgAddress,
  uploadCircuit,
  buildFinalizeCompDefTx,
  RescueCipher,
  deserializeLE,
  getMXEPublicKey,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  x25519,
  getClusterAccAddress,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";
import { expect } from "chai";

describe("EpochTelehealth", () => {
  // Configure the client to use the local cluster.
  // anchor.setProvider(anchor.AnchorProvider.env());
  // const program = anchor.workspace.EpochTelehealth as Program<EpochTelehealth>;
  // const provider = anchor.getProvider();

  // const arciumEnv = getArciumEnv();

  // Devnet configuration
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);
  const wallet = new anchor.Wallet(owner);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = anchor.workspace.EpochTelehealth as Program<EpochTelehealth>;

  // Update your test setup to use devnet when needed
  // const useDevnet = true; // Set to false for local testing

  // if (useDevnet) {
  //    // Use your cluster offset
  // } else {
  //   // Local configuration
  //   anchor.setProvider(anchor.AnchorProvider.env());
  //   const provider = anchor.getProvider() as anchor.AnchorProvider;
  //   const program = anchor.workspace.EpochTelehealth as Program<EpochTelehealth>;
  //   const arciumEnv = getArciumEnv();
  //   const clusterAccount = arciumEnv.arciumClusterPubkey;
  // }

  type Event = anchor.IdlEvents<(typeof program)["idl"]>;
  const awaitEvent = async <E extends keyof Event>(eventName: E) => {
    let listenerId: number;
    const event = await new Promise<Event[E]>((res) => {
      listenerId = program.addEventListener(eventName, (event) => {
        res(event);
      });
    });
    await program.removeEventListener(listenerId);
    return event;
  };

  const clusterAccount = getClusterAccAddress(1078779259);

  it("can store and share medical records securely!", async () => {

    console.log("Initializing share record computation definition");
    const initSig = await initShareRecordCompDef(program, owner, false, false);
    console.log(
      "Share record computation definition initialized with signature",
      initSig
    );

    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );

    console.log("MXE x25519 pubkey is", mxePublicKey);

    // Create encryption keys for the healthcare provider
    const providerPrivateKey = x25519.utils.randomSecretKey();
    const providerPublicKey = x25519.getPublicKey(providerPrivateKey);
    const sharedSecret = x25519.getSharedSecret(
      providerPrivateKey,
      mxePublicKey
    );
    const cipher = new RescueCipher(sharedSecret);

    // Sample medical record data (use UUIDs and free-text strings at the app layer)
    // We convert them to u64 hashes for the encrypted circuit and RescueCipher
    const uuidPatient = randomUUID();
    const uuidDoctor = randomUUID();
    const uuidRecord = randomUUID();
    const consultationDateStr = new Date().toISOString();
    const diagnosisText = "Acute bronchitis - patient reports cough and fever";
    const symptomsText = "Cough, fever, sore throat";
    const treatmentPlanText = "Rest, hydration, inhaler as needed";
    const medicationsText = "Amoxicillin 500mg, Paracetamol 500mg";
    const notesText =
      "Follow-up in 7 days; advise chest x-ray if symptoms worsen";

    const hashToU64 = (s: string): bigint => {
      const digest = createHash("sha256").update(s).digest();
      // take first 8 bytes as little-endian u64
      let v = BigInt(0);
      for (let i = 0; i < 8; i++) {
        v |= BigInt(digest[i]) << (BigInt(i) * BigInt(8));
      }
      return v;
    };

    const patientId = hashToU64(uuidPatient);
    const doctorId = hashToU64(uuidDoctor);
    const recordId = hashToU64(uuidRecord);
    const consultationDate = hashToU64(consultationDateStr);
    const diagnosis = hashToU64(diagnosisText);
    const symptoms = hashToU64(symptomsText);
    const treatmentPlan = hashToU64(treatmentPlanText);
    const medications = hashToU64(medicationsText);
    const notes = hashToU64(notesText);

    const medicalData = [
      recordId,
      patientId,
      doctorId,
      consultationDate,
      diagnosis,
      symptoms,
      treatmentPlan,
      medications,
      notes,
    ];

    // Encrypt the medical record data
    const nonce = randomBytes(16);
    const ciphertext = cipher.encrypt(medicalData, nonce);

    // Store the encrypted medical record
    const storeSig = await program.methods
      .storeMedicalRecord(
        ciphertext[0],
        ciphertext[1],
        ciphertext[2],
        ciphertext[3],
        ciphertext[4],
        ciphertext[5],
        ciphertext[6],
        ciphertext[7],
        ciphertext[8]
      )
      .rpc({ commitment: "confirmed" });
    console.log("Store signature is ", storeSig);

    // Simulate sharing with another healthcare provider
    const receiverSecretKey = x25519.utils.randomSecretKey();
    const receiverPubKey = x25519.getPublicKey(receiverSecretKey);
    const receiverNonce = randomBytes(16);

    const receivedRecordEventPromise = awaitEvent("receivedMedicalRecordEvent");
    const computationOffset = new anchor.BN(randomBytes(8), "hex");

    // Share the medical record with the receiver
    const queueSig = await program.methods
      .shareMedicalRecord(
        computationOffset,
        Array.from(receiverPubKey),
        new anchor.BN(deserializeLE(receiverNonce).toString()),
        Array.from(providerPublicKey),
        new anchor.BN(deserializeLE(nonce).toString())
      )
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        // clusterAccount: arciumEnv.arciumClusterPubkey,
        clusterAccount: clusterAccount,

        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(
            getCompDefAccOffset("share_medical_record")
          ).readUInt32LE()
        ),
        medicalRecord: PublicKey.findProgramAddressSync(
          [Buffer.from("medical_record"), owner.publicKey.toBuffer()],
          program.programId
        )[0],
      })
      .rpc({ skipPreflight: true, commitment: "confirmed" });
    console.log("Queue signature is ", queueSig);

    // Wait for computation to finalize
    const finalizeSig = await awaitComputationFinalization(
      provider as anchor.AnchorProvider,
      computationOffset,
      program.programId,
      "confirmed"
    );
    console.log("Finalize signature is ", finalizeSig);

    // Verify the received medical record
    const receiverSharedSecret = x25519.getSharedSecret(
      receiverSecretKey,
      mxePublicKey
    );
    const receiverCipher = new RescueCipher(receiverSharedSecret);

    const receivedRecordEvent = await receivedRecordEventPromise;

    // Decrypt and verify all fields
    const decryptedFields = receiverCipher.decrypt(
      [
        receivedRecordEvent.patientId,
        receivedRecordEvent.doctorId,
        receivedRecordEvent.consultationDate,
        receivedRecordEvent.diagnosis,
        receivedRecordEvent.symptoms,
        receivedRecordEvent.treatmentPlan,
        receivedRecordEvent.medications,
        receivedRecordEvent.notes,
      ],
      new Uint8Array(receivedRecordEvent.nonce)
    );

    // Verify all fields match the original data
    expect(decryptedFields[0]).to.equal(medicalData[0], "Patient ID mismatch");
    expect(decryptedFields[1]).to.equal(medicalData[1], "Doctor ID mismatch");
    expect(decryptedFields[2]).to.equal(
      medicalData[2],
      "Consultation date mismatch"
    );
    expect(decryptedFields[3]).to.equal(medicalData[3], "Diagnosis mismatch");
    expect(decryptedFields[4]).to.equal(medicalData[4], "Symptoms mismatch");
    expect(decryptedFields[5]).to.equal(
      medicalData[5],
      "Treatment plan mismatch"
    );
    expect(decryptedFields[6]).to.equal(medicalData[6], "Medications mismatch");
    expect(decryptedFields[7]).to.equal(medicalData[7], "Notes mismatch");

    console.log(
      "All medical record fields successfully decrypted and verified"
    );
  });

  async function initShareRecordCompDef(
    program: Program<EpochTelehealth>,
    owner: anchor.web3.Keypair,
    uploadRawCircuit: boolean,
    offchainSource: boolean
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("share_medical_record");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    console.log("Comp def PDA is ", compDefPDA);

    const sig = await program.methods
      .initShareRecordCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({
        commitment: "confirmed",
      });
    console.log("Init share record computation definition transaction", sig);

    if (uploadRawCircuit) {
      const rawCircuit = fs.readFileSync("build/share_medical_record.arcis");

      await uploadCircuit(
        provider as anchor.AnchorProvider,
        "share_medical_record",
        program.programId,
        rawCircuit,
        true
      );
    } else if (!offchainSource) {
      const finalizeTx = await buildFinalizeCompDefTx(
        provider as anchor.AnchorProvider,
        Buffer.from(offset).readUInt32LE(),
        program.programId
      );

      const latestBlockhash = await provider.connection.getLatestBlockhash();
      finalizeTx.recentBlockhash = latestBlockhash.blockhash;
      finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

      finalizeTx.sign(owner);

      await provider.sendAndConfirm(finalizeTx);
    }
    return sig;
  }
});

async function getMXEPublicKeyWithRetry(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
  maxRetries: number = 10,
  retryDelayMs: number = 500
): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const mxePublicKey = await getMXEPublicKey(provider, programId);
      if (mxePublicKey) {
        return mxePublicKey;
      }
    } catch (error) {
      console.log(`Attempt ${attempt} failed to fetch MXE public key:`, error);
    }

    if (attempt < maxRetries) {
      console.log(
        `Retrying in ${retryDelayMs}ms... (attempt ${attempt}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(
    `Failed to fetch MXE public key after ${maxRetries} attempts`
  );
}

function readKpJson(path: string): anchor.web3.Keypair {
  const file = fs.readFileSync(path);
  return anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(file.toString()))
  );
}
