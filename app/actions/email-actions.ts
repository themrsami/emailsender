'use server';

import { cookies } from 'next/headers';
import { sendEmail, EmailConfig, EmailData } from '@/lib/emailer';
import { queueEmailBatch, QueuedEmail } from '@/lib/qstash';

const AUTH_COOKIE_NAME = 'mail_sender_auth';

// Verify password and set authentication cookie
export async function verifyPassword(password: string): Promise<boolean> {
    const isValid = password === process.env.SITE_PASSWORD;

    if (isValid) {
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE_NAME, 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
        });
    }

    return isValid;
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
    return authCookie?.value === 'authenticated';
}

// Logout - clear authentication
export async function logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
}

// Send a single email (for client-side delay mode)
export async function sendSingleEmail(
    gmailUser: string,
    gmailPassword: string,
    emailData: EmailData,
    pdfBase64?: string
): Promise<{ success: boolean; to: string; error?: string }> {
    // Verify authentication first
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        return { success: false, to: emailData.to, error: 'Not authenticated' };
    }

    const config: EmailConfig = {
        user: gmailUser,
        pass: gmailPassword,
    };

    // Convert base64 PDF to Buffer if provided
    let pdfBuffer: Buffer | undefined;
    if (pdfBase64) {
        pdfBuffer = Buffer.from(pdfBase64, 'base64');
    }

    const result = await sendEmail(config, emailData, pdfBuffer);

    return {
        success: result.success,
        to: emailData.to,
        error: result.error,
    };
}

// Queue all emails with QStash (for server-side delay mode)
export async function queueAllEmails(
    gmailUser: string,
    gmailPassword: string,
    emails: EmailData[],
    minDelay: number,
    maxDelay: number,
    pdfBase64?: string,
    baseUrl?: string,
    startDelaySeconds?: number  // NEW: Initial delay before first email (for scheduling)
): Promise<{ success: boolean; totalQueued: number; error?: string }> {
    console.log('=== queueAllEmails called ===');
    console.log('Emails count:', emails.length);
    console.log('Base URL provided:', baseUrl);
    console.log('Start delay (seconds):', startDelaySeconds || 0);

    // Verify authentication first
    const authenticated = await isAuthenticated();
    console.log('Authenticated:', authenticated);

    if (!authenticated) {
        return { success: false, totalQueued: 0, error: 'Not authenticated' };
    }

    // Get the base URL - must be provided for production
    const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
    console.log('URL resolved to:', url);

    if (!url) {
        return {
            success: false,
            totalQueued: 0,
            error: 'App URL not configured. Please deploy to Vercel first.'
        };
    }

    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    console.log('Full URL:', fullUrl);

    try {
        // Convert emails to queued format with credentials
        const queuedEmails: QueuedEmail[] = emails.map(email => ({
            to: email.to,
            subject: email.subject,
            body: email.body,
            gmailUser,
            gmailPassword,
            pdfBase64,
        }));

        console.log('Calling queueEmailBatch with', queuedEmails.length, 'emails');
        console.log('Delay range:', minDelay, '-', maxDelay, 'seconds');
        console.log('Initial start delay:', startDelaySeconds || 0, 'seconds');

        // Pass the start delay to queueEmailBatch
        const result = await queueEmailBatch(
            queuedEmails,
            minDelay,
            maxDelay,
            fullUrl,
            startDelaySeconds || 0  // Pass the initial delay
        );

        console.log('queueEmailBatch result:', result);

        return {
            success: true,
            totalQueued: result.totalQueued,
        };
    } catch (error) {
        console.error('Failed to queue emails:', error);
        return {
            success: false,
            totalQueued: 0,
            error: error instanceof Error ? error.message : 'Failed to queue emails',
        };
    }
}
