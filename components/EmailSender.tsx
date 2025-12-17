'use client';

import { useState, useRef, useCallback } from 'react';
import { sendSingleEmail, queueAllEmails } from '@/app/actions/email-actions';
import SchedulePicker from './SchedulePicker';
import ProgressDisplay from './ProgressDisplay';
import NumberInput from './NumberInput';
import { Cloud, Monitor, Check, AlertTriangle } from 'lucide-react';

interface EmailData {
    to: string;
    subject: string;
    body: string;
}

interface EmailResult {
    to: string;
    success: boolean;
    error?: string;
}

type SendMode = 'client' | 'server';

export default function EmailSender() {
    // Mode selection
    const [sendMode, setSendMode] = useState<SendMode>('server');

    // Credentials
    const [gmailUser, setGmailUser] = useState('');
    const [gmailPassword, setGmailPassword] = useState('');

    // Files
    const [emails, setEmails] = useState<EmailData[]>([]);
    const [jsonFileName, setJsonFileName] = useState('');
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);
    const [pdfFileName, setPdfFileName] = useState('');

    // Delays
    const [minDelay, setMinDelay] = useState(120);
    const [maxDelay, setMaxDelay] = useState(300);

    // Schedule
    const [scheduledTime, setScheduledTime] = useState<Date | null>(null);

    // Progress
    const [isRunning, setIsRunning] = useState(false);
    const [currentEmail, setCurrentEmail] = useState(0);
    const [results, setResults] = useState<EmailResult[]>([]);
    const [currentDelay, setCurrentDelay] = useState<number | undefined>();
    const [queueStatus, setQueueStatus] = useState<string | null>(null);

    // Refs
    const jsonInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef(false);

    // Handle JSON file upload
    const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (Array.isArray(data)) {
                    setEmails(data);
                    setJsonFileName(file.name);
                } else {
                    alert('JSON must be an array of email objects');
                }
            } catch {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    // Handle PDF file upload
    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = (event.target?.result as string).split(',')[1];
            setPdfBase64(base64);
            setPdfFileName(file.name);
        };
        reader.readAsDataURL(file);
    };

    // Remove PDF
    const removePdf = () => {
        setPdfBase64(null);
        setPdfFileName('');
        if (pdfInputRef.current) {
            pdfInputRef.current.value = '';
        }
    };

    // Random delay between min and max
    const getRandomDelay = () => {
        return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    };

    // Delay helper
    const delay = (seconds: number) =>
        new Promise((resolve) => setTimeout(resolve, seconds * 1000));

    // Client-side sending (original behavior)
    const startClientSending = useCallback(async () => {
        setIsRunning(true);
        setCurrentEmail(0);
        setResults([]);
        abortRef.current = false;

        for (let i = 0; i < emails.length; i++) {
            if (abortRef.current) break;

            setCurrentEmail(i + 1);

            const result = await sendSingleEmail(
                gmailUser,
                gmailPassword,
                emails[i],
                pdfBase64 || undefined
            );

            setResults((prev) => [...prev, result]);

            // Add delay between emails (except for the last one)
            if (i < emails.length - 1 && !abortRef.current) {
                const delaySeconds = getRandomDelay();
                setCurrentDelay(delaySeconds);
                await delay(delaySeconds);
                setCurrentDelay(undefined);
            }
        }

        setIsRunning(false);
    }, [gmailUser, gmailPassword, emails, pdfBase64, minDelay, maxDelay]);

    // Server-side sending via QStash
    const startServerSending = useCallback(async (startDelaySeconds: number = 0) => {
        setIsRunning(true);

        if (startDelaySeconds > 0) {
            const minutes = Math.floor(startDelaySeconds / 60);
            setQueueStatus(`Queuing emails (scheduled to start in ${minutes} minutes)...`);
        } else {
            setQueueStatus('Queuing emails...');
        }

        try {
            const baseUrl = window.location.origin;

            const result = await queueAllEmails(
                gmailUser,
                gmailPassword,
                emails,
                minDelay,
                maxDelay,
                pdfBase64 || undefined,
                baseUrl,
                startDelaySeconds  // Pass the scheduled delay to QStash
            );

            if (result.success) {
                if (startDelaySeconds > 0) {
                    const minutes = Math.floor(startDelaySeconds / 60);
                    setQueueStatus(`✅ ${result.totalQueued} emails scheduled! First email will be sent in ~${minutes} minutes. You can close this tab.`);
                } else {
                    setQueueStatus(`✅ ${result.totalQueued} emails queued! They will be sent automatically. You can close this tab.`);
                }
            } else {
                setQueueStatus(`❌ Failed to queue emails: ${result.error}`);
            }
        } catch (error) {
            setQueueStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        setIsRunning(false);
    }, [gmailUser, gmailPassword, emails, pdfBase64, minDelay, maxDelay]);

    // Start sending based on mode
    const startSending = useCallback(async (startDelaySeconds: number = 0) => {
        if (!gmailUser || !gmailPassword) {
            alert('Please enter Gmail credentials');
            return;
        }
        if (emails.length === 0) {
            alert('Please upload a JSON file with emails');
            return;
        }

        if (sendMode === 'server') {
            await startServerSending(startDelaySeconds);
        } else {
            await startClientSending();
        }
    }, [sendMode, gmailUser, gmailPassword, emails, startServerSending, startClientSending]);

    // Handle scheduled start
    const handleScheduledStart = useCallback(async () => {
        if (!scheduledTime) {
            startSending(0);
            return;
        }

        const now = Date.now();
        const targetTime = scheduledTime.getTime();
        const waitTimeSeconds = Math.max(0, Math.floor((targetTime - now) / 1000));

        if (sendMode === 'server') {
            // For server mode: pass the delay to QStash immediately
            // User can close browser right away!
            await startSending(waitTimeSeconds);
        } else {
            // For client mode: wait on client side
            if (waitTimeSeconds > 0) {
                setIsRunning(true);
                setQueueStatus('Waiting for scheduled time...');
                await delay(waitTimeSeconds);
                if (!abortRef.current) {
                    setQueueStatus(null);
                    await startSending(0);
                }
            } else {
                startSending(0);
            }
        }
    }, [scheduledTime, sendMode, startSending]);


    // Stop sending
    const stopSending = () => {
        abortRef.current = true;
        setIsRunning(false);
        setCurrentDelay(undefined);
        setQueueStatus(null);
    };

    // Validate form
    const isValid = gmailUser && gmailPassword && emails.length > 0;

    return (
        <div className="email-sender">
            {/* Mode Selection */}
            <section className="section">
                <h2>Sending Mode</h2>
                <div className="mode-selector">
                    <button
                        type="button"
                        className={`mode-btn ${sendMode === 'server' ? 'active' : ''}`}
                        onClick={() => setSendMode('server')}
                        disabled={isRunning}
                    >
                        <Cloud className="mode-icon" size={24} />
                        <span className="mode-title">Server-Side (QStash)</span>
                        <span className="mode-desc">Close browser anytime</span>
                    </button>
                    <button
                        type="button"
                        className={`mode-btn ${sendMode === 'client' ? 'active' : ''}`}
                        onClick={() => setSendMode('client')}
                        disabled={isRunning}
                    >
                        <Monitor className="mode-icon" size={24} />
                        <span className="mode-title">Client-Side</span>
                        <span className="mode-desc">Keep browser open</span>
                    </button>
                </div>
                {sendMode === 'server' && (
                    <p className="hint success">
                        <Check size={14} /> Emails will be queued and sent automatically. You can close your browser after queuing.
                    </p>
                )}
                {sendMode === 'client' && (
                    <p className="hint warning">
                        <AlertTriangle size={14} /> Browser must stay open. You'll see real-time progress.
                    </p>
                )}
            </section>

            {/* Credentials Section */}
            <section className="section">
                <h2>Gmail Credentials</h2>
                <div className="input-row">
                    <div className="input-group">
                        <label htmlFor="gmail-user">Gmail Email</label>
                        <input
                            id="gmail-user"
                            type="email"
                            value={gmailUser}
                            onChange={(e) => setGmailUser(e.target.value)}
                            placeholder="your.email@gmail.com"
                            disabled={isRunning}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="gmail-password">App Password</label>
                        <input
                            id="gmail-password"
                            type="password"
                            value={gmailPassword}
                            onChange={(e) => setGmailPassword(e.target.value)}
                            placeholder="xxxx xxxx xxxx xxxx"
                            disabled={isRunning}
                        />
                    </div>
                </div>
            </section>

            {/* Files Section */}
            <section className="section">
                <h2>File Uploads</h2>
                <div className="input-row">
                    <div className="file-upload-group">
                        <label>Email Data (JSON)</label>
                        <input
                            ref={jsonInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleJsonUpload}
                            disabled={isRunning}
                            hidden
                        />
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => jsonInputRef.current?.click()}
                            disabled={isRunning}
                        >
                            {jsonFileName || 'Choose JSON File'}
                        </button>
                        {emails.length > 0 && (
                            <span className="file-info">{emails.length} emails loaded</span>
                        )}
                    </div>

                    <div className="file-upload-group">
                        <label>CV Attachment (PDF) - Optional</label>
                        <input
                            ref={pdfInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                            disabled={isRunning}
                            hidden
                        />
                        <div className="file-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => pdfInputRef.current?.click()}
                                disabled={isRunning}
                            >
                                {pdfFileName || 'Choose PDF File'}
                            </button>
                            {pdfBase64 && (
                                <button
                                    type="button"
                                    className="btn-danger"
                                    onClick={removePdf}
                                    disabled={isRunning}
                                >
                                    Remove CV
                                </button>
                            )}
                        </div>
                        {pdfBase64 && (
                            <span className="file-info attached">✓ CV will be attached</span>
                        )}
                    </div>
                </div>
            </section>

            {/* Delay Section */}
            <section className="section">
                <h2>Delay Settings</h2>
                <div className="delay-inputs">
                    <NumberInput
                        label="Minimum Delay"
                        value={minDelay}
                        onChange={setMinDelay}
                        min={10}
                        max={3600}
                        step={30}
                        unit="sec"
                        disabled={isRunning}
                    />
                    <NumberInput
                        label="Maximum Delay"
                        value={maxDelay}
                        onChange={setMaxDelay}
                        min={10}
                        max={3600}
                        step={30}
                        unit="sec"
                        disabled={isRunning}
                    />
                </div>
            </section>

            {/* Schedule Section */}
            <section className="section">
                <h2>Schedule (Optional)</h2>
                <SchedulePicker onScheduleChange={setScheduledTime} disabled={isRunning} />
            </section>

            {/* Queue Status */}
            {queueStatus && (
                <section className="section queue-status">
                    <p>{queueStatus}</p>
                </section>
            )}

            {/* Action Buttons */}
            <section className="section actions">
                {!isRunning ? (
                    <button
                        type="button"
                        className="btn-primary btn-large"
                        onClick={handleScheduledStart}
                        disabled={!isValid}
                    >
                        {sendMode === 'server'
                            ? (scheduledTime ? 'Queue & Schedule' : 'Queue Emails')
                            : (scheduledTime ? 'Schedule & Start' : 'Start Now')
                        }
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn-danger btn-large"
                        onClick={stopSending}
                    >
                        Stop
                    </button>
                )}
            </section>

            {/* Progress Display (only for client-side mode) */}
            {sendMode === 'client' && (
                <ProgressDisplay
                    current={currentEmail}
                    total={emails.length}
                    results={results}
                    isRunning={isRunning}
                    currentDelay={currentDelay}
                />
            )}
        </div>
    );
}
