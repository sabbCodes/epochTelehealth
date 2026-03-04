"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GuidelinesPage() {
  const router = useRouter();
  const effectiveDate = "February 27, 2026";
  const companyName = "Epoch Telehealth";
  const companyEmail = "medicalboard@epochtelehealth.com";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/telehealthlogowithtext.svg" alt="Epoch Telehealth" width={140} height={36} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-[#004DFF] transition-colors cursor-pointer bg-transparent border-none p-0 outline-none">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-28 pb-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#004DFF] rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-[#004DFF] font-semibold text-sm uppercase tracking-widest">Medical Policies</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">Medical Professional Guidelines</h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">Effective Date: {effectiveDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <div className="prose prose-slate dark:prose-invert max-w-none">

          <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
            Welcome to the {companyName} Medical Professional Guidelines. These rules and standards apply to all healthcare professionals authorized to practice via our platform. Adherence is mandatory to ensure patient safety, legal compliance, and the highest standard of virtual care.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-10">
            <p className="text-blue-800 dark:text-blue-200 font-medium text-sm">
              <strong>Core Principle:</strong> Telehealth consultations must meet the same standard of care as in-person medical visits. If a patient's condition requires physical examination, you must immediately refer them to a local healthcare facility.
            </p>
          </div>

          {[
            {
              title: "1. Licensure and Credentials",
              content: `All providers must maintain active, unrestricted licenses to practice medicine in their designated jurisdictions. You must immediately notify ${companyName} at ${companyEmail} of any disciplinary actions, restrictions, suspensions, or revocations of your medical license or DEA registration. Failure to report administrative changes within 48 hours is grounds for immediate termination from the platform.`,
            },
            {
              title: "2. Standard of Care",
              content: `Providers are solely responsible for determining if a telehealth consultation is appropriate for a patient's specific presentation. You must collect sufficient medical history, evaluate symptoms comprehensively, and accurately document all findings. If visual or auditory data via the platform is insufficient to make a safe clinical judgment, you must conclude the virtual session and direct the patient to seek in-person care.`,
            },
            {
              title: "3. Prescribing Practices",
              content: `Prescriptions must only be issued when clinically indicated and supported by documented medical necessity. Providers must utilize the platform's integrated e-prescribing tools. \n\n**Controlled Substances:** Prescribing controlled substances (including narcotics, specific sedatives, and stimulants) via telehealth without a prior in-person examination is strictly prohibited unless specifically permitted by local and federal laws (e.g., Ryan Haight Act exemptions). Providers bear full legal responsibility for all compliance regarding controlled substances.`,
            },
            {
              title: "4. Emergency Protocols",
              content: `Telehealth is not a substitute for emergency medicine. If a patient presents with symptoms of a medical emergency (e.g., severe chest pain, acute respiratory distress, severe bleeding, altered mental status), you must strictly advise them to call their local emergency number (e.g., 911, 112) or go to the nearest emergency room immediately. Document the referral clearly in the patient's record.`,
            },
            {
              title: "5. Patient Privacy and Confidentiality (HIPAA/NDPR)",
              content: `You must conduct all consultations in a private, secure environment where unauthorized individuals cannot hear or see the patient. You must use only the approved ${companyName} platform for communications and data transfer; using personal SMS, public email, or unencrypted third-party messaging apps to communicate with patients or share PHI (Protected Health Information) is strictly forbidden.`,
            },
            {
              title: "6. Informed Consent",
              content: `Before initiating a clinical evaluation, you must verify the patient's identity and obtain informed consent for telehealth treatment. You must clearly explain the limitations of virtual care to the patient, including the inability to perform physical examinations or certain diagnostic tests.`,
            },
            {
              title: "7. Medical Records and Documentation",
              content: `Detailed, accurate, and timely documentation is required for every patient interaction. Clinical notes must be completed and locked within 24 hours of the consultation. Records must include the chief complaint, history of present illness, relevant medical history, review of systems, assessment/diagnosis, and a clear treatment plan or referral disposition.`,
            },
            {
              title: "8. Professional Conduct and Boundaries",
              content: `Providers must maintain strict professional boundaries with all patients. Harassment, discrimination, or inappropriate behavior of any kind will result in immediate permanent removal from the platform and potential reporting to your local medical licensing board. Wait times must be minimized; if you are delayed, you must utilize the platform's messaging features to notify the patient.`,
            },
            {
              title: "9. Technical Competence",
              content: `Providers are expected to maintain adequate internet connectivity, a high-quality webcam, and a professional microphone. A poor technical setup that continually disrupts care may lead to suspension of triage access until resolved. Ensure you are fully familiar with the platform's video, chat, and prescription interfaces.`,
            },
            {
              title: "10. Liability and Malpractice Insurance",
              content: `All independent contractors must carry their own medical malpractice insurance with coverage limits that meet or exceed the requirements of their practicing jurisdictions. You are required to provide proof of active coverage annually and must ensure your policy explicitly covers telemedicine services.`,
            },
          ].map((section, i) => (
            <div key={i} className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{section.title}</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-10 mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/terms" className="text-[#004DFF] hover:underline font-medium text-sm">View Terms of Service →</Link>
            <button onClick={() => router.back()} className="text-[#004DFF] hover:underline font-medium text-sm bg-transparent border-none p-0 outline-none cursor-pointer">← Go Back</button>
          </div>
        </div>
      </div>
    </div>
  );
}
