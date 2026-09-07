import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { RegisterForm } from '../components/auth/RegisterForm';
import registerImg from '../assets/image/registerImage.webp';

export function RegisterPage() {
  const registerFeatures = [
    'First 14 days free!',
    'Free unlimited UK based support',
    'Simple cancellation process',
    '90 Day money back guarantee',
  ];

  return (
    <AuthLayout
      imageSrc={registerImg}
      imageAlt="Two screenshots of the LandlordVision software showing tenancy management and property details"
      brandGreenTheme={true}
      features={registerFeatures}
    >
      <div className="space-y-4">
        {/* Top Prompt & Main Heading matching reference design */}
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <p className="text-xs sm:text-sm font-medium text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#04A26F] hover:text-[#038a5e] transition-colors hover:underline"
            >
              Log in
            </Link>
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight pt-1">
            Start using Landlord Vision
          </h1>
        </div>

        {/* Registration Form Component */}
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}
