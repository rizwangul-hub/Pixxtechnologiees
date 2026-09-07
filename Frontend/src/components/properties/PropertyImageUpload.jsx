import React, { useRef } from 'react';
import { Image, Upload, X } from 'lucide-react';

/**
 * PropertyImageUpload Component
 * Drag-and-drop or click-to-upload property image component with live thumbnail preview.
 */
export function PropertyImageUpload({ image, setImage }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      {/* Thumbnail Box */}
      <div className="w-24 h-24 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 relative group">
        {image ? (
          <>
            <img src={image} alt="Property Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="text-slate-400 flex flex-col items-center">
            <Image className="w-8 h-8" />
            <span className="text-[10px] font-bold mt-1">NO PICTURE</span>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-[#00a36f] bg-white p-4 rounded-xl text-center cursor-pointer transition-colors space-y-1"
      >
        <Upload className="w-5 h-5 text-slate-400 mx-auto" />
        <p className="text-xs font-extrabold text-slate-700">Drop files anywhere on the page</p>
        <p className="text-[11px] font-medium text-slate-400">or click to browse from device (JPG, PNG, WEBP)</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
