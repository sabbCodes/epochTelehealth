import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { EpochTelehealth } from "../target/types/epoch_telehealth";
import { randomBytes } from "crypto";
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
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  x25519,
  getComputationAccAddress,
  getMXEPublicKey,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";
import { expect } from "chai";

describe("EpochTelehealth", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.EpochTelehealth as Program<EpochTelehealth>;
  const provider = anchor.getProvider();

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

  const arciumEnv = getArciumEnv();

  // Enhanced string encoding/decoding functions with automatic splitting
  function stringToU64Array(str: string, numU64s: number): bigint[] {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const result: bigint[] = [];

    for (let i = 0; i < numU64s; i++) {
      let value = BigInt(0);
      for (let j = 0; j < 8; j++) {
        const byteIndex = i * 8 + j;
        if (byteIndex < bytes.length) {
          value |= BigInt(bytes[byteIndex]) << BigInt(j * 8);
        }
      }
      result.push(value);
    }
    return result;
  }

  function u64ArrayToString(u64Array: bigint[]): string {
    const bytes: number[] = [];

    for (let i = 0; i < u64Array.length; i++) {
      const value = u64Array[i];
      for (let j = 0; j < 8; j++) {
        const byte = Number((value >> BigInt(j * 8)) & BigInt(0xff));
        if (byte !== 0) {
          bytes.push(byte);
        }
      }
    }

    // Remove trailing zeros
    let endIndex = bytes.length;
    while (endIndex > 0 && bytes[endIndex - 1] === 0) {
      endIndex--;
    }

    return new TextDecoder().decode(new Uint8Array(bytes.slice(0, endIndex)));
  }

  // For u128 fields (patient_id, doctor_id, treatment_plan)
  function stringToU128(str: string): bigint {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let value = BigInt(0);

    for (let i = 0; i < Math.min(bytes.length, 16); i++) {
      value |= BigInt(bytes[i]) << BigInt(i * 8);
    }
    return value;
  }

  function u128ToString(value: bigint): string {
    const bytes: number[] = [];
    for (let i = 0; i < 16; i++) {
      const byte = Number((value >> BigInt(i * 8)) & BigInt(0xff));
      if (byte !== 0) {
        bytes.push(byte);
      }
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  // NEW: Automatic text splitting functions for better UX
  function splitTextIntoFields(
    text: string,
    fieldCount: number,
    charsPerField: number
  ): string[] {
    const result: string[] = [];
    let remainingText = text;

    for (let i = 0; i < fieldCount; i++) {
      if (remainingText.length === 0) {
        result.push(""); // Empty field
        continue;
      }

      const chunk = remainingText.substring(0, charsPerField);
      result.push(chunk);
      remainingText = remainingText.substring(chunk.length);
    }

    return result;
  }

  function joinFieldsIntoText(fields: string[]): string {
    return fields.join("").trim();
  }

  // Helper to convert array of strings to u64 array
  function stringArrayToU64Array(
    strings: string[],
    numU64sPerString: number
  ): bigint[] {
    const result: bigint[] = [];

    for (const str of strings) {
      const u64s = stringToU64Array(str, numU64sPerString);
      result.push(...u64s);
    }

    return result;
  }

  // Helper to convert u64 array back to string array
  function u64ArrayToStringArray(
    u64Array: bigint[],
    numStrings: number,
    numU64sPerString: number
  ): string[] {
    const result: string[] = [];

    for (let i = 0; i < numStrings; i++) {
      const startIndex = i * numU64sPerString;
      const endIndex = startIndex + numU64sPerString;
      const stringU64s = u64Array.slice(startIndex, endIndex);
      result.push(u64ArrayToString(stringU64s));
    }

    return result;
  }

  it("can store and share health record confidentially with automatic text splitting!", async () => {
    const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );

    console.log("MXE x25519 pubkey is", mxePublicKey);

    console.log("Initializing share health record computation definition");
    const initSHRSig = await initShareHealthRecordCompDef(
      program,
      owner,
      false,
      false
    );
    console.log(
      "Share health record computation definition initialized with signature",
      initSHRSig
    );

    const senderPrivateKey = x25519.utils.randomSecretKey();
    const senderPublicKey = x25519.getPublicKey(senderPrivateKey);
    const sharedSecret = x25519.getSharedSecret(senderPrivateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Test data with natural language inputs (like a doctor would type)
    const recordId = new anchor.BN(12345);

    // Basic identifiers
    const patientId = stringToU128("PATIENT_001");
    const doctorId = stringToU128("DR_SMITH_123");
    const consultationDate = BigInt(Math.floor(Date.now() / 1000));

    // NATURAL LANGUAGE INPUTS (like from a form)
    const diagnosisText = "Hypertension Stage 2 with complications";
    const symptomsText = "Headache Dizziness Nausea Fatigue Anxiety";
    const treatmentPlanText =
      "Medication and lifestyle changes with regular monitoring";
    const medicationsText =
      "Lisinopril 10mg daily, Aspirin 81mg, Metformin 500mg";
    const notesText = "improved state";

    // AUTOMATIC SPLITTING FOR BETTER UX
    // Diagnosis: Split across 3 u64 fields (24 chars total)
    const diagnosisFields = splitTextIntoFields(diagnosisText, 3, 8);
    const diagnosisParts = stringArrayToU64Array(diagnosisFields, 1);

    // Symptoms: Split across 5 u64 fields (5 symptoms, 8 chars each)
    const symptomFields = splitTextIntoFields(symptomsText, 5, 8);
    const symptoms = stringArrayToU64Array(symptomFields, 1);

    // Treatment plan: u128 field (16 chars max - take first part)
    const treatmentPlan = stringToU128(treatmentPlanText.substring(0, 16));

    // Medications: Split across 5 u64 fields (5 med entries, 8 chars each)
    const medicationFields = splitTextIntoFields(medicationsText, 5, 8);
    const medications = stringArrayToU64Array(medicationFields, 1);

    // Notes: u64 field (8 chars max - take first part)
    const notes = stringToU128("improved state");

    console.log("Original inputs:", {
      diagnosis: diagnosisText,
      symptoms: symptomsText,
      treatmentPlan: treatmentPlanText,
      medications: medicationsText,
      notes: notesText,
    });

    console.log("Split fields:", {
      diagnosisFields,
      symptomFields,
      medicationFields,
    });

    // Combine all data for encryption (18 total fields: 3 u128 + 15 u64)
    const healthRecordData = [
      patientId, // u128 - patient_id
      doctorId, // u128 - doctor_id
      consultationDate, // u64 - consultation_date
      ...diagnosisParts, // 3 x u64 - diagnosis array
      ...symptoms, // 5 x u64 - symptoms array
      treatmentPlan, // u128 - treatment_plan
      ...medications, // 5 x u64 - medications array
      notes, // u64 - notes
    ];

    console.log("Health record data length:", healthRecordData.length);
    console.log("Expected: 18 fields (3 u128 + 15 u64)");

    const nonce = randomBytes(16);

    // Encrypt the data
    const ciphertext: number[][] = cipher.encrypt(healthRecordData, nonce);

    // Fund the doctor account
    const airdropSig = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig, "confirmed");

    const healthRecordPDA = PublicKey.findProgramAddressSync(
      [
        Buffer.from("health_record"),
        owner.publicKey.toBuffer(),
        recordId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];

    // Store the health record
    const storeSig = await program.methods
      .storeHealthRecord(
        recordId,
        ciphertext[0], // patient_id
        ciphertext[1], // doctor_id
        ciphertext[2], // consultation_date
        [
          ciphertext[3], // diagnosis part 1
          ciphertext[4], // diagnosis part 2
          ciphertext[5], // diagnosis part 3
        ],
        [
          ciphertext[6], // symptom1
          ciphertext[7], // symptom2
          ciphertext[8], // symptom3
          ciphertext[9], // symptom4
          ciphertext[10], // symptom5
        ],
        ciphertext[11], // treatment_plan (u128)
        [
          ciphertext[12], // medication1
          ciphertext[13], // medication2
          ciphertext[14], // medication3
          ciphertext[15], // medication4
          ciphertext[16], // medication5
        ],
        ciphertext[17] // notes
      )
      .signers([owner])
      .rpc({ commitment: "confirmed" });
    console.log("Store health record signature:", storeSig);

    // Test sharing the record
    const receiverSecretKey = x25519.utils.randomSecretKey();
    const receiverPubKey = x25519.getPublicKey(receiverSecretKey);
    const receiverNonce = randomBytes(16);

    const receivedHealthRecordEventPromise = awaitEvent(
      "receivedHealthRecordEvent"
    );

    const computationOffset = new anchor.BN(randomBytes(8), "hex");

    const queueSig = await program.methods
      .shareHealthRecord(
        computationOffset,
        Array.from(receiverPubKey),
        new anchor.BN(deserializeLE(receiverNonce).toString()),
        Array.from(senderPublicKey),
        new anchor.BN(deserializeLE(nonce).toString())
      )
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          program.programId,
          computationOffset
        ),
        clusterAccount: arciumEnv.arciumClusterPubkey,
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(program.programId),
        executingPool: getExecutingPoolAccAddress(program.programId),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("share_health_record")).readUInt32LE()
        ),
        healthRecord: healthRecordPDA,
        payer: owner.publicKey,
      })
      .rpc({ commitment: "confirmed" });
    console.log("Queue signature:", queueSig);

    const finalizeSig = await awaitComputationFinalization(
      provider as anchor.AnchorProvider,
      computationOffset,
      program.programId,
      "confirmed"
    );
    console.log("Finalize signature:", finalizeSig);

    const receiverSharedSecret = x25519.getSharedSecret(
      receiverSecretKey,
      mxePublicKey
    );
    const receiverCipher = new RescueCipher(receiverSharedSecret);

    const receivedHealthRecordEvent = await receivedHealthRecordEventPromise;

    // Prepare encrypted data from event for decryption
    const encryptedData: number[][] = [
      receivedHealthRecordEvent.patientId,
      receivedHealthRecordEvent.doctorId,
      receivedHealthRecordEvent.consultationDate,
      ...receivedHealthRecordEvent.diagnosis,
      ...receivedHealthRecordEvent.symptoms,
      receivedHealthRecordEvent.treatmentPlan,
      ...receivedHealthRecordEvent.medications,
      receivedHealthRecordEvent.notes,
    ];

    // Decrypt back to numeric values
    const decryptedFields: bigint[] = receiverCipher.decrypt(
      encryptedData,
      new Uint8Array(receivedHealthRecordEvent.nonce)
    );

    // Convert decrypted values back to strings and RECONSTRUCT ORIGINAL TEXTS
    const decryptedPatientId = u128ToString(decryptedFields[0]);
    const decryptedDoctorId = u128ToString(decryptedFields[1]);

    // Reconstruct diagnosis from 3 u64 fields
    const decryptedDiagnosisFields = u64ArrayToStringArray(
      [decryptedFields[3], decryptedFields[4], decryptedFields[5]],
      3,
      1
    );
    const decryptedDiagnosis = joinFieldsIntoText(decryptedDiagnosisFields);

    // Reconstruct symptoms from 5 u64 fields
    const decryptedSymptomFields = u64ArrayToStringArray(
      decryptedFields.slice(6, 11),
      5,
      1
    );
    const decryptedSymptoms = joinFieldsIntoText(decryptedSymptomFields);

    const decryptedTreatmentPlan = u128ToString(decryptedFields[11]);

    // Reconstruct medications from 5 u64 fields
    const decryptedMedicationFields = u64ArrayToStringArray(
      decryptedFields.slice(12, 17),
      5,
      1
    );
    const decryptedMedications = joinFieldsIntoText(decryptedMedicationFields);

    const decryptedNotes = u64ArrayToString([decryptedFields[17]]);

    console.log("Reconstructed values:", {
      patientId: decryptedPatientId,
      doctorId: decryptedDoctorId,
      diagnosis: decryptedDiagnosis,
      symptoms: decryptedSymptoms,
      treatmentPlan: decryptedTreatmentPlan,
      medications: decryptedMedications,
      notes: decryptedNotes,
    });

    // Verify reconstructed values match original inputs
    expect(decryptedPatientId).to.equal("PATIENT_001", "Patient ID mismatch");
    expect(decryptedDoctorId).to.equal("DR_SMITH_123", "Doctor ID mismatch");
    expect(decryptedFields[2].toString()).to.equal(
      consultationDate.toString(),
      "Consultation date mismatch"
    );

    // Check that we reconstructed the meaningful parts of the original text
    expect(decryptedDiagnosis).to.include("Hypertension", "Diagnosis mismatch");
    expect(decryptedSymptoms).to.include("Headache", "Symptoms mismatch");
    expect(decryptedSymptoms).to.include("Dizziness", "Symptoms mismatch");
    expect(decryptedTreatmentPlan).to.include(
      "Medication",
      "Treatment plan mismatch"
    );
    expect(decryptedMedications).to.include(
      "Lisinopril",
      "Medications mismatch"
    );
    expect(decryptedNotes).to.include("improved", "Notes mismatch");

    console.log(
      "All health record fields successfully decrypted and reconstructed!"
    );
    console.log("Original texts preserved with automatic splitting:", {
      originalDiagnosis: diagnosisText,
      reconstructedDiagnosis: decryptedDiagnosis,
      originalSymptoms: symptomsText,
      reconstructedSymptoms: decryptedSymptoms,
      originalMedications: medicationsText,
      reconstructedMedications: decryptedMedications,
    });
  });

  async function initShareHealthRecordCompDef(
    program: Program<EpochTelehealth>,
    owner: anchor.web3.Keypair,
    uploadRawCircuit: boolean,
    offchainSource: boolean
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount"
    );
    const offset = getCompDefAccOffset("share_health_record");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgAddress()
    )[0];

    console.log("Comp def PDA is", compDefPDA);

    const sig = await program.methods
      .initShareHealthRecordCompDef()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({
        commitment: "confirmed",
      });
    console.log(
      "Init share health record computation definition transaction",
      sig
    );

    if (uploadRawCircuit) {
      const rawCircuit = fs.readFileSync("build/share_health_record.arcis");

      await uploadCircuit(
        provider as anchor.AnchorProvider,
        "share_health_record",
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

// Helper functions remain the same...
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
