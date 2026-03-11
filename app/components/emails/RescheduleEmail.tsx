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

interface RescheduleEmailProps {
  appointment: {
    patientName: string;
    doctorName: string;
    originalDate: string;
    originalTime: string;
    doctorMessage?: string;
    recipientType: 'patient' | 'doctor';
  };
}

export function RescheduleEmail({ appointment }: RescheduleEmailProps) {
  const { patientName, doctorName, originalDate, originalTime, doctorMessage, recipientType } = appointment;

  const isPatient = recipientType === 'patient';

  const formattedDate = new Date(originalDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Html>
      <Head>
        <title>{isPatient ? 'Appointment Reschedule Request' : 'Appointment Cancelled'}</title>
      </Head>
      <Preview>
        {isPatient
          ? `Dr. ${doctorName} has requested to reschedule your appointment`
          : `Your appointment with ${patientName} has been cancelled`}
      </Preview>
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
              {isPatient ? '📅 Reschedule Request' : '❌ Appointment Cancelled'}
            </Text>
            <Text style={subtitle}>
              {isPatient
                ? 'Your doctor has requested to reschedule your upcoming appointment.'
                : 'A patient has cancelled their appointment.'}
            </Text>

            <Text style={paragraph}>
              Hi {isPatient ? patientName : `Dr. ${doctorName}`},
            </Text>
            <Text style={paragraph}>
              {isPatient
                ? `Dr. ${doctorName} has requested to reschedule your appointment that was scheduled for ${formattedDate} at ${originalTime}. They will update their availability with new slots — please log in to your dashboard to book a new time.`
                : `${patientName} has cancelled their appointment that was scheduled for ${formattedDate} at ${originalTime}.`}
            </Text>

            {/* Original appointment details */}
            <Section style={detailsBox}>
              <Row style={detailRow}>
                <Column style={detailLabelColumn}><Text style={detailLabel}>Patient</Text></Column>
                <Column><Text style={detailValue}>{patientName}</Text></Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabelColumn}><Text style={detailLabel}>Doctor</Text></Column>
                <Column><Text style={detailValue}>Dr. {doctorName}</Text></Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabelColumn}><Text style={detailLabel}>Original Date</Text></Column>
                <Column><Text style={detailValue}>{formattedDate}</Text></Column>
              </Row>
              <Row style={{ ...detailRow, borderBottom: 'none', paddingBottom: 0 }}>
                <Column style={detailLabelColumn}><Text style={detailLabel}>Original Time</Text></Column>
                <Column><Text style={detailValue}>{originalTime}</Text></Column>
              </Row>
            </Section>

            {/* Doctor message to patient */}
            {isPatient && doctorMessage && (
              <Section style={messageBox}>
                <Text style={messageLabel}>Message from Dr. {doctorName}:</Text>
                <Text style={messageText}>{doctorMessage}</Text>
              </Section>
            )}

            {/* CTA for patient */}
            {isPatient && (
              <Section style={{ textAlign: 'center', margin: '32px 0' }}>
                <Button style={button} href="https://www.epochtelehealth.com/doctors">
                  Book a New Appointment
                </Button>
              </Section>
            )}

            {/* Info box */}
            <Section style={infoBox}>
              <Text style={infoText}>
                {isPatient
                  ? '💡 You can browse available doctors and book a new time slot from your dashboard.'
                  : '💡 No action needed. The patient has been notified.'}
              </Text>
            </Section>
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
              If you have questions, contact <Link href="mailto:support@epochtelehealth.com" style={link}>support@epochtelehealth.com</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = { backgroundColor: '#f1f5f9', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', padding: '40px 16px' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' };
const header = { backgroundColor: '#ffffff', padding: '36px 48px', textAlign: 'center' as const, borderBottom: '1px solid #e2e8f0' };
const logo = { margin: '0 auto', height: 'auto' };
const content = { padding: '48px 48px 32px' };
const h1 = { color: '#0f172a', fontSize: '26px', fontWeight: '700', margin: '0 0 8px' };
const subtitle = { color: '#64748b', fontSize: '15px', margin: '0 0 24px' };
const paragraph = { color: '#374151', fontSize: '15px', lineHeight: '1.7', margin: '0 0 16px' };
const detailsBox = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', margin: '24px 0' };
const detailRow = { borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' };
const detailLabelColumn = { width: '120px' };
const detailLabel = { color: '#64748b', fontSize: '14px', fontWeight: '600', margin: '0' };
const detailValue = { color: '#0f172a', fontSize: '15px', fontWeight: '500', margin: '0' };
const messageBox = { backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '10px', padding: '16px 20px', margin: '16px 0' };
const messageLabel = { margin: '0 0 6px', fontSize: '13px', fontWeight: '700', color: '#713f12' };
const messageText = { margin: '0', fontSize: '14px', color: '#92400e', lineHeight: '1.6' };
const button = { backgroundColor: '#004DFF', borderRadius: '10px', color: '#ffffff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '16px 40px' };
const infoBox = { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px 20px', margin: '16px 0' };
const infoText = { margin: '0', fontSize: '13px', color: '#1d4ed8', lineHeight: '1.6' };
const divider = { borderColor: '#e2e8f0', margin: '0' };
const footer = { padding: '28px 48px 36px', textAlign: 'center' as const };
const footerLogo = { margin: '0 0 6px', fontSize: '13px', color: '#64748b' };
const footerLink = { margin: '0 0 6px', fontSize: '13px' };
const link = { color: '#004DFF', textDecoration: 'none' };
const footerText = { margin: '16px 0 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' };
