/**
 * Arcium encryption utilities for medical records
 * These functions help encrypt, decrypt, and share medical records securely
 */

import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  RescueCipher,
  getMXEPublicKey,
  x25519,
  getComputationAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getMXEAccAddress,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
  getClusterAccAddress,
  deserializeLE,
} from "@arcium-hq/client";

/**
 * Browser-compatible hash function to convert strings to u64
 */
export const hashToU64 = async (s: string): Promise<bigint> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(s);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const hashArray = new Uint8Array(hashBuffer);
  
  let v = BigInt(0);
  for (let i = 0; i < 8; i++) {
    v |= BigInt(hashArray[i]) << (BigInt(i) * BigInt(8));
  }
  return v;
};

/**
 * Browser-compatible random bytes generator
 */
export const randomBytes = (length: number): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(length));
};

/**
 * Encrypt medical record data using Arcium's RescueCipher
 * @param provider - Anchor provider instance
 * @param programId - Program ID of the Solana program
 * @param data - Medical record data to encrypt
 * @param data.patientId - Patient's profile ID from database
 * @param data.doctorId - Doctor's profile ID from database (not wallet address)
 * @param data.diagnosis - Medical diagnosis
 * @param data.symptoms - Patient symptoms
 * @param data.treatment - Treatment plan
 * @param data.medications - Prescribed medications
 * @param data.notes - Additional notes
 */
export const encryptMedicalData = async (
  provider: AnchorProvider,
  programId: PublicKey,
  data: {
    patientId: string;
    doctorId: string;
    diagnosis: string;
    symptoms: string;
    treatment: string;
    medications: string;
    notes: string;
  }
): Promise<{
  ciphertext: number[][];
  nonce: Uint8Array;
  publicKey: Uint8Array;
}> => {
  // Get MXE public key for encryption
  const mxePublicKey = await getMXEPublicKey(provider, programId);
  
  // Generate encryption keys
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  
  if (!publicKey) {
    throw new Error("Failed to generate public key");
  }
  
  const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
  const cipher = new RescueCipher(sharedSecret);

  // Convert form data to u64 hashes
  const medicalData = [
    await hashToU64(data.patientId),
    await hashToU64(data.doctorId),
    await hashToU64(new Date().toISOString()),
    await hashToU64(data.diagnosis),
    await hashToU64(data.symptoms),
    await hashToU64(data.treatment),
    await hashToU64(data.medications),
    await hashToU64(data.notes),
  ];

  // Encrypt the medical data
  const nonce = randomBytes(16);
  const ciphertext = cipher.encrypt(medicalData, nonce);

  return { ciphertext, nonce, publicKey };
};

/**
 * Get accounts needed for sharing medical records
 */
export const getShareMedicalRecordAccounts = (
  programId: PublicKey,
  computationOffset: BN,
  clusterOffset: number,
  medicalRecordPDA: PublicKey
) => {
  return {
    computationAccount: getComputationAccAddress(programId, computationOffset),
    clusterAccount: getClusterAccAddress(clusterOffset),
    mxeAccount: getMXEAccAddress(programId),
    mempoolAccount: getMempoolAccAddress(programId),
    executingPool: getExecutingPoolAccAddress(programId),
    compDefAccount: getCompDefAccAddress(
      programId,
      Buffer.from(getCompDefAccOffset("share_medical_record")).readUInt32LE()
    ),
    medicalRecord: medicalRecordPDA,
  };
};

/**
 * Decrypt received medical record data
 */
export const decryptMedicalData = (
  ciphertexts: number[][],
  nonce: Uint8Array,
  receiverSecretKey: Uint8Array,
  mxePublicKey: Uint8Array
): bigint[] => {
  const sharedSecret = x25519.getSharedSecret(receiverSecretKey, mxePublicKey);
  const cipher = new RescueCipher(sharedSecret);
  return cipher.decrypt(ciphertexts, nonce);
};
