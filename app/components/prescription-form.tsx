"use client";

import { useState } from "react";
import { Pill, Save, CheckCircle2 } from "lucide-react";
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
  const [formData, setFormData] = useState({
    medicationName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.medicationName || !formData.dosage || !formData.frequency) {
      toast({
        title: "Missing fields",
        description: "Please fill out the medication name, dosage, and frequency.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // We assume there's a 'prescriptions' table in Supabase.
      // If it doesn't exist yet, this will fail gracefully and the dev can create it.
      const { error } = await supabase.from("prescriptions").insert({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: appointmentId,
        medication_name: formData.medicationName,
        dosage: formData.dosage,
        frequency: formData.frequency,
        duration: formData.duration,
        instructions: formData.instructions,
        status: "active",
        issued_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Prescription Saved",
        description: "The prescription has been securely saved to the database.",
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
            className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl"
          >
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-5">
        <div>
          <Label htmlFor="medicationName" className="text-slate-300">Medication Name</Label>
          <Input
            id="medicationName"
            value={formData.medicationName}
            onChange={(e) => handleChange("medicationName", e.target.value)}
            placeholder="e.g. Amoxicillin"
            className="mt-1.5 bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dosage" className="text-slate-300">Dosage</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => handleChange("dosage", e.target.value)}
              placeholder="e.g. 500mg"
              className="mt-1.5 bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="frequency" className="text-slate-300">Frequency</Label>
            <Input
              id="frequency"
              value={formData.frequency}
              onChange={(e) => handleChange("frequency", e.target.value)}
              placeholder="e.g. Twice a day"
              className="mt-1.5 bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="duration" className="text-slate-300">Duration (Days/Weeks)</Label>
          <Input
            id="duration"
            value={formData.duration}
            onChange={(e) => handleChange("duration", e.target.value)}
            placeholder="e.g. 7 Days"
            className="mt-1.5 bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>

        <div>
          <Label htmlFor="instructions" className="text-slate-300">Special Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => handleChange("instructions", e.target.value)}
            placeholder="e.g. Take with food"
            className="mt-1.5 min-h-[80px] bg-slate-800/80 border-slate-700 focus:border-[#004DFF] focus:ring-1 focus:ring-[#004DFF] text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>

        <div className="bg-emerald-900/20 border border-emerald-700/30 p-4 rounded-xl flex items-start space-x-3 backdrop-blur-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          <div className="text-sm text-emerald-200/90 leading-relaxed">
            This prescription will be securely stored in the database. The patient will be able to view this and order the medication directly from their dashboard.
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
              Save Prescription
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
