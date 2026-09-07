import React from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';

/**
 * PropertyFormNotes Component
 * Availability checkbox and Notes textarea section matching screenshot 2.
 */
export function PropertyFormNotes({ formData, setFormData }) {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 text-left">
      {/* Not Available For Letting Checkbox */}
      <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 flex items-center gap-2.5">
        <input
          type="checkbox"
          id="notAvailableForLetting"
          checked={Boolean(formData.notAvailableForLetting)}
          onChange={(e) => handleChange('notAvailableForLetting', e.target.checked)}
          className="w-4 h-4 rounded-md border-amber-300 text-[#00a36f] focus:ring-[#00a36f] cursor-pointer"
        />
        <label
          htmlFor="notAvailableForLetting"
          className="text-xs font-bold text-amber-900 cursor-pointer select-none flex items-center gap-1.5"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Not Available For Letting</span>
        </label>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <MessageSquare className="w-5 h-5 text-[#00a36f]" />
          <h3 className="text-base font-extrabold text-slate-900">Notes</h3>
        </div>
        <textarea
          rows={5}
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Add additional property specifications, access codes, or landlord notes..."
          className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] outline-none transition-all resize-y"
        />
      </div>
    </div>
  );
}
