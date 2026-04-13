'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BarChart3, X } from 'lucide-react';
import { dbPurchaseOrders, dbSalesOrders, dbPurchaseOrderItems, dbSalesOrderItems, dbSuppliers, dbCustomers } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { format as dateFnsFormat } from 'date-fns';
import type { PurchaseOrder, SalesOrder, PurchaseOrderItem, SalesOrderItem } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#4b5563', '#1f2937'];
const BAR_COLORS = ['#000000', '#374151', '#6b7280', '#9ca3af', '#4b5563', '#1f2937', '#d1d5db', '#e5e7eb'];

export default function ChartAnalysis() {
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseOrderItem[]>([]);
  const [salesItems, setSalesItems] = useState<SalesOrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const [po, so, pi, si, sup, cust] = await Promise.all([
        dbPurchaseOrders.getAll(), dbSalesOrders.getAll(),
        dbPurchaseOrderItems.getAll(), dbSalesOrderItems.getAll(),
        dbSuppliers.getAll(), dbCustomers.getAll(),
      ]);
      setPurchaseOrders(po);
      setSalesOrders(so);
      setPurchaseItems(pi);
      setSalesItems(si);
      setSuppliers(sup.map(s => ({ id: s.id, name: s.name })));
      setCustomers(cust.map(c => ({ id: c.id, name: c.name })));
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

  const dateFromStr = dateFrom ? dateFnsFormat(dateFrom, 'yyyy-MM-dd') : '';
  const dateToStr = dateTo ? dateFnsFormat(dateTo, 'yyyy-MM-dd') : '';

  // ============ PURCHASE CHARTS ============
  const poFiltered = purchaseOrders.filter(o => (!dateFromStr || o.date >= dateFromStr) && (!dateToStr || o.date <= dateToStr));

  // 1. 进货规格占比 (by spec from purchase items)
  const poSpecMap: Record<string, number> = {};
  poFiltered.forEach(o => {
    const items = purchaseItems.filter(i => i.orderId === o.id);
    items.forEach(item => {
      const spec = item.spec || item.productName;
      poSpecMap[spec] = (poSpecMap[spec] || 0) + item.weight;
    });
  });
  const poSpecData = Object.entries(poSpecMap).map(([name, weight]) => ({ name, weight })).sort((a, b) => b.weight - a.weight);

  // 2. 进货不同供应商占比 (pie chart)
  const poSupplierMap: Record<string, number> = {};
  poFiltered.forEach(o => {
    poSupplierMap[o.supplierName || '未知'] = (poSupplierMap[o.supplierName || '未知'] || 0) + o.totalAmount;
  });
  const poSupplierPieData = Object.entries(poSupplierMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // 3. 不同供应商在不同名称产品的供应量 (grouped bar chart)
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
  const poSupplierProductData = Object.entries(poSupplierProductMap).map(([supplier, products]) => ({
    supplier,
    ...products,
  }));
  const poProductNamesArr = Array.from(poProductNames);

  // 4. 进货均价 (by product, average unit price)
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

  // 1. 对不同客户出不同规格产品 (grouped bar chart)
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
  const soCustomerSpecData = Object.entries(soCustomerSpecMap).map(([customer, specs]) => ({
    customer,
    ...specs,
  }));
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

      <Card className="border-gray-200"><CardContent className="py-3">
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onSelect={({ from: f, to: t }) => { setDateFrom(f); setDateTo(t); }}
            placeholder="日期筛选"
          />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }} className="h-8 px-2">
              <X className="h-3.5 w-3.5 mr-1" />清除
            </Button>
          )}
        </div>
      </CardContent></Card>

      <Tabs defaultValue="purchase">
        <TabsList className="bg-gray-100"><TabsTrigger value="purchase">进货图表</TabsTrigger><TabsTrigger value="sales">出货图表</TabsTrigger></TabsList>

        <TabsContent value="purchase" className="space-y-4">
          {/* Row 1: Spec pie + Supplier pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">进货规格占比</CardTitle></CardHeader><CardContent>
              {poSpecData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <PieChart width={400} height={300}>
                  <Pie data={poSpecData} cx="50%" cy="50%" outerRadius={100} dataKey="weight" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                    {poSpecData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}KG`} />
                </PieChart>
              )}
            </CardContent></Card>

            <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">进货供应商占比</CardTitle></CardHeader><CardContent>
              {poSupplierPieData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <PieChart width={400} height={300}>
                  <Pie data={poSupplierPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}>
                    {poSupplierPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                </PieChart>
              )}
            </CardContent></Card>
          </div>

          {/* Row 2: Supplier-Product grouped bar */}
          <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">不同供应商供应不同产品量</CardTitle></CardHeader><CardContent>
            {poSupplierProductData.length === 0 ? <EmptyState title="暂无数据" /> : (
              <BarChart data={poSupplierProductData} width={600} height={Math.max(300, poSupplierProductData.length * 50)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="supplier" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v}KG`} />
                <Tooltip />
                <Legend />
                {poProductNamesArr.map((name, i) => (
                  <Bar key={name} dataKey={name} fill={BAR_COLORS[i % BAR_COLORS.length]} stackId="a" />
                ))}
              </BarChart>
            )}
          </CardContent></Card>

          {/* Row 3: Average price */}
          <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">进货均价 (元/KG)</CardTitle></CardHeader><CardContent>
            {poAvgPriceData.length === 0 ? <EmptyState title="暂无数据" /> : (
              <BarChart data={poAvgPriceData} layout="vertical" height={Math.max(200, poAvgPriceData.length * 40)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => `¥${v}`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `¥${v}/KG`} />
                <Bar dataKey="avgPrice" fill="#000" name="均价" />
              </BarChart>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {/* Row 1: Customer-Spec grouped bar */}
          <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">不同客户出货规格分布</CardTitle></CardHeader><CardContent>
            {soCustomerSpecData.length === 0 ? <EmptyState title="暂无数据" /> : (
              <BarChart data={soCustomerSpecData} width={600} height={Math.max(300, soCustomerSpecData.length * 50)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="customer" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${v}KG`} />
                <Tooltip />
                <Legend />
                {soSpecNamesArr.map((name, i) => (
                  <Bar key={name} dataKey={name} fill={BAR_COLORS[i % BAR_COLORS.length]} stackId="a" />
                ))}
              </BarChart>
            )}
          </CardContent></Card>

          {/* Row 2: Amount rank + Weight rank */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">货品出货金额排行</CardTitle></CardHeader><CardContent>
              {soAmountRankData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <BarChart data={soAmountRankData} layout="vertical" height={Math.max(200, soAmountRankData.length * 40)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                  <Bar dataKey="amount" fill="#000" name="出货金额" />
                </BarChart>
              )}
            </CardContent></Card>

            <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">货品出货重量排行</CardTitle></CardHeader><CardContent>
              {soWeightRankData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <BarChart data={soWeightRankData} layout="vertical" height={Math.max(200, soWeightRankData.length * 40)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={v => `${v}KG`} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}KG`} />
                  <Bar dataKey="weight" fill="#374151" name="出货重量" />
                </BarChart>
              )}
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
