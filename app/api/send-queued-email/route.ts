import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { sendEmail } from '@/lib/emailer';

// This endpoint is called by QStash when it's time to send an email
async function handler(request: NextRequest) {
    try {
        const body = await request.json();

        const { to, subject, body: emailBody, gmailUser, gmailPassword, pdfBase64 } = body;

        // Validate required fields
        if (!to || !subject || !emailBody || !gmailUser || !gmailPassword) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Convert base64 PDF to Buffer if provided
        let pdfBuffer: Buffer | undefined;
        if (pdfBase64) {
            pdfBuffer = Buffer.from(pdfBase64, 'base64');
        }

        // Send the email
        const result = await sendEmail(
            { user: gmailUser, pass: gmailPassword },
            { to, subject, body: emailBody },
            pdfBuffer
        );

        if (result.success) {
            console.log(`✅ Email sent to: ${to}`);
            return NextResponse.json({ success: true, to });
        } else {
            console.error(`❌ Failed to send email to: ${to}`, result.error);
            return NextResponse.json(
                { success: false, to, error: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error processing queued email:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Wrap handler with QStash signature verification for security
export const POST = verifySignatureAppRouter(handler);
