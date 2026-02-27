import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';

interface AppointmentEmailProps {
  appointment: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    duration: string;
    type: 'video' | 'extended_video' | 'chat';
    meetingLink?: string;
    recipientType: 'patient' | 'doctor';
  };
}

export function AppointmentEmail({ appointment }: AppointmentEmailProps) {
  const { patientName, doctorName, date, time, duration, type, meetingLink, recipientType } = appointment;
  
  const isPatient = recipientType === 'patient';
  const subject = isPatient 
    ? `Appointment Confirmed with Dr. ${doctorName}`
    : `New Appointment with ${patientName}`;
    
  const previewText = isPatient
    ? `Your ${type.replace('_', ' ')} appointment is confirmed.`
    : `You have a new appointment scheduled.`;

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayType = type === "video"
    ? "Video Consultation"
    : type === "extended_video"
      ? "Extended Video Consultation"
      : "Chat Consultation";

  return (
    <Html>
      <Head>
        <title>{subject}</title>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://www.epochtelehealth.com/epochlogo.png"
              width="160"
              alt="Epoch Telehealth"
              style={logo}
            />
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={h1}>
              {isPatient ? "Appointment Confirmed! ✅" : "New Appointment Scheduled 📅"}
            </Text>
            <Text style={subtitle}>
              {isPatient ? "Your consultation is all set." : "A patient has booked a session with you."}
            </Text>

            <Text style={paragraph}>
              Hi {isPatient ? patientName : `Dr. ${doctorName}`},
            </Text>
            <Text style={paragraph}>
              {isPatient
                ? `Your ${displayType.toLowerCase()} with Dr. ${doctorName} has been confirmed. Please find the details below.`
                : `You have a new ${displayType.toLowerCase()} with ${patientName}. Please review the details below.`}
            </Text>

            {/* Appointment Details Box */}
            <Section style={detailsBox}>
              <Row style={detailRow}>
                <Column style={detailLabelColumn}><Text style={detailLabel}>Date</Text></Column>
                <Column><Text style={detailValue}>{formattedDate}</Text></Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabelColumn}><Text style={detailLabel}>Time</Text></Column>
                <Column><Text style={detailValue}>{time}</Text></Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabelColumn}><Text style={detailLabel}>Type</Text></Column>
                <Column><Text style={detailValue}>{displayType}</Text></Column>
              </Row>
              <Row style={{ ...detailRow, borderBottom: 'none', paddingBottom: 0 }}>
                <Column style={detailLabelColumn}><Text style={detailLabel}>Duration</Text></Column>
                <Column><Text style={detailValue}>{duration} minutes</Text></Column>
              </Row>
            </Section>

            {/* CTA */}
            {meetingLink ? (
              <Section style={{ textAlign: 'center', margin: '32px 0' }}>
                <Button style={button} href={meetingLink}>
                  Join Consultation
                </Button>
              </Section>
            ) : (
              <Section style={infoBox}>
                <Text style={infoText}>
                  ℹ️ <strong>Note:</strong> The meeting link will be available closer to the appointment time.
                </Text>
              </Section>
            )}

            {isPatient && (
              <Section style={infoBox}>
                <Text style={infoText}>
                  💡 <strong>Preparation tip:</strong> Please ensure you have a stable internet connection and find a quiet place for your consultation.
                </Text>
              </Section>
            )}
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerLogo}>
              <strong>Epoch Telehealth</strong> &mdash; Healthcare Without Borders
            </Text>
            <Text style={footerLink}>
              <Link href="https://www.epochtelehealth.com" style={link}>epochtelehealth.com</Link>
            </Text>
            <Text style={footerText}>
              This email was sent to you regarding your appointment.<br />
              If you need to reschedule, or have questions, contact <Link href="mailto:support@epochtelehealth.com" style={link}>support@epochtelehealth.com</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f1f5f9',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  padding: '40px 16px',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
};

const header = {
  backgroundColor: '#004DFF',
  padding: '36px 48px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
  filter: 'brightness(0) invert(1)',
  height: 'auto',
};

const content = {
  padding: '48px 48px 32px',
};

const h1 = {
  color: '#0f172a',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0 0 8px',
};

const subtitle = {
  color: '#64748b',
  fontSize: '15px',
  margin: '0 0 24px',
};

const paragraph = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
};

const detailsBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const detailRow = {
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: '12px',
  marginBottom: '12px',
};

const detailLabelColumn = {
  width: '120px',
};

const detailLabel = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const detailValue = {
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: '500',
  margin: '0',
};

const button = {
  backgroundColor: '#004DFF',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 40px',
  letterSpacing: '0.2px',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '16px 0',
};

const infoText = {
  margin: '0',
  fontSize: '13px',
  color: '#1d4ed8',
  lineHeight: '1.6',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '0',
};

const footer = {
  padding: '28px 48px 36px',
  textAlign: 'center' as const,
};

const footerLogo = {
  margin: '0 0 6px',
  fontSize: '13px',
  color: '#64748b',
};

const footerLink = {
  margin: '0 0 6px',
  fontSize: '13px',
};

const link = {
  color: '#004DFF',
  textDecoration: 'none',
};

const footerText = {
  margin: '16px 0 0',
  fontSize: '12px',
  color: '#cbd5e1',
  lineHeight: '1.5',
};
