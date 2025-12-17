import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { sendEmail } from '@/lib/emailer';

// Create receiver for signature verification
const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

// This endpoint is called by QStash when it's time to send an email
export async function POST(request: NextRequest) {
    try {
        // Get the raw body for signature verification
        const body = await request.text();
        const signature = request.headers.get('upstash-signature');

        // Verify QStash signature
        if (signature) {
            try {
                const isValid = await receiver.verify({
                    signature,
                    body,
                });
                if (!isValid) {
                    console.error('Invalid QStash signature');
                    return NextResponse.json(
                        { success: false, error: 'Invalid signature' },
                        { status: 401 }
                    );
                }
            } catch (verifyError) {
                console.error('Signature verification error:', verifyError);
                return NextResponse.json(
                    { success: false, error: 'Signature verification failed' },
                    { status: 401 }
                );
            }
        } else {
            // No signature - reject in production
            console.error('No QStash signature provided');
            return NextResponse.json(
                { success: false, error: 'No signature' },
                { status: 401 }
            );
        }

        // Parse the body
        const data = JSON.parse(body);
        const { to, subject, body: emailBody, gmailUser, gmailPassword, pdfBase64 } = data;

        // Validate required fields
        if (!to || !subject || !emailBody || !gmailUser || !gmailPassword) {
            console.error('Missing required fields:', { to, subject, emailBody: !!emailBody, gmailUser: !!gmailUser, gmailPassword: !!gmailPassword });
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
        console.log(`Attempting to send email to: ${to}`);
        const result = await sendEmail(
            { user: gmailUser, pass: gmailPassword },
            { to, subject, body: emailBody },
            pdfBuffer
        );

        if (result.success) {
            console.log(`Email sent successfully to: ${to}`);
            return NextResponse.json({ success: true, to });
        } else {
            console.error(`Failed to send email to: ${to}`, result.error);
            return NextResponse.json(
                { success: false, to, error: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error processing queued email:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
