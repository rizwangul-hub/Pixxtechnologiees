import React from 'react';
import { Trash2 } from 'lucide-react';
import { incomeItemTypes, incomeAccountTypes } from '../../data/incomeData';
import { formatCurrency } from '../../utils/currencyFormatter';

/**
 * InvoiceLineItemRow Component
 * Renders an individual line item inputs row for desktop & card layout for mobile.
 */
export function InvoiceLineItemRow({ index, line, onChange, onRemove, error }) {
  const lineAmount = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);

  return (
    <>
      {/* DESKTOP ROW */}
      <tr className="hidden md:table-row hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 align-top">
        {/* Item */}
        <td className="py-3 px-3">
          <select
            value={line.item || ''}
            onChange={(e) => onChange(index, 'item', e.target.value)}
            className={`w-full h-9 px-2.5 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none cursor-pointer ${
              error?.item ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
            }`}
          >
            <option value="">- Select -</option>
            {incomeItemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </td>

        {/* Description */}
        <td className="py-3 px-3">
          <textarea
            rows={1}
            value={line.description || ''}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            placeholder="Description..."
            className="w-full min-h-[36px] py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none resize-y"
          />
        </td>

        {/* Qty */}
        <td className="py-3 px-3 w-24">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={line.quantity ?? 1.0}
            onChange={(e) => onChange(index, 'quantity', e.target.value)}
            className={`w-full h-9 px-2 text-xs font-bold text-center bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none ${
              error?.quantity ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
            }`}
          />
        </td>

        {/* Unit Price */}
        <td className="py-3 px-3 w-28">
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-xs font-bold text-slate-400">£</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={line.unitPrice ?? 0.0}
              onChange={(e) => onChange(index, 'unitPrice', e.target.value)}
              className={`w-full h-9 pl-6 pr-2 text-xs font-bold text-right bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none ${
                error?.unitPrice ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
              }`}
            />
          </div>
        </td>

        {/* Account */}
        <td className="py-3 px-3">
          <select
            value={line.account || ''}
            onChange={(e) => onChange(index, 'account', e.target.value)}
            className={`w-full h-9 px-2.5 text-xs bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:border-[#00a36f] outline-none cursor-pointer ${
              error?.account ? 'border-red-500 bg-red-50/50' : 'border-slate-200'
            }`}
          >
            <option value="">- Select -</option>
            {incomeAccountTypes.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>
        </td>

        {/* Amount (Live Calculated) */}
        <td className="py-3 px-3 text-right font-black text-xs text-slate-900 align-middle w-28 whitespace-nowrap">
          {formatCurrency(lineAmount)}
        </td>

        {/* Remove Line */}
        <td className="py-3 px-2 text-center align-middle w-10">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Remove line item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-left relative">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute right-3 top-3 p-1 text-slate-400 hover:text-red-600 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Item</label>
          <select
            value={line.item || ''}
            onChange={(e) => onChange(index, 'item', e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
          >
            <option value="">- Select Item -</option>
            {incomeItemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
          <input
            type="text"
            value={line.description || ''}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            placeholder="Description..."
            className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
            <input
              type="number"
              step="0.01"
              value={line.quantity ?? 1.0}
              onChange={(e) => onChange(index, 'quantity', e.target.value)}
              className="w-full h-9 px-2 text-xs font-bold text-center bg-white border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Price (£)</label>
            <input
              type="number"
              step="0.01"
              value={line.unitPrice ?? 0.0}
              onChange={(e) => onChange(index, 'unitPrice', e.target.value)}
              className="w-full h-9 px-2 text-xs font-bold text-right bg-white border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-600">Line Amount:</span>
          <span className="text-sm font-black text-[#00a36f]">{formatCurrency(lineAmount)}</span>
        </div>
      </div>
    </>
  );
}
