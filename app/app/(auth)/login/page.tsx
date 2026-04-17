import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your AppFlowy workspace',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-indigo-950 p-4">
      <LoginForm />
    </main>
  );
}
