import { Resend } from "resend";
import { AppointmentEmail } from "@/components/emails/AppointmentEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
  disposition: string;
}

interface EmailData {
  from: string;
  to: string;
  subject: string;
  react: React.ReactElement;
  attachments?: EmailAttachment[];
}

export interface AppointmentDetails {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  duration: string;
  meetingLink?: string;
  type: "video" | "extended_video" | "chat";
  icalEvent?: string; // iCal event as string
  recipientType: "patient" | "doctor";
}

export async function sendAppointmentConfirmation(
  to: string,
  appointment: AppointmentDetails & { icalEvent?: string }
) {
  try {
    // Create the email component first to get the subject
    const emailComponent = AppointmentEmail({ appointment });

    // Prepare the email data according to Resend's API
    const emailData: EmailData = {
      from: "Sabb | teleHealthSol <delivered@resend.dev>",
      to: "telehealthsolng@gmail.com",
      subject: `Appointment ${appointment.recipientType === "patient" ? "Confirmed" : "Scheduled"}: Dr. ${appointment.doctorName}`,
      react: emailComponent, // Pass the React component directly
    };

    // Add iCal event as attachment if provided
    if (appointment.icalEvent) {
      emailData.attachments = [
        {
          filename: "appointment.ics",
          content: Buffer.from(appointment.icalEvent).toString("base64"),
          contentType: "text/calendar; method=REQUEST",
          disposition: "attachment",
        },
      ];
    }

    console.log("Sending email with data:", {
      to: emailData.to,
      subject: emailData.subject,
      hasAttachments: !!emailData.attachments,
      usingApiKey: process.env.RESEND_API_KEY ? "Yes" : "No",
    });

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("Error sending email:", {
        error,
        message: error.message,
      });
      return { success: false, error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Unknown error occurred"),
    };
  }
}
