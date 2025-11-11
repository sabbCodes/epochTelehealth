// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { PublicKey } from "@solana/web3.js";
// import { EpochTelehealth } from "../target/types/epoch_telehealth";
// import { randomBytes } from "crypto";
// import {
//   awaitComputationFinalization,
//   getArciumEnv,
//   getCompDefAccOffset,
//   getArciumAccountBaseSeed,
//   getArciumProgAddress,
//   uploadCircuit,
//   buildFinalizeCompDefTx,
//   RescueCipher,
//   deserializeLE,
//   getMXEAccAddress,
//   getMempoolAccAddress,
//   getCompDefAccAddress,
//   getExecutingPoolAccAddress,
//   x25519,
//   getComputationAccAddress,
//   getMXEPublicKey,
// } from "@arcium-hq/client";
// import * as fs from "fs";
// import * as os from "os";
// import { expect } from "chai";

// describe("EpochTelehealth", () => {
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.AnchorProvider.env());
//   const program = anchor.workspace.EpochTelehealth as Program<EpochTelehealth>;
//   const provider = anchor.getProvider();

//   type Event = anchor.IdlEvents<(typeof program)["idl"]>;
//   const awaitEvent = async <E extends keyof Event>(eventName: E) => {
//     let listenerId: number;
//     const event = await new Promise<Event[E]>((res) => {
//       listenerId = program.addEventListener(eventName, (event) => {
//         res(event);
//       });
//     });
//     await program.removeEventListener(listenerId);

//     return event;
//   };

//   const arciumEnv = getArciumEnv();

//   it("can store and share health record confidentially!", async () => {
//     const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

//     const mxePublicKey = await getMXEPublicKeyWithRetry(
//       provider as anchor.AnchorProvider,
//       program.programId
//     );

//     console.log("MXE x25519 pubkey is", mxePublicKey);

//     console.log("Initializing share health record computation definition");
//     const initSHRSig = await initShareHealthRecordCompDef(
//       program,
//       owner,
//       false,
//       false
//     );
//     console.log(
//       "Share health record computation definition initialized with signature",
//       initSHRSig
//     );

//     const senderPrivateKey = x25519.utils.randomSecretKey();
//     const senderPublicKey = x25519.getPublicKey(senderPrivateKey);
//     const sharedSecret = x25519.getSharedSecret(senderPrivateKey, mxePublicKey);
//     const cipher = new RescueCipher(sharedSecret);

//     // Test data matching your circuit's u64 types
//     const recordId = new anchor.BN(12345);

//     // Core identifiers as u64 (matching circuit)
//     const patientId = BigInt(420);
//     const doctorId = BigInt(789);
//     const consultationDate = BigInt(Math.floor(Date.now() / 1000));

//     // Medical data encoded as u64 values (use IDs/codes instead of text)
//     const diagnosis = BigInt(101); // Diagnosis code for "Hypertension"
//     const symptom1 = BigInt(201); // Symptom code for "Headache"
//     const symptom2 = BigInt(202); // Symptom code for "Dizziness"
//     const treatmentPlan = BigInt(301); // Treatment type code
//     const medication1 = BigInt(401); // Medication code for "Lisinopril"
//     const medication2 = BigInt(402); // Additional medication if needed
//     const notes = BigInt(501); // Notes/observations code

//     // Combine all data into single array matching circuit structure
//     const healthRecordData = [
//       patientId,
//       doctorId,
//       consultationDate,
//       diagnosis,
//       symptom1,
//       symptom2,
//       treatmentPlan,
//       medication1,
//       medication2,
//       notes,
//     ];

//     const nonce = randomBytes(16);

//     // Encrypt the numeric data (RescueCipher expects number[] output)
//     const ciphertext: number[][] = cipher.encrypt(healthRecordData, nonce);

//     // Fund the doctor account
//     const airdropSig = await provider.connection.requestAirdrop(
//       owner.publicKey,
//       2 * anchor.web3.LAMPORTS_PER_SOL
//     );
//     await provider.connection.confirmTransaction(airdropSig, "confirmed");

//     const healthRecordPDA = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("health_record"),
//         owner.publicKey.toBuffer(),
//         recordId.toArrayLike(Buffer, "le", 8),
//       ],
//       program.programId
//     )[0];

//     // Convert numeric values to 32-byte arrays for storage
//     const storeSig = await program.methods
//       .storeHealthRecord(
//         recordId,
//         ciphertext[0],
//         ciphertext[1],
//         ciphertext[2],
//         ciphertext[3],
//         [ciphertext[4], ciphertext[5]],
//         ciphertext[6],
//         [ciphertext[7], ciphertext[8]],
//         ciphertext[9]
//       )
//       .signers([owner])
//       .rpc({ commitment: "confirmed" });
//     console.log("Store health record signature:", storeSig);

