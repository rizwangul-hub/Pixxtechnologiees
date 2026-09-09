import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import {
  FileText,
  UserCheck,
  Briefcase,
  Building2,
  Layers,
  DollarSign,
  Receipt,
  Wallet,
  PieChart,
  Download,
  Printer,
  ArrowLeft,
  Search,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  X,
  Filter,
  Landmark,
} from 'lucide-react';
import { formatCurrency } from '../utils/currencyFormatter';
import { downloadFileAPI } from '../services/api';
import { getSavedProperties, getSavedUnits } from '../data/propertiesData';
import { getSavedCustomers, getSavedPaymentSchedules } from '../data/customersData';
import { getSavedLandlords } from '../data/landlordsData';
import {
  fetchCustomersFromAPI,
  fetchLandlordsFromAPI,
  fetchAgentsAPI,
  fetchPropertiesFromAPI,
  fetchUnitsFromAPI,
  fetchTenantStatementAPI,
  fetchLandlordReportAPI,
  fetchAgentReportAPI,
  fetchPropertyReportAPI,
  fetchUnitReportAPI,
  fetchPaymentReportAPI,
  fetchExpenseReportAPI,
  fetchFinancialSummaryReportAPI,
  fetchMortgageReportAPI,
} from '../services/apiData';

const REPORT_TYPES = [
  {
    id: 'tenant-statement',
    name: 'Tenant Statement',
    description: 'View complete rent, charges, and payment history statement for a tenant with running balance.',
    icon: FileText,
    badge: 'Most Important',
    color: 'emerald',
  },
  {
    id: 'landlord-report',
    name: 'Landlord Report',
    description: 'View financial summary, property portfolio, and net earnings for a landlord.',
    icon: UserCheck,
    color: 'blue',
  },
  {
    id: 'agent-report',
    name: 'Agent Report',
    description: 'View agent collections, repair expenses, net amounts, and monthly settlements.',
    icon: Briefcase,
    color: 'purple',
  },
  {
    id: 'property-report',
    name: 'Property Report',
    description: 'View property occupancy, unit breakdown, rent, payments, and expenses.',
    icon: Building2,
    color: 'indigo',
  },
  {
    id: 'unit-report',
    name: 'Unit Report',
    description: 'View unit status, rent history, active tenant, and financial records.',
    icon: Layers,
    color: 'cyan',
  },
  {
    id: 'payment-report',
    name: 'Payment Report',
    description: 'Filter and view all rent and tenant payment transactions.',
    icon: DollarSign,
    color: 'emerald',
  },
  {
    id: 'expense-report',
    name: 'Expense Report',
    description: 'Track property expenses vs. agent repair expenses.',
    icon: Receipt,
    color: 'amber',
  },
  {
    id: 'income-report',
    name: 'Income Report',
    description: 'Analyze expected, received, and outstanding rental income.',
    icon: Wallet,
    color: 'emerald',
  },
  {
    id: 'invoice-report',
    name: 'Invoice Report',
    description: 'Track issued rent invoices and payment statuses.',
    icon: FileText,
    color: 'slate',
  },
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Overall financial performance, expected rent, expenses, and net position.',
    icon: PieChart,
    color: 'rose',
  },
  {
    id: 'mortgage-report',
    name: 'Mortgage & Financing Report',
    description: 'Analyze property mortgage loans, outstanding bank balances, interest rates, and monthly commitments.',
    icon: Landmark,
    color: 'teal',
  },
];

