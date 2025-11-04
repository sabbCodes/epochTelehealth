# Epoch Telehealth - System Architecture

## Overview
Epoch TeleHealth is a decentralized telemedicine platform that instantly connects patients in underserved regions (starting with Nigeria) to a global network of verified doctors via video and chat. Leveraging blockchain technology, it provides every user with a secure, immutable, and patient-owned Electronic Health Record (EHR), solving the dual crisis of inaccessible care and fragmented, vulnerable medical data.

It is a comprehensive healthcare platform built on Solana that combines encrypted medical records with Web3 payments, AI-powered triage, and pharmacy integration.

## Core Components

### 1. Blockchain Layer (Solana)
- **Medical Record Storage**: Encrypted health data stored on-chain using Arcium
- **USDC Payments**: Circle-integrated payments for medical services
- **Embedded Wallets**: User-friendly wallet creation for non-Web3 users

### 2. Encryption & Security (Arcium)
- **Confidential Computing**: Medical data processed in secure enclaves
- **Deterministic Encryption**: Fixed nonce system for consistent decryption
- **PDA-based Storage**: Program Derived Accounts for secure data isolation

### 3. AI Services Layer
- **AI Triage Agent**: Symptom analysis and specialist recommendation
- **Health Record Analysis**: Personalized insights using patient medical history
- **Hallucination Prevention**: Fine-tuned models using platform health data

### 4. Pharmacy Integration
- **Medication Orders**: Prescription fulfillment and delivery
- **Inventory Management**: Real-time pharmacy stock tracking
- **Delivery Coordination**: Logistics for medication distribution

### 5. Frontend Applications
- **Patient Portal**: Health record management and AI triage
- **Doctor Dashboard**: Medical record creation and patient management
- **Pharmacy Interface**: Order processing and inventory management