//     // Test sharing the record
//     const receiverSecretKey = x25519.utils.randomSecretKey();
//     const receiverPubKey = x25519.getPublicKey(receiverSecretKey);
//     const receiverNonce = randomBytes(16);

//     const receivedHealthRecordEventPromise = awaitEvent(
//       "receivedHealthRecordEvent"
//     );

//     const computationOffset = new anchor.BN(randomBytes(8), "hex");

//     const queueSig = await program.methods
//       .shareHealthRecord(
//         computationOffset,
//         Array.from(receiverPubKey),
//         new anchor.BN(deserializeLE(receiverNonce).toString()),
//         Array.from(senderPublicKey),
//         new anchor.BN(deserializeLE(nonce).toString())
//       )
//       .accountsPartial({
//         computationAccount: getComputationAccAddress(
//           program.programId,
//           computationOffset
//         ),
//         clusterAccount: arciumEnv.arciumClusterPubkey,
//         mxeAccount: getMXEAccAddress(program.programId),
//         mempoolAccount: getMempoolAccAddress(program.programId),
//         executingPool: getExecutingPoolAccAddress(program.programId),
//         compDefAccount: getCompDefAccAddress(
//           program.programId,
//           Buffer.from(getCompDefAccOffset("share_health_record")).readUInt32LE()
//         ),
//         healthRecord: healthRecordPDA,
//         payer: owner.publicKey,
//       })
//       .rpc({ commitment: "confirmed" });
//     console.log("Queue signature:", queueSig);

//     const finalizeSig = await awaitComputationFinalization(
//       provider as anchor.AnchorProvider,
//       computationOffset,
//       program.programId,
//       "confirmed"
//     );
//     console.log("Finalize signature:", finalizeSig);

//     const receiverSharedSecret = x25519.getSharedSecret(
//       receiverSecretKey,
//       mxePublicKey
//     );
//     const receiverCipher = new RescueCipher(receiverSharedSecret);

//     const receivedHealthRecordEvent = await receivedHealthRecordEventPromise;

//     // Prepare encrypted data from event for decryption
//     const encryptedData: number[][] = [
//       receivedHealthRecordEvent.patientId,
//       receivedHealthRecordEvent.doctorId,
//       receivedHealthRecordEvent.consultationDate,
//       receivedHealthRecordEvent.diagnosis,
//       ...receivedHealthRecordEvent.symptoms,
//       receivedHealthRecordEvent.treatmentPlan,
//       ...receivedHealthRecordEvent.medications,
//       receivedHealthRecordEvent.notes,
//     ];

//     // Decrypt back to numeric values
//     const decryptedFields: bigint[] = receiverCipher.decrypt(
//       encryptedData,
//       new Uint8Array(receivedHealthRecordEvent.nonce)
//     );

//     // Convert decrypted number arrays back to BigInt for comparison
//     const decryptedPatientId = decryptedFields[0];
//     const decryptedDoctorId = decryptedFields[1];
//     const decryptedConsultationDate = decryptedFields[2];
//     const decryptedDiagnosis = decryptedFields[3];
//     const decryptedSymptom1 = decryptedFields[4];
//     const decryptedSymptom2 = decryptedFields[5];
//     const decryptedTreatmentPlan = decryptedFields[6];
//     const decryptedMedication1 = decryptedFields[7];
//     const decryptedMedication2 = decryptedFields[8];
//     const decryptedNotes = decryptedFields[9];

//     // Verify all numeric values match
//     expect(decryptedPatientId.toString()).to.equal(
//       patientId.toString(),
//       "Patient ID mismatch"
//     );
//     expect(decryptedDoctorId.toString()).to.equal(
//       doctorId.toString(),
//       "Doctor ID mismatch"
//     );
//     expect(decryptedConsultationDate.toString()).to.equal(
//       consultationDate.toString(),
//       "Consultation date mismatch"
//     );
//     expect(decryptedDiagnosis.toString()).to.equal(
//       diagnosis.toString(),
//       "Diagnosis mismatch"
//     );
//     expect(decryptedSymptom1.toString()).to.equal(
//       symptom1.toString(),
//       "Symptom 1 mismatch"
//     );
//     expect(decryptedSymptom2.toString()).to.equal(
//       symptom2.toString(),
//       "Symptom 2 mismatch"
//     );
//     expect(decryptedTreatmentPlan.toString()).to.equal(
//       treatmentPlan.toString(),
//       "Treatment plan mismatch"
//     );
//     expect(decryptedMedication1.toString()).to.equal(
//       medication1.toString(),
//       "Medication 1 mismatch"
//     );
//     expect(decryptedMedication2.toString()).to.equal(
//       medication2.toString(),
//       "Medication 2 mismatch"
//     );
//     expect(decryptedNotes.toString()).to.equal(
//       notes.toString(),
//       "Notes mismatch"
//     );

