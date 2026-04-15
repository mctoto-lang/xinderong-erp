'use client';

import { useAppStore } from '@/lib/store';
import LoginPage from '@/components/pages/LoginPage';
import WelcomePage from '@/components/pages/WelcomePage';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import Dashboard from '@/components/pages/Dashboard';
import PurchaseManagement from '@/components/pages/PurchaseManagement';
import SalesManagement from '@/components/pages/SalesManagement';
import ProductionManagement from '@/components/pages/ProductionManagement';
import InventoryManagement from '@/components/pages/InventoryManagement';
import FinanceManagement from '@/components/pages/FinanceManagement';
import CustomerManagement from '@/components/pages/CustomerManagement';
import SupplierManagement from '@/components/pages/SupplierManagement';
import LogisticsManagement from '@/components/pages/LogisticsManagement';
import ChartAnalysis from '@/components/pages/ChartAnalysis';
import SystemManagement from '@/components/pages/SystemManagement';
import { Toaster } from '@/components/ui/sonner';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const pages: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  purchase: PurchaseManagement,
  sales: SalesManagement,
  production: ProductionManagement,
  inventory: InventoryManagement,
  finance: FinanceManagement,
  customer: CustomerManagement,
  supplier: SupplierManagement,
  logistics: LogisticsManagement,
  charts: ChartAnalysis,
  system: SystemManagement,
};

export default function Home() {
  const { isAuthenticated, activeModule, showWelcome, setShowWelcome } = useAppStore();

  if (showWelcome) {
    return <WelcomePage onEnterBackend={() => setShowWelcome(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const PageComponent = pages[activeModule] || Dashboard;

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto">
          <PageComponent />
        </main>
      </SidebarInset>
      <Toaster position="top-right" />
    </SidebarProvider>
  );
}
