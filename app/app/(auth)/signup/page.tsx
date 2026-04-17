import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your AppFlowy account',
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-indigo-950 p-4">
      <SignupForm />
    </main>
  );
}
