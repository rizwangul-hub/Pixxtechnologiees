import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { OccupancyChart } from '../components/dashboard/OccupancyChart';
import { IncomeChart } from '../components/dashboard/IncomeChart';
import { ActualVsTargetChart } from '../components/dashboard/ActualVsTargetChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { PaymentSection } from '../components/dashboard/PaymentSection';
import { dashboardPaymentsData } from '../data/dashboardPaymentsData';
import { Building2, Layers, CheckCircle, Home, Users, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const summaryMetrics = [
    {
      title: 'Total Properties',
      value: '12',
      subtext: 'Across UK portfolios',
      icon: Building2,
    },
    {
      title: 'Total Units',
      value: '168',
      subtext: 'Flats, shops & houses',
      icon: Layers,
    },
    {
      title: 'Occupied Units',
      value: '124',
      subtext: '74% current occupancy',
      icon: CheckCircle,
      highlight: true,
    },
    {
      title: 'Available Units',
      value: '44',
      subtext: '26% available to let',
      icon: Home,
    },
    {
      title: 'Total Tenants',
      value: '118',
      subtext: 'Active AST agreements',
      icon: Users,
    },
    {
      title: 'Outstanding Arrears',
      value: '£24,850',
      subtext: 'Requires collection',
      icon: AlertCircle,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* 1. DASHBOARD HEADER & PORTFOLIO BANNER */}
        <DashboardHeader />

        {/* 2. SUMMARY METRIC CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {summaryMetrics.map((metric, idx) => (
            <SummaryCard key={idx} {...metric} />
          ))}
        </div>

        {/* 3. DASHBOARD ANALYTICS CHARTS (3 COLUMNS ON DESKTOP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <OccupancyChart />
          <IncomeChart />
          <ActualVsTargetChart />
        </div>

        {/* 4. RECENT ACTIVITY TIMELINE */}
        <RecentActivity />

        {/* 5. OVERDUE PAYMENTS SECTION */}
        <PaymentSection
          type="overdue"
          rentCharges={dashboardPaymentsData.overdue.rentCharges}
          propertyExpenses={dashboardPaymentsData.overdue.propertyExpenses}
          defaultExpanded={true}
        />

        {/* 6. UPCOMING PAYMENTS SECTION */}
        <PaymentSection
          type="upcoming"
          rentCharges={dashboardPaymentsData.upcoming.rentCharges}
          propertyExpenses={dashboardPaymentsData.upcoming.propertyExpenses}
          defaultExpanded={true}
        />
      </div>
    </AppLayout>
  );
}
