"use client";

import { useState } from "react";
import { Pill, Save, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface PrescriptionFormProps {
  patientName: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const emptyPrescription = () => ({
  medicationName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

export function PrescriptionForm({
  patientName,
  patientId,
  doctorId,
  appointmentId,
  onSave,
  onCancel,
}: PrescriptionFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [prescriptions, setPrescriptions] = useState([emptyPrescription()]);

  const updatePrescription = (index: number, field: string, value: string) => {
    setPrescriptions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const addDrug = () => setPrescriptions((prev) => [...prev, emptyPrescription()]);

  const removeDrug = (index: number) => {
    if (prescriptions.length === 1) return; // keep at least one
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const valid = prescriptions.filter(
      (p) => p.medicationName.trim() && p.dosage.trim() && p.frequency.trim()
    );

    if (valid.length === 0) {
      toast({
        title: "Missing fields",
        description: "Each prescription needs at least a name, dosage, and frequency.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const rows = valid.map((p) => ({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: appointmentId,
        medication_name: p.medicationName,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
        instructions: p.instructions,
        status: "active",
        issued_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("prescriptions").insert(rows);
      if (error) throw error;

      toast({
        title: "Prescriptions Saved",
        description: `${valid.length} prescription(s) saved securely to the database.`,
      });

      if (onSave) onSave();
    } catch (err: any) {
      console.error("Error saving prescription:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save prescription.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full z-40 bg-slate-900/60 backdrop-blur-xl border-slate-800/50 rounded-2xl shadow-xl overflow-hidden">
      <CardHeader className="bg-slate-900/80 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 p-2 rounded-xl">
              <Pill className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Write Prescription</CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                Patient: <span className="text-slate-200 font-medium">{patientName}</span>
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl block sm:hidden md:block"
          >
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          {prescriptions.map((p, i) => (
            <div key={i} className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl space-y-5 relative">
              <div className="flex items-center justify-between pointer-events-none">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Drug {i + 1}</p>
              </div>
              
              {prescriptions.length > 1 && (
                <button
                  onClick={() => removeDrug(i)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors bg-slate-800 p-1.5 rounded-md border border-slate-700"
                  title="Remove drug"
                >
                  <Trash2 size={14} />
                </button>
              )}

              <div>
                <Label className="text-slate-300">Medication Name</Label>
                <Input
                  value={p.medicationName}
                  onChange={(e) => updatePrescription(i, "medicationName", e.target.value)}
                  placeholder="e.g. Amoxicillin"
                  className="mt-1.5 bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Dosage</Label>
                  <Input
                    value={p.dosage}
                    onChange={(e) => updatePrescription(i, "dosage", e.target.value)}
                    placeholder="e.g. 500mg"
                    className="mt-1.5 bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Frequency</Label>
                  <Input
                    value={p.frequency}
                    onChange={(e) => updatePrescription(i, "frequency", e.target.value)}
                    placeholder="e.g. Twice a day"
                    className="mt-1.5 bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Duration (Days/Weeks)</Label>
                <Input
                  value={p.duration}
                  onChange={(e) => updatePrescription(i, "duration", e.target.value)}
                  placeholder="e.g. 7 Days"
                  className="mt-1.5 bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-slate-300">Special Instructions (Optional)</Label>
                <Textarea
                  value={p.instructions}
                  onChange={(e) => updatePrescription(i, "instructions", e.target.value)}
                  placeholder="e.g. Take with food"
                  className="mt-1.5 min-h-[60px] bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addDrug}
          className="w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-600 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-400 py-3 rounded-xl text-sm transition-all"
        >
          <Plus size={16} /> Add Another Drug
        </button>

        <div className="bg-emerald-900/20 border border-emerald-700/30 p-4 rounded-xl flex items-start space-x-3 backdrop-blur-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <div className="text-sm text-emerald-200/90 leading-relaxed">
            These prescriptions will be securely stored. The patient can view them and order medications directly from their dashboard.
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-3 bg-slate-900/40 border-t border-slate-800/50 p-5">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 shadow-lg shadow-emerald-900/20 transition-all font-medium"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Prescriptions
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
