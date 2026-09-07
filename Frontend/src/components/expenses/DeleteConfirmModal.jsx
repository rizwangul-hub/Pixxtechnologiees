import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * DeleteConfirmModal Component
 * Confirmation dialog for destructive bulk delete action.
 */
export function DeleteConfirmModal({ count, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h3 className="text-base font-extrabold tracking-tight">Confirm Delete</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-3 text-slate-800 text-xs sm:text-sm font-medium">
          <p>
            Are you sure you want to delete{' '}
            <span className="font-extrabold text-slate-900">{count} selected expense(s)</span>?
          </p>
          <p className="text-xs text-slate-500">
            This action cannot be undone. All invoice records and payment history associated with these items will be permanently removed.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Delete Expenses
          </button>
        </div>
      </div>
    </div>
  );
}
