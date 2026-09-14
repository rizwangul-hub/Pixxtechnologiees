import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  fetchMortgagesAPI,
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
    name: 'Property Portfolio Report',
    description: 'View property occupancy, property breakdown, rent, payments, and expenses.',
    icon: Building2,
    color: 'indigo',
  },
  {
    id: 'unit-report',
    name: 'Individual Property Report',
    description: 'View individual property status, rent history, active tenant, and financial records.',
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
  const [searchParams] = useSearchParams();

  // Selection state
  const [selectedReportType, setSelectedReportType] = useState(() => searchParams.get('type') || null);
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
  const [selectedTenantId, setSelectedTenantId] = useState(() => searchParams.get('tenantId') || '');
  const [selectedLandlordId, setSelectedLandlordId] = useState(() => searchParams.get('landlordId') || 'All');
  const [selectedAgentId, setSelectedAgentId] = useState(() => searchParams.get('agentId') || '');
  const [selectedPropertyId, setSelectedPropertyId] = useState(() => searchParams.get('propertyId') || 'All');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  const defaultFrom = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
    .toISOString()
    .split('T')[0];
  const defaultTo = new Date().toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  // Sync with searchParams if navigated from other pages (e.g. Landlord Detail)
  useEffect(() => {
    const qType = searchParams.get('type');
    const qLandlord = searchParams.get('landlordId');
    const qProperty = searchParams.get('propertyId');
    if (qType) setSelectedReportType(qType);
    if (qLandlord) setSelectedLandlordId(qLandlord);
    if (qProperty) setSelectedPropertyId(qProperty);
  }, [searchParams]);

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

        const qTenant = searchParams.get('tenantId');
        const qLandlord = searchParams.get('landlordId');
        const qProperty = searchParams.get('propertyId');
        const qAgent = searchParams.get('agentId');

        if (qTenant) {
          setSelectedTenantId(qTenant);
        } else if (activeTenants.length > 0) {
          setSelectedTenantId((activeTenants[0]._id || activeTenants[0].id)?.toString());
        }

        if (qLandlord) {
          setSelectedLandlordId(qLandlord);
        } else if (searchParams.get('type') === 'mortgage-report') {
          setSelectedLandlordId('All');
        } else if (activeLandlords.length > 0) {
          setSelectedLandlordId((activeLandlords[0]._id || activeLandlords[0].id)?.toString());
        }

        if (qAgent) {
          setSelectedAgentId(qAgent);
        } else if (activeAgents.length > 0) {
          setSelectedAgentId((activeAgents[0]._id || activeAgents[0].id)?.toString());
        }

        if (qProperty) {
          setSelectedPropertyId(qProperty);
        } else {
          setSelectedPropertyId('All');
        }

        if (combinedUnits.length > 0) {
          setSelectedUnitId((combinedUnits[0]._id || combinedUnits[0].id)?.toString());
        }
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

  // Auto-generate mortgage report when arriving with type=mortgage-report and specific landlord
  useEffect(() => {
    const qType = searchParams.get('type');
    const qLandlord = searchParams.get('landlordId');
    if (qType === 'mortgage-report' && qLandlord && landlords.length > 0 && !reportData && !loading) {
      handleGenerateReport(null, { reportType: 'mortgage-report', landlordId: qLandlord });
    }
  }, [searchParams, landlords.length]);

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

  // Dynamically filter properties for selected landlord in Mortgage Report
  const mortgageAvailableProperties = useMemo(() => {
    if (!selectedLandlordId || selectedLandlordId === 'All') {
      return properties;
    }
    const targetLId = selectedLandlordId.toString();
    const filtered = properties.filter((p) => {
      const pLId = (p.landlordId?._id || p.landlordId?.id || p.landlordId || p.landlord)?.toString();
      return pLId === targetLId;
    });
    return filtered.length > 0 ? filtered : properties;
  }, [properties, selectedLandlordId]);

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
        type: property.assetType || property.propertyType || property.type || 'Residential',
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

  const buildLocalMortgageReport = async (landlordId, propertyId, fromDateStr, toDateStr) => {
    let list = [];
    try {
      list = await fetchMortgagesAPI({
        landlordId: landlordId && landlordId !== 'All' ? landlordId : '',
        propertyId: propertyId && propertyId !== 'All' ? propertyId : '',
      });
    } catch (e) {
      console.warn('[Local Mortgage Report Fallback]', e.message);
    }
    if (!Array.isArray(list)) list = [];

    // If landlord selected, filter
    if (landlordId && landlordId !== 'All') {
      const targetLId = landlordId.toString();
      list = list.filter((m) => {
        const mLId = (m.landlordId?._id || m.landlordId?.id || m.landlordId || m.landlord)?.toString();
        return mLId === targetLId;
      });
    }

    if (propertyId && propertyId !== 'All') {
      const targetPId = propertyId.toString();
      list = list.filter((m) => {
        const mPId = (m.propertyId?._id || m.propertyId?.id || m.propertyId)?.toString();
        const hasSub = (m.properties || []).some(
          (p) => (p.propertyId?._id || p.propertyId?.id || p.propertyId)?.toString() === targetPId
        );
        return mPId === targetPId || hasSub;
      });
    }

    const targetLandlord = (landlords || []).find(
      (l) => (l._id || l.id)?.toString() === landlordId?.toString()
    );
    const landlordName = targetLandlord
      ? targetLandlord.fullName
      : landlordId && landlordId !== 'All'
      ? 'Selected Landlord'
      : 'All Landlords Portfolio';

    let totalOriginalLoan = 0;
    let totalOutstanding = 0;
    let totalMonthlyPayments = 0;

    const rows = list.map((m) => {
      const loan = Number(m.originalLoanAmount) || 0;
      const outstanding = Number(m.currentOutstandingBalance) || 0;
      const monthly = Number(m.monthlyPayment) || 0;
      totalOriginalLoan += loan;
      totalOutstanding += outstanding;
      if (m.status === 'Active') totalMonthlyPayments += monthly;

      const securedProps = (m.properties || [])
        .filter((p) => p.status !== 'Released')
        .map((p) => p.propertyId?.name || p.propertyId?.propertyName || 'Property');
      const propDisplay = m.propertyId?.name || m.propertyId?.propertyName || securedProps.join(', ') || 'Unassigned Property';

      return {
        mortgageId: m._id || m.id,
        mortgageReference: m.mortgageReference || m.mortgageAccountNumber || '-',
        mortgageType: m.mortgageType || 'Individual Property',
        propertyName: propDisplay,
        securedPropertiesCount: securedProps.length || 1,
        securedProperties: securedProps,
        landlordName: m.landlordId?.fullName || landlordName,
        lenderName: m.lenderName || 'Bank / Lender',
        mortgageAccountNumber: m.mortgageAccountNumber || m.mortgageReference || '-',
        originalLoanAmount: loan,
        originalLoanAmountFormatted: formatCurrency(loan),
        totalPaid: Math.max(0, loan - outstanding),
        totalPaidFormatted: formatCurrency(Math.max(0, loan - outstanding)),
        currentOutstandingBalance: outstanding,
        currentOutstandingBalanceFormatted: formatCurrency(outstanding),
        monthlyPayment: monthly,
        monthlyPaymentFormatted: formatCurrency(monthly),
        interestRate: m.interestRate || 0,
        startDate: m.startDate ? String(m.startDate).slice(0, 10) : '-',
        nextPaymentDate: m.nextPaymentDate ? String(m.nextPaymentDate).slice(0, 10) : '-',
        status: m.status || 'Active',
      };
    });

    return {
      reportType: `Mortgage & Financing Report — ${landlordName}`,
      reportDate: new Date().toISOString().split('T')[0],
      landlord: targetLandlord
        ? {
            id: targetLandlord._id || targetLandlord.id,
            name: targetLandlord.fullName,
            region: targetLandlord.region || 'United Kingdom',
            email: targetLandlord.email,
            phone: targetLandlord.phone,
          }
        : null,
      rows,
      summary: {
        totalOriginalLoan,
        totalOriginalLoanFormatted: formatCurrency(totalOriginalLoan),
        totalOutstanding,
        totalOutstandingFormatted: formatCurrency(totalOutstanding),
        totalMonthlyPayments,
        totalMonthlyPaymentsFormatted: formatCurrency(totalMonthlyPayments),
      },
    };
  };

  const handleGenerateReport = async (e, overrides = {}) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setLoading(true);
    setReportData(null);

    const repType = overrides.reportType || selectedReportType;
    const lId = overrides.landlordId !== undefined ? overrides.landlordId : selectedLandlordId;
    const pId = overrides.propertyId !== undefined ? overrides.propertyId : selectedPropertyId;
    const tId = overrides.tenantId !== undefined ? overrides.tenantId : selectedTenantId;
    const aId = overrides.agentId !== undefined ? overrides.agentId : selectedAgentId;
    const uId = overrides.unitId !== undefined ? overrides.unitId : selectedUnitId;
    const fDate = overrides.fromDate || dateFrom;
    const tDate = overrides.toDate || dateTo;

    if (overrides.reportType && overrides.reportType !== selectedReportType) {
      setSelectedReportType(overrides.reportType);
    }
    if (overrides.landlordId && overrides.landlordId !== selectedLandlordId) {
      setSelectedLandlordId(overrides.landlordId);
    }

    try {
      let data = null;
      switch (repType) {
        case 'tenant-statement':
          if (!tId) throw new Error('Please select a tenant');
          data = await fetchTenantStatementAPI(tId, {
            fromDate: fDate,
            toDate: tDate,
            propertyId: pId !== 'All' ? pId : '',
          });
          break;

        case 'landlord-report':
          if (!lId) throw new Error('Please select a landlord');
          data = await fetchLandlordReportAPI(lId, {
            fromDate: fDate,
            toDate: tDate,
          });
          break;

        case 'agent-report':
          if (!aId) throw new Error('Please select an agent');
          data = await fetchAgentReportAPI(aId, {
            fromDate: fDate,
            toDate: tDate,
          });
          break;

        case 'property-report':
          if (!pId) throw new Error('Please select a property');
          try {
            data = await fetchPropertyReportAPI(pId, {
              fromDate: fDate,
              toDate: tDate,
            });
          } catch (apiErr) {
            console.warn('[API Warning] Fetch property report fallback to local:', apiErr.message);
          }
          if (!data) {
            data = buildLocalPropertyReport(pId, fDate, tDate);
          }
          break;

        case 'unit-report':
          if (!uId) throw new Error('Please select a unit');
          try {
            data = await fetchUnitReportAPI(uId, {
              fromDate: fDate,
              toDate: tDate,
            });
          } catch (apiErr) {
            console.warn('[API Warning] Fetch unit report fallback to local:', apiErr.message);
          }
          if (!data) {
            data = buildLocalUnitReport(uId, fDate, tDate);
          }
          break;

        case 'payment-report':
        case 'income-report':
        case 'invoice-report':
          data = await fetchPaymentReportAPI({
            fromDate: fDate,
            toDate: tDate,
            tenantId: tId !== 'All' ? tId : '',
            propertyId: pId !== 'All' ? pId : '',
          });
          break;

        case 'expense-report':
          data = await fetchExpenseReportAPI({
            fromDate: fDate,
            toDate: tDate,
            propertyId: pId !== 'All' ? pId : '',
          });
          break;

        case 'financial-summary':
          data = await fetchFinancialSummaryReportAPI({
            fromDate: fDate,
            toDate: tDate,
          });
          break;

        case 'mortgage-report':
          try {
            data = await fetchMortgageReportAPI({
              fromDate: fDate,
              toDate: tDate,
              propertyId: pId !== 'All' ? pId : '',
              landlordId: lId !== 'All' ? lId : '',
            });
          } catch (mErr) {
            console.warn('[API Warning] Mortgage report fallback:', mErr.message);
          }
          if (!data || !data.rows) {
            data = await buildLocalMortgageReport(lId, pId, fDate, tDate);
          }
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
      case 'mortgage-report': {
        const targetLName = (selectedLandlordId && selectedLandlordId !== 'All'
          ? landlords.find((l) => (l._id || l.id)?.toString() === selectedLandlordId?.toString())?.fullName || 'Landlord'
          : 'Portfolio').replace(/[^a-zA-Z0-9]/g, '_');
        return {
          url: `/reports/mortgages/${format}?${query}&propertyId=${selectedPropertyId !== 'All' ? selectedPropertyId : ''}&landlordId=${selectedLandlordId !== 'All' ? selectedLandlordId : ''}`,
          filename: `Mortgage_Report_${targetLName}.${formatExt}`,
        };
      }
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

              {/* DEDICATED LANDLORD MORTGAGE REPORT GENERATOR SECTION */}
              {selectedReportType === 'mortgage-report' && (
                <div className="space-y-4 bg-gradient-to-br from-teal-50/70 via-emerald-50/40 to-slate-50 p-4 sm:p-5 rounded-2xl border border-teal-200/80">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-[#04A26F] text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Landlord Mortgage & Financing Statement
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Generate comprehensive mortgage liabilities for a specific landlord or the entire portfolio. Shows original facilities, current outstanding debt, monthly outflows, and secured properties.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Landlord Selection */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#04A26F]" />
                          <span>Select Landlord</span>
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">Individual or All</span>
                      </label>
                      <select
                        value={selectedLandlordId}
                        onChange={(e) => {
                          setSelectedLandlordId(e.target.value);
                          setSelectedPropertyId('All');
                        }}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none shadow-2xs cursor-pointer"
                      >
                        <option value="All">🏢 All Landlords (Full Portfolio Mortgages)</option>
                        {landlords.map((l) => (
                          <option key={l._id || l.id} value={l._id || l.id}>
                            👤 {l.fullName} {l.region ? `(${l.region})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Property Selection */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#04A26F]" />
                          <span>Select Property</span>
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">Asset scope</span>
                      </label>
                      <select
                        value={selectedPropertyId}
                        onChange={(e) => setSelectedPropertyId(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#04A26F] focus:border-transparent outline-none shadow-2xs cursor-pointer"
                      >
                        <option value="All">
                          {selectedLandlordId && selectedLandlordId !== 'All'
                            ? `All Properties of ${landlords.find((l) => (l._id || l.id)?.toString() === selectedLandlordId?.toString())?.fullName || 'Landlord'}`
                            : 'All Properties Across Portfolio'}
                        </option>
                        {mortgageAvailableProperties.map((p) => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            🏠 {p.title || p.name || p.propertyName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Feature highlights pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-teal-200/60">
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
                      ✓ Facility Loans
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      ✓ Total Remaining Outstanding
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      ✓ Monthly Outflow (£/mo)
                    </span>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-md">
                      ✓ Group & Individual Mortgages
                    </span>
                  </div>
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

              {/* Property / Unit Selection */}
              {selectedReportType === 'unit-report' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Property (Rentable Asset) *
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

              {/* Quick Period Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date Range & Active Period
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom('2020-01-01');
                        setDateTo(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                    >
                      All Time
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom(`${new Date().getFullYear()}-01-01`);
                        setDateTo(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                    >
                      This Year ({new Date().getFullYear()})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() - 1);
                        setDateFrom(d.toISOString().split('T')[0]);
                        setDateTo(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                    >
                      Last 12 Mo
                    </button>
                  </div>
                </div>

                {/* Date Range Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#04A26F] outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#04A26F] outline-none bg-white"
                      required
                    />
                  </div>
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
                    if (info) {
                      downloadFileAPI(info.url, info.filename, {
                        method: 'POST',
                        body: { reportData },
                      }).catch((err) => alert(err.message));
                    }
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
                    if (info) {
                      downloadFileAPI(info.url, info.filename, {
                        method: 'POST',
                        body: { reportData },
                      }).catch((err) => alert(err.message));
                    }
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
                    if (info) {
                      downloadFileAPI(info.url, info.filename, {
                        method: 'POST',
                        body: { reportData },
                      }).catch((err) => alert(err.message));
                    }
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

                  {/* Dedicated Landlord Mortgage Statement Header & KPI Cards */}
                  {selectedReportType === 'mortgage-report' && (
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 rounded-2xl text-white shadow-lg space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-teal-500/20 border border-teal-500/30 rounded-xl text-teal-400 shrink-0">
                            <Landmark className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 block">
                              Mortgage & Financing Portfolio Report
                            </span>
                            <h2 className="text-xl font-black text-white mt-0.5">
                              {reportData.landlord?.name ||
                                (selectedLandlordId && selectedLandlordId !== 'All'
                                  ? landlords.find((l) => (l._id || l.id)?.toString() === selectedLandlordId?.toString())?.fullName || 'Landlord'
                                  : 'All Landlords Portfolio Mortgages')}
                            </h2>
                            <p className="text-xs text-slate-300 mt-0.5">
                              Active Bank Liabilities, Facilities & Debt Position
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col sm:items-end">
                          <span className="px-3 py-1 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black rounded-full inline-block">
                            {reportData.rows?.length || 0} Registered {reportData.rows?.length === 1 ? 'Facility' : 'Facilities'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono mt-1">
                            Generated: {reportData.reportDate || new Date().toISOString().split('T')[0]}
                          </span>
                        </div>
                      </div>

                      {/* 4 Premium Mortgage KPI Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                        <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Facility Loans
                          </span>
                          <span className="text-lg font-black text-blue-400 mt-1 block">
                            {reportData.summary?.totalOriginalLoanFormatted ||
                              formatCurrency(reportData.summary?.totalOriginalLoan || 0)}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Original borrowed capital</span>
                        </div>

                        <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-xl">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                            Remaining Outstanding Debt
                          </span>
                          <span className="text-lg font-black text-amber-400 mt-1 block">
                            {reportData.summary?.totalOutstandingFormatted ||
                              formatCurrency(reportData.summary?.totalOutstanding || 0)}
                          </span>
                          <span className="text-[10px] text-amber-300/70 block mt-0.5">Current unpaid bank debt</span>
                        </div>

                        <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Settled to Date
                          </span>
                          <span className="text-lg font-black text-emerald-400 mt-1 block">
                            {reportData.summary?.totalPaidFormatted ||
                              formatCurrency(reportData.rows?.reduce((s, r) => s + (r.totalPaid || 0), 0) || 0)}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Principal + interest cleared</span>
                        </div>

                        <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Monthly Outflow
                          </span>
                          <span className="text-lg font-black text-purple-300 mt-1 block">
                            {reportData.summary?.totalMonthlyPaymentsFormatted ||
                              formatCurrency(reportData.summary?.totalMonthlyPayments || 0)}
                            <span className="text-xs font-normal text-slate-400">/mo</span>
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Combined monthly payments</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Cards for other reports */}
                  {selectedReportType !== 'mortgage-report' && reportData.summary && (
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
                    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold">
                            <th className="p-2.5">Facility Ref</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Secured Asset(s)</th>
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
                          {reportData.rows.map((row, idx) => {
                            const isCol = (row.mortgageType === 'Collective / Group') || (row.securedPropertiesCount > 1);
                            return (
                              <tr key={row.mortgageId || idx} className="hover:bg-slate-50 font-semibold">
                                <td className="p-2.5 font-mono font-bold text-slate-800">{row.mortgageReference || '-'}</td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isCol ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'}`}>
                                    {isCol ? 'Collective' : 'Individual'}
                                  </span>
                                </td>
                                <td className="p-2.5 font-extrabold text-slate-900">
                                  <div>
                                    <span>{row.propertyName}</span>
                                    {row.securedProperties && row.securedProperties.length > 0 && isCol && (
                                      <p className="text-[10px] text-slate-500 font-normal truncate max-w-xs">
                                        {Array.isArray(row.securedProperties) ? row.securedProperties.join(', ') : row.securedProperties}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2.5 text-slate-600">{row.landlordName}</td>
                                <td className="p-2.5 text-slate-800">{row.lenderName}</td>
                                <td className="p-2.5 font-mono">{row.originalLoanAmountFormatted}</td>
                                <td className="p-2.5 font-mono text-emerald-700">{row.totalPaidFormatted}</td>
                                <td className="p-2.5 font-mono font-black text-amber-900 bg-amber-50/60">{row.currentOutstandingBalanceFormatted}</td>
                                <td className="p-2.5 font-mono">{row.monthlyPaymentFormatted}</td>
                                <td className="p-2.5">{row.interestRate ? `${row.interestRate}%` : '0%'}</td>
                                <td className="p-2.5 text-slate-600">{row.nextPaymentDate}</td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Portfolio Totals Row */}
                          <tr className="bg-slate-100 border-t-2 border-slate-300 font-extrabold text-slate-900 text-xs">
                            <td className="p-2.5" colSpan="5">PORTFOLIO TOTALS</td>
                            <td className="p-2.5 font-mono text-slate-900">
                              {reportData.summary?.totalOriginalLoanFormatted || formatCurrency(reportData.summary?.totalOriginalLoan || 0)}
                            </td>
                            <td className="p-2.5 font-mono text-emerald-700">
                              {reportData.summary?.totalPaidFormatted || formatCurrency(reportData.rows?.reduce((s, r) => s + (r.totalPaid || 0), 0) || 0)}
                            </td>
                            <td className="p-2.5 font-mono font-black text-amber-900 bg-amber-100/60">
                              {reportData.summary?.totalOutstandingFormatted || formatCurrency(reportData.summary?.totalOutstanding || 0)}
                            </td>
                            <td className="p-2.5 font-mono text-slate-900">
                              {reportData.summary?.totalMonthlyPaymentsFormatted || formatCurrency(reportData.summary?.totalMonthlyPayments || 0)}
                            </td>
                            <td className="p-2.5" colSpan="3"></td>
                          </tr>
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
