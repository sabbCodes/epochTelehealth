"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  const effectiveDate = "February 27, 2026";
  const companyName = "Epoch Telehealth";
  const companyEmail = "privacy@epochtelehealth.com";
  const companyAddress = "Lagos, Nigeria";

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
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-[#004DFF] transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-28 pb-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#004DFF] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-[#004DFF] font-semibold text-sm uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">Effective Date: {effectiveDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <div className="prose prose-slate dark:prose-invert max-w-none">

          <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
            At {companyName}, your privacy is not just a legal obligation — it is a core value. This Privacy Policy explains how we collect, use, share, and protect your personal and health information when you use our platform. Health data is among the most sensitive personal data that exists, and we are committed to treating it with the highest level of care and respect.
          </p>

          <div className="bg-[#CCDBFF]/30 dark:bg-[#004DFF]/10 border border-[#CCDBFF] dark:border-[#004DFF]/30 rounded-2xl p-6 mb-10">
            <p className="text-[#004DFF] dark:text-[#CCDBFF] font-medium text-sm">
              <strong>Your data, your control.</strong> We will never sell your personal or health data to third parties for marketing purposes. Period.
            </p>
          </div>

          {[
            {
              title: "1. Who We Are",
              content: `${companyName} operates the telehealth platform available at epochtelehealth.com and associated mobile applications. We are registered and operating in Nigeria, and our data practices comply with the Nigeria Data Protection Regulation (NDPR) 2019, and to the extent applicable, the General Data Protection Regulation (GDPR) and relevant international health data standards.\n\nFor all privacy-related inquiries, contact our Data Protection Officer at ${companyEmail}.`,
            },
            {
              title: "2. Information We Collect",
              content: `We collect the following categories of information:\n\n**Account Information:** Full name, email address, phone number, date of birth, country, and profile photo.\n\n**Health Information:** Medical history, symptoms, prescriptions, consultation notes, and health records you upload or that are generated during consultations.\n\n**Professional Information (Doctors/Pharmacists):** Medical licence numbers, specialization, institutional affiliations, and credential documents.\n\n**Transaction Data:** Payment details (processed by third-party payment providers; we do not store full card numbers), booking history, and consultation receipts.\n\n**Technical Data:** IP address, device type, browser version, session data, and usage logs collected automatically when you use the platform.\n\n**Communications:** Messages exchanged with healthcare professionals through our secure messaging system.`,
            },
            {
              title: "3. Legal Basis for Processing",
              content: `We process your data on the following legal bases:\n\n- **Contract Performance:** To provide the services you have requested (e.g., booking and delivering consultations).\n- **Legitimate Interests:** To improve our platform, detect fraud, and ensure security.\n- **Legal Obligation:** To comply with applicable law, including health information retention requirements.\n- **Consent:** For marketing communications and non-essential data processing. You may withdraw consent at any time.\n- **Vital Interests:** In emergency circumstances where processing is necessary to protect your life or that of another person.`,
            },
            {
              title: "4. How We Use Your Information",
              content: `We use your information to:\n\n- Provide, maintain, and improve the ${companyName} platform.\n- Match patients with appropriate healthcare professionals.\n- Facilitate secure consultations and maintain consultation records.\n- Process payments and manage your subscription or bookings.\n- Verify the credentials and identity of healthcare professionals.\n- Send appointment reminders, platform updates, and health-related communications.\n- Detect, prevent, and investigate fraudulent or unauthorized activity.\n- Comply with regulatory requirements and legal obligations.\n- Conduct anonymized research to improve healthcare outcomes (only where consent is given or data is fully anonymized).`,
            },
            {
              title: "5. Blockchain & Decentralized Storage",
              content: `${companyName} leverages Solana blockchain technology to store cryptographic references to health records. The actual health record content is stored in encrypted form. The blockchain records the hash (digital fingerprint) of your data — not the data itself — ensuring immutability and tamper-proof audit trails.\n\nOnly you and the healthcare professionals you explicitly authorize can access the content of your health records. We use end-to-end encryption for all sensitive health data in transit and at rest.`,
            },
            {
              title: "6. Sharing of Information",
              content: `We do not sell, rent, or trade your personal or health data. We may share your information only in the following limited circumstances:\n\n**Healthcare Professionals:** With the doctors, pharmacists, or other providers you engage through our platform, to the extent necessary to deliver care.\n\n**Service Providers:** With trusted third-party vendors (e.g., cloud hosting, payment processors, email delivery) who process data on our behalf under strict data processing agreements.\n\n**Legal Requirements:** When required by law, court order, or to protect the rights, property, or safety of ${companyName}, our users, or the public.\n\n**Business Transfers:** In the event of a merger, acquisition, or asset sale, your data may be transferred with appropriate safeguards and prior notice.\n\n**With Your Explicit Consent:** In any other circumstance, only with your clear, informed consent.`,
            },
            {
              title: "7. Data Retention",
              content: `We retain your personal data for as long as your account is active or as needed to provide services. Health consultation records are retained for a minimum of 7 years, in compliance with Nigerian medical record retention requirements. You may request deletion of your account and personal data; however, certain health records may be retained for the legally required period even after account deletion.\n\nWhen data is no longer required, it is securely deleted or anonymized.`,
            },
            {
              title: "8. Your Rights",
              content: `Depending on your jurisdiction, you have the following rights regarding your data:\n\n- **Access:** Request a copy of the personal data we hold about you.\n- **Correction:** Request correction of inaccurate or incomplete data.\n- **Deletion (Right to be Forgotten):** Request deletion of your data, subject to legal retention requirements.\n- **Portability:** Request your data in a structured, machine-readable format.\n- **Restriction:** Request that we restrict processing of your data in certain circumstances.\n- **Objection:** Object to processing based on legitimate interests.\n- **Withdraw Consent:** Withdraw any consent you have previously given.\n\nTo exercise any of these rights, contact us at ${companyEmail}. We will respond within 30 days.`,
            },
            {
              title: "9. Security Measures",
              content: `We implement technical and organizational measures to protect your data, including:\n\n- TLS/SSL encryption for all data in transit.\n- AES-256 encryption for health data at rest.\n- Multi-factor authentication for healthcare professional accounts.\n- Regular security audits and penetration testing.\n- Role-based access controls limiting data access to only those who need it.\n- Incident response procedures with 72-hour breach notification obligations.\n\nDespite these measures, no system is completely immune to breach. In the event of a data breach that affects your rights, we will notify you and applicable regulators as required by law.`,
            },
            {
              title: "10. Cookies and Tracking",
              content: `We use cookies and similar tracking technologies to:\n\n- Maintain your session and authentication state.\n- Remember your preferences (e.g., dark mode, language).\n- Analyze platform usage to improve our services (via anonymized analytics).\n\nYou can control cookie settings through your browser. Disabling certain cookies may impact platform functionality. We do not use third-party advertising cookies or sell your browsing data to advertisers.`,
            },
            {
              title: "11. Children's Privacy",
              content: `The ${companyName} platform is not intended for use by individuals under 18 years of age. We do not knowingly collect personal data from minors. If a parent or guardian becomes aware that their child has provided us with personal data without their consent, they should contact us at ${companyEmail} and we will delete such information promptly.`,
            },
            {
              title: "12. International Data Transfers",
              content: `Our infrastructure operates globally, which may involve transferring your data to countries outside Nigeria. Where such transfers occur, we implement appropriate safeguards (such as standard contractual clauses) to ensure your data receives equivalent protection to that afforded under Nigerian and applicable international data protection law.`,
            },
            {
              title: "13. Changes to This Policy",
              content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes via email and/or a prominent notice on the platform, with at least 14 days' notice before changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated policy.`,
            },
            {
              title: "14. Contact Us",
              content: `If you have any questions, concerns, or complaints about this Privacy Policy or our data practices, please contact our Data Protection Officer:\n\n${companyName}\nAttn: Data Protection Officer\n${companyAddress}\nEmail: ${companyEmail}\n\nIf you are not satisfied with our response, you have the right to lodge a complaint with the Nigeria Data Protection Bureau (NDPB) or your applicable supervisory authority.`,
            },
          ].map((section, i) => (
            <div key={i} className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{section.title}</h2>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {section.content.split('\n').map((line, j) => {
                  if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
                    return <p key={j} className="font-semibold text-slate-800 dark:text-white mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
                  }
                  if (line.startsWith('**') && line.includes(':**')) {
                    const [bold, rest] = line.split(':**');
                    return <p key={j} className="mb-2"><strong className="text-slate-800 dark:text-white">{bold.replace('**', '')}:</strong>{rest}</p>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={j} className="ml-4 mb-1 list-disc">{line.slice(2)}</li>;
                  }
                  if (line === '') return <br key={j} />;
                  return <p key={j} className="mb-2">{line}</p>;
                })}
              </div>
            </div>
          ))}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-10 mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/terms" className="text-[#004DFF] hover:underline font-medium text-sm">View Terms of Service →</Link>
            <Link href="/signin" className="text-[#004DFF] hover:underline font-medium text-sm">← Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
