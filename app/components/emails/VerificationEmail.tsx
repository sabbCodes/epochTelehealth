import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";
import * as React from "react";

export interface VerificationEmailProps {
  name: string;
  status: "approved" | "rejected";
  reason?: string;
  role: "doctor" | "pharmacy";
}

export const VerificationEmail = ({
  name,
  status,
  reason,
  role,
}: VerificationEmailProps) => {
  const isApproved = status === "approved";
  const previewText = isApproved
    ? "Your application has been approved!"
    : "Action Required: Update your application";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Application {isApproved ? "Approved" : "Needs Update"}
          </Heading>
          <Text style={text}>
            Hello {name},
          </Text>
          <Text style={text}>
            {isApproved ? (
              <>
                Congratulations! Your application to join Epoch telehealth as a {role} has been <strong>approved</strong>.
                You can now log in to your dashboard, manage your schedule, and start seeing patients.
              </>
            ) : (
              <>
                Thank you for applying to Epoch telehealth. We have reviewed your application and unfortunately, we require some updates before we can approve it.
              </>
            )}
          </Text>

          {!isApproved && reason && (
            <Section style={reasonSection}>
              <Text style={reasonTitle}>Reason for required updates:</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>
          )}

          {!isApproved && (
            <>
              <Text style={text}>
                <strong>How to update your application:</strong>
                <br />
                1. Log in to your {role} dashboard.
                <br />
                2. Navigate to the <strong>Settings</strong> tab.
                <br />
                3. Update your profile information as requested.
                <br />
                4. Save your changes to automatically resubmit your application for review.
              </Text>
            </>
          )}

          <Section style={buttonContainer}>
            <Button
              style={button}
              href={`https://epochtelehealth.com/signin`}
            >
              {isApproved ? "Go to Dashboard" : "Update Application"}
            </Button>
          </Section>

          <Text style={footer}>
            If you have any questions, please contact our support team.
            <br />
            Best regards,
            <br />
            The Epoch Telehealth Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  maxWidth: "600px",
  marginTop: "40px",
  marginBottom: "40px",
};

const h1 = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 20px",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const reasonSection = {
  backgroundColor: "#fef2f2",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #fecaca",
  marginBottom: "24px",
};

const reasonTitle = {
  color: "#991b1b",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const reasonText = {
  color: "#7f1d1d",
  fontSize: "15px",
  margin: "0",
  lineHeight: "22px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#004DFF",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 20px",
};

const footer = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "40px 0 0",
  borderTop: "1px solid #e2e8f0",
  paddingTop: "20px",
};