export function ReportsPage() {
  // Selection state
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropdown Options
  const [tenants, setTenants] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [agents, setAgents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);

  // Generator Form Parameters
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedLandlordId, setSelectedLandlordId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  const defaultFrom = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
    .toISOString()
    .split('T')[0];
  const defaultTo = new Date().toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  // Load initial dropdown data
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        let [tList, lList, aList, pList, uList] = await Promise.all([
          fetchCustomersFromAPI(),
          fetchLandlordsFromAPI(),
          fetchAgentsAPI(),
          fetchPropertiesFromAPI(),
          fetchUnitsFromAPI(),
        ]);

        const localProps = getSavedProperties();
        const localUnits = getSavedUnits();
        const localCusts = getSavedCustomers();
        const localLandlords = getSavedLandlords();

        let combinedProps = Array.isArray(pList) && pList.length > 0 ? [...pList] : [];
        localProps.forEach((lp) => {
          const lpId = (lp._id || lp.id)?.toString();
          if (!combinedProps.some((p) => (p._id || p.id)?.toString() === lpId)) {
            combinedProps.push(lp);
          }
        });

        let combinedUnits = Array.isArray(uList) && uList.length > 0 ? [...uList] : [];
        localUnits.forEach((lu) => {
          const luId = (lu._id || lu.id)?.toString();
          if (!combinedUnits.some((u) => (u._id || u.id)?.toString() === luId)) {
            combinedUnits.push(lu);
          }
        });

        const activeTenants = ((tList && tList.length > 0) ? tList : localCusts).filter(
          (c) => !c.isArchived && c.status !== 'Archived'
        );
        const activeLandlords = ((lList && lList.length > 0) ? lList : localLandlords).filter(
          (l) => !l.isArchived && l.status !== 'Archived'
        );
        const activeAgents = (aList || []).filter((a) => !a.isArchived && a.status !== 'Archived');

        setTenants(activeTenants);
        setLandlords(activeLandlords);
        setAgents(activeAgents);
        setProperties(combinedProps);
        setUnits(combinedUnits);

        if (activeTenants.length > 0) setSelectedTenantId((activeTenants[0]._id || activeTenants[0].id)?.toString());
        if (activeLandlords.length > 0) setSelectedLandlordId((activeLandlords[0]._id || activeLandlords[0].id)?.toString());
        if (activeAgents.length > 0) setSelectedAgentId((activeAgents[0]._id || activeAgents[0].id)?.toString());
        if (combinedProps.length > 0) setSelectedPropertyId('All');
        if (combinedUnits.length > 0) setSelectedUnitId((combinedUnits[0]._id || combinedUnits[0].id)?.toString());
      } catch (e) {
        console.warn('[Report Dropdowns Load Warning]', e.message);
        const localProps = getSavedProperties();
        const localUnits = getSavedUnits();
        setProperties(localProps);
        setUnits(localUnits);
        if (localUnits.length > 0) setSelectedUnitId((localUnits[0].id || localUnits[0]._id)?.toString());
      }
    };
    loadDropdowns();
  }, []);

  // Filter units when property changes
  const availableUnits = useMemo(() => {
    if (!selectedPropertyId || selectedPropertyId === 'All') {
      return units;
    }
    const targetPropId = selectedPropertyId.toString();
    return units.filter((u) => {
      const uPropId = u.propertyId?._id
        ? u.propertyId._id.toString()
        : u.propertyId
        ? u.propertyId.toString()
        : u.property?.id || u.property?._id || '';
      return uPropId === targetPropId;
    });
  }, [units, selectedPropertyId]);

  // Auto select first unit when availableUnits changes
  useEffect(() => {
    if (selectedReportType === 'unit-report') {
      if (availableUnits.length > 0) {
        const matching = availableUnits.find((u) => (u._id || u.id)?.toString() === selectedUnitId?.toString());
        if (!matching) {
          setSelectedUnitId((availableUnits[0]._id || availableUnits[0].id)?.toString() || '');
        }
      } else {
        setSelectedUnitId('');
      }
    }
  }, [selectedPropertyId, availableUnits, selectedReportType]);

  const buildLocalUnitReport = (unitId, fromDateStr, toDateStr) => {
    const localUnits = getSavedUnits();
    const localProps = getSavedProperties();
    const localCusts = getSavedCustomers();
    const localSchedules = getSavedPaymentSchedules();

    const targetUnitIdStr = unitId ? unitId.toString() : '';
    const unit = (units.length > 0 ? units : localUnits).find((u) => (u.id || u._id)?.toString() === targetUnitIdStr) || localUnits[0];

    if (!unit) {
      throw new Error('Unit record not found');
    }

    const uPropId = unit.propertyId?._id ? unit.propertyId._id.toString() : unit.propertyId ? unit.propertyId.toString() : '';
    const property = (properties.length > 0 ? properties : localProps).find((p) => (p.id || p._id)?.toString() === uPropId);
    const tenant = unit.customerName ? localCusts.find((c) => (c.name || c.fullName) === unit.customerName) : null;

    const unitPayments = localSchedules.filter((s) => {
      const sUnitId = (s.unitId || s.unit)?._id ? (s.unitId || s.unit)._id.toString() : (s.unitId || s.unit) ? (s.unitId || s.unit).toString() : '';
      return sUnitId === targetUnitIdStr;
    });

    const totalRent = unitPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || Number(unit.price) || 0;
    const totalPaid = unitPayments.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0) || (unit.status === 'Occupied' ? Number(unit.price) || 0 : 0);

    return {
      reportType: 'Unit Report',
      reportDate: new Date().toISOString().split('T')[0],
      unit: {
        id: unit.id || unit._id,
        name: unit.name || unit.unitName,
        type: unit.type || 'Unit',
        status: unit.status || 'Available',
        floor: unit.floor || 'N/A',
        size: unit.size || 'N/A',
        price: unit.price || unit.monthlyRent || 0,
      },
      property: {
        name: property?.name || property?.propertyName || property?.title || 'Property',
        address: property?.address || 'N/A',
        landlordName: property?.landlordName || 'Landlord',
      },
      tenant: tenant
        ? {
            name: tenant.name || tenant.fullName,
            phone: tenant.phone || 'N/A',
            email: tenant.email || 'N/A',
          }
        : unit.customerName
        ? { name: unit.customerName, phone: 'N/A', email: 'N/A' }
        : null,
      agent: null,
      summary: {
        totalRent,
        totalPaid,
        outstanding: totalRent - totalPaid,
      },
      payments: unitPayments,
    };
  };

  const buildLocalPropertyReport = (propertyId, fromDateStr, toDateStr) => {
    const localProps = getSavedProperties();
    const localUnits = getSavedUnits();
    const localCusts = getSavedCustomers();
    const localSchedules = getSavedPaymentSchedules();

    const isAll = !propertyId || propertyId === 'All' || propertyId === 'all';
    const targetPropIdStr = propertyId ? propertyId.toString().trim().toLowerCase() : '';

    const allPropsPool = properties.length > 0 ? properties : localProps;
    let property = isAll
      ? { _id: 'all_props', name: 'All Properties Portfolio', title: 'All Properties Portfolio', landlordName: 'Portfolio Manager' }
      : allPropsPool.find((p) => {
          const pId = (p.id || p._id)?.toString().trim().toLowerCase();
          const pName = (p.title || p.name || p.propertyName)?.toString().trim().toLowerCase();
          return pId === targetPropIdStr || pName === targetPropIdStr;
        }) || {
          _id: propertyId,
          name: propertyId || 'Selected Property',
          title: propertyId || 'Selected Property',
          landlordName: 'Property Manager',
        };

    const targetPropIds = [
      property._id,
      property._id?.toString(),
      property.id,
      property.name,
      property.title,
      property.propertyName,
      propertyId,
    ]
      .filter(Boolean)
      .map((v) => v.toString().trim().toLowerCase());

    const isMatchProp = (uProp) => {
      if (isAll) return true;
      if (!uProp) return false;
      const uPropStr = (uProp._id || uProp.id || uProp?.name || uProp?.title || uProp).toString().trim().toLowerCase();
      return targetPropIds.includes(uPropStr);
    };

    const allUnitsPool = units.length > 0 ? units : localUnits;
    const propUnits = isAll
      ? allUnitsPool
      : allUnitsPool.filter((u) => isMatchProp(u.propertyId) || isMatchProp(u.property));

    const propSchedules = isAll
      ? localSchedules
      : localSchedules.filter((s) => isMatchProp(s.propertyId) || isMatchProp(s.property));

    const totalRent = propSchedules.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalPaid = propSchedules.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);

    const occupiedCount = propUnits.filter((u) => u.status === 'Occupied' || u.customerId || u.customerName).length;
    const availableCount = Math.max(0, propUnits.length - occupiedCount);

    const unitMatrixRows = propUnits.map((u, idx) => {
      const rent = Number(u.price || u.monthlyRent) || 0;
      const mFee = rent > 0 ? -50 : 0;
      const netRentReceivable = rent + mFee;
      return {
        no: idx + 1,
        propertyId: property._id,
        unitId: u._id || u.id,
        propertyName: property.title || property.name,
        unitName: u.name || u.unitName,
        propertyAddress: `${property.address || property.title || property.name || 'Property'}, ${u.name || ''}`,
        rent,
        mFee,
        dueDate: '1st',
        netRentReceivable,
        collections: [
          { monthLabel: 'Month 1', date: '-', amount: u.status === 'Occupied' ? rent : 0, status: u.status === 'Occupied' ? 'Paid' : 'Unpaid' },
          { monthLabel: 'Month 2', date: '-', amount: u.status === 'Occupied' ? rent : 0, status: u.status === 'Occupied' ? 'Paid' : 'Unpaid' },
          { monthLabel: 'Month 3', date: '-', amount: u.status === 'Occupied' ? rent : 0, status: u.status === 'Occupied' ? 'Paid' : 'Unpaid' },
        ],
      };
    });

    return {
      reportType: 'Property Report',
      reportDate: new Date().toISOString().split('T')[0],
      fromDate: fromDateStr || '',
      toDate: toDateStr || '',
      property: {
        id: property._id || property.id,
        name: property.title || property.name || property.propertyName,
        address: property.address || 'N/A',
        city: property.city || 'N/A',
        type: property.type || property.propertyType || 'Residential',
        landlordName: property.landlordName || 'N/A',
        totalUnits: propUnits.length,
        occupiedUnits: occupiedCount,
        availableUnits: availableCount,
      },
      summary: {
        totalUnits: propUnits.length,
        occupiedUnits: occupiedCount,
        availableUnits: availableCount,
        totalRent,
        totalPaid,
        totalExpenses: 0,
        netIncome: totalPaid,
        outstanding: totalRent - totalPaid,
      },
      units: propUnits.map((u) => ({
        id: u._id || u.id,
        name: u.name || u.unitName,
        type: u.type || 'Unit',
        status: u.status || 'Available',
        price: u.price || u.monthlyRent || 0,
        tenantName: u.customerName || 'N/A',
      })),
      unitMatrixRows,
      payments: propSchedules,
      propertyExpenses: [],
      agentExpenses: [],
    };
  };

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    setReportData(null);

    try {
      let data = null;
      switch (selectedReportType) {
        case 'tenant-statement':
          if (!selectedTenantId) throw new Error('Please select a tenant');
          data = await fetchTenantStatementAPI(selectedTenantId, {
            fromDate: dateFrom,
            toDate: dateTo,
            propertyId: selectedPropertyId !== 'All' ? selectedPropertyId : '',
          });
          break;

        case 'landlord-report':
          if (!selectedLandlordId) throw new Error('Please select a landlord');
          data = await fetchLandlordReportAPI(selectedLandlordId, {
            fromDate: dateFrom,
            toDate: dateTo,
          });
          break;

        case 'agent-report':
          if (!selectedAgentId) throw new Error('Please select an agent');
          data = await fetchAgentReportAPI(selectedAgentId, {
            fromDate: dateFrom,
            toDate: dateTo,
          });
          break;

        case 'property-report':
          if (!selectedPropertyId) throw new Error('Please select a property');
          try {
            data = await fetchPropertyReportAPI(selectedPropertyId, {
              fromDate: dateFrom,
              toDate: dateTo,
            });
          } catch (apiErr) {
            console.warn('[API Warning] Fetch property report fallback to local:', apiErr.message);
          }
          if (!data) {
            data = buildLocalPropertyReport(selectedPropertyId, dateFrom, dateTo);
          }
          break;

        case 'unit-report':
          if (!selectedUnitId) throw new Error('Please select a unit');
          try {
            data = await fetchUnitReportAPI(selectedUnitId, {
              fromDate: dateFrom,
              toDate: dateTo,
            });
          } catch (apiErr) {
            console.warn('[API Warning] Fetch unit report fallback to local:', apiErr.message);
          }
          if (!data) {
            data = buildLocalUnitReport(selectedUnitId, dateFrom, dateTo);
          }
          break;

        case 'payment-report':
        case 'income-report':
        case 'invoice-report':
          data = await fetchPaymentReportAPI({
            fromDate: dateFrom,
            toDate: dateTo,
            tenantId: selectedTenantId !== 'All' ? selectedTenantId : '',
            propertyId: selectedPropertyId !== 'All' ? selectedPropertyId : '',
          });
          break;

        case 'expense-report':
          data = await fetchExpenseReportAPI({
            fromDate: dateFrom,
            toDate: dateTo,
            propertyId: selectedPropertyId !== 'All' ? selectedPropertyId : '',
          });
          break;

        case 'financial-summary':
          data = await fetchFinancialSummaryReportAPI({
            fromDate: dateFrom,
            toDate: dateTo,
          });
          break;

        case 'mortgage-report':
          data = await fetchMortgageReportAPI({
            fromDate: dateFrom,
            toDate: dateTo,
            propertyId: selectedPropertyId !== 'All' ? selectedPropertyId : '',
            landlordId: selectedLandlordId !== 'All' ? selectedLandlordId : '',
          });
          break;

        default:
          break;
      }

      if (!data) throw new Error('Failed to generate report data.');
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Error generating report');
    }
    setLoading(false);
  };

  const getDownloadEndpoint = (reportType, format) => {
    const formatExt = format === 'word' ? 'docx' : format === 'excel' ? 'xlsx' : 'pdf';
    const query = `fromDate=${dateFrom}&toDate=${dateTo}`;

    switch (reportType) {
      case 'tenant-statement':
        return {
          url: `/reports/tenant-statement/${selectedTenantId}/${format}?${query}&propertyId=${selectedPropertyId !== 'All' ? selectedPropertyId : ''}`,
          filename: `Tenant_Statement.${formatExt}`,
        };
      case 'landlord-report':
        return {
          url: `/reports/landlord/${selectedLandlordId}/${format}?${query}`,
          filename: `Landlord_Report.${formatExt}`,
        };
      case 'agent-report':
        return {
          url: `/reports/agent/${selectedAgentId}/${format}?${query}`,
          filename: `Agent_Report.${formatExt}`,
        };
      case 'property-report':
        return {
          url: `/reports/property/${selectedPropertyId}/${format}?${query}`,
          filename: `Property_Report.${formatExt}`,
        };
      case 'unit-report':
        return {
          url: `/reports/unit/${selectedUnitId}/${format}?${query}`,
          filename: `Unit_Report.${formatExt}`,
        };
      case 'payment-report':
        return {
          url: `/reports/payments/${format}?${query}&propertyId=${selectedPropertyId !== 'All' ? selectedPropertyId : ''}&tenantId=${selectedTenantId !== 'All' ? selectedTenantId : ''}`,
          filename: `Payment_Report.${formatExt}`,
        };
      case 'expense-report':
        return {
          url: `/reports/expenses/${format}?${query}&propertyId=${selectedPropertyId !== 'All' ? selectedPropertyId : ''}`,
          filename: `Expense_Report.${formatExt}`,
        };
      case 'income-report':
        return {
          url: `/reports/income/${format}?${query}&propertyId=${selectedPropertyId !== 'All' ? selectedPropertyId : ''}`,
          filename: `Income_Report.${formatExt}`,
        };
      case 'invoice-report':
        return {
          url: `/reports/invoices/${format}?${query}&propertyId=${selectedPropertyId !== 'All' ? selectedPropertyId : ''}&tenantId=${selectedTenantId !== 'All' ? selectedTenantId : ''}`,
          filename: `Invoice_Report.${formatExt}`,
        };
      case 'financial-summary':
        return {
          url: `/reports/financial-summary/${format}?${query}`,
          filename: `Financial_Summary.${formatExt}`,
        };
      case 'mortgage-report':
        return {
          url: `/reports/mortgages/${format}?${query}&propertyId=${selectedPropertyId !== 'All' ? selectedPropertyId : ''}`,
          filename: `Mortgage_Report.${formatExt}`,
        };
      default:
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-print-area, #report-print-area * {
            visibility: visible;
          }
          #report-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
        {/* Header */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="w-8 h-8 text-[#04A26F]" />
              Report Center
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Automatically generate, preview, print, and export professional statements & business reports.
            </p>
          </div>

          {selectedReportType && (
            <button
              onClick={() => {
                setSelectedReportType(null);
                setReportData(null);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Report Center
            </button>
          )}
        </div>

        {/* ==================================================== */}
        {/* 1. REPORT CENTER GRID VIEW (WHEN NO REPORT IS SELECTED) */}
        {/* ==================================================== */}
        {!selectedReportType && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REPORT_TYPES.map((rep) => {
              const Icon = rep.icon;
              return (
                <div
                  key={rep.id}
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold">
                        <Icon className="w-6 h-6" />
                      </div>
                      {rep.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {rep.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#04A26F] transition">
                        {rep.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {rep.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedReportType(rep.id)}
                    className="w-full py-2.5 px-4 bg-[#04A26F] hover:bg-[#038d61] text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Generate Report</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. PARAMETER GENERATOR FORM (WHEN REPORT TYPE SELECTED) */}
        {/* ==================================================== */}
        {selectedReportType && !reportData && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5 max-w-2xl mx-auto no-print">
            <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#04A26F] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Generate {REPORT_TYPES.find((r) => r.id === selectedReportType)?.name}
                </h2>
                <p className="text-xs text-gray-500">
                  Select parameters below to auto-collect records and create the report.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleGenerateReport} className="space-y-4">
              {/* Tenant Selection */}
              {(selectedReportType === 'tenant-statement' || selectedReportType === 'payment-report') && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Tenant *
                  </label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none bg-white"
                    required={selectedReportType === 'tenant-statement'}
                  >
                    {selectedReportType === 'payment-report' && <option value="All">All Tenants</option>}
                    {tenants.map((t) => (
                      <option key={t._id || t.id} value={t._id || t.id}>
                        {t.fullName || t.name} ({t.phone || t.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Landlord Selection */}
              {selectedReportType === 'landlord-report' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Landlord *
                  </label>
                  <select
                    value={selectedLandlordId}
                    onChange={(e) => setSelectedLandlordId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none bg-white"
                    required
                  >
                    {landlords.map((l) => (
                      <option key={l._id || l.id} value={l._id || l.id}>
                        {l.fullName} ({l.region || 'Landlord'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Agent Selection */}
              {selectedReportType === 'agent-report' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Agent *
                  </label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none bg-white"
                    required
                  >
                    {agents.map((a) => (
                      <option key={a._id || a.id} value={a._id || a.id}>
                        {a.fullName} ({a.region || 'Agent'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Property Selection */}
              {(selectedReportType === 'property-report' ||
                selectedReportType === 'tenant-statement' ||
                selectedReportType === 'unit-report' ||
                selectedReportType === 'expense-report') && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Property {selectedReportType === 'property-report' && '*'}
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none bg-white"
                    required={selectedReportType === 'property-report'}
                  >
                    <option value="All">All Properties Portfolio</option>
                    {properties.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.title || p.name || p.propertyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Unit Selection */}
              {selectedReportType === 'unit-report' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Unit *
                  </label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none bg-white"
                    required
                  >
                    {availableUnits.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.name} ({u.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#04A26F] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#04A26F] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedReportType(null)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#04A26F] hover:bg-[#038d61] text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Generate Report</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. INTERACTIVE REPORT PREVIEW & DOWNLOAD TOOLBAR */}
        {/* ==================================================== */}
        {selectedReportType && reportData && (
          <div className="space-y-6">
            {/* Download & Action Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4 no-print">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase">Report Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Generated
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Download PDF */}
                <button
                  type="button"
                  onClick={() => {
                    const info = getDownloadEndpoint(selectedReportType, 'pdf');
                    if (info) downloadFileAPI(info.url, info.filename).catch((err) => alert(err.message));
                  }}
                  className="inline-flex items-center px-3.5 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition shadow-sm cursor-pointer"
                  title="Download PDF Document"
                >
                  <Download className="w-4 h-4 mr-1 text-rose-600" /> Download PDF
                </button>

                {/* Download Word */}
                <button
                  type="button"
                  onClick={() => {
                    const info = getDownloadEndpoint(selectedReportType, 'word');
                    if (info) downloadFileAPI(info.url, info.filename).catch((err) => alert(err.message));
                  }}
                  className="inline-flex items-center px-3.5 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition shadow-sm cursor-pointer"
                  title="Download Word Document (.docx)"
                >
                  <Download className="w-4 h-4 mr-1 text-blue-600" /> Download Word
                </button>

                {/* Download Excel */}
                <button
                  type="button"
                  onClick={() => {
                    const info = getDownloadEndpoint(selectedReportType, 'excel');
                    if (info) downloadFileAPI(info.url, info.filename).catch((err) => alert(err.message));
                  }}
                  className="inline-flex items-center px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                  title="Download Excel Workbook (.xlsx)"
                >
                  <Download className="w-4 h-4 mr-1" /> Download Excel (.xlsx)
                </button>

                {/* Print Button */}
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4 mr-1.5" /> Print Report
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div id="report-print-area" className="bg-white p-8 rounded-xl border border-gray-200 shadow-md max-w-4xl mx-auto space-y-6 text-gray-900">
              {/* TENANT STATEMENT PREVIEW (EXACT USER SPECIFICATION MATCH) */}
              {selectedReportType === 'tenant-statement' && (
                <div className="space-y-6 font-sans">
                  {/* STATEMENT TOP HEADER */}
                  <div className="flex justify-between items-start border-b border-gray-200 pb-6">
                    <div>
                      {reportData.landlord?.logoUrl ? (
                        <img
                          src={reportData.landlord.logoUrl}
                          alt="Landlord Logo"
                          className="h-14 object-contain mb-2"
                        />
                      ) : (
                        <div className="h-12 w-36 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center font-bold text-[#04A26F] text-sm">
                          {reportData.landlord?.name || 'PixxTechnologies'}
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Statement of Account</h2>
                      <p className="text-xs font-bold text-gray-800">
                        Tenant: <span className="font-extrabold text-gray-900">{reportData.tenant.name}</span>
                      </p>
                      {reportData.tenant.address && (
                        <p className="text-xs text-gray-600">Tenant Address: {reportData.tenant.address}</p>
                      )}
                      <p className="text-xs text-gray-600">
                        Property: {reportData.property.name} - {reportData.property.address}
                      </p>
                      <p className="text-xs text-gray-600">Landlord: {reportData.landlord.name}</p>
                      <p className="text-xs font-bold text-gray-900 mt-1">Date: {reportData.statementDate}</p>
                    </div>
                  </div>

                  {/* SUMMARY SECTION */}
                  <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                    <p className="font-bold text-gray-900 text-sm mb-2">
                      Period: From <span className="underline">{reportData.fromDate}</span> to{' '}
                      <span className="underline">{reportData.toDate}</span>
                    </p>
                    <div className="flex justify-between max-w-md">
                      <span className="font-medium text-gray-700">Balance Forward at {reportData.fromDate}:</span>
                      <span className="font-bold text-gray-900">{reportData.summary.balanceForwardFormatted}</span>
                    </div>
                    <div className="flex justify-between max-w-md">
                      <span className="font-medium text-gray-700">Total Rent Due for Period:</span>
                      <span className="font-bold text-gray-900">{reportData.summary.totalRentDueFormatted}</span>
                    </div>
                    <div className="flex justify-between max-w-md pt-1 border-t border-gray-200 font-bold text-gray-900">
                      <span>Total Amount Due at {reportData.toDate}:</span>
                      <span>{reportData.summary.totalAmountDueFormatted}</span>
                    </div>
                  </div>

                  {/* STATEMENT TRANSACTIONS TABLE */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">Statement Transactions</h3>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-200 font-bold text-gray-800 uppercase tracking-wider">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Reference</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3">Payee</th>
                            <th className="py-2.5 px-3 text-right">Debit</th>
                            <th className="py-2.5 px-3 text-right">Credit</th>
                            <th className="py-2.5 px-3 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 font-mono">
                          {reportData.transactions.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-2.5 px-3 font-sans font-medium whitespace-nowrap">{row.date}</td>
                              <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{row.reference || '—'}</td>
                              <td className="py-2.5 px-3 font-sans text-gray-900">{row.description}</td>
                              <td className="py-2.5 px-3 font-sans text-gray-700">{row.payee || '—'}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-gray-900">{row.debitFormatted}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{row.creditFormatted}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-gray-900">{row.balanceFormatted}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* STATEMENT FOOTER TOTALS */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs max-w-md ml-auto text-right">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>Total Payments Received in Period:</span>
                      <span className="text-emerald-700">{reportData.summary.totalPaymentsFormatted}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total Outstanding at {reportData.toDate}:</span>
                      <span className="text-rose-600">{reportData.summary.totalOutstandingFormatted}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* OTHER REPORTS PREVIEWS */}
              {selectedReportType !== 'tenant-statement' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{reportData.reportType}</h2>
                    <p className="text-xs text-gray-500 mt-1">Generated Date: {reportData.reportDate}</p>
                  </div>

                  {/* Unit Report Overview Header Card */}
                  {selectedReportType === 'unit-report' && reportData.unit && (
                    <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 space-y-3 text-xs text-left">
                      <div className="flex justify-between items-start border-b border-emerald-100 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Unit Report Overview</span>
                          <h3 className="text-xl font-black text-slate-900 mt-0.5">{reportData.unit.name}</h3>
                          <p className="text-xs text-slate-500 font-semibold">{reportData.property?.name || 'Property'} • {reportData.unit.type} {reportData.unit.floor ? `(${reportData.unit.floor})` : ''}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-white border border-emerald-200 text-[#04A26F]">
                          {reportData.unit.status || 'Available'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-700">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Rent / Agreed Price</span>
                          <span className="text-base font-extrabold text-[#04A26F]">{formatCurrency(reportData.unit.price)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Tenant</span>
                          <span className="text-xs font-extrabold text-slate-900">{reportData.tenant?.name || 'No Active Tenant'}</span>
                          {reportData.tenant?.phone && <span className="text-[11px] text-slate-500 block">{reportData.tenant.phone}</span>}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Property Address</span>
                          <span className="text-xs font-semibold text-slate-700">{reportData.property?.address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Cards */}
                  {reportData.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(reportData.summary).map(([key, value]) => {
                        if (typeof value === 'object') return null;
                        return (
                          <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block truncate">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </span>
                            <span className="text-base font-bold text-gray-900 mt-1 block truncate">
                              {typeof value === 'number' && key.toLowerCase().includes('amount')
                                ? formatCurrency(value)
                                : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tables Preview */}
                  {reportData.properties && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100 font-bold border-b border-gray-200">
                            <th className="p-2">Property</th>
                            <th className="p-2">Units</th>
                            <th className="p-2">Occupied</th>
                            <th className="p-2">Rent Due</th>
                            <th className="p-2">Paid</th>
                            <th className="p-2">Expenses</th>
                            <th className="p-2">Net Income</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reportData.properties.map((p) => (
                            <tr key={p.propertyId}>
                              <td className="p-2 font-bold">{p.name}</td>
                              <td className="p-2">{p.totalUnits}</td>
                              <td className="p-2">{p.occupiedUnits}</td>
                              <td className="p-2">{formatCurrency(p.totalRentDue)}</td>
                              <td className="p-2 text-emerald-700 font-bold">{formatCurrency(p.totalPaid)}</td>
                              <td className="p-2 text-amber-700">{formatCurrency(p.totalExpenses)}</td>
                              <td className="p-2 font-bold">{formatCurrency(p.netIncome)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reportData.settlements && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100 font-bold border-b border-gray-200">
                            <th className="p-2">Month</th>
                            <th className="p-2">Property</th>
                            <th className="p-2">Tenant</th>
                            <th className="p-2">Expected</th>
                            <th className="p-2">Expense</th>
                            <th className="p-2">Net</th>
                            <th className="p-2">Received</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reportData.settlements.map((s) => (
                            <tr key={s.id}>
                              <td className="p-2 font-bold">{s.monthYear}</td>
                              <td className="p-2">{s.property}</td>
                              <td className="p-2">{s.tenant}</td>
                              <td className="p-2">{formatCurrency(s.expectedAmount)}</td>
                              <td className="p-2 text-amber-700">{formatCurrency(s.expenseAmount)}</td>
                              <td className="p-2 font-bold">{formatCurrency(s.netAmount)}</td>
                              <td className="p-2 text-emerald-700 font-bold">{formatCurrency(s.paidAmount)}</td>
                              <td className="p-2">{s.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reportData.payments && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100 font-bold border-b border-gray-200">
                            <th className="p-2">Date</th>
                            <th className="p-2">Tenant</th>
                            <th className="p-2">Property</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Paid</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reportData.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="p-2 font-mono">{p.dueDate}</td>
                              <td className="p-2 font-bold">{p.tenantName}</td>
                              <td className="p-2">{p.propertyName}</td>
                              <td className="p-2">{formatCurrency(p.amount)}</td>
                              <td className="p-2 text-emerald-700 font-bold">{formatCurrency(p.paidAmount)}</td>
                              <td className="p-2">{p.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reportData.rows && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold">
                            <th className="p-2.5">Property</th>
                            <th className="p-2.5">Landlord</th>
                            <th className="p-2.5">Lender</th>
                            <th className="p-2.5">Original Loan</th>
                            <th className="p-2.5">Total Paid</th>
                            <th className="p-2.5">Outstanding Balance</th>
                            <th className="p-2.5">Monthly Payment</th>
                            <th className="p-2.5">Rate (%)</th>
                            <th className="p-2.5">Next Due</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reportData.rows.map((row, idx) => (
                            <tr key={row.mortgageId || idx} className="hover:bg-slate-50 font-semibold">
                              <td className="p-2.5 font-extrabold text-slate-900">{row.propertyName}</td>
                              <td className="p-2.5 text-slate-600">{row.landlordName}</td>
                              <td className="p-2.5 text-slate-800">{row.lenderName}</td>
                              <td className="p-2.5 font-mono">{row.originalLoanAmountFormatted}</td>
                              <td className="p-2.5 font-mono text-emerald-700">{row.totalPaidFormatted}</td>
                              <td className="p-2.5 font-mono font-black text-amber-900">{row.currentOutstandingBalanceFormatted}</td>
                              <td className="p-2.5 font-mono">{row.monthlyPaymentFormatted}</td>
                              <td className="p-2.5">{row.interestRate ? `${row.interestRate}%` : '0%'}</td>
                              <td className="p-2.5 text-slate-600">{row.nextPaymentDate}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
