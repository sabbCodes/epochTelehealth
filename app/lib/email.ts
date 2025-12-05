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
  icalEvent?: string;
  recipientType: "patient" | "doctor";
}

export async function sendAppointmentConfirmation(
  to: string,
  appointment: AppointmentDetails & { icalEvent?: string }
) {
  try {
    const emailComponent = AppointmentEmail({ appointment });

    const emailData: EmailData = {
      from: "Sabb | epochTeleHealth <noreply@epochtelehealth.com>",
      to: to,
      subject: `Appointment ${appointment.recipientType === "patient" ? "Confirmed" : "Scheduled"}: Dr. ${appointment.doctorName}`,
      react: emailComponent,
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
