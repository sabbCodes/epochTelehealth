import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Section,
  Text,
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
    
  const appointmentDetails = isPatient
    ? `Your ${type} appointment with Dr. ${doctorName} has been confirmed.`
    : `You have a new ${type} appointment with ${patientName}.`;

  return (
    <Html>
      <Head>
        <title>{subject}</title>
      </Head>
      <Body style={main}>
        <Container style={container}>
          <Text style={title}>Telehealth Appointment</Text>
          <Text style={text}>
            Hi {isPatient ? patientName : `Dr. ${doctorName}`},
          </Text>
          attachments
          <Text style={text}>{appointmentDetails}</Text>
          <Section style={section}>
            <Text style={label}>Date</Text>
            <Text style={value}>
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>

            <Text style={label}>Time</Text>
            <Text style={value}>{time}</Text>

            <Text style={label}>Duration</Text>
            <Text style={value}>{duration}</Text>

            <Text style={label}>Appointment Type</Text>
            <Text style={value}>
              {type === "video"
                ? "Video Consultation"
                : type === "extended_video"
                  ? "Extended Video Consultation"
                  : "Chat Consultation"}
            </Text>

            {meetingLink && (
              <>
                <Text style={label}>Meeting Link</Text>
                <Button style={button} href={meetingLink}>
                  Join Meeting
                </Button>
              </>
            )}
          </Section>
          <Text style={footer}>
            If you have any questions or need to reschedule, please contact our
            support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  padding: '10px 0',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const title = {
  color: '#333333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const section = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const label = {
  color: '#666666',
  fontSize: '14px',
  margin: '8px 0 4px',
};

const value = {
  color: '#333333',
  fontSize: '16px',
  margin: '0 0 16px',
  fontWeight: '500',
};

const button = {
  backgroundColor: '#4f46e5',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '24px',
  padding: '12px 24px',
  textDecoration: 'none',
  margin: '8px 0',
};

const footer = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '20px',
  marginTop: '20px',
  textAlign: 'center' as const,
};
