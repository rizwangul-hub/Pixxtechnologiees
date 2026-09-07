import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { PasskeyModal } from '../components/auth/PasskeyModal';
import loginImg from '../assets/image/LoginImage.webp';

export function LoginPage() {
  const [isPasskeyMode, setIsPasskeyMode] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);

  return (
    <AuthLayout
      imageSrc={loginImg}
      imageAlt="Screenshot of the LandlordVision dashboard shown on mobile, tablet, and laptop"
      brandGreenTheme={true}
      tagline="All-In-One Property Management Software for Landlords"
      subtagline={
        isPasskeyMode
          ? 'Landlord Vision is a cloud-based residential landlord software that helps manage finances, tasks and landlord responsibilities'
          : ''
      }
      hideLeftLogo={isPasskeyMode}
      showFormLogo={isPasskeyMode}
    >
      <div className="space-y-4">
        {/* Top Header Section */}
        {!isPasskeyMode ? (
          <div className="flex items-center justify-between flex-wrap gap-2 text-left pb-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Log in
            </h1>

            <p className="text-xs sm:text-sm font-medium text-gray-600">
              New to Landlord Vision?{' '}
              <Link
                to="/register"
                className="font-bold text-[#00a36f] hover:text-[#008f61] transition-colors underline"
              >
                Try now
              </Link>
            </p>
          </div>
        ) : (
          <div className="text-center sm:text-left pb-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Login
            </h1>
          </div>
        )}

        {/* Login Form Component */}
        <LoginForm
          isPasskeyMode={isPasskeyMode}
          onTogglePasskeyMode={(val) => setIsPasskeyMode(val)}
          onOpenPasskeyModal={() => setIsPasskeyModalOpen(true)}
        />
      </div>

      {/* Passkey Biometric Simulation Modal */}
      <PasskeyModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
        onSuccess={() => {
          alert('Passkey authenticated successfully! Logging into LandlordVision...');
        }}
      />
    </AuthLayout>
  );
}
