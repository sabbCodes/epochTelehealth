# Arcium Integration Guide

This document explains how the Arcium encryption is integrated into the Epoch Telehealth platform.

## Overview

The platform uses Arcium's MPC (Multi-Party Computation) encryption to securely store medical records on the Solana blockchain. All sensitive medical data is encrypted before being stored on-chain.

## Architecture

### Components

1. **Solana Program** (`programs/epoch_telehealth/src/lib.rs`)
   - `store_medical_record`: Stores encrypted medical records on-chain
   - `share_medical_record`: Shares encrypted records with authorized providers
   - `share_medical_record_callback`: Handles the callback after MPC computation

2. **Frontend Form** (`app/components/health-record-form.tsx`)
   - Collects medical record data from healthcare providers
   - Encrypts data using Arcium's RescueCipher
   - Submits encrypted data to the Solana program

3. **Utility Functions** (`app/utils/arcium-helpers.ts`)
   - Reusable encryption/decryption functions
   - Helper functions for account derivation

## How It Works

### Storing Medical Records

1. **Data Collection**: Healthcare provider fills out the form with:
   - Patient ID
   - Diagnosis
   - Symptoms
   - Treatment plan
   - Medications
   - Additional notes

2. **Encryption Process**:
   ```typescript
   // Get MXE public key from Arcium
   const mxePublicKey = await getMXEPublicKey(provider, programId);
   
   // Generate ephemeral key pair
   const privateKey = x25519.utils.randomSecretKey();
   const publicKey = x25519.getPublicKey(privateKey);
   
   // Create shared secret
   const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
   
   // Initialize cipher
   const cipher = new RescueCipher(sharedSecret);
   
   // Hash and encrypt data
   const medicalData = [
     await hashToU64(patientId),
     await hashToU64(doctorId),
     await hashToU64(consultationDate),
     await hashToU64(diagnosis),
     await hashToU64(symptoms),
     await hashToU64(treatment),
     await hashToU64(medications),
     await hashToU64(notes),
   ];
   
   const ciphertext = cipher.encrypt(medicalData, nonce);
   ```

3. **On-Chain Storage**:
   - Encrypted data is stored in a PDA (Program Derived Address)
   - PDA is derived from: `["medical_record", doctor_wallet_pubkey, record_id]`
   - Only the encrypted ciphertext is stored on-chain

### Sharing Medical Records

To share a medical record with another healthcare provider:

1. Generate receiver's key pair
2. Call `share_medical_record` instruction with:
   - Computation offset (unique identifier)
   - Receiver's public key
   - Receiver's nonce
   - Sender's public key
   - Original nonce

3. Arcium's MXE performs the computation off-chain
4. Callback instruction emits an event with re-encrypted data
5. Receiver can decrypt using their private key

## Setup Instructions

### Prerequisites

1. Install dependencies:
   ```bash
   cd app
   npm install
   ```

2. Ensure you have the Arcium program deployed on devnet/mainnet

### Configuration

1. Update the program ID in `app/components/epoch_telehealth.json`
2. Set the cluster offset for your Arcium cluster (see tests for example)

### Running the Application

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```

2. Connect your Solana wallet (Phantom, Solflare, etc.)

3. Fill out the medical record form and submit

4. The transaction will:
   - Encrypt the data
   - Create a PDA for the medical record
   - Store the encrypted data on-chain
   - Return a transaction signature

## Security Considerations

1. **Data Privacy**: All medical data is encrypted before leaving the browser
2. **Key Management**: Ephemeral keys are generated per transaction
3. **Access Control**: Only authorized parties can decrypt shared records
4. **On-Chain Storage**: Only encrypted ciphertexts are stored on-chain

## Testing

Run the test suite to verify the integration:

```bash
arcium test
```

The test file (`tests/epoch_telehealth.ts`) demonstrates:
- Storing encrypted medical records
- Sharing records with another provider
- Decrypting received records
- Verifying data integrity

## Troubleshooting

### Common Issues

1. **Wallet not connected**: Ensure a Solana wallet is connected before submitting
2. **MXE not initialized**: Make sure the MXE account is properly set up
3. **Insufficient SOL**: Ensure the wallet has enough SOL for transaction fees
4. **Computation definition not initialized**: Run `init_share_record_comp_def` first

### Error Messages

- `"Wallet not connected"`: Connect a Solana wallet
- `"Failed to store medical record"`: Check console for detailed error
- `"Invalid medical record data format"`: Ensure all required fields are filled

## Resources

- [Arcium Documentation](https://docs.arcium.com)
- [Anchor Documentation](https://www.anchor-lang.com)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