//     console.log("All health record fields successfully decrypted and verified");
//   });

//   async function initShareHealthRecordCompDef(
//     program: Program<EpochTelehealth>,
//     owner: anchor.web3.Keypair,
//     uploadRawCircuit: boolean,
//     offchainSource: boolean
//   ): Promise<string> {
//     const baseSeedCompDefAcc = getArciumAccountBaseSeed(
//       "ComputationDefinitionAccount"
//     );
//     const offset = getCompDefAccOffset("share_health_record");

//     const compDefPDA = PublicKey.findProgramAddressSync(
//       [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
//       getArciumProgAddress()
//     )[0];

//     console.log("Comp def PDA is", compDefPDA);

//     const sig = await program.methods
//       .initShareHealthRecordCompDef()
//       .accounts({
//         compDefAccount: compDefPDA,
//         payer: owner.publicKey,
//         mxeAccount: getMXEAccAddress(program.programId),
//       })
//       .signers([owner])
//       .rpc({
//         commitment: "confirmed",
//       });
//     console.log(
//       "Init share health record computation definition transaction",
//       sig
//     );

//     if (uploadRawCircuit) {
//       const rawCircuit = fs.readFileSync("build/share_health_record.arcis");

//       await uploadCircuit(
//         provider as anchor.AnchorProvider,
//         "share_health_record",
//         program.programId,
//         rawCircuit,
//         true
//       );
//     } else if (!offchainSource) {
//       const finalizeTx = await buildFinalizeCompDefTx(
//         provider as anchor.AnchorProvider,
//         Buffer.from(offset).readUInt32LE(),
//         program.programId
//       );

//       const latestBlockhash = await provider.connection.getLatestBlockhash();
//       finalizeTx.recentBlockhash = latestBlockhash.blockhash;
//       finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

//       finalizeTx.sign(owner);

//       await provider.sendAndConfirm(finalizeTx);
//     }
//     return sig;
//   }
// });

// // Helper functions
// function bigIntToUint8Array32(bigInt: bigint): number[] {
//   const hexString = bigInt.toString(16).padStart(64, "0"); // 32 bytes = 64 hex chars
//   return Array.from(Buffer.from(hexString, "hex"));
// }

// function arrayToBigInt(arr: number[]): bigint {
//   return BigInt("0x" + Buffer.from(arr).toString("hex"));
// }

// async function getMXEPublicKeyWithRetry(
//   provider: anchor.AnchorProvider,
//   programId: PublicKey,
//   maxRetries: number = 10,
//   retryDelayMs: number = 500
// ): Promise<Uint8Array> {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       const mxePublicKey = await getMXEPublicKey(provider, programId);
//       if (mxePublicKey) {
//         return mxePublicKey;
//       }
//     } catch (error) {
//       console.log(`Attempt ${attempt} failed to fetch MXE public key:`, error);
//     }

//     if (attempt < maxRetries) {
//       console.log(
//         `Retrying in ${retryDelayMs}ms... (attempt ${attempt}/${maxRetries})`
//       );
//       await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
//     }
//   }

//   throw new Error(
//     `Failed to fetch MXE public key after ${maxRetries} attempts`
//   );
// }

