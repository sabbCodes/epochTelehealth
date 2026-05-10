import { Resend } from "resend";
import { AppointmentEmail } from "@/components/emails/AppointmentEmail";
import { RescheduleEmail } from "@/components/emails/RescheduleEmail";
import { VerificationEmail } from "@/components/emails/VerificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Helper to retry async functions for transient errors
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      console.warn(`Attempt ${attempt} failed: ${error.message || 'Unknown error'}`);
      if (attempt >= maxRetries) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error("Unreachable");
}

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
      from: "Sabb | Epoch telehealth <noreply@epochtelehealth.com>",
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

    const { data } = await withRetry(async () => {
      const response = await resend.emails.send(emailData);
      if (response.error) throw response.error;
      return response;
    });

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
export interface RescheduleDetails {
  patientName: string;
  doctorName: string;
  originalDate: string;
  originalTime: string;
  doctorMessage?: string;
  recipientType: "patient" | "doctor";
}

export async function sendRescheduleNotification(to: string, details: RescheduleDetails) {
  try {
    const emailComponent = RescheduleEmail({ appointment: details });
    const subject = details.recipientType === "patient"
      ? `Reschedule Request from Dr. ${details.doctorName}`
      : `Appointment Cancelled by ${details.patientName}`;

    const { data } = await withRetry(async () => {
      const response = await resend.emails.send({
        from: "Sabb | Epoch telehealth <noreply@epochtelehealth.com>",
        to,
        subject,
        react: emailComponent,
      });
      if (response.error) throw response.error;
      return response;
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send reschedule email:", error);
    return { success: false, error: error instanceof Error ? error : new Error("Unknown error") };
  }
}

export async function sendVerificationStatusEmail(
  to: string,
  name: string,
  status: "approved" | "rejected",
  role: "doctor" | "pharmacy",
  reason?: string
) {
  try {
    const emailComponent = VerificationEmail({ name, status, reason, role });
    const subject = status === "approved"
      ? `Your Epoch Telehealth ${role} Application is Approved!`
      : `Action Required: Your Epoch Telehealth Application`;

    const { data } = await withRetry(async () => {
      const response = await resend.emails.send({
        from: "Sabb | Epoch telehealth <noreply@epochtelehealth.com>",
        to,
        subject,
        react: emailComponent,
      });
      if (response.error) throw response.error;
      return response;
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: error instanceof Error ? error : new Error("Unknown error") };
  }
}
