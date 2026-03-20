"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useRoomConnection,
  VideoView
} from "@whereby.com/browser-sdk/react";
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  MessageCircle, FileText, Monitor, 
  Plus, Send, Activity, X, ChevronRight, 
  Settings, ShieldCheck, Trash2, Save, RefreshCw, ChevronDown
} from "lucide-react";
import { VideoParticipant } from '@/components/video/VideoParticipant';
import { HealthRecordForm } from '@/components/health-record-form';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { EpochTelehealth } from '@/components/epoch_telehealth';
import idl from '@/components/epoch_telehealth.json';
import { getMXEPublicKey, RescueCipher, x25519 } from "@arcium-hq/client";
import { PublicKey } from "@solana/web3.js";
import { PrescriptionForm } from '@/components/prescription-form';

interface UserProfile {
  id?: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  role?: string;
}

interface PatientDetails {
  date_of_birth: string | null;
  gender: string | null;
}

interface HealthRecord {
  id: number;
  title: string;
  date: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  medications: string;
  notes: string;
  blockchainTx: string;
}

interface PrescriptionRow {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface WherebyVideoCallProps {
  roomUrl: string;
  localUser: UserProfile;
  remoteUser: UserProfile;
  role: "doctor" | "patient";
  appointmentId?: string;
  patientProfileId?: string;
}

const emptyPrescription = (): PrescriptionRow => ({
  medicationName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

function calculateAge(dob: string | null): string {
  if (!dob) return "N/A";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "N/A";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age.toString();
}

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey((idl as any).address);

const getNonce = (): Uint8Array => {
  const envNonce = process.env.NEXT_PUBLIC_ENCRYPTION_NONCE;
  const hex = envNonce?.startsWith('0x') ? envNonce.slice(2) : envNonce;
  const nonce = new Uint8Array(16);
  if (hex?.length === 32) {
    for (let i = 0; i < 32; i += 2) nonce[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return nonce;
};

const getPrivateKey = (): Uint8Array => {
  const envKey = process.env.NEXT_PUBLIC_ENCRYPTION_PRIVATE_KEY;
  const hex = envKey?.startsWith('0x') ? envKey.slice(2) : envKey;
  const key = new Uint8Array(32);
  if (hex?.length === 64) {
    for (let i = 0; i < 64; i += 2) key[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return key;
};

const u64ArrayToString = (arr: bigint[]): string => {
  const bytes: number[] = [];
  for (const val of arr) {
    for (let j = 0; j < 8; j++) {
      const b = Number((val >> BigInt(j * 8)) & BigInt(0xff));
      if (b !== 0) bytes.push(b);
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
};

const u128ToString = (val: bigint): string => {
  const bytes: number[] = [];
  for (let i = 0; i < 16; i++) {
    const b = Number((val >> BigInt(i * 8)) & BigInt(0xff));
    if (b !== 0) bytes.push(b);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
};

export function WherebyVideoCall({
  roomUrl,
  localUser,
  remoteUser,
  role,
  appointmentId = "",
  patientProfileId = "",
}: WherebyVideoCallProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showClinicalPanel, setShowClinicalPanel] = useState(role === "doctor");
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Clinical panel state
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showHealthRecord, setShowHealthRecord] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([emptyPrescription()]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [isFetchingRecords, setIsFetchingRecords] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  // Wallet hooks for on-chain record fetch
  const { connection } = useConnection();
  const wallet = useWallet();

  // Core SDK Hooks
  const roomConnectionOptions = React.useMemo(() => ({
    localMediaOptions: {
      audio: true,
      video: true,
    },
    displayName: localUser ? `${localUser.first_name || ''} ${localUser.last_name || ''}`.trim() : "Guest"
  }), [localUser?.first_name, localUser?.last_name]);

  const { state, actions } = useRoomConnection(roomUrl, roomConnectionOptions);

  const {
    localParticipant,
    remoteParticipants,
    connectionStatus,
    chatMessages,
    screenshares
  } = state;

  const {
    toggleCamera,
    toggleMicrophone,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    startScreenshare,
    stopScreenshare
  } = actions;

  // Connection logic
  const isJoiningRoom = useRef(false);

  useEffect(() => {
    if ((connectionStatus === "ready" || connectionStatus === "disconnected") && !isJoiningRoom.current) {
      isJoiningRoom.current = true;
      const delay = connectionStatus === "disconnected" ? 2000 : 0;
      setTimeout(() => {
        joinRoom()
          .then(() => console.log("[WherebyVideoCall] Successfully joined room"))
          .catch((error) => {
            console.error("[WherebyVideoCall] Failed to join room:", error);
            isJoiningRoom.current = false;
          });
      }, delay);
    }
  }, [connectionStatus, joinRoom]);

  const leaveRoomRef = useRef(leaveRoom);
  useEffect(() => { leaveRoomRef.current = leaveRoom; }, [leaveRoom]);
  useEffect(() => {
    return () => {
      try { if (leaveRoomRef.current) leaveRoomRef.current(); }
      catch (e) { console.error("[WherebyVideoCall] Error leaving room:", e); }
    };
  }, []);

  useEffect(() => {
    if (connectionStatus === "connected") {
      const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch patient details for the clinical panel (doctor only)
  useEffect(() => {
    if (role !== "doctor" || !patientProfileId) return;
    const fetchPatient = async () => {
      const { data, error } = await supabase
        .from("patient_profiles")
        .select("date_of_birth, gender")
        .eq("id", patientProfileId)
        .single();
      if (!error && data) setPatientDetails(data as PatientDetails);
    };
    fetchPatient();
  }, [role, patientProfileId]);

  // Fetch patient's on-chain health records
  const handleFetchRecords = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast({ title: "Wallet required", description: "Please connect your wallet to fetch records.", variant: "destructive" });
      return;
    }
    setIsFetchingRecords(true);
    setHealthRecords([]);
    try {
      const provider = new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions());
      setProvider(provider);
      const program = new Program<EpochTelehealth>(idl_object, provider);
      const mxePublicKey = await getMXEPublicKey(provider, programID);
      if (!mxePublicKey) throw new Error("Failed to get MXE public key");
      const sharedSecret = x25519.getSharedSecret(getPrivateKey(), mxePublicKey);
      const cipher = new RescueCipher(sharedSecret);
      const nonce = getNonce();
      const allRecords = await program.account.healthRecord.all();
      const results: HealthRecord[] = [];
      for (const record of allRecords) {
        try {
          const encData = [
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
          const dec = cipher.decrypt(encData, nonce);
          const patientId = u128ToString(dec[0]);
          // Filter: only keep records whose decrypted patientId matches current patient's profile id prefix
          if (!patientProfileId || !patientId || !patientProfileId.startsWith(patientId.slice(0, 8))) continue;
          const dateRaw = u128ToString(dec[2]);
          const parsedDate = new Date(dateRaw);
          const displayDate = isNaN(parsedDate.getTime()) ? new Date().toISOString().split('T')[0] : parsedDate.toISOString().split('T')[0];
          const diagnosis = u64ArrayToString([dec[3], dec[4], dec[5]]);
          const symptoms = u64ArrayToString([dec[6], dec[7], dec[8], dec[9], dec[10]]);
          const treatment = u128ToString(dec[11]);
          const medications = u64ArrayToString([dec[12], dec[13], dec[14], dec[15], dec[16]]);
          const notes = u128ToString(dec[17]);
          results.push({
            id: results.length + 1,
            title: `Record — ${displayDate}`,
            date: displayDate,
            diagnosis: diagnosis || 'Encrypted',
            symptoms: symptoms || 'Encrypted',
            treatment: treatment || 'Encrypted',
            medications: medications || 'Encrypted',
            notes: notes || 'Encrypted',
            blockchainTx: record.publicKey.toString(),
          });
        } catch { /* skip undecryptable records */ }
      }
      setHealthRecords(results);
      if (results.length === 0) toast({ title: "No records found", description: "No health records found for this patient on-chain." });
    } catch (err: any) {
      toast({ title: "Failed to fetch records", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsFetchingRecords(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendChatMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleEndCall = () => {
    leaveRoom();
    window.location.href = role === "doctor" ? "/doctor-dashboard" : "/dashboard";
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar - Clinical Panel (Doctor only) */}
      <AnimatePresence>
        {showClinicalPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="absolute left-0 top-0 bottom-0 md:relative h-full border-r border-slate-800 bg-slate-900/95 md:bg-slate-900/50 backdrop-blur-xl flex flex-col z-40 shadow-2xl md:shadow-none"
          >
            <div className="p-5 flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Activity className="text-blue-500" size={20} />
                  </div>
                  <h2 className="font-bold text-lg">Clinical Panel</h2>
                </div>
                <button onClick={() => setShowClinicalPanel(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">

                {/* Patient Details (real data) */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient Details</h3>
                  <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl space-y-2">
                    <p className="text-sm font-semibold">
                      {remoteUser?.first_name} {remoteUser?.last_name}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>Age: <span className="text-slate-200">{calculateAge(patientDetails?.date_of_birth ?? null)}</span></span>
                      <span>Gender: <span className="text-slate-200">{patientDetails?.gender || "N/A"}</span></span>
                    </div>
                  </div>
                </div>

                {/* Patient Records — on-chain fetch */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health Records</h3>
                    <button
                      onClick={handleFetchRecords}
                      disabled={isFetchingRecords}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={10} className={isFetchingRecords ? 'animate-spin' : ''} />
                      {isFetchingRecords ? 'Fetching...' : 'Fetch Records'}
                    </button>
                  </div>

                  {healthRecords.length === 0 && !isFetchingRecords && (
                    <p className="text-xs text-slate-500 italic px-1">Click "Fetch Records" to load this patient's on-chain medical history.</p>
                  )}

                  <div className="space-y-2">
                    {healthRecords.map((rec) => (
                      <div key={rec.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedRecord(expandedRecord === rec.id ? null : rec.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
                        >
                          <span className="text-xs font-semibold text-slate-200">{rec.title}</span>
                          <ChevronDown size={13} className={`text-slate-400 transition-transform ${expandedRecord === rec.id ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedRecord === rec.id && (
                          <div className="px-3 pb-3 space-y-2 border-t border-slate-700/50 pt-2">
                            {[['Diagnosis', rec.diagnosis], ['Symptoms', rec.symptoms], ['Treatment', rec.treatment], ['Medications', rec.medications], ['Notes', rec.notes]].map(([label, val]) => val && val !== 'Encrypted' ? (
                              <div key={label}>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                                <p className="text-xs text-slate-300 mt-0.5">{val}</p>
                              </div>
                            ) : null)}
                            <a
                              href={`https://explorer.solana.com/address/${rec.blockchainTx}?cluster=devnet`}
                              target="_blank" rel="noreferrer"
                              className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mt-1"
                            >
                              View on Solana Explorer
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ---- Prescription panel ---- */}
                {showPrescription && (
                  <div className="rounded-xl overflow-hidden mt-2">
                    <PrescriptionForm
                      patientName={`${remoteUser?.first_name || ""} ${remoteUser?.last_name || ""}`.trim() || "Patient"}
                      patientId={patientProfileId}
                      doctorId={localUser?.id || ""}
                      appointmentId={appointmentId}
                      onSave={() => { setShowPrescription(false); }}
                      onCancel={() => setShowPrescription(false)}
                    />
                  </div>
                )}

                {/* ---- Health record overlay ---- */}
                {showHealthRecord && (
                  <div className="rounded-xl overflow-hidden">
                    <HealthRecordForm
                      patientName={`${remoteUser?.first_name || ""} ${remoteUser?.last_name || ""}`.trim() || "Patient"}
                      patientId={patientProfileId}
                      doctorId={localUser?.id || ""}
                      onSave={() => { setShowHealthRecord(false); toast({ title: "Record saved on-chain!" }); }}
                      onCancel={() => setShowHealthRecord(false)}
                    />
                  </div>
                )}
              </div>

              {/* Action buttons — fixed at bottom */}
              {!showPrescription && !showHealthRecord && (
                <div className="pt-4 space-y-2 flex-shrink-0">
                  <button
                    onClick={() => setShowPrescription(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] text-sm"
                  >
                    <Plus size={16} /> Add Prescription
                  </button>
                  <button
                    onClick={() => setShowHealthRecord(true)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm"
                  >
                    <FileText size={16} /> Update Medical Record
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col relative h-full">
        
        {/* Top Floating Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-30 pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            {!showClinicalPanel && role === "doctor" && (
              <button 
                onClick={() => setShowClinicalPanel(true)}
                className="p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700 hover:border-blue-500 transition-all group"
              >
                <ChevronRight className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium font-mono">{formatTime(callDuration)}</span>
              <div className="w-px h-4 bg-slate-700" />
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck size={14} className="text-blue-500" />
                <span className="hidden sm:inline">Secure P2P</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button className="p-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors">
              <Settings size={20} />
            </button>
            <div className="px-3 sm:px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl flex items-center sm:gap-3">
              <img src="/telehealthlogo.svg" alt="Epoch Telehealth" className="h-6 w-auto" />
              <span className="hidden sm:inline text-sm font-bold tracking-tight">Epoch <span className="text-blue-500">Telehealth</span></span>
            </div>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          <div className="w-full h-full">
            {screenshares && screenshares.length > 0 ? (
              <div className="w-full h-full flex flex-col md:flex-row relative">
                 {/* Main Area: Screenshare */}
                 <div className="flex-[3] relative bg-slate-900">
                   {screenshares[0].stream && (
                      <VideoView 
                        stream={screenshares[0].stream} 
                        className="w-full h-full object-contain" 
                      />
                   )}
                    <div className="absolute top-24 left-6 px-3 py-1.5 glass-effect rounded-full text-xs font-medium text-white flex items-center gap-2 z-10">
                      <Monitor size={14} />
                      {(() => {
                        const sharerId = screenshares[0].participantId;
                        if (sharerId === localParticipant?.id) return "You are presenting";
                        return `${remoteUser.first_name || "Remote user"} is presenting`;
                      })()}
                    </div>
                 </div>

                 <div className="flex-1 flex flex-row md:flex-col items-center justify-center gap-4 p-4 min-h-[200px] md:min-h-0 bg-[#0b1121]">
                    {/* Remote Participant */}
                    <div className="w-[45%] md:w-full max-w-[320px] aspect-video relative rounded-xl overflow-hidden shadow-lg border border-slate-800">
                      <VideoParticipant 
                        key={remoteParticipants[0]?.id || 'remote-placeholder'}
                        participant={remoteParticipants[0]} 
                        user={remoteUser} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Local Participant */}
                    <div className="w-[45%] md:w-full max-w-[320px] aspect-video relative rounded-xl overflow-hidden shadow-lg border border-slate-800">
                      <VideoParticipant 
                        key={localParticipant?.id ? `local-${localParticipant.id}` : 'local-placeholder'}
                        participant={localParticipant} 
                        user={localUser} 
                        isLocal={true}
                        className="w-full h-full object-cover"
                      />
                    </div>
                 </div>
              </div>
            ) : (
              <VideoParticipant 
                key={remoteParticipants[0]?.id || 'remote-placeholder'}
                participant={remoteParticipants[0]} 
                user={remoteUser} 
                className="w-full h-full"
              />
            )}
          </div>

          {/* Local Participant Inset */}
          {(!screenshares || screenshares.length === 0) && (
            <motion.div 
              drag
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              className="absolute bottom-24 right-6 w-40 h-56 sm:w-48 sm:h-64 md:w-64 md:h-40 lg:w-72 lg:h-48 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl z-40 bg-slate-900"
            >
              <VideoParticipant 
                key={localParticipant?.id ? `local-${localParticipant.id}` : 'local-placeholder'}
                participant={localParticipant} 
                user={localUser} 
                isLocal={true}
              />
            </motion.div>
          )}
        </div>

        {/* Controls Dock */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
          <div className="glass-effect rounded-2xl p-2 px-3 flex items-center gap-3 shadow-2xl border border-slate-700/50">
            <button 
              onClick={() => toggleMicrophone()}
              disabled={!localParticipant?.id}
              className={`p-4 rounded-xl transition-all ${!localParticipant?.id ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' : !localParticipant?.isAudioEnabled ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {localParticipant?.isAudioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
            
            <button 
              onClick={() => toggleCamera()}
              disabled={!localParticipant?.id}
              className={`p-4 rounded-xl transition-all ${!localParticipant?.id ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' : !localParticipant?.isVideoEnabled ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {localParticipant?.isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
            </button>

            <button 
              onClick={() => {
                const isLocalSharing = screenshares?.some(s => s.participantId === localParticipant?.id);
                const isSomeoneElseSharing = screenshares && screenshares.length > 0 && !isLocalSharing;
                if (isLocalSharing) {
                  stopScreenshare();
                } else if (isSomeoneElseSharing) {
                   toast({
                     title: "Presentation in progress",
                     description: "Please wait for the current presenter to stop sharing before starting your presentation.",
                     variant: "destructive",
                   });
                } else {
                  startScreenshare();
                }
              }}
              className={`p-4 rounded-xl transition-all ${
                screenshares?.some(s => s.participantId === localParticipant?.id) 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } ${
                (screenshares && screenshares.length > 0 && !screenshares.some(s => s.participantId === localParticipant?.id)) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              title={
                screenshares && screenshares.length > 0 && !screenshares.some(s => s.participantId === localParticipant?.id)
                  ? "Someone else is presenting" 
                  : "Share Screen"
              }
            >
              <Monitor size={22} />
            </button>

            <button 
              onClick={() => setShowChat(!showChat)}
              className={`p-4 rounded-xl transition-all relative ${showChat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <MessageCircle size={22} />
              {chatMessages.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-900" />
              )}
            </button>

            <div className="w-px h-8 bg-slate-700 mx-1" />

            <button 
              onClick={handleEndCall}
              className="p-4 px-6 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all active:scale-[0.95] flex items-center gap-2"
            >
              <PhoneOff size={22} />
              <span className="font-bold hidden sm:inline">End Call</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute right-0 top-0 bottom-0 md:relative h-full w-80 sm:w-96 border-l border-slate-800 bg-slate-900/95 md:bg-slate-900/80 backdrop-blur-xl flex flex-col z-40 shadow-2xl md:shadow-none"
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <h2 className="font-bold">Consultation Chat</h2>
              <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-3">
                  <MessageCircle size={40} />
                  <p className="text-sm">Start a secure session chat...</p>
                </div>
              ) : (
                chatMessages.map((msg: any, i) => {
                  const isMe = msg.senderId === localParticipant?.id;
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">
                        {isMe ? 'You' : remoteUser.first_name} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-slate-900 border-t border-slate-800">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="w-full bg-slate-800 border-none rounded-xl py-3.5 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  className="absolute right-2 p-2 text-blue-500 hover:text-blue-400"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-3 flex items-center justify-center gap-1 uppercase tracking-widest font-bold">
                <ShieldCheck size={10} />
                End-to-End Encrypted
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
