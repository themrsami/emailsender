'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Mail, Key } from 'lucide-react';

export interface SavedAccount {
    id: string;
    email: string;
    appPassword: string;
    label?: string;
}

interface AccountSelectorProps {
    onAccountSelect: (account: SavedAccount | null) => void;
    disabled?: boolean;
}

const STORAGE_KEY = 'mail_sender_accounts';

export default function AccountSelector({ onAccountSelect, disabled }: AccountSelectorProps) {
    const [accounts, setAccounts] = useState<SavedAccount[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formLabel, setFormLabel] = useState('');

    // Load accounts from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setAccounts(parsed);
                // Auto-select first account if available
                if (parsed.length > 0 && !selectedId) {
                    setSelectedId(parsed[0].id);
                    onAccountSelect(parsed[0]);
                }
            } catch {
                console.error('Failed to parse saved accounts');
            }
        }
    }, []);

    // Save accounts to localStorage
    const saveAccounts = (newAccounts: SavedAccount[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts));
        setAccounts(newAccounts);
    };

    // Generate unique ID
    const generateId = () => `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add new account
    const handleAdd = () => {
        if (!formEmail || !formPassword) return;

        const newAccount: SavedAccount = {
            id: generateId(),
            email: formEmail.trim(),
            appPassword: formPassword.trim(),
            label: formLabel.trim() || undefined,
        };

        const newAccounts = [...accounts, newAccount];
        saveAccounts(newAccounts);

        // Auto-select new account
        setSelectedId(newAccount.id);
        onAccountSelect(newAccount);

        // Reset form
        setFormEmail('');
        setFormPassword('');
        setFormLabel('');
        setIsAdding(false);
    };

    // Update account
    const handleUpdate = (id: string) => {
        if (!formEmail || !formPassword) return;

        const newAccounts = accounts.map(acc =>
            acc.id === id
                ? { ...acc, email: formEmail.trim(), appPassword: formPassword.trim(), label: formLabel.trim() || undefined }
                : acc
        );
        saveAccounts(newAccounts);

        // Update selection if editing selected account
        if (selectedId === id) {
            const updated = newAccounts.find(a => a.id === id);
            if (updated) onAccountSelect(updated);
        }

        setEditingId(null);
        setFormEmail('');
        setFormPassword('');
        setFormLabel('');
    };

    // Delete account
    const handleDelete = (id: string) => {
        const newAccounts = accounts.filter(acc => acc.id !== id);
        saveAccounts(newAccounts);

        // Clear selection if deleted
        if (selectedId === id) {
            if (newAccounts.length > 0) {
                setSelectedId(newAccounts[0].id);
                onAccountSelect(newAccounts[0]);
            } else {
                setSelectedId(null);
                onAccountSelect(null);
            }
        }
    };

    // Select account
    const handleSelect = (account: SavedAccount) => {
        setSelectedId(account.id);
        onAccountSelect(account);
    };

    // Start editing
    const startEditing = (account: SavedAccount) => {
        setEditingId(account.id);
        setFormEmail(account.email);
        setFormPassword(account.appPassword);
        setFormLabel(account.label || '');
        setIsAdding(false);
    };

    // Cancel editing/adding
    const cancelForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormEmail('');
        setFormPassword('');
        setFormLabel('');
    };

    return (
        <div className="account-selector">
            {/* Account List */}
            {accounts.length > 0 && (
                <div className="account-list">
                    {accounts.map(account => (
                        <div
                            key={account.id}
                            className={`account-item ${selectedId === account.id ? 'selected' : ''} ${editingId === account.id ? 'editing' : ''}`}
                        >
                            {editingId === account.id ? (
                                // Edit Form
                                <div className="account-form">
                                    <div className="form-row">
                                        <div className="input-with-icon">
                                            <Mail size={16} />
                                            <input
                                                type="email"
                                                placeholder="Gmail address"
                                                value={formEmail}
                                                onChange={(e) => setFormEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="input-with-icon">
                                            <Key size={16} />
                                            <input
                                                type="password"
                                                placeholder="App password"
                                                value={formPassword}
                                                onChange={(e) => setFormPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <input
                                            type="text"
                                            placeholder="Label (optional)"
                                            value={formLabel}
                                            onChange={(e) => setFormLabel(e.target.value)}
                                            className="label-input"
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn-icon success" onClick={() => handleUpdate(account.id)}>
                                            <Check size={16} />
                                        </button>
                                        <button type="button" className="btn-icon" onClick={cancelForm}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Account Display
                                <>
                                    <button
                                        type="button"
                                        className="account-select-btn"
                                        onClick={() => handleSelect(account)}
                                        disabled={disabled}
                                    >
                                        <div className="account-radio">
                                            {selectedId === account.id && <div className="radio-dot" />}
                                        </div>
                                        <div className="account-info">
                                            {account.label && <span className="account-label">{account.label}</span>}
                                            <span className="account-email">{account.email}</span>
                                        </div>
                                    </button>
                                    <div className="account-actions">
                                        <button
                                            type="button"
                                            className="btn-icon"
                                            onClick={() => startEditing(account)}
                                            disabled={disabled}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-icon danger"
                                            onClick={() => handleDelete(account.id)}
                                            disabled={disabled}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Form */}
            {isAdding && (
                <div className="account-form add-form">
                    <div className="form-row">
                        <div className="input-with-icon">
                            <Mail size={16} />
                            <input
                                type="email"
                                placeholder="Gmail address"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="input-with-icon">
                            <Key size={16} />
                            <input
                                type="password"
                                placeholder="App password"
                                value={formPassword}
                                onChange={(e) => setFormPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Label (optional, e.g. Work, Personal)"
                            value={formLabel}
                            onChange={(e) => setFormLabel(e.target.value)}
                            className="label-input"
                        />
                    </div>
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-save"
                            onClick={handleAdd}
                            disabled={!formEmail || !formPassword}
                        >
                            <Check size={16} />
                            Save Account
                        </button>
                        <button type="button" className="btn-cancel" onClick={cancelForm}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Add Account Button */}
            {!isAdding && !editingId && (
                <button
                    type="button"
                    className="btn-add-account"
                    onClick={() => setIsAdding(true)}
                    disabled={disabled}
                >
                    <Plus size={18} />
                    {accounts.length === 0 ? 'Add Gmail Account' : 'Add Another Account'}
                </button>
            )}

            {/* Empty State */}
            {accounts.length === 0 && !isAdding && (
                <p className="account-empty-hint">
                    No accounts saved. Add your Gmail account to get started.
                </p>
            )}
        </div>
    );
}