// function readKpJson(path: string): anchor.web3.Keypair {
//   const file = fs.readFileSync(path);
//   return anchor.web3.Keypair.fromSecretKey(
//     new Uint8Array(JSON.parse(file.toString()))
//   );
// }









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

  // String encoding/decoding functions
  function stringToBigInt(str: string, maxBytes: number): bigint {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);

    let result = BigInt(0);
    for (let i = 0; i < Math.min(bytes.length, maxBytes); i++) {
      result |= BigInt(bytes[i]) << BigInt(i * 8);
    }
    return result;
  }

  function bigIntToString(value: bigint, maxBytes: number): string {
    const bytes: number[] = [];
    for (let i = 0; i < maxBytes; i++) {
      const byte = Number((value >> BigInt(i * 8)) & BigInt(0xff));
      if (byte !== 0) {
        bytes.push(byte);
      }
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  // Convert bigint to 32-byte array (u8; 32)
  function bigIntTo32Bytes(value: bigint): number[] {
    const result = new Array(32).fill(0);
    for (let i = 0; i < 8; i++) {
      result[i] = Number((value >> BigInt(i * 8)) & BigInt(0xff));
    }
    return result;
  }

  // Convert 32-byte array back to bigint
  function bytes32ToBigInt(bytes: number[]): bigint {
    let result = BigInt(0);
    for (let i = 0; i < 8; i++) {
      result |= BigInt(bytes[i]) << BigInt(i * 8);
    }
    return result;
  }

  it("can store and share health record confidentially!", async () => {
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

    // Test data with string conversion
    const recordId = new anchor.BN(12345);

    // Convert strings to bigints
    const patientId = stringToBigInt("PATIENT_001", 16); // u128
    const doctorId = stringToBigInt("DR_SMITH_123", 16); // u128
    const consultationDate = BigInt(Math.floor(Date.now() / 1000)); // u64

    // Medical data as u64 types from strings
    const diagnosis = stringToBigInt("Hypertension", 8);
    const symptoms = [
      stringToBigInt("Headache", 8),
      stringToBigInt("Dizziness", 8),
      BigInt(0),
      BigInt(0),
      BigInt(0),
    ];
    const treatmentPlan = stringToBigInt("Medication", 8);
    const medications = [
      stringToBigInt("Lisinopril", 8),
      stringToBigInt("10mg", 8),
      BigInt(0),
      BigInt(0),
      BigInt(0),
    ];
    const notes = stringToBigInt("Patient shows improvement", 8);

    // Combine all data for encryption (matching circuit structure)
    const healthRecordData = [
      patientId, // u128
      doctorId, // u128
      consultationDate, // u64
      diagnosis, // u64
      ...symptoms, // 5 x u64
      treatmentPlan, // u64
      ...medications, // 5 x u64
      notes, // u64
    ];

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

    // Store the health record - convert encrypted data to proper format
    const storeSig = await program.methods
      .storeHealthRecord(
        recordId,
        ciphertext[0], // patient_id
        ciphertext[1], // doctor_id
        ciphertext[2], // consultation_date
        ciphertext[3], // diagnosis
        [
          ciphertext[4], // symptom1
          ciphertext[5], // symptom2
          ciphertext[6], // symptom3
          ciphertext[7], // symptom4
          ciphertext[8], // symptom5
        ],
        ciphertext[9], // treatment_plan
        [
          ciphertext[10], // medication1
          ciphertext[11], // medication2
          ciphertext[12], // medication3
          ciphertext[13], // medication4
          ciphertext[14], // medication5
        ],
        ciphertext[15] // notes
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
      receivedHealthRecordEvent.diagnosis,
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

    // Convert decrypted values back to strings for verification
    const decryptedPatientId = bigIntToString(decryptedFields[0], 16);
    const decryptedDoctorId = bigIntToString(decryptedFields[1], 16);
    const decryptedDiagnosis = bigIntToString(decryptedFields[3], 8);
    const decryptedSymptom1 = bigIntToString(decryptedFields[4], 8);
    const decryptedSymptom2 = bigIntToString(decryptedFields[5], 8);
    const decryptedTreatmentPlan = bigIntToString(decryptedFields[9], 8);
    const decryptedMedication1 = bigIntToString(decryptedFields[10], 8);
    const decryptedMedication2 = bigIntToString(decryptedFields[11], 8);
    const decryptedNotes = bigIntToString(decryptedFields[15], 8);

    // Verify all values match
    expect(decryptedPatientId).to.equal("PATIENT_001", "Patient ID mismatch");
    expect(decryptedDoctorId).to.equal("DR_SMITH_123", "Doctor ID mismatch");
    expect(decryptedFields[2].toString()).to.equal(
      consultationDate.toString(),
      "Consultation date mismatch"
    );
    expect(decryptedDiagnosis).to.equal("Hypertension", "Diagnosis mismatch");
    expect(decryptedSymptom1).to.equal("Headache", "Symptom 1 mismatch");
    expect(decryptedSymptom2).to.equal("Dizziness", "Symptom 2 mismatch");
    expect(decryptedTreatmentPlan).to.equal(
      "Medication",
      "Treatment plan mismatch"
    );
    expect(decryptedMedication1).to.equal(
      "Lisinopril",
      "Medication 1 mismatch"
    );
    expect(decryptedMedication2).to.equal("10mg", "Medication 2 mismatch");
    expect(decryptedNotes).to.equal(
      "Patient shows improvement",
      "Notes mismatch"
    );

    console.log("All health record fields successfully decrypted and verified");
    console.log("Original strings preserved:", {
      patientId: decryptedPatientId,
      doctorId: decryptedDoctorId,
      diagnosis: decryptedDiagnosis,
      symptoms: [decryptedSymptom1, decryptedSymptom2].filter(
        (s) => s.length > 0
      ),
      treatmentPlan: decryptedTreatmentPlan,
      medications: [decryptedMedication1, decryptedMedication2].filter(
        (m) => m.length > 0
      ),
      notes: decryptedNotes,
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

// Helper functions
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