import React, { useRef } from 'react';
import { Paperclip, Upload, X, FileCheck } from 'lucide-react';

/**
 * DocumentUploader Component
 * Section 3: Attachment drag-and-drop & browse uploader matching screenshot 3.
 */
export function DocumentUploader({ attachment, setAttachment }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type,
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setAttachment({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type,
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-left">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Paperclip className="w-5 h-5 text-[#00a36f]" />
        <h3 className="text-base font-extrabold text-slate-900">Attached Document</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        {/* Status / File Info */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
          {attachment ? (
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-[#00a36f] font-bold">
              <FileCheck className="w-4 h-4" />
              <span>{attachment.name}</span>
              <span className="text-[10px] text-slate-400">({attachment.size})</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-0.5 rounded-full hover:bg-emerald-100 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-slate-400 italic">No attachment</span>
          )}
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-[#00a36f] bg-white p-3 rounded-xl text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-[#00a36f] hover:underline">Attach File</span>
          <span className="text-[11px] text-slate-400">or drop files anywhere on the page (PDF, JPG, PNG, DOCX, XLSX)</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
