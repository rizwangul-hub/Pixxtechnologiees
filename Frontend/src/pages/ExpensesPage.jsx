import React, { useState, useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Link } from 'react-router-dom';
import { ChevronRight, FileSpreadsheet, Plus } from 'lucide-react';
import { ExpenseFilters } from '../components/expenses/ExpenseFilters';
import { ExpenseActionBar } from '../components/expenses/ExpenseActionBar';
import { ExpenseStatusTabs } from '../components/expenses/ExpenseStatusTabs';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { BulkActionsBar } from '../components/expenses/BulkActionsBar';
import { ExpensePagination } from '../components/expenses/ExpensePagination';
import { demoExpenses, filterExpenses } from '../data/expensesData';

export function ExpensesPage() {
  const [expenses, setExpenses] = useState(demoExpenses);
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // Date sorting: 'asc' or 'desc'
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    supplier: 'All',
    property: 'All',
    dateFrom: '',
    dateTo: '',
    dueDateFrom: '',
    dueDateTo: '',
    paidAmountFrom: '',
    paidAmountTo: '',
    dueAmountFrom: '',
    dueAmountTo: '',
  });

  // Calculate filtered expense records
  const filteredData = useMemo(() => {
    return filterExpenses(expenses, filters, activeTab, sortOrder);
  }, [expenses, filters, activeTab, sortOrder]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: expenses.length,
      awaiting_payment: expenses.filter((e) => e.status === 'awaiting_payment' || e.amountDue > 0).length,
      fully_paid: expenses.filter((e) => e.status === 'fully_paid' || (e.amountPaid > 0 && e.amountDue === 0)).length,
      repeating: expenses.filter((e) => e.isRepeating || e.status === 'repeating').length,
    };
  }, [expenses]);

  // Pagination calculation
  const totalRecords = filteredData.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const currentRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Handlers
  const handleClearFilters = () => {
    setFilters({
      search: '',
      supplier: 'All',
      property: 'All',
      dateFrom: '',
      dateTo: '',
      dueDateFrom: '',
      dueDateTo: '',
      paidAmountFrom: '',
      paidAmountTo: '',
      dueAmountFrom: '',
      dueAmountTo: '',
    });
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
  };

  const handleSelectTab = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleToggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === currentRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentRecords.map((item) => item.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (actionType) => {
    if (actionType === 'delete') {
      setExpenses((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
    } else if (actionType === 'mark_paid') {
      setExpenses((prev) =>
        prev.map((item) =>
          selectedIds.includes(item.id)
            ? { ...item, status: 'fully_paid', amountPaid: item.amountPaid + item.amountDue, amountDue: 0 }
            : item
        )
      );
      setSelectedIds([]);
    } else if (actionType === 'mark_awaiting') {
      setExpenses((prev) =>
        prev.map((item) =>
          selectedIds.includes(item.id) ? { ...item, status: 'awaiting_payment' } : item
        )
      );
      setSelectedIds([]);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-12 text-left">
        {/* 1. PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Expenses
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage supplier invoices, recurring expenses, and property maintenance charges.
            </p>
          </div>
        </div>

        {/* 2. FILTER AREA */}
        <ExpenseFilters
          filters={filters}
          setFilters={setFilters}
          onSearch={handleSearchSubmit}
          onClear={handleClearFilters}
        />

        {/* 3. TOP ACTION BAR */}
        <ExpenseActionBar />

        {/* 4. EXPENSE STATUS TABS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <ExpenseStatusTabs
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            counts={tabCounts}
          />

          {/* BULK ACTIONS BAR (IF RECORDS SELECTED) */}
          <BulkActionsBar
            selectedCount={selectedIds.length}
            onAction={handleBulkAction}
          />

          {/* EXPENSE TABLE */}
          {filteredData.length > 0 ? (
            <>
              <ExpenseTable
                expenses={currentRecords}
                selectedIds={selectedIds}
                onToggleSelectAll={handleToggleSelectAll}
                onToggleSelect={handleToggleSelect}
                sortOrder={sortOrder}
                onToggleSort={handleToggleSort}
              />

              {/* PAGINATION */}
              <ExpensePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRecords={totalRecords}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
          ) : (
            /* EMPTY STATE */
            <div className="py-12 px-4 text-center space-y-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-800">No expenses found</p>
                <p className="text-xs font-medium text-slate-500">
                  Try changing your filters or add a new expense.
                </p>
              </div>
              <Link
                to="/expenses/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#00a36f] hover:bg-[#008f61] transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </Link>
            </div>
          )}

          {/* SECOND ACTION ROW BELOW TABLE */}
          <div className="pt-4 border-t border-slate-100">
            <ExpenseActionBar />
          </div>
        </div>

        {/* 5. SUMMARY LINK AT BOTTOM */}
        <div className="pt-2">
          <Link
            to="/expenses/summary"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#00a36f] hover:underline"
          >
            <span>View summary of payments</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
