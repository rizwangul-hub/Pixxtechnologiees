import React, { useState } from 'react';
import { PaymentSectionHeader } from './PaymentSectionHeader';
import { PaymentSubsection } from './PaymentSubsection';
import { PaymentDetailModal } from './PaymentDetailModal';
import {
  calculateOverdueTotals,
  calculateUpcomingTotals,
} from '../../data/dashboardPaymentsData';

/**
 * PaymentSection Component
 * Primary section container for Overdue Payments or Upcoming Payments.
 */
export function PaymentSection({
  type = 'overdue',
  rentCharges = [],
  propertyExpenses = [],
  defaultExpanded = true,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedItem, setSelectedItem] = useState(null);

  const isOverdue = type === 'overdue';

  // Calculate dynamic totals
  const totals = isOverdue
    ? calculateOverdueTotals(rentCharges, propertyExpenses)
    : calculateUpcomingTotals(rentCharges, propertyExpenses);

  const title = isOverdue ? 'Overdue Payments' : 'Upcoming Payments';
  const subtitle = isOverdue ? 'more than 0 days' : 'in the next 30 days';

  return (
    <section className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-left transition-all duration-200">
      {/* SECTION HEADER */}
      <PaymentSectionHeader
        title={title}
        subtitle={subtitle}
        count={totals.count}
        totalAmount={totals.grandTotal}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        type={type}
      />

      {/* EXPANDABLE BODY CONTENT */}
      {isExpanded && (
        <div className="space-y-6 pt-2 border-t border-slate-100 animate-fade-in">
          {/* SUBSECTION 1: RENTS AND CHARGES */}
          <PaymentSubsection
            title="Rents and Charges"
            totalAmount={totals.rentChargesGrandTotal}
            items={rentCharges}
            type={type}
            isExpense={false}
            viewAllRoute={isOverdue ? '/payments/overdue' : '/payments/upcoming'}
            onClickRow={(item) => setSelectedItem(item)}
          />

          {/* SUBSECTION 2: PROPERTY EXPENSES */}
          <PaymentSubsection
            title="Property Expenses"
            totalAmount={totals.expensesTotal}
            items={propertyExpenses}
            type={type}
            isExpense={true}
            viewAllRoute={isOverdue ? '/expenses/overdue' : '/expenses/upcoming'}
            onClickRow={(item) => setSelectedItem(item)}
          />
        </div>
      )}

      {/* INTERACTIVE PAYMENT DETAIL MODAL */}
      {selectedItem && (
        <PaymentDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </section>
  );
}
