'use client';

import { Check, X } from 'lucide-react';

interface EmailResult {
    to: string;
    success: boolean;
    error?: string;
}

interface ProgressDisplayProps {
    current: number;
    total: number;
    results: EmailResult[];
    isRunning: boolean;
    currentDelay?: number;
}

export default function ProgressDisplay({
    current,
    total,
    results,
    isRunning,
    currentDelay,
}: ProgressDisplayProps) {
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    const progress = total > 0 ? (current / total) * 100 : 0;

    if (total === 0) {
        return null;
    }

    return (
        <div className="progress-display">
            <div className="progress-header">
                <h3>Sending Progress</h3>
                {isRunning && currentDelay !== undefined && (
                    <span className="delay-indicator">
                        Waiting {currentDelay}s before next email...
                    </span>
                )}
            </div>

            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="progress-stats">
                <div className="stat">
                    <span className="stat-value">{current}</span>
                    <span className="stat-label">/ {total} Emails</span>
                </div>
                <div className="stat success">
                    <span className="stat-value">{successCount}</span>
                    <span className="stat-label">Success</span>
                </div>
                <div className="stat failure">
                    <span className="stat-value">{failureCount}</span>
                    <span className="stat-label">Failed</span>
                </div>
            </div>

            {results.length > 0 && (
                <div className="results-list">
                    <h4>Results</h4>
                    <div className="results-scroll">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={`result-item ${result.success ? 'success' : 'failure'}`}
                            >
                                <span className="result-icon">
                                    {result.success ? <Check size={14} /> : <X size={14} />}
                                </span>
                                <span className="result-email">{result.to}</span>
                                {result.error && (
                                    <span className="result-error">{result.error}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
