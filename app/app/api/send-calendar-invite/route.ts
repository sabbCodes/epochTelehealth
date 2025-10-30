import { NextResponse } from 'next/server';
import { sendAppointmentConfirmation } from '@/lib/email';
import { createEvent } from 'ics';
import { parseISO, addMinutes } from 'date-fns';

interface RequestBody {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  duration: string;
  type: 'video' | 'extended_video' | 'chat';
  meetingLink?: string;
  recipientType: 'patient' | 'doctor';
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    
    console.log('Received calendar invite request:', {
      to: body.to,
      recipientType: body.recipientType,
      hasMeetingLink: !!body.meetingLink,
      type: body.type
    });

    try {
      // 1. Send the email confirmation
      console.log('Sending email to:', body.to);
      console.log('Email details:', {
        patientName: body.patientName,
        doctorName: body.doctorName,
        date: body.date,
        time: body.time,
        type: body.type,
        hasMeetingLink: !!body.meetingLink,
        recipientType: body.recipientType
      });

      const emailResult = await sendAppointmentConfirmation(body.to, {
        patientName: body.patientName,
        doctorName: body.doctorName,
        date: body.date,
        time: body.time,
        duration: body.duration,
        type: body.type,
        meetingLink: body.meetingLink,
        recipientType: body.recipientType,
      });

      if (!emailResult.success) {
        throw emailResult.error || new Error('Failed to send email');
      }
      
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', {
        error: emailError,
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : undefined
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to send email confirmation',
          details: emailError instanceof Error ? emailError.message : 'Unknown error',
          code: 'EMAIL_SEND_FAILED'
        },
        { status: 500 }
      );
    }

    try {
      // 2. Create and attach iCal event
      console.log('Creating iCal event with details:', {
        date: body.date,
        time: body.time,
        duration: body.duration,
        type: body.type,
        hasMeetingLink: !!body.meetingLink
      });

      const startDate = parseISO(`${body.date}T${body.time}`);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start date/time');
      }

      // Parse duration (handle both 'HH:MM' and 'X min' formats)
      let durationInMinutes = 30; // default
      if (body.duration.includes(':')) {
        const [hours, minutes] = body.duration.split(':').map(Number);
        durationInMinutes = hours * 60 + minutes;
      } else {
        // Handle 'X min' format
        const match = body.duration.match(/(\d+)/);
        if (match) {
          durationInMinutes = parseInt(match[1], 10);
        }
      }

      const endDate = addMinutes(startDate, durationInMinutes);
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid end date calculation');
      }

      // Format dates for ics
      const formatDateForICS = (date: Date): [number, number, number, number, number] => {
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date in formatDateForICS');
        }
        return [
          date.getFullYear(),
          date.getMonth() + 1, // months are 0-based in JS
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
        ];
      };

      const eventData = {
        start: formatDateForICS(startDate),
        end: formatDateForICS(endDate),
        title: `Appointment with Dr. ${body.doctorName}`,
        description: `Appointment with Dr. ${body.doctorName} for ${body.type} consultation\n\n` +
                   `Patient: ${body.patientName}\n` +
                   `Type: ${body.type.charAt(0).toUpperCase() + body.type.slice(1)} Consultation\n` +
                   (body.meetingLink ? `Meeting Link: ${body.meetingLink}\n` : ''),
        location: body.type === 'video' ? (body.meetingLink || 'Online') : 'In-Person',
        url: body.meetingLink,
        organizer: { name: 'TelehealthSol', email: 'noreply@telehealthsol.xyz' },
        status: 'CONFIRMED' as const,
        busyStatus: 'BUSY' as const,
        attendees: [
          { 
            name: body.patientName, 
            email: body.recipientType === 'patient' ? body.to : '',
            rsvp: true,
            partstat: 'ACCEPTED' as const,
            role: 'REQ-PARTICIPANT' as const
          },
          { 
            name: `Dr. ${body.doctorName}`, 
            email: body.recipientType === 'doctor' ? body.to : '',
            rsvp: true,
            partstat: 'ACCEPTED' as const,
            role: 'CHAIR' as const
          },
        ],
        alarms: [
          { 
            action: 'display' as const, 
            trigger: { minutes: 15, before: true }, 
            description: 'Reminder' 
          },
        ],
      };

      console.log('Creating iCal event with data:', JSON.stringify(eventData, null, 2));
      const { error, value: icsEvent } = createEvent(eventData);

      if (error) {
        console.error('Error creating iCal event:', error);
        return NextResponse.json({ 
          success: true, 
          message: 'Email sent successfully, but failed to create calendar invite',
          error: error.message 
        });
      }

      console.log('iCal event created successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Email and calendar invite sent successfully',
        icsEvent 
      });
    } catch (error) {
      console.error('Error in send-calendar-invite:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send-calendar-invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
