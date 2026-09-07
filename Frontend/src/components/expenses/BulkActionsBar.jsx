import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';

/**
 * BulkActionsBar Component
 * Dropdown menu for bulk expense operations.
 */
export function BulkActionsBar({ selectedCount, onAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (selectedCount === 0) return null;

  const handleActionClick = (actionType) => {
    setIsOpen(false);
    if (actionType === 'delete') {
      setShowConfirmModal(true);
    } else {
      onAction(actionType);
    }
  };

  const handleConfirmDelete = () => {
    setShowConfirmModal(false);
    onAction('delete');
  };

  return (
    <>
      <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 animate-fade-in">
        <span className="text-xs font-extrabold text-slate-800 px-2 py-1 bg-emerald-100/70 text-[#00a36f] rounded-md border border-emerald-200">
          {selectedCount} expense{selectedCount > 1 ? 's' : ''} selected
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs cursor-pointer focus:ring-2 focus:ring-[#00a36f] outline-none"
          >
            <span>Bulk Options</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isOpen && (
            <div
              className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left animate-fade-in"
              onClick={() => setIsOpen(false)}
            >
              <button
                type="button"
                onClick={() => handleActionClick('mark_paid')}
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mark as Paid</span>
              </button>

              <button
                type="button"
                onClick={() => handleActionClick('mark_awaiting')}
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Mark as Awaiting Payment</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={() => handleActionClick('delete')}
                className="w-full px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <DeleteConfirmModal
          count={selectedCount}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </>
  );
}
