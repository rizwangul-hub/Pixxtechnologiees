import React, { useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign, CheckCircle2 } from 'lucide-react';
import { InvoiceInformation } from '../components/income/InvoiceInformation';
import { InvoicePropertySelector } from '../components/income/InvoicePropertySelector';
import { DocumentUploader } from '../components/income/DocumentUploader';
import { InvoiceLineItems } from '../components/income/InvoiceLineItems';
import { getNextInvoiceNumber, saveInvoice } from '../data/incomeData';

export function AddIncomePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errors, setErrors] = useState({});

  // Document attachment state
  const [attachment, setAttachment] = useState(null);

  // Default Today date format YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const dueDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Main Form Data State
  const [formData, setFormData] = useState({
    contact: '',
    date: todayStr,
    dueDate: dueDateStr,
    endDate: '',
    invoiceNumber: getNextInvoiceNumber(),
    property: '',
    isPaid: false,
    paymentInstructions: '',
  });

  // Default 1 line item
  const [lineItems, setLineItems] = useState([
    {
      id: `line-${Date.now()}`,
      item: 'Other Income',
      description: '',
      quantity: 1.0,
      unitPrice: 0.0,
      account: 'Other Income',
    },
  ]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.contact) {
      newErrors.contact = 'Contact is required.';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required.';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required.';
    }
    if (!formData.invoiceNumber || !formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required.';
    }
    if (!formData.property) {
      newErrors.property = 'Please select a property.';
    }

    if (!lineItems || lineItems.length === 0) {
      newErrors.items = 'Invoice must contain at least one line item.';
    } else {
      lineItems.forEach((line, idx) => {
        if (!line.item) {
          newErrors[`line_${idx}`] = { ...(newErrors[`line_${idx}`] || {}), item: true };
          newErrors.items = 'Please select an item type for all lines.';
        }
        if (!line.account) {
          newErrors[`line_${idx}`] = { ...(newErrors[`line_${idx}`] || {}), account: true };
          newErrors.items = 'Please select an account for all lines.';
        }
        if (Number(line.quantity) <= 0) {
          newErrors[`line_${idx}`] = { ...(newErrors[`line_${idx}`] || {}), quantity: true };
          newErrors.items = 'Quantity must be greater than 0.';
        }
        if (Number(line.unitPrice) < 0) {
          newErrors[`line_${idx}`] = { ...(newErrors[`line_${idx}`] || {}), unitPrice: true };
          newErrors.items = 'Unit price cannot be negative.';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const totalAmount = lineItems.reduce(
      (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
      0
    );

    setTimeout(() => {
      const invoiceRecord = {
        id: `inv-${Date.now()}`,
        portfolioId: 'port-1',
        contact: formData.contact,
        property: formData.property,
        invoiceNumber: formData.invoiceNumber,
        date: formData.date,
        dueDate: formData.dueDate,
        endDate: formData.endDate,
        items: lineItems,
        total: totalAmount,
        currency: 'GBP',
        isPaid: formData.isPaid,
        status: formData.isPaid ? 'Paid' : 'Awaiting Payment',
        paymentInstructions: formData.paymentInstructions,
        attachment: attachment,
        createdAt: new Date().toISOString(),
      };

      saveInvoice(invoiceRecord);
      setIsSubmitting(false);
      setShowSuccessToast(true);

      setTimeout(() => {
        navigate('/income');
      }, 800);
    }, 600);
  };

  return (
    <AppLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12 text-left">
        {/* SUCCESS TOAST NOTIFICATION */}
        {showSuccessToast && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="text-xs sm:text-sm font-extrabold">
              Income invoice saved successfully.
            </span>
          </div>
        )}

        {/* BREADCRUMBS HEADER */}
        <div className="flex items-center gap-3">
          <Link
            to="/income"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#00a36f] shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Income</span>
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-xs font-bold text-slate-900">Add Invoice (Other Income)</span>
        </div>

        {/* PAGE TITLE BANNER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-[#00a36f] shrink-0">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Add Invoice (Other Income)
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Record a new non-rental income invoice for your property portfolio.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: INVOICE INFORMATION */}
        <InvoiceInformation
          formData={formData}
          setFormData={setFormData}
          errors={errors}
        />

        {/* SECTION 2: PROPERTY */}
        <InvoicePropertySelector
          formData={formData}
          setFormData={setFormData}
          errors={errors}
        />

        {/* SECTION 3: ATTACHED DOCUMENT */}
        <DocumentUploader
          attachment={attachment}
          setAttachment={setAttachment}
        />

        {/* SECTION 4: INVOICE LINE ITEMS */}
        <InvoiceLineItems
          items={lineItems}
          setItems={setLineItems}
          errors={errors}
        />

        {/* SECTION 5: PAYMENT STATUS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-left">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="thisInvoiceIsPaid"
              checked={Boolean(formData.isPaid)}
              onChange={(e) => setFormData((prev) => ({ ...prev, isPaid: e.target.checked }))}
              className="w-4 h-4 rounded-md border-slate-300 text-[#00a36f] focus:ring-[#00a36f] cursor-pointer"
            />
            <label
              htmlFor="thisInvoiceIsPaid"
              className="text-xs font-bold text-slate-800 cursor-pointer select-none"
            >
              This invoice is paid
            </label>
          </div>
        </div>

        {/* SECTION 6: PAYMENT INSTRUCTIONS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-left">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Payment Instructions
          </h3>
          <textarea
            rows={4}
            value={formData.paymentInstructions}
            onChange={(e) => setFormData((prev) => ({ ...prev, paymentInstructions: e.target.value }))}
            placeholder="Enter payment instructions, bank details, or remittance advice for customer..."
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00a36f] outline-none transition-all resize-y"
          />
        </div>

        {/* BOTTOM FORM ACTIONS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-end gap-3">
          <Link
            to="/income"
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#00a36f] hover:bg-[#008f61] active:bg-[#007a53] disabled:opacity-50 transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a36f]"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
