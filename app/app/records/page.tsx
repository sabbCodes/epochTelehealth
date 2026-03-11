"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Search,
  ChevronDown,
  ExternalLink,
  Shield,
  Clock,
  RefreshCw,
  Hash,
  ArrowLeft,
} from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  setProvider,
} from "@coral-xyz/anchor";
import { EpochTelehealth } from "@/components/epoch_telehealth";
import idl from "@/components/epoch_telehealth.json";
import { getMXEPublicKey, RescueCipher, x25519 } from "@arcium-hq/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface MedicalRecord {
  id: number;
  title: string;
  date: string;
  doctor: string;
  type: string;
  status: string;
  blockchainTx: string;
  summary: string;
  symptoms?: string;
  treatment?: string;
  medications?: string;
  notes?: string;
  prescriptions?: string[];
  results?: Record<string, string>;
  followUp?: string;
  recordId?: string;
  patientId?: string;
  consultationDate?: string;
}

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey(idl.address);

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

// String decoding functions
const u64ArrayToString = (u64Array: bigint[]): string => {
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
};

const u128ToString = (value: bigint): string => {
  const bytes: number[] = [];
  for (let i = 0; i < 16; i++) {
    const byte = Number((value >> BigInt(i * 8)) & BigInt(0xff));
    if (byte !== 0) {
      bytes.push(byte);
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
};

export default function RecordsPage() {
  const router = useRouter();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const toggleRecord = (id: number) => {
    setExpandedRecord(expandedRecord === id ? null : id);
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

  const fetchMedicalRecords = async () => {
    if (!publicKey || !signTransaction) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const anchorProvider = getProvider();
      const program = new Program<EpochTelehealth>(idl_object, anchorProvider);

      console.log("🔍 Fetching all health record accounts...");

      // Get MXE public key for decryption WITH NULL CHECK
      const mxePublicKey = await getMXEPublicKey(anchorProvider, programID);

      // ADDED: Critical null check
      if (!mxePublicKey) {
        throw new Error(
          "Failed to get MXE public key - received null. Check program ID and network connection."
        );
      }

      console.log(
        "✅ MXE public key obtained:",
        Buffer.from(mxePublicKey).toString("hex")
      );

      const privateKey = getPrivateKey();
      console.log(
        "🔑 Private key being used:",
        Buffer.from(privateKey).toString("hex")
      );

      // Now mxePublicKey is guaranteed to not be null
      const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
      console.log(
        "🔐 Shared secret generated:",
        Buffer.from(sharedSecret).toString("hex")
      );

      const cipher = new RescueCipher(sharedSecret);

      // Use the EXACT SAME nonce generation as in your form component
      const nonce = getNonce();
      console.log(
        "✅ Using nonce for decryption:",
        Buffer.from(nonce).toString("hex")
      );

      // Fetch ALL health record accounts
      console.log("📥 Fetching all records from blockchain...");
      const allRecords = await program.account.healthRecord.all();
      console.log(`✅ Found ${allRecords.length} records total`);

      const decryptedRecords: MedicalRecord[] = [];

      for (const record of allRecords) {
        try {
          console.log(`🔓 Decrypting record: ${record.publicKey.toString()}`);

          // Extract encrypted data
          const encryptedData = [
            Array.from(new Uint8Array(record.account.patientId)),
            Array.from(new Uint8Array(record.account.doctorId)),
            Array.from(new Uint8Array(record.account.consultationDate)),
            Array.from(new Uint8Array(record.account.diagnosis[0])),
            Array.from(new Uint8Array(record.account.diagnosis[1])),
            Array.from(new Uint8Array(record.account.diagnosis[2])),
            Array.from(new Uint8Array(record.account.symptoms[0])),
            Array.from(new Uint8Array(record.account.symptoms[1])),
            Array.from(new Uint8Array(record.account.symptoms[2])),
            Array.from(new Uint8Array(record.account.symptoms[3])),
            Array.from(new Uint8Array(record.account.symptoms[4])),
            Array.from(new Uint8Array(record.account.treatmentPlan)),
            Array.from(new Uint8Array(record.account.medications[0])),
            Array.from(new Uint8Array(record.account.medications[1])),
            Array.from(new Uint8Array(record.account.medications[2])),
            Array.from(new Uint8Array(record.account.medications[3])),
            Array.from(new Uint8Array(record.account.medications[4])),
            Array.from(new Uint8Array(record.account.notes)),
          ];

          console.log("🔐 Decrypting data...");
          const decryptedData = cipher.decrypt(encryptedData, nonce);
          console.log("✅ Data decrypted successfully");

          // Convert decrypted values back to strings
          const patientId = u128ToString(decryptedData[0]);
          const doctorId = u128ToString(decryptedData[1]);

          // Handle consultation date - it's likely encrypted text, not a timestamp
          let consultationDate: string;
          try {
            const consultationText = u128ToString(decryptedData[2]);
            // Try to parse as date, if not use as-is
            const date = new Date(consultationText);
            if (!isNaN(date.getTime())) {
              consultationDate = date.toISOString().split("T")[0];
            } else {
              consultationDate =
                consultationText || new Date().toISOString().split("T")[0];
            }
          } catch {
            consultationDate = new Date().toISOString().split("T")[0];
          }

          // Reconstruct text fields
          const diagnosis = u64ArrayToString([
            decryptedData[3],
            decryptedData[4],
            decryptedData[5],
          ]);
          const symptoms = u64ArrayToString([
            decryptedData[6],
            decryptedData[7],
            decryptedData[8],
            decryptedData[9],
            decryptedData[10],
          ]);
          const treatmentPlan = u128ToString(decryptedData[11]);
          const medications = u64ArrayToString([
            decryptedData[12],
            decryptedData[13],
            decryptedData[14],
            decryptedData[15],
            decryptedData[16],
          ]);
          const notes = u128ToString(decryptedData[17]);

          const recordId = record.publicKey.toString().slice(0, 8);

          console.log("📋 Decrypted values:", {
            patientId,
            doctorId,
            consultationDate,
            diagnosis: diagnosis.substring(0, 30),
            symptoms: symptoms.substring(0, 30),
            treatmentPlan: treatmentPlan.substring(0, 30),
          });

          // Check if we got readable text or just garbled data
          const isReadableText = (text: string) => {
            return (
              text.length > 0 &&
              !text.includes("�") &&
              /^[\x20-\x7E]*$/.test(text)
            ); // Basic ASCII check
          };

          decryptedRecords.push({
            id: decryptedRecords.length + 1,
            title: `Record from ${consultationDate}`,
            date: consultationDate,
            doctor: isReadableText(doctorId) ? doctorId : "Unknown Doctor",
            type: "Consultation",
            status: "Completed",
            blockchainTx: record.publicKey.toString(),
            summary: isReadableText(diagnosis)
              ? diagnosis
              : "Encrypted Diagnosis",
            symptoms: isReadableText(symptoms)
              ? symptoms
              : "Encrypted Symptoms",
            treatment: isReadableText(treatmentPlan)
              ? treatmentPlan
              : "Encrypted Treatment",
            medications: isReadableText(medications)
              ? medications
              : "Encrypted Medications",
            notes: isReadableText(notes) ? notes : "Encrypted Notes",
            recordId: recordId,
            patientId: isReadableText(patientId)
              ? patientId
              : "Unknown Patient",
            consultationDate: consultationDate,
          });

          console.log(
            `✅ Successfully processed record ${decryptedRecords.length}`
          );
        } catch (decryptError) {
          console.error(
            `❌ Failed to decrypt record ${record.publicKey}:`,
            decryptError
          );
          decryptedRecords.push({
            id: decryptedRecords.length + 1,
            title: `Medical Record`,
            date: new Date().toISOString().split("T")[0],
            doctor: "Unknown",
            type: "Encrypted",
            status: "Stored on Blockchain",
            blockchainTx: record.publicKey.toString(),
            summary: "Unable to decrypt record",
            symptoms: "Data encrypted",
            treatment: "Data encrypted",
            medications: "Data encrypted",
            notes: "Data encrypted",
          });
        }
      }

      console.log(`🎉 Total records processed: ${decryptedRecords.length}`);
      setMedicalRecords(decryptedRecords);
    } catch (err) {
      console.error("❌ Error fetching medical records:", err);
      setError(
        `Failed to fetch medical records: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Consultation":
        return "bg-blue-900/40 text-blue-300 border border-blue-700/30";
      case "Lab Report":
        return "bg-emerald-900/40 text-emerald-300 border border-emerald-700/30";
      case "Prescription":
        return "bg-purple-900/40 text-purple-300 border border-purple-700/30";
      case "Imaging":
        return "bg-amber-900/40 text-amber-300 border border-amber-700/30";
      default:
        return "bg-slate-800 text-slate-300 border border-slate-700/30";
    }
  };

  // Filter records based on search query
  const filteredRecords = medicalRecords.filter(
    (record) =>
      record.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.symptoms?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.treatment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patientId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">
                Medical Records
              </h1>
              <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-700/30">
                <Shield className="w-3 h-3 mr-1" />
                Blockchain Secured
              </Badge>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[#004DFF]" />
            <p className="text-slate-400">
              Fetching and decrypting your medical records from the blockchain...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-slate-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-white">
                  Medical Records
                </h1>
              </div>
              <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-700/30">
                <Shield className="w-3 h-3 mr-1" />
                Blockchain Secured
              </Badge>
            </div>
            <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input
                  placeholder="Search records, doctors, or conditions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl"
                  disabled={true}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 md:flex-none md:w-48 justify-center border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={fetchMedicalRecords}
                  disabled={isLoading || !publicKey}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {publicKey ? "Refresh" : "Connect"}
                </Button>
                <div
                  className="wallet-connect-wrapper flex-1 md:flex-none"
                  style={{ minWidth: "fit-content" }}
                >
                  <WalletMultiButton className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-red-900/30 border border-red-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Records</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={fetchMedicalRecords}
              className="px-4 py-2 bg-[#004DFF] text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no records
  if (medicalRecords.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-slate-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-white">
                  Medical Records
                </h1>
              </div>
              <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-700/30">
                <Shield className="w-3 h-3 mr-1" />
                Blockchain Secured
              </Badge>
            </div>
            <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <Input
                  placeholder="Search records, doctors, or conditions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl"
                  disabled={true}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 md:flex-none md:w-48 justify-center border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={fetchMedicalRecords}
                  disabled={isLoading || !publicKey}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {publicKey ? "Refresh" : "Connect"}
                </Button>
                <div
                  className="wallet-connect-wrapper flex-1 md:flex-none"
                  style={{ minWidth: "fit-content" }}
                >
                  <WalletMultiButton className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-[#004DFF]/15 border border-[#004DFF]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#004DFF]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No Medical Records Found
            </h2>
            <p className="text-slate-400 mb-6">
              You don&apos;t have any medical records yet. Connect your wallet and
              click the button below to fetch your records from the blockchain.
            </p>
            <button
              onClick={fetchMedicalRecords}
              disabled={!publicKey}
              className={`px-6 py-3 rounded-xl font-medium flex items-center mx-auto ${
                publicKey
                  ? "bg-[#004DFF] text-white hover:bg-blue-600"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              } transition-colors`}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {publicKey ? "Fetch My Records" : "Connect Wallet First"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#004DFF]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-slate-600"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-white">
                Medical Records
              </h1>
            </div>
            <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-700/30">
              <Shield className="w-3 h-3 mr-1" />
              Blockchain Secured
            </Badge>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <Input
                placeholder="Search records, doctors, or conditions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-[#004DFF]/30"
              />
            </div>
            <Button
              variant="outline"
              className="w-full md:w-48 flex items-center justify-center border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={fetchMedicalRecords}
              disabled={isLoading || !publicKey}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {publicKey ? "Refresh Records" : "Connect Wallet"}
                </>
              )}
            </Button>
            <div className="wallet-connect-wrapper">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Records Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-slate-400">
            Showing {filteredRecords.length} of {medicalRecords.length} records
          </p>
          {searchQuery && (
            <Badge variant="outline" className="text-[#004DFF] border-[#004DFF]/30">
              Search: &quot;{searchQuery}&quot;
            </Badge>
          )}
        </div>

        {/* Timeline View */}
        <div className="space-y-4">
          {filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Collapsible
                open={expandedRecord === record.id}
                onOpenChange={() => toggleRecord(record.id)}
              >
                <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/50 hover:border-slate-700/50 transition-all rounded-2xl">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#004DFF]/15 border border-[#004DFF]/20 rounded-2xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-[#004DFF]" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">
                              {record.title}
                            </CardTitle>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center text-sm text-slate-400">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                {new Date(record.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center text-sm text-slate-400">
                                <User className="w-3.5 h-3.5 mr-1" />
                                {record.doctor}
                              </div>
                              {record.patientId && (
                                <div className="flex items-center text-sm text-slate-400">
                                  <Hash className="w-3.5 h-3.5 mr-1" />
                                  Patient: {record.patientId}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(record.type)}>
                            {record.type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-emerald-400 border-emerald-700/30"
                          >
                            {record.status}
                          </Badge>
                          <ChevronDown
                            className={`w-5 h-5 text-slate-400 transition-transform ${
                              expandedRecord === record.id ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Record Details */}
                        <div className="space-y-4">
                          {record.patientId && (
                            <div>
                              <h4 className="font-semibold text-slate-300 mb-2">
                                Patient ID
                              </h4>
                              <p className="text-slate-400 text-sm">
                                {record.patientId}
                              </p>
                            </div>
                          )}

                          <div>
                            <h4 className="font-semibold text-slate-300 mb-2">
                              Diagnosis
                            </h4>
                            <p className="text-slate-400 text-sm">
                              {record.summary}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-slate-300 mb-2">
                              Symptoms
                            </h4>
                            <p className="text-slate-400 text-sm">
                              {record.symptoms}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-slate-300 mb-2">
                              Treatment Plan
                            </h4>
                            <p className="text-slate-400 text-sm">
                              {record.treatment}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-slate-300 mb-2">
                              Medications
                            </h4>
                            <p className="text-slate-400 text-sm">
                              {record.medications}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold text-slate-300 mb-2">
                              Clinical Notes
                            </h4>
                            <p className="text-slate-400 text-sm">
                              {record.notes}
                            </p>
                          </div>
                        </div>

                        {/* Blockchain Info */}
                        <div className="space-y-4">
                          <div className="bg-slate-800/60 border border-slate-700/30 rounded-xl p-4">
                            <h4 className="font-semibold text-white mb-3 flex items-center">
                              <Shield className="w-4 h-4 mr-2 text-emerald-400" />
                              Blockchain Verification
                            </h4>

                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="text-slate-400">
                                  Transaction:
                                </span>
                                <div className="flex items-center justify-between mt-1">
                                  <code className="text-xs bg-slate-700/60 text-slate-300 px-2 py-1 rounded-lg">
                                    {record.blockchainTx.substring(0, 20)}...
                                  </code>
                                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              {record.recordId && (
                                <div>
                                  <span className="text-slate-400">
                                    Record ID:
                                  </span>
                                  <div className="mt-1">
                                    <code className="text-xs bg-slate-700/60 text-slate-300 px-2 py-1 rounded-lg">
                                      {record.recordId}
                                    </code>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center space-x-2 pt-2">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-emerald-400 text-xs">
                                  Verified on Solana
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-2">
                            <Button className="w-full border-slate-700 text-slate-300 hover:bg-slate-800" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              View Full Record
                            </Button>
                            <Button className="w-full border-slate-700 text-slate-300 hover:bg-slate-800" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
