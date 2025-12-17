import { Client } from '@upstash/qstash';

// Initialize QStash client
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
    const result = await qstashClient.publishJSON({
        url: `${baseUrl}/api/send-queued-email`,
        body: email,
        delay: delaySeconds,
    });

    return { messageId: result.messageId };
}

// Queue multiple emails with random delays
export async function queueEmailBatch(
    emails: QueuedEmail[],
    minDelay: number,
    maxDelay: number,
    baseUrl: string
): Promise<{ totalQueued: number; messageIds: string[] }> {
    const messageIds: string[] = [];
    let cumulativeDelay = 0;

    for (let i = 0; i < emails.length; i++) {
        // First email sends immediately, rest have cumulative delays
        if (i > 0) {
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            cumulativeDelay += randomDelay;
        }

        const result = await queueEmail(emails[i], cumulativeDelay, baseUrl);
        messageIds.push(result.messageId);
    }

    return {
        totalQueued: emails.length,
        messageIds,
    };
}
