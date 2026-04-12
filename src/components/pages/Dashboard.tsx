'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable, type UnifiedOrder } from '@/components/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import {
  dbPurchaseOrders, dbSalesOrders, dbProductionOrders,
  dbPurchaseOrderItems, dbSalesOrderItems,
} from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────

interface KpiData {
  monthPurchaseWeight: number;
  monthSalesWeight: number;
  monthPayable: number;
  monthReceivable: number;
  purchaseWeightTrend: number;
  salesWeightTrend: number;
}

interface ChartDataItem {
  month: string;
  avgPrice: number;
}

// ─── Demo Data ────────────────────────────────────────────────

function generateDemoChartData() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months.map((month, i) => ({
    month,
    avgPrice: Math.round(3000 + Math.sin(i * 0.5) * 500 + Math.random() * 300),
  }));
}

function generateSalesDemoChartData() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months.map((month, i) => ({
    month,
    avgPrice: Math.round(5000 + Math.cos(i * 0.4) * 800 + Math.random() * 400),
  }));
}

// ─── Main Dashboard ───────────────────────────────────────────

export default function Dashboard() {
  const { currentUser } = useAppStore();
  const [kpi, setKpi] = useState<KpiData>({
    monthPurchaseWeight: 0, monthSalesWeight: 0,
    monthPayable: 0, monthReceivable: 0,
    purchaseWeightTrend: 0, salesWeightTrend: 0,
  });
  const [purchaseOrders, setPurchaseOrders] = useState<UnifiedOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<UnifiedOrder[]>([]);
  const [productionOrders, setProductionOrders] = useState<UnifiedOrder[]>([]);
  const [purchaseChartData, setPurchaseChartData] = useState<ChartDataItem[]>([]);
  const [salesChartData, setSalesChartData] = useState<ChartDataItem[]>([]);
  const [isPurchaseChartDemo, setIsPurchaseChartDemo] = useState(false);
  const [isSalesChartDemo, setIsSalesChartDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const initialLoadRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

      const [
        allPurchaseOrders,
        allSalesOrders,
        allProductionOrders,
        allPurchaseItems,
        allSalesItems,
      ] = await Promise.all([
        dbPurchaseOrders.getAll(),
        dbSalesOrders.getAll(),
        dbProductionOrders.getAll(),
        dbPurchaseOrderItems.getAll(),
        dbSalesOrderItems.getAll(),
      ]);

      // ─── KPI Calculations ────────────────────────────────
      const currentMonthPurchaseItems = allPurchaseItems.filter(item => {
        const order = allPurchaseOrders.find(o => o.id === item.orderId);
        return order && order.date.startsWith(currentMonth);
      });
      const monthPurchaseWeight = currentMonthPurchaseItems.reduce((sum, item) => sum + item.weight, 0);

      const lastMonthPurchaseItems = allPurchaseItems.filter(item => {
        const order = allPurchaseOrders.find(o => o.id === item.orderId);
        return order && order.date.startsWith(lastMonth);
      });
      const lastMonthPurchaseWeight = lastMonthPurchaseItems.reduce((sum, item) => sum + item.weight, 0);
      const purchaseWeightTrend = lastMonthPurchaseWeight > 0
        ? ((monthPurchaseWeight - lastMonthPurchaseWeight) / lastMonthPurchaseWeight) * 100
        : 0;

      const currentMonthSalesItems = allSalesItems.filter(item => {
        const order = allSalesOrders.find(o => o.id === item.orderId);
        return order && order.date.startsWith(currentMonth);
      });
      const monthSalesWeight = currentMonthSalesItems.reduce((sum, item) => sum + item.weight, 0);

      const lastMonthSalesItems = allSalesItems.filter(item => {
        const order = allSalesOrders.find(o => o.id === item.orderId);
        return order && order.date.startsWith(lastMonth);
      });
      const lastMonthSalesWeight = lastMonthSalesItems.reduce((sum, item) => sum + item.weight, 0);
      const salesWeightTrend = lastMonthSalesWeight > 0
        ? ((monthSalesWeight - lastMonthSalesWeight) / lastMonthSalesWeight) * 100
        : 0;

      const monthPayable = allPurchaseOrders
        .filter(o => o.date.startsWith(currentMonth))
        .reduce((sum, o) => sum + o.unpaidAmount, 0);

      const monthReceivable = allSalesOrders
        .filter(o => o.date.startsWith(currentMonth))
        .reduce((sum, o) => sum + o.uncollectedAmount, 0);

      setKpi({
        monthPurchaseWeight,
        monthSalesWeight,
        monthPayable,
        monthReceivable,
        purchaseWeightTrend,
        salesWeightTrend,
      });

      // ─── Unified Orders ──────────────────────────────────
      const purchaseUnified: UnifiedOrder[] = allPurchaseOrders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        date: o.date,
        type: 'purchase' as const,
        party: o.supplierName,
        amount: o.totalAmount,
        status: o.paymentStatus,
        createdAt: o.createdAt,
      })).sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        return dateCmp !== 0 ? dateCmp : b.orderNo.localeCompare(a.orderNo);
      });

      const salesUnified: UnifiedOrder[] = allSalesOrders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        date: o.date,
        type: 'sales' as const,
        party: o.customerName,
        amount: o.totalAmount,
        status: o.paymentStatus,
        createdAt: o.createdAt,
      })).sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        return dateCmp !== 0 ? dateCmp : b.orderNo.localeCompare(a.orderNo);
      });

      const productionUnified: UnifiedOrder[] = allProductionOrders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        date: o.date,
        type: 'production' as const,
        party: o.status === 'completed' ? '已完成' : o.status === 'processing' ? '加工中' : o.status === 'cancelled' ? '已取消' : '待加工',
        amount: o.inputTotal,
        status: o.status,
        createdAt: o.createdAt,
      })).sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        return dateCmp !== 0 ? dateCmp : b.orderNo.localeCompare(a.orderNo);
      });

      setPurchaseOrders(purchaseUnified);
      setSalesOrders(salesUnified);
      setProductionOrders(productionUnified);

      // ─── Chart Data ──────────────────────────────────────
      const purchasePriceByMonth = new Map<string, { totalPrice: number; totalWeight: number }>();
      allPurchaseItems.forEach(item => {
        if (item.weight > 0) {
          const order = allPurchaseOrders.find(o => o.id === item.orderId);
          if (order) {
            const monthKey = order.date.substring(0, 7);
            const existing = purchasePriceByMonth.get(monthKey) || { totalPrice: 0, totalWeight: 0 };
            existing.totalPrice += item.amount;
            existing.totalWeight += item.weight;
            purchasePriceByMonth.set(monthKey, existing);
          }
        }
      });

      if (purchasePriceByMonth.size > 0) {
        const sortedMonths = Array.from(purchasePriceByMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b));
        const chartData = sortedMonths.map(([month, { totalPrice, totalWeight }]) => ({
          month: `${parseInt(month.split('-')[1])}月`,
          avgPrice: totalWeight > 0 ? Math.round(totalPrice / totalWeight) : 0,
        }));
        setPurchaseChartData(chartData);
        setIsPurchaseChartDemo(false);
      } else {
        setPurchaseChartData(generateDemoChartData());
        setIsPurchaseChartDemo(true);
      }

      const salesPriceByMonth = new Map<string, { totalPrice: number; totalWeight: number }>();
      allSalesItems.forEach(item => {
        if (item.weight > 0) {
          const order = allSalesOrders.find(o => o.id === item.orderId);
          if (order) {
            const monthKey = order.date.substring(0, 7);
            const existing = salesPriceByMonth.get(monthKey) || { totalPrice: 0, totalWeight: 0 };
            existing.totalPrice += item.amount;
            existing.totalWeight += item.weight;
            salesPriceByMonth.set(monthKey, existing);
          }
        }
      });

      if (salesPriceByMonth.size > 0) {
        const sortedMonths = Array.from(salesPriceByMonth.entries())
          .sort(([a], [b]) => a.localeCompare(b));
        const chartData = sortedMonths.map(([month, { totalPrice, totalWeight }]) => ({
          month: `${parseInt(month.split('-')[1])}月`,
          avgPrice: totalWeight > 0 ? Math.round(totalPrice / totalWeight) : 0,
        }));
        setSalesChartData(chartData);
        setIsSalesChartDemo(false);
      } else {
        setSalesChartData(generateSalesDemoChartData());
        setIsSalesChartDemo(true);
      }
    } finally {
      if (initialLoadRef.current) {
        setLoading(false);
        initialLoadRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* KPI skeleton */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <div className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </Card>
              ))}
            </div>
            {/* Charts skeleton */}
            <div className="px-4 lg:px-6 flex flex-col gap-4">
              <Card><div className="p-6"><Skeleton className="h-[250px] w-full" /></div></Card>
              <Card><div className="p-6"><Skeleton className="h-[250px] w-full" /></div></Card>
            </div>
            {/* Table skeleton */}
            <div className="px-4 lg:px-6">
              <Card>
                <div className="p-6">
                  <Skeleton className="h-4 w-48 mb-4" />
                  <Skeleton className="h-[300px] w-full" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards kpi={kpi} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive
              purchaseChartData={purchaseChartData}
              salesChartData={salesChartData}
              isPurchaseChartDemo={isPurchaseChartDemo}
              isSalesChartDemo={isSalesChartDemo}
            />
          </div>
          <DataTable
            purchaseOrders={purchaseOrders}
            salesOrders={salesOrders}
            productionOrders={productionOrders}
          />
        </div>
      </div>
    </div>
  );
}
