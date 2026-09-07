import React, { useState } from 'react';
import { Check, PhoneCall, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TalkToUsModal } from './TalkToUsModal';
import { ChatbotModal } from './ChatbotModal';
import logoImg from '../../assets/image/logo.png';

export function AuthLayout({
  imageSrc,
  imageAlt,
  children,
  brandGreenTheme = false,
  features = [],
  tagline = '',
  subtagline = '',
  hideLeftLogo = false,
  showFormLogo = false,
}) {
  const [isTalkToUsOpen, setIsTalkToUsOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-white font-sans text-gray-900 antialiased overflow-x-hidden relative flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8">
      {/* Centered Main Container Matching Reference Layout */}
      <div className="w-full max-w-[1240px] mx-auto flex flex-col md:flex-row items-stretch justify-center gap-6 lg:gap-10 my-auto">
        
        {/* LEFT SIDE: Rounded Green Feature Card (Hidden on mobile & mobile tabs < md) */}
        {brandGreenTheme ? (
          <div className="hidden md:flex w-full md:w-[48%] lg:w-[48%] bg-[#00a36f] rounded-[1.5rem] px-6 sm:px-8 pt-8 sm:pt-10 pb-9 sm:pb-[46px] flex-col justify-between items-center text-white text-center shrink-0 relative overflow-hidden shadow-lg">
            {/* Subtle background geometric decoration */}
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-black/10 blur-2xl pointer-events-none" />

            {/* Top Brand Logo (Hidden in Passkey mode view where logo is on right form panel) */}
            {!hideLeftLogo ? (
              <div className="relative z-10 w-full flex items-center justify-center pt-2 pb-4">
                <Link to="/login" className="inline-block transition-transform hover:scale-105">
                  <img
                    src={logoImg}
                    alt="LandlordVision Logo"
                    className="h-[95px] sm:h-[103px] w-auto object-contain max-w-[480px] align-middle box-content"
                    style={{ boxSizing: 'content-box' }}
                  />
                </Link>
              </div>
            ) : (
              <div className="pt-2" />
            )}

            {/* Middle Software Screenshot Image */}
            <div className="relative z-10 my-auto py-2 w-full flex justify-center items-center max-w-md">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full max-h-[360px] object-contain drop-shadow-2xl rounded-lg transition-transform duration-500 hover:scale-[1.02] align-middle overflow-clip"
              />
            </div>

            {/* Bottom Content: Tagline & Optional Subtagline */}
            {tagline && (
              <div className="relative z-10 w-full max-w-md mx-auto text-center pt-4 pb-2 space-y-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-snug tracking-tight drop-shadow-xs">
                  {tagline}
                </h2>
                {subtagline && (
                  <p className="text-xs sm:text-sm text-emerald-100/90 font-normal leading-relaxed drop-shadow-xs max-w-sm mx-auto">
                    {subtagline}
                  </p>
                )}
              </div>
            )}

            {features && features.length > 0 && (
              <div className="relative z-10 w-full max-w-sm mx-auto space-y-3 pt-4 pb-1">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 font-semibold text-sm sm:text-base text-white">
                    <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    </div>
                    <span className="drop-shadow-xs">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Standard Dedicated Image Card Layout (Hidden on mobile & mobile tabs < md) */
          <div className="hidden md:flex w-full md:w-[45%] lg:w-[48%] h-56 sm:h-72 md:h-auto min-h-full rounded-3xl overflow-hidden bg-slate-100 items-center justify-center shrink-0 shadow-md">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-full object-cover object-center align-middle"
            />
          </div>
        )}

        {/* RIGHT SIDE: Authentication Form Panel */}
        <div className="w-full md:w-[52%] lg:w-[52%] flex flex-col justify-between p-2 sm:p-6 lg:p-8 bg-white">
          {/* Brand Logo Header (Shown when showFormLogo is true OR on mobile where left card is hidden) */}
          {(showFormLogo || !brandGreenTheme) ? (
            <div className="w-full max-w-[460px] mx-auto flex items-center justify-center pb-2 pt-1">
              <Link
                to="/login"
                className="inline-flex items-center justify-center transition-transform hover:scale-105 md:bg-transparent bg-[#00a36f] md:px-0 md:py-0 px-6 py-3 rounded-2xl md:shadow-none shadow-md"
              >
                <img
                  src={logoImg}
                  alt="LandlordVision Logo"
                  className="h-[75px] sm:h-[95px] w-auto object-contain max-w-[440px] align-middle box-content"
                  style={{ boxSizing: 'content-box' }}
                />
              </Link>
            </div>
          ) : (
            <div className="w-full max-w-[460px] mx-auto flex md:hidden items-center justify-center pb-4 pt-1">
              <Link
                to="/login"
                className="inline-flex items-center justify-center transition-transform hover:scale-105 bg-[#00a36f] px-6 py-3 rounded-2xl shadow-md"
              >
                <img
                  src={logoImg}
                  alt="LandlordVision Logo"
                  className="h-[75px] sm:h-[85px] w-auto object-contain max-w-[360px] align-middle box-content"
                  style={{ boxSizing: 'content-box' }}
                />
              </Link>
            </div>
          )}

          {/* Main Form Content */}
          <div className="w-full max-w-[460px] mx-auto my-auto py-2">
            {children}
          </div>

          {/* Page Footer */}
          <div className="w-full max-w-[460px] mx-auto text-xs text-gray-400 text-center pt-4">
            &copy; {new Date().getFullYear()} LandlordVision. All rights reserved.
          </div>
        </div>
      </div>

      {/* FLOATING CIRCULAR "TALK TO US" WIDGET */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsTalkToUsOpen(true)}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border border-gray-200/80 shadow-2xl hover:shadow-3xl flex flex-col items-center justify-center p-2 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Talk to us support widget"
        >
          {/* Icons Row: Phone | Message */}
          <div className="flex items-center gap-1.5 text-slate-700 pb-1">
            <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 group-hover:text-[#04A26F] transition-colors" />
            <div className="w-[1px] h-4 bg-slate-300" />
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 group-hover:text-[#04A26F] transition-colors" />
          </div>

          {/* Text with Red Notification Dot */}
          <div className="relative text-[11px] sm:text-xs font-bold text-slate-700 tracking-tight leading-none">
            <span>Talk to us</span>
            <span className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          </div>
        </button>
      </div>

      {/* TALK TO US MODAL POPUP */}
      <TalkToUsModal
        isOpen={isTalkToUsOpen}
        onClose={() => setIsTalkToUsOpen(false)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
      />

      {/* OPENROUTER AI CHATBOT WIDGET */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
      />
    </div>
  );
}
