import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  return (
    <AuthLayout>
      <div className="space-y-4">
        <div className="text-left pb-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manager Sign In
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Enter your credentials to access Pixx Technologies internal management system.
          </p>
        </div>

        <LoginForm />
      </div>
    </AuthLayout>
  );
}
