import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/app/actions/email-actions';
import LoginForm from '@/components/LoginForm';

export default async function HomePage() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
