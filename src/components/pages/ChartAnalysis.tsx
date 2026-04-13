'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { dbPurchaseOrders, dbSalesOrders, dbPurchaseOrderItems, dbSalesOrderItems } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { format as dateFnsFormat, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from 'date-fns';
import type { PurchaseOrder, SalesOrder, PurchaseOrderItem, SalesOrderItem } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ChartAnalysis() {
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseOrderItem[]>([]);
  const [salesItems, setSalesItems] = useState<SalesOrderItem[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const [po, so, pi, si] = await Promise.all([
        dbPurchaseOrders.getAll(), dbSalesOrders.getAll(),
        dbPurchaseOrderItems.getAll(), dbSalesOrderItems.getAll(),
      ]);
      setPurchaseOrders(po);
      setSalesOrders(so);
      setPurchaseItems(pi);
      setSalesItems(si);
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

  const setQuickRange = (type: 'week' | 'month' | 'year') => {
    const now = new Date();
    if (type === 'week') {
      setDateFrom(startOfWeek(now, { weekStartsOn: 1 }));
      setDateTo(endOfWeek(now, { weekStartsOn: 1 }));
    } else if (type === 'month') {
      setDateFrom(startOfMonth(now));
      setDateTo(endOfMonth(now));
    } else {
      setDateFrom(startOfYear(now));
      setDateTo(endOfYear(now));
    }
  };

  const clearRange = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const dateFromStr = dateFrom ? dateFnsFormat(dateFrom, 'yyyy-MM-dd') : '';
  const dateToStr = dateTo ? dateFnsFormat(dateTo, 'yyyy-MM-dd') : '';

  // ============ PURCHASE CHARTS ============
  const poFiltered = purchaseOrders.filter(o => (!dateFromStr || o.date >= dateFromStr) && (!dateToStr || o.date <= dateToStr));

  // 1. 进货规格占比
  const poSpecMap: Record<string, number> = {};
  poFiltered.forEach(o => {
    const items = purchaseItems.filter(i => i.orderId === o.id);
    items.forEach(item => {
      const spec = item.spec || item.productName;
      poSpecMap[spec] = (poSpecMap[spec] || 0) + item.weight;
    });
  });
  const poSpecData = Object.entries(poSpecMap).map(([name, weight]) => ({ name, weight })).sort((a, b) => b.weight - a.weight);

  // 2. 进货供应商占比
  const poSupplierMap: Record<string, number> = {};
  poFiltered.forEach(o => {
    poSupplierMap[o.supplierName || '未知'] = (poSupplierMap[o.supplierName || '未知'] || 0) + o.totalAmount;
  });
  const poSupplierPieData = Object.entries(poSupplierMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // 3. 不同供应商供应不同产品量
  const poSupplierProductMap: Record<string, Record<string, number>> = {};
  const poProductNames = new Set<string>();
  poFiltered.forEach(o => {
    const items = purchaseItems.filter(i => i.orderId === o.id);
    items.forEach(item => {
      if (!poSupplierProductMap[o.supplierName || '未知']) poSupplierProductMap[o.supplierName || '未知'] = {};
      poSupplierProductMap[o.supplierName || '未知'][item.productName] = (poSupplierProductMap[o.supplierName || '未知'][item.productName] || 0) + item.weight;
      poProductNames.add(item.productName);
    });
  });
  const poSupplierProductData = Object.entries(poSupplierProductMap).map(([supplier, products]) => ({ supplier, ...products }));
  const poProductNamesArr = Array.from(poProductNames);

  // 4. 进货均价
  const poPriceMap: Record<string, { totalAmount: number; totalWeight: number }> = {};
  poFiltered.forEach(o => {
    const items = purchaseItems.filter(i => i.orderId === o.id);
    items.forEach(item => {
      if (!poPriceMap[item.productName]) poPriceMap[item.productName] = { totalAmount: 0, totalWeight: 0 };
      poPriceMap[item.productName].totalAmount += item.amount;
      poPriceMap[item.productName].totalWeight += item.weight;
    });
  });
  const poAvgPriceData = Object.entries(poPriceMap).map(([name, data]) => ({
    name,
    avgPrice: data.totalWeight > 0 ? Math.round((data.totalAmount / data.totalWeight) * 100) / 100 : 0,
  })).sort((a, b) => b.avgPrice - a.avgPrice);

  // ============ SALES CHARTS ============
  const soFiltered = salesOrders.filter(o => (!dateFromStr || o.date >= dateFromStr) && (!dateToStr || o.date <= dateToStr));

  // 1. 不同客户出货规格分布
  const soCustomerSpecMap: Record<string, Record<string, number>> = {};
  const soSpecNames = new Set<string>();
  soFiltered.forEach(o => {
    const items = salesItems.filter(i => i.orderId === o.id);
    items.forEach(item => {
      if (!soCustomerSpecMap[o.customerName || '未知']) soCustomerSpecMap[o.customerName || '未知'] = {};
      soCustomerSpecMap[o.customerName || '未知'][item.productName] = (soCustomerSpecMap[o.customerName || '未知'][item.productName] || 0) + item.weight;
      soSpecNames.add(item.productName);
    });
  });
  const soCustomerSpecData = Object.entries(soCustomerSpecMap).map(([customer, specs]) => ({ customer, ...specs }));
  const soSpecNamesArr = Array.from(soSpecNames);

  // 2. 货品出货金额排行
  const soAmountMap: Record<string, number> = {};
  soFiltered.forEach(o => {
    const items = salesItems.filter(i => i.orderId === o.id);
    items.forEach(item => {
      soAmountMap[item.productName] = (soAmountMap[item.productName] || 0) + item.amount;
    });
  });
  const soAmountRankData = Object.entries(soAmountMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);

  // 3. 货品出货重量排行
  const soWeightMap: Record<string, number> = {};
  soFiltered.forEach(o => {
    const items = salesItems.filter(i => i.orderId === o.id);
    items.forEach(item => {
      soWeightMap[item.productName] = (soWeightMap[item.productName] || 0) + item.weight;
    });
  });
  const soWeightRankData = Object.entries(soWeightMap).map(([name, weight]) => ({ name, weight })).sort((a, b) => b.weight - a.weight);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">图表分析</h2><p className="text-sm text-muted-foreground">通过图表分析采购和出货业务数据</p></div>

      <div className="rounded-lg border border-gray-200 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onSelect={({ from: f, to: t }) => { setDateFrom(f); setDateTo(t); }}
            placeholder="日期筛选"
          />
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setQuickRange('week')} className="h-8 px-3 text-xs">本周</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('month')} className="h-8 px-3 text-xs">本月</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('year')} className="h-8 px-3 text-xs">本年</Button>
          </div>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearRange} className="h-8 px-2">
              <X className="h-3.5 w-3.5 mr-1" />清除
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="purchase">
        <TabsList className="bg-gray-100"><TabsTrigger value="purchase">进货图表</TabsTrigger><TabsTrigger value="sales">出货图表</TabsTrigger></TabsList>

        <TabsContent value="purchase" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">进货规格占比</CardTitle></CardHeader>
              <CardContent>
                {poSpecData.length === 0 ? <EmptyState title="暂无数据" /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={poSpecData} cx="50%" cy="50%" outerRadius={90} dataKey="weight" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                        {poSpecData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}KG`} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">进货供应商占比</CardTitle></CardHeader>
              <CardContent>
                {poSupplierPieData.length === 0 ? <EmptyState title="暂无数据" /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={poSupplierPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                        {poSupplierPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">不同供应商供应不同产品量</CardTitle></CardHeader>
            <CardContent>
              {poSupplierProductData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <ResponsiveContainer width="100%" height={Math.max(280, poSupplierProductData.length * 45)}>
                  <BarChart data={poSupplierProductData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="supplier" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tickFormatter={v => `${v}KG`} tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Legend />
                    {poProductNamesArr.map((name, i) => (
                      <Bar key={name} dataKey={name} fill={BAR_COLORS[i % BAR_COLORS.length]} stackId="a" radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">进货均价 (元/KG)</CardTitle></CardHeader>
            <CardContent>
              {poAvgPriceData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <ResponsiveContainer width="100%" height={Math.max(200, poAvgPriceData.length * 35)}>
                  <BarChart data={poAvgPriceData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={v => `¥${v}`} tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip formatter={(v: number) => `¥${v}/KG`} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="avgPrice" fill="#3b82f6" name="均价" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4 mt-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">不同客户出货规格分布</CardTitle></CardHeader>
            <CardContent>
              {soCustomerSpecData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <ResponsiveContainer width="100%" height={Math.max(280, soCustomerSpecData.length * 45)}>
                  <BarChart data={soCustomerSpecData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="customer" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tickFormatter={v => `${v}KG`} tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    <Legend />
                    {soSpecNamesArr.map((name, i) => (
                      <Bar key={name} dataKey={name} fill={BAR_COLORS[i % BAR_COLORS.length]} stackId="a" />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">货品出货金额排行</CardTitle></CardHeader>
              <CardContent>
                {soAmountRankData.length === 0 ? <EmptyState title="暂无数据" /> : (
                  <ResponsiveContainer width="100%" height={Math.max(200, soAmountRankData.length * 35)}>
                    <BarChart data={soAmountRankData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="amount" fill="#10b981" name="出货金额" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">货品出货重量排行</CardTitle></CardHeader>
              <CardContent>
                {soWeightRankData.length === 0 ? <EmptyState title="暂无数据" /> : (
                  <ResponsiveContainer width="100%" height={Math.max(200, soWeightRankData.length * 35)}>
                    <BarChart data={soWeightRankData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tickFormatter={v => `${v}KG`} tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}KG`} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="weight" fill="#f59e0b" name="出货重量" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
