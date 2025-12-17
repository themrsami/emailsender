import { Client } from '@upstash/qstash';

// Initialize QStash client
console.log('Initializing QStash client, token exists:', !!process.env.QSTASH_TOKEN);

export const qstashClient = new Client({
    token: process.env.QSTASH_TOKEN!,
});

export interface QueuedEmail {
    to: string;
    subject: string;
    body: string;
    gmailUser: string;
    gmailPassword: string;
    pdfBase64?: string;
}

// Queue a single email with delay
export async function queueEmail(
    email: QueuedEmail,
    delaySeconds: number,
    baseUrl: string
): Promise<{ messageId: string }> {
    const targetUrl = `${baseUrl}/api/send-queued-email`;
    console.log(`Queueing email to ${email.to} with ${delaySeconds}s delay`);
    console.log(`Target URL: ${targetUrl}`);

    try {
        const result = await qstashClient.publishJSON({
            url: targetUrl,
            body: email,
            delay: delaySeconds,
        });

        console.log(`Email queued successfully, messageId: ${result.messageId}`);
        return { messageId: result.messageId };
    } catch (error) {
        console.error('QStash publishJSON failed:', error);
        throw error;
    }
}

// Queue multiple emails with random delays
export async function queueEmailBatch(
    emails: QueuedEmail[],
    minDelay: number,
    maxDelay: number,
    baseUrl: string,
    startDelaySeconds: number = 0  // NEW: Initial delay before first email
): Promise<{ totalQueued: number; messageIds: string[] }> {
    console.log('=== queueEmailBatch started ===');
    console.log(`Processing ${emails.length} emails`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Delay range: ${minDelay}s - ${maxDelay}s`);
    console.log(`Start delay (scheduled): ${startDelaySeconds}s`);

    const messageIds: string[] = [];
    // Start with the initial delay (for scheduled emails)
    let cumulativeDelay = startDelaySeconds;

    for (let i = 0; i < emails.length; i++) {
        // Add random delay between emails (except before first one)
        if (i > 0) {
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            cumulativeDelay += randomDelay;
        }

        console.log(`Processing email ${i + 1}/${emails.length} to ${emails[i].to}, total delay: ${cumulativeDelay}s`);
        const result = await queueEmail(emails[i], cumulativeDelay, baseUrl);
        messageIds.push(result.messageId);
    }

    console.log('=== queueEmailBatch completed ===');
    console.log(`Total queued: ${emails.length}`);
    console.log(`Message IDs: ${messageIds.join(', ')}`);

    return {
        totalQueued: emails.length,
        messageIds,
    };
}
