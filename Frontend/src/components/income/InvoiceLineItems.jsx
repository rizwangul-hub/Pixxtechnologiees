import React from 'react';
import { Layers, Plus } from 'lucide-react';
import { InvoiceLineItemRow } from './InvoiceLineItemRow';
import { formatCurrency } from '../../utils/currencyFormatter';

/**
 * InvoiceLineItems Component
 * Section 4: Invoice Line Items table, Add Line button, and live Grand Total calculation.
 */
export function InvoiceLineItems({ items = [], setItems, errors }) {
  const handleLineChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddLine = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length}`,
        item: 'Other Income',
        description: '',
        quantity: 1.0,
        unitPrice: 0.0,
        account: 'Other Income',
      },
    ]);
  };

  const handleRemoveLine = (index) => {
    if (items.length === 1) {
      // Reset line 1 instead of leaving completely empty table if only 1 exists
      setItems([
        {
          id: `line-${Date.now()}`,
          item: '',
          description: '',
          quantity: 1.0,
          unitPrice: 0.0,
          account: '',
        },
      ]);
    } else {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Live Total calculation = sum of (quantity * unitPrice) for all lines
  const totalAmount = items.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
    0
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-left">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Layers className="w-5 h-5 text-[#00a36f]" />
        <h3 className="text-base font-extrabold text-slate-900">Invoice Line Items</h3>
      </div>

      {errors?.items && (
        <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          {errors.items}
        </p>
      )}

      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3">Item</th>
              <th className="py-3 px-3">Description</th>
              <th className="py-3 px-3 text-center">Qty</th>
              <th className="py-3 px-3 text-right">Unit Price</th>
              <th className="py-3 px-3">Account</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-2 text-center w-10">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((line, idx) => (
              <InvoiceLineItemRow
                key={line.id || idx}
                index={idx}
                line={line}
                onChange={handleLineChange}
                onRemove={handleRemoveLine}
                error={errors?.[`line_${idx}`]}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS LIST */}
      <div className="md:hidden space-y-3">
        {items.map((line, idx) => (
          <InvoiceLineItemRow
            key={line.id || idx}
            index={idx}
            line={line}
            onChange={handleLineChange}
            onRemove={handleRemoveLine}
            error={errors?.[`line_${idx}`]}
          />
        ))}
      </div>

      {/* ADD NEW LINE BUTTON & TOTAL SUMMARY ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleAddLine}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-300 cursor-pointer shadow-2xs self-start"
        >
          <Plus className="w-4 h-4 text-[#00a36f] stroke-[3]" />
          <span>Add a new line</span>
        </button>

        {/* Live Grand Total */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80 self-end">
          <span className="text-xs font-bold text-slate-600">Total:</span>
          <span className="text-lg font-black text-slate-900">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
