import { redirect } from 'next/navigation';
import { isAuthenticated, logout } from '@/app/actions/email-actions';
import EmailSender from '@/components/EmailSender';
import { Mail, LogOut, Info } from 'lucide-react';

export default async function DashboardPage() {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
        redirect('/');
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-title">
                        <Mail size={22} />
                        <h1>Mail Sender</h1>
                    </div>
                    <form action={logout}>
                        <button type="submit" className="btn-logout">
                            <LogOut size={14} />
                            Logout
                        </button>
                    </form>
                </div>
            </header>

            <main className="dashboard-main">
                <EmailSender />
            </main>

            <footer className="dashboard-footer">
                <p><Info size={14} /> Keep this tab open while sending in client-side mode.</p>
            </footer>
        </div>
    );
}
