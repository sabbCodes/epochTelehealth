"use client";

import { useState } from "react";
import {
  FileText,
  Save,
  Upload,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { Program, AnchorProvider, web3, setProvider } from "@coral-xyz/anchor";
import { EpochTelehealth } from "./epoch_telehealth";
import idl from "./epoch_telehealth.json";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { RescueCipher, getMXEPublicKey, x25519 } from "@arcium-hq/client";
import { useToast } from "@/hooks/use-toast";

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey(idl.address);

// Browser-compatible crypto utilities
const hashToU64 = async (s: string): Promise<bigint> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(s);
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data as BufferSource
  );
  const hashArray = new Uint8Array(hashBuffer);

  let v = BigInt(0);
  for (let i = 0; i < 8; i++) {
    v |= BigInt(hashArray[i]) << (BigInt(i) * BigInt(8));
  }
  return v;
};

const randomBytes = (length: number): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(length));
};

const getFixedNonce = (): Uint8Array => {
  // Use a fixed nonce from environment or fallback
  const nonceString =
    process.env.NEXT_PUBLIC_ENCRYPTION_NONCE ||
    "epoch-telehealth-default-nonce-12345";

  const encoder = new TextEncoder();
  const data = encoder.encode(nonceString);

  // Ensure we have exactly 16 bytes
  const nonce = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    nonce[i] = data[i % data.length];
  }

  return nonce; // Return as Uint8Array
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

  // const [files, setFiles] = useState<{ name: string; type: string; size: string }[]>([])
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

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      AnchorProvider.defaultOptions()
    );
    setProvider(provider);
    return provider;
  };

  // const handleSubmit = async () => {
  //   // Validate form data
  //   if (!formData.diagnosis || !formData.symptoms || !formData.treatment) {
  //     toast({
  //       title: "Missing Required Fields",
  //       description:
  //         "Please fill in at least diagnosis, symptoms, and treatment fields.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsSaving(true);

  //   try {
  //     const anchorProvider = getProvider();
  //     const program = new Program<EpochTelehealth>(idl_object, anchorProvider);

  //     // Get MXE public key for encryption
  //     const mxePublicKey = await getMXEPublicKey(anchorProvider, programID);

  //     // Generate encryption keys
  //     const privateKey = x25519.utils.randomSecretKey();
  //     const publicKey = x25519.getPublicKey(privateKey);

  //     if (!publicKey) {
  //       throw new Error("Failed to generate public key");
  //     }

  //     const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
  //     const cipher = new RescueCipher(sharedSecret);

  //     // Convert form data to u64 hashes
  //     const medicalData = [
  //       await hashToU64(patientId),
  //       await hashToU64(doctorId),
  //       await hashToU64(new Date().toISOString()), // consultation date
  //       await hashToU64(formData.diagnosis),
  //       await hashToU64(formData.symptoms),
  //       await hashToU64(formData.treatment),
  //       await hashToU64(formData.medications),
  //       await hashToU64(formData.notes),
  //     ];

  //     // Encrypt the medical data
  //     const nonce = randomBytes(16);
  //     const ciphertext = cipher.encrypt(medicalData, nonce);

  //     // Validate ciphertext
  //     if (!ciphertext || ciphertext.length !== 8) {
  //       throw new Error("Invalid ciphertext generated");
  //     }

  //     // Derive the medical record PDA
  //     const [medicalRecordPDA] = PublicKey.findProgramAddressSync(
  //       [Buffer.from("medical_record"), wallet.publicKey!.toBuffer()],
  //       programID
  //     );

  //     // Store encrypted medical record on-chain
  //     const signature = await program.methods
  //       .storeMedicalRecord(
  //         Array.from(ciphertext[0]!),
  //         Array.from(ciphertext[1]!),
  //         Array.from(ciphertext[2]!),
  //         Array.from(ciphertext[3]!),
  //         Array.from(ciphertext[4]!),
  //         Array.from(ciphertext[5]!),
  //         Array.from(ciphertext[6]!),
  //         Array.from(ciphertext[7]!)
  //       )
  //       .accounts({
  //         payer: wallet.publicKey!,
  //         systemProgram: web3.SystemProgram.programId,
  //         medicalRecord: medicalRecordPDA,
  //       })
  //       .rpc({ commitment: "confirmed" });

  //     console.log("Medical record stored successfully! Signature:", signature);

  //     toast({
  //       title: "Success!",
  //       description: (
  //         <div>
  //           <p>Medical record encrypted and stored on-chain successfully.</p>
  //           <p className="text-xs mt-1 break-all">Tx: {signature}</p>
  //         </div>
  //       ),
  //     });

  //     if (onSave) {
  //       onSave({
  //         ...formData,
  //         patientId,
  //         createdAt: new Date().toISOString(),
  //         signature,
  //       });
  //     }
  //   } catch (err) {
  //     console.error("Error submitting record:", err);
  //     const errorMessage =
  //       err instanceof Error ? err.message : "Unknown error occurred";
  //     toast({
  //       title: "Failed to Store Record",
  //       description: `Error: ${errorMessage}. Please ensure your wallet is connected and try again.`,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

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

      // Get MXE public key for encryption
      const mxePublicKey = await getMXEPublicKey(anchorProvider, programID);

      // Generate encryption keys
      const privateKey = x25519.utils.randomSecretKey();
      const publicKey = x25519.getPublicKey(privateKey);

      if (!publicKey) {
        throw new Error("Failed to generate public key");
      }

      const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
      const cipher = new RescueCipher(sharedSecret);

      // Generate deterministic nonce using record ID, doctor ID, and patient ID
      const nonce = getFixedNonce();
      console.log("Generated deterministic nonce:", Array.from(nonce));

      // Convert text directly to bigint (without hashing)
      const textToBigInt = (s: string): bigint => {
        const encoder = new TextEncoder();
        const data = encoder.encode(s);

        // Convert first 8 bytes to bigint (same as your hashToU64 but without hashing)
        let value = BigInt(0);
        for (let i = 0; i < Math.min(8, data.length); i++) {
          value |= BigInt(data[i]) << (BigInt(i) * BigInt(8));
        }
        return value;
      };

      // Then use this instead of hashToU64:
      const medicalData = [
        textToBigInt(patientId),
        textToBigInt(doctorId),
        textToBigInt(new Date().toISOString()),
        textToBigInt(formData.diagnosis),
        textToBigInt(formData.symptoms),
        textToBigInt(formData.treatment),
        textToBigInt(formData.medications),
        textToBigInt(formData.notes),
      ];

      // Encrypt the medical data with deterministic nonce
      const ciphertext = cipher.encrypt(medicalData, nonce);

      // Validate ciphertext
      if (!ciphertext || ciphertext.length !== 8) {
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

      // Derive the medical record PDA
      const [medicalRecordPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("medical_record"), wallet.publicKey!.toBuffer()],
        programID
      );

      // Convert ciphertext to arrays safely
      const ciphertextArrays = ciphertext.map((ct) => {
        if (!ct) throw new Error("Undefined ciphertext element");
        return Array.from(ct);
      });

      // Store encrypted medical record on-chain
      const signature = await program.methods
        .storeMedicalRecord(
          ciphertextArrays[0],
          ciphertextArrays[1],
          ciphertextArrays[2],
          ciphertextArrays[3],
          ciphertextArrays[4],
          ciphertextArrays[5],
          ciphertextArrays[6],
          ciphertextArrays[7]
        )
        .accounts({
          payer: wallet.publicKey!,
          systemProgram: web3.SystemProgram.programId,
          medicalRecord: medicalRecordPDA,
        })
        .rpc({ commitment: "confirmed" });

      console.log("Medical record stored successfully! Signature:", signature);
      console.log("Medical Record PDA:", medicalRecordPDA.toString());

      toast({
        title: "Success!",
        description: (
          <div>
            <p>Medical record encrypted and stored on-chain successfully.</p>
            <p className="text-xs mt-1 break-all">Tx: {signature}</p>
          </div>
        ),
      });

      if (onSave) {
        onSave({
          ...formData,
          patientId,
          createdAt: new Date().toISOString(),
          signature,
        });
      }
    } catch (err) {
      console.error("Error submitting record:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      toast({
        title: "Failed to Store Record",
        description: `Error: ${errorMessage}. Please ensure your wallet is connected and try again.`,
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
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <Input
            id="diagnosis"
            value={formData.diagnosis}
            onChange={(e) => handleChange("diagnosis", e.target.value)}
            placeholder="Enter diagnosis"
          />
        </div>

        <div>
          <Label htmlFor="symptoms">Symptoms</Label>
          <Textarea
            id="symptoms"
            value={formData.symptoms}
            onChange={(e) => handleChange("symptoms", e.target.value)}
            placeholder="Describe patient symptoms"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="treatment">Treatment Plan</Label>
          <Textarea
            id="treatment"
            value={formData.treatment}
            onChange={(e) => handleChange("treatment", e.target.value)}
            placeholder="Describe the treatment plan"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="medications">Medications</Label>
          <Textarea
            id="medications"
            value={formData.medications}
            onChange={(e) => handleChange("medications", e.target.value)}
            placeholder="List prescribed medications with dosage"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Any additional notes or observations"
            className="min-h-[80px]"
          />
        </div>

        {/* <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Attachments</Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Plus className="w-4 h-4 mr-1" />
                  Add File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Drag and drop files here, or click to browse
                    </p>
                    <Button onClick={handleAddFile}>Browse Files</Button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Supported formats: PDF, JPG, PNG, DOCX (Max size: 10MB)
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2 mt-2">
            {files.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">No files attached</div>
            ) : (
              files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.size}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="h-8 w-8 p-0 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div> */}

        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            This record will be encrypted & securely stored on the blockchain,
            powered by Arcium.
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
