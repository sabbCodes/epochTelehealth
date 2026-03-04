"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
  const router = useRouter();
  const effectiveDate = "February 27, 2026";
  const companyName = "Epoch Telehealth";
  const companyEmail = "legal@epochtelehealth.com";
  const companyAddress = "Kano, Nigeria";

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
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-[#004DFF] font-semibold text-sm uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">Terms of Service</h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">Effective Date: {effectiveDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <div className="prose prose-slate dark:prose-invert max-w-none">

          <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
            Welcome to {companyName}. By accessing or using our platform, website, or mobile application (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. Please read them carefully before using our Service.
          </p>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-10">
            <p className="text-amber-800 dark:text-amber-200 font-medium text-sm">
              <strong>Important:</strong> {companyName} is a telehealth facilitation platform and does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical decisions.
            </p>
          </div>

          {[
            {
              title: "1. Acceptance of Terms",
              content: `By creating an account, accessing, or using the ${companyName} platform, you confirm that you are at least 18 years of age (or the age of majority in your jurisdiction), have read and understood these Terms, and agree to be legally bound by them. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.`,
            },
            {
              title: "2. Description of Service",
              content: `${companyName} is a digital health platform that connects patients with licensed healthcare professionals for remote consultations, prescription management, and health record management. Our services include: (a) secure video and chat consultations with verified doctors; (b) encrypted health record storage on decentralized infrastructure; (c) prescription forwarding and medication delivery coordination; and (d) appointment scheduling and management tools.`,
            },
            {
              title: "3. User Accounts and Registration",
              content: `To access certain features of the Service, you must create an account. You agree to: (a) provide accurate, current, and complete information during registration; (b) maintain and promptly update your account information; (c) keep your password secure and confidential; (d) notify us immediately at ${companyEmail} of any unauthorized use of your account; and (e) accept responsibility for all activities that occur under your account. We reserve the right to suspend or terminate accounts that contain inaccurate information or violate these Terms.`,
            },
            {
              title: "4. Healthcare Disclaimer",
              content: `${companyName} is NOT a licensed medical provider. The platform facilitates connections between patients and independent licensed healthcare professionals. Consultations conducted through our platform do not constitute an establishment of a traditional doctor-patient relationship with ${companyName}. Medical decisions remain the exclusive responsibility of the licensed professionals and the patients they serve. Emergency medical situations should be addressed by contacting local emergency services immediately.`,
            },
            {
              title: "5. Verification of Healthcare Professionals",
              content: `We conduct credential verification for all healthcare professionals listed on our platform. However, we do not guarantee the accuracy, completeness, or currency of credential information. Patients are encouraged to independently verify the qualifications of any healthcare professional before engaging their services. ${companyName} is not liable for any misrepresentation by healthcare professionals.`,
            },
            {
              title: "6. Payment Terms",
              content: `Consultation fees are set by individual healthcare professionals and displayed clearly before booking. ${companyName} may charge platform facilitation fees which will be disclosed prior to payment. All payments are processed securely through our payment partners. Refund policies for consultations vary; please review the specific cancellation policy at the time of booking. ${companyName} reserves the right to modify its fee structure with 30 days' notice.`,
            },
            {
              title: "7. Intellectual Property",
              content: `All content on the ${companyName} platform, including but not limited to text, graphics, logos, software, and data compilations, is the property of ${companyName} or its licensors and is protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes. You may not copy, modify, distribute, sell, or lease any part of the Service without our explicit written consent.`,
            },
            {
              title: "8. User Content and Conduct",
              content: `You retain ownership of health information and content you submit to the platform. By submitting content, you grant ${companyName} a limited license to process, store, and transmit that content solely to provide the Service. You agree not to: (a) upload false or misleading health information; (b) impersonate healthcare professionals or other users; (c) use the Service for any unlawful purpose; (d) attempt to gain unauthorized access to our systems; or (e) interfere with the proper functioning of the Service.`,
            },
            {
              title: "9. Privacy and Data Protection",
              content: `Your privacy is critically important to us. Our collection, use, and storage of personal and health information is governed by our Privacy Policy, which is incorporated into these Terms by reference. We comply with applicable data protection regulations including NDPR (Nigeria Data Protection Regulation), GDPR where applicable, and HIPAA standards for any US-connected data processing.`,
            },
            {
              title: "10. Limitation of Liability",
              content: `To the maximum extent permitted by applicable law, ${companyName} and its officers, directors, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to: loss of health outcomes, personal injury, medical malpractice claims, or data loss, arising from your use of the Service. Our total liability to you for any claims arising from these Terms or your use of the Service shall not exceed the amount you paid to us in the three (3) months prior to the event giving rise to the claim.`,
            },
            {
              title: "11. Indemnification",
              content: `You agree to indemnify, defend, and hold harmless ${companyName}, its affiliates, officers, directors, employees, and agents from and against any claims, damages, losses, costs, and expenses (including reasonable legal fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any applicable law or third-party rights; or (d) any content you submit to the platform.`,
            },
            {
              title: "12. Termination",
              content: `Either party may terminate this agreement at any time. You may close your account by contacting us at ${companyEmail}. We may suspend or terminate your access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service ceases immediately. Provisions that by their nature should survive termination shall remain in effect.`,
            },
            {
              title: "13. Governing Law and Dispute Resolution",
              content: `These Terms shall be governed by the laws of the Federal Republic of Nigeria, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the Service shall first be attempted to be resolved through good-faith negotiation. If resolution cannot be reached within 30 days, disputes shall be submitted to binding arbitration in Lagos, Nigeria, in accordance with applicable arbitration rules. Nothing herein prevents either party from seeking injunctive relief for urgent matters.`,
            },
            {
              title: "14. Changes to Terms",
              content: `We reserve the right to modify these Terms at any time. We will provide at least 14 days' notice of material changes via email or a prominent notice on the platform. Your continued use of the Service after the effective date of the updated Terms constitutes your acceptance of the changes. If you do not agree to the updated Terms, you should discontinue use of the Service.`,
            },
            {
              title: "15. Contact Information",
              content: `If you have any questions, concerns, or require clarification regarding these Terms of Service, please contact us at:\n\n${companyName}\n${companyAddress}\nEmail: ${companyEmail}`,
            },
          ].map((section, i) => (
            <div key={i} className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{section.title}</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-10 mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/privacy" className="text-[#004DFF] hover:underline font-medium text-sm">View Privacy Policy →</Link>
            <button onClick={() => router.back()} className="text-[#004DFF] hover:underline font-medium text-sm bg-transparent border-none p-0 outline-none cursor-pointer">← Go Back</button>
          </div>
        </div>
      </div>
    </div>
  );
}
