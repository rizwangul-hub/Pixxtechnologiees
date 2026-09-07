import React from 'react';
import { X, Phone, MessageSquare, LifeBuoy, GraduationCap } from 'lucide-react';

export function TalkToUsModal({ isOpen, onClose, onOpenChatbot }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4 sm:p-6 bg-black/30 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-5 transition-all relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SECTION 1: How can we help? */}
        <div className="space-y-2 text-left pt-1">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#00a36f] tracking-tight">
            How can we help?
          </h3>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <span>Talk to us:</span>
              <a
                href="tel:01925357355"
                className="text-gray-900 hover:text-[#00a36f] transition-colors font-bold underline"
              >
                01925 357 355
              </a>
            </p>
            <p className="text-xs text-gray-500 font-medium">
              9am to 5pm Monday to Friday
            </p>
          </div>

          {/* Top Buttons: Contact Sales & Chat to our bot */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                alert('Connecting to LandlordVision Sales team...');
                onClose();
              }}
              className="w-full h-11 px-3 rounded-full bg-[#f96332] hover:bg-[#e85322] active:bg-[#d44315] text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-md shadow-[#f96332]/20 hover:shadow-lg flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>CONTACT SALES</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenChatbot) onOpenChatbot();
              }}
              className="w-full h-11 px-3 rounded-full bg-white border-2 border-[#00a36f] hover:bg-emerald-50 text-[#00a36f] text-xs font-extrabold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>CHAT TO OUR BOT</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Get product support */}
        <div className="space-y-2.5 text-left pt-2 border-t border-gray-100">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#00a36f] tracking-tight">
            Get product support
          </h3>

          {/* Bottom Buttons: Raise a ticket & Learning lounge */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                alert('Redirecting to Support Ticket Portal...');
                onClose();
              }}
              className="w-full h-11 px-3 rounded-full bg-[#f96332] hover:bg-[#e85322] active:bg-[#d44315] text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-md shadow-[#f96332]/20 hover:shadow-lg flex items-center justify-center gap-1.5"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>RAISE A TICKET</span>
            </button>

            <button
              type="button"
              onClick={() => {
                alert('Opening LandlordVision Learning Lounge Guides & Tutorials...');
                onClose();
              }}
              className="w-full h-11 px-3 rounded-full bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-md shadow-[#00a36f]/20 hover:shadow-lg flex items-center justify-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>LEARNING LOUNGE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
