"use client";

import { useState } from "react";
import { Save, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import {
  Program,
  AnchorProvider,
  web3,
  setProvider,
  BN,
} from "@coral-xyz/anchor";
import { EpochTelehealth } from "./epoch_telehealth";
import idl from "./epoch_telehealth.json";
import { PublicKey, Connection } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { RescueCipher, getMXEPublicKey, x25519 } from "@arcium-hq/client";
import { useToast } from "@/hooks/use-toast";

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey(idl.address);

// Generate UUID for recordId
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Get nonce from environment
const getNonce = (): Uint8Array => {
  const envNonce = process.env.NEXT_PUBLIC_ENCRYPTION_NONCE;

  const hex = envNonce?.startsWith("0x") ? envNonce.slice(2) : envNonce;
  const nonce = new Uint8Array(16);
  if (hex?.length === 32) {
    for (let i = 0; i < 32; i += 2) {
      nonce[i / 2] = parseInt(hex?.substring(i, i + 2), 16);
    }
  }

  return nonce;
};

// Get private key from environment
const getPrivateKey = (): Uint8Array => {
  const envPrivateKey = process.env.NEXT_PUBLIC_ENCRYPTION_PRIVATE_KEY;
  
  const hex = envPrivateKey?.startsWith('0x') ? envPrivateKey.slice(2) : envPrivateKey;
  const privateKey = new Uint8Array(32);
  if (hex?.length === 64) { // 32 bytes = 64 hex chars
    for (let i = 0; i < 64; i += 2) {
      privateKey[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
  }

  console.log("✅ Using fixed private key from environment");
  return privateKey;
};

// String encoding functions for u64/u128 types
const stringToU64Array = (str: string, numU64s: number): bigint[] => {
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
};

const stringToU128 = (str: string): bigint => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let value = BigInt(0);

  for (let i = 0; i < Math.min(bytes.length, 16); i++) {
    value |= BigInt(bytes[i]) << BigInt(i * 8);
  }
  return value;
};

// Text splitting utilities for better UX
const splitTextIntoFields = (
  text: string,
  fieldCount: number,
  charsPerField: number
): string[] => {
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
};

// Helper function to convert string array to u64 array
const stringArrayToU64Array = (
  strings: string[],
  numU64sPerString: number
): bigint[] => {
  const result: bigint[] = [];

  for (const str of strings) {
    const u64s = stringToU64Array(str, numU64sPerString);
    result.push(...u64s);
  }

  return result;
};

interface HealthRecordFormProps {
  patientName: string;
  patientId: string;
  doctorId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export function HealthRecordForm({
  patientName,
  patientId,
  doctorId,
  onSave,
  onCancel,
}: HealthRecordFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    diagnosis: "",
    symptoms: "",
    treatment: "",
    medications: "",
    notes: "",
    followUp: "",
    recordType: "consultation",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { connection } = useConnection();
  const wallet = useWallet();

  const getProvider = () => {
    if (
      !wallet.publicKey ||
      !wallet.signTransaction ||
      !wallet.signAllTransactions
    ) {
      throw new Error("Wallet not connected");
    }

    // Create a fresh connection to avoid blockhash issues
    const freshConnection = new Connection(connection.rpcEndpoint, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000, // 60 seconds
    });

    const provider = new AnchorProvider(freshConnection, wallet as any, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
      skipPreflight: false,
    });
    setProvider(provider);
    return provider;
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.diagnosis || !formData.symptoms || !formData.treatment) {
      toast({
        title: "Missing Required Fields",
        description:
          "Please fill in at least diagnosis, symptoms, and treatment fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const anchorProvider = getProvider();
      const program = new Program<EpochTelehealth>(idl_object, anchorProvider);

      // Get MXE public key for encryption WITH NULL CHECK
      console.log("Fetching MXE public key...");
      const mxePublicKey = await getMXEPublicKey(anchorProvider, programID);

      // ADDED: Critical null check
      if (!mxePublicKey) {
        throw new Error(
          "Failed to get MXE public key - received null. Check program ID and network connection."
        );
      }

      console.log(
        "MXE public key obtained:",
        Buffer.from(mxePublicKey).toString("hex")
      );

      // Generate encryption keys
      const privateKey = x25519.utils.randomSecretKey();
      const publicKey = x25519.getPublicKey(privateKey);

      const privateKeyHex = Buffer.from(privateKey).toString('hex');
      console.log('NEXT_PUBLIC_ENCRYPTION_PRIVATE_KEY=' + privateKeyHex);

      if (!publicKey) {
        throw new Error("Failed to generate public key");
      }

      // Now mxePublicKey is guaranteed to not be null
      const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
      const cipher = new RescueCipher(sharedSecret);

      // Generate record ID from UUID
      const recordUUID = generateUUID();
      // Convert UUID to numeric record ID (using first 8 bytes of hash)
      const recordId = new BN(
        Array.from(new TextEncoder().encode(recordUUID))
          .slice(0, 8)
          .reduce((acc, byte, i) => acc + (byte << (i * 8)), 0)
      );

      // Get nonce (from env or random)
      const nonce = getNonce();

      // AUTOMATIC TEXT SPLITTING FOR BETTER UX
      console.log("Preparing health record data...");
      const diagnosisFields = splitTextIntoFields(formData.diagnosis, 3, 8);
      const diagnosisParts = stringArrayToU64Array(diagnosisFields, 1);

      const symptomFields = splitTextIntoFields(formData.symptoms, 5, 8);
      const symptoms = stringArrayToU64Array(symptomFields, 1);

      const treatmentPlan = stringToU128(formData.treatment.substring(0, 16));

      const medicationFields = splitTextIntoFields(formData.medications, 5, 8);
      const medications = stringArrayToU64Array(medicationFields, 1);

      const notes = stringToU128(formData.notes.substring(0, 16));

      // Basic identifiers
      const patientIdBigInt = stringToU128(patientId.substring(0, 16));
      const doctorIdBigInt = stringToU128(doctorId.substring(0, 16));
      const consultationDate = BigInt(Math.floor(Date.now() / 1000));

      // Combine all data for encryption (18 total fields: 4 u128 + 14 u64)
      const healthRecordData = [
        patientIdBigInt, // u128 - patient_id
        doctorIdBigInt, // u128 - doctor_id
        consultationDate, // u64 - consultation_date
        ...diagnosisParts, // 3 x u64 - diagnosis array
        ...symptoms, // 5 x u64 - symptoms array
        treatmentPlan, // u128 - treatment_plan
        ...medications, // 5 x u64 - medications array
        notes, // u128 - notes
      ];

      console.log("Health record data prepared");

      // Encrypt the medical data
      console.log("Encrypting data...");
      const ciphertext: number[][] = cipher.encrypt(healthRecordData, nonce);

      // Validate ciphertext
      if (!ciphertext || ciphertext.length !== 18) {
        console.error("Ciphertext length:", ciphertext?.length);
        throw new Error("Invalid ciphertext generated");
      }

      // Validate each ciphertext element
      for (let i = 0; i < ciphertext.length; i++) {
        if (!ciphertext[i] || ciphertext[i].length !== 32) {
          console.error(`Invalid ciphertext at index ${i}:`, ciphertext[i]);
          throw new Error(`Invalid ciphertext at index ${i}`);
        }
      }

      // Derive the health record PDA using recordId
      console.log("Deriving PDA...");
      const [healthRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("health_record"),
          wallet.publicKey!.toBuffer(),
          recordId.toArrayLike(Buffer, "le", 8),
        ],
        programID
      );

      // Convert ciphertext to arrays safely
      const ciphertextArrays = ciphertext.map((ct) => {
        if (!ct) throw new Error("Undefined ciphertext element");
        return Array.from(ct);
      });

      console.log("Sending transaction...");

      // Store encrypted health record on-chain with retry logic
      let retries = 3;
      let signature: string = "";

      while (retries > 0) {
        try {
          signature = await program.methods
            .storeHealthRecord(
              recordId,
              ciphertextArrays[0], // patient_id
              ciphertextArrays[1], // doctor_id
              ciphertextArrays[2], // consultation_date
              [
                ciphertextArrays[3], // diagnosis part 1
                ciphertextArrays[4], // diagnosis part 2
                ciphertextArrays[5], // diagnosis part 3
              ],
              [
                ciphertextArrays[6], // symptom1
                ciphertextArrays[7], // symptom2
                ciphertextArrays[8], // symptom3
                ciphertextArrays[9], // symptom4
                ciphertextArrays[10], // symptom5
              ],
              ciphertextArrays[11], // treatment_plan
              [
                ciphertextArrays[12], // medication1
                ciphertextArrays[13], // medication2
                ciphertextArrays[14], // medication3
                ciphertextArrays[15], // medication4
                ciphertextArrays[16], // medication5
              ],
              ciphertextArrays[17] // notes
            )
            .accounts({
              doctor: wallet.publicKey!,
              systemProgram: web3.SystemProgram.programId,
              healthRecord: healthRecordPDA,
            })
            .signers([]) // Wallet is already signer Acute Malaria Headache, fever, malaise medication ACT, paracetamol & ciprofloxacin Check in 3 days
            .rpc({
              commitment: "confirmed",
              skipPreflight: false,
              preflightCommitment: "confirmed",
            });

          break; // Success, break out of retry loop
        } catch (err: any) {
          retries--;
          if (retries === 0) throw err;

          console.log(`Retrying transaction... ${retries} attempts left`);
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      console.log("Health record stored successfully! Signature:", signature);
      console.log("Health Record PDA:", healthRecordPDA.toString());
      console.log("Record UUID:", recordUUID);

      toast({
        title: "Success!",
        description: (
          <div>
            <p>Health record encrypted and stored on-chain successfully.</p>
            <p className="text-xs mt-1">Record ID: {recordUUID}</p>
            <p className="text-xs break-all">Tx: {signature}</p>
          </div>
        ),
      });

      if (onSave) {
        onSave({
          ...formData,
          patientId,
          recordId: recordUUID,
          createdAt: new Date().toISOString(),
          signature,
          pda: healthRecordPDA.toString(),
        });
      }
    } catch (err) {
      console.error("Error submitting record:", err);
      let errorMessage = "Unknown error occurred";

      if (err instanceof Error) {
        errorMessage = err.message;

        // Provide more user-friendly error messages
        if (errorMessage.includes("Blockhash not found")) {
          errorMessage =
            "Network connection issue. Please check your internet connection and try again.";
        } else if (errorMessage.includes("Transaction simulation failed")) {
          errorMessage =
            "Transaction failed. Please ensure you have sufficient SOL for transaction fees.";
        } else if (errorMessage.includes("User rejected")) {
          errorMessage = "Transaction was rejected by your wallet.";
        } else if (errorMessage.includes("failed to send transaction")) {
          errorMessage = "Failed to send transaction. Please try again.";
        }
      }

      toast({
        title: "Failed to Store Record",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const recordTypes = [
    { value: "consultation", label: "Consultation" },
    { value: "diagnosis", label: "Diagnosis" },
    { value: "prescription", label: "Prescription" },
    { value: "lab_result", label: "Lab Result" },
    { value: "imaging", label: "Imaging" },
    { value: "follow_up", label: "Follow-up" },
  ];

  return (
    <Card className="w-full z-40">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">New Health Record</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Patient: {patientName}
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-600 dark:text-blue-400"
          >
            <Clock className="w-3 h-3 mr-1" />
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="recordType">Record Type</Label>
            <Select
              value={formData.recordType}
              onValueChange={(value) => handleChange("recordType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select record type" />
              </SelectTrigger>
              <SelectContent>
                {recordTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="diagnosis">
            Diagnosis{" "}
            <span className="text-xs text-gray-500">(up to 24 characters)</span>
          </Label>
          <Textarea
            id="diagnosis"
            value={formData.diagnosis}
            onChange={(e) => handleChange("diagnosis", e.target.value)}
            placeholder="Enter diagnosis"
            maxLength={24}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.diagnosis.length}/24 characters
          </p>
        </div>

        <div>
          <Label htmlFor="symptoms">
            Symptoms{" "}
            <span className="text-xs text-gray-500">(up to 40 characters)</span>
          </Label>
          <Textarea
            id="symptoms"
            value={formData.symptoms}
            onChange={(e) => handleChange("symptoms", e.target.value)}
            placeholder="Describe patient symptoms"
            className="min-h-[80px]"
            maxLength={40}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.symptoms.length}/40 characters
          </p>
        </div>

        <div>
          <Label htmlFor="treatment">
            Treatment Plan{" "}
            <span className="text-xs text-gray-500">(up to 16 characters)</span>
          </Label>
          <Textarea
            id="treatment"
            value={formData.treatment}
            onChange={(e) => handleChange("treatment", e.target.value)}
            placeholder="Describe the treatment plan"
            className="min-h-[80px]"
            maxLength={16}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.treatment.length}/16 characters
          </p>
        </div>

        <div>
          <Label htmlFor="medications">
            Medications{" "}
            <span className="text-xs text-gray-500">(up to 40 characters)</span>
          </Label>
          <Textarea
            id="medications"
            value={formData.medications}
            onChange={(e) => handleChange("medications", e.target.value)}
            placeholder="List prescribed medications with dosage"
            className="min-h-[80px]"
            maxLength={40}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.medications.length}/40 characters
          </p>
        </div>

        <div>
          <Label htmlFor="notes">
            Additional Notes{" "}
            <span className="text-xs text-gray-500">(up to 16 characters)</span>
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Any additional notes or observations"
            className="min-h-[80px]"
            maxLength={16}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.notes.length}/16 characters
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            This record will be encrypted & securely stored on the blockchain,
            powered by Arcium. Character limits ensure proper encryption.
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 bg-gray-50 dark:bg-gray-800/50 p-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Record
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
