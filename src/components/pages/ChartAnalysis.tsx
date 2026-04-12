'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BarChart3, TrendingUp } from 'lucide-react';
import { dbPurchaseOrders, dbSalesOrders, dbPurchaseOrderItems, dbSalesOrderItems, dbSuppliers, dbCustomers } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import type { PurchaseOrder, SalesOrder, PurchaseOrderItem, SalesOrderItem } from '@/lib/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const COLORS = ['#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'];

export default function ChartAnalysis() {
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseOrderItem[]>([]);
  const [salesItems, setSalesItems] = useState<SalesOrderItem[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

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

  // Purchase charts data
  const poFiltered = purchaseOrders.filter(o => (!dateStart || o.date >= dateStart) && (!dateEnd || o.date <= dateEnd));

  // Purchase order trend (by date)
  const poByDate: Record<string, { count: number; amount: number }> = {};
  poFiltered.forEach(o => {
    if (!poByDate[o.date]) poByDate[o.date] = { count: 0, amount: 0 };
    poByDate[o.date].count++;
    poByDate[o.date].amount += o.totalAmount;
  });
  const poTrendData = Object.entries(poByDate).sort().map(([date, data]) => ({ date, ...data }));

  // Purchase by category
  const poByCategory: Record<string, { weight: number; amount: number }> = {};
  poFiltered.forEach(o => {
    const items = purchaseItems.filter(i => i.orderId === o.id);
    items.forEach(item => {
      if (!poByCategory[item.productName]) poByCategory[item.productName] = { weight: 0, amount: 0 };
      poByCategory[item.productName].weight += item.weight;
      poByCategory[item.productName].amount += item.amount;
    });
  });
  const poCategoryData = Object.entries(poByCategory).map(([name, data]) => ({ name, ...data }));

  // Sales charts data
  const soFiltered = salesOrders.filter(o => (!dateStart || o.date >= dateStart) && (!dateEnd || o.date <= dateEnd));

  // Customer sales amount
  const soByCustomer: Record<string, { amount: number; collected: number }> = {};
  soFiltered.forEach(o => {
    if (!soByCustomer[o.customerName]) soByCustomer[o.customerName] = { amount: 0, collected: 0 };
    soByCustomer[o.customerName].amount += o.totalAmount;
    soByCustomer[o.customerName].collected += o.collectedAmount;
  });
  const soCustomerData = Object.entries(soByCustomer).map(([name, data]) => ({ name, ...data }));

  // Collection progress
  const collectionPie = [
    { name: '已回款', value: soFiltered.reduce((s, o) => s + o.collectedAmount, 0) },
    { name: '待回款', value: soFiltered.reduce((s, o) => s + o.uncollectedAmount, 0) },
  ].filter(d => d.value > 0);

  // Product sales
  const soByProduct: Record<string, number> = {};
  soFiltered.forEach(o => {
    const items = salesItems.filter(i => i.orderId === o.id);
    items.forEach(item => { soByProduct[item.productName] = (soByProduct[item.productName] || 0) + item.weight; });
  });
  const soProductData = Object.entries(soByProduct).map(([name, weight]) => ({ name, weight })).sort((a, b) => b.weight - a.weight);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">图表分析</h2><p className="text-sm text-muted-foreground">通过图表分析采购和出货业务数据</p></div>

      <Card className="border-gray-200"><CardContent className="py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1"><Label className="text-xs">开始日期</Label><Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="h-9 w-40" /></div>
          <div className="space-y-1"><Label className="text-xs">结束日期</Label><Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="h-9 w-40" /></div>
        </div>
      </CardContent></Card>

      <Tabs defaultValue="purchase">
        <TabsList className="bg-gray-100"><TabsTrigger value="purchase">进货图表</TabsTrigger><TabsTrigger value="sales">出货图表</TabsTrigger></TabsList>

        <TabsContent value="sales" className="space-y-4">
          {/* Customer amount */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">客户出货金额</CardTitle></CardHeader><CardContent>
              {soCustomerData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <BarChart data={soCustomerData} layout="vertical" height={Math.max(200, soCustomerData.length * 40)}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} /><YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} /><Tooltip formatter={(v: number) => formatMoney(v)} /><Bar dataKey="amount" fill="#000" name="出货金额" /></BarChart>
              )}
            </CardContent></Card>

            <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">回款进度</CardTitle></CardHeader><CardContent>
              {collectionPie.length === 0 ? <EmptyState title="暂无数据" /> : (
                <PieChart><Pie data={collectionPie} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`} dataKey="value"><Cell fill="#22c55e" /><Cell fill="#f97316" /></Pie><Tooltip formatter={(v: number) => formatMoney(v)} /></PieChart>
              )}
            </CardContent></Card>
          </div>

          {/* Product sales */}
          <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">产品出货统计</CardTitle></CardHeader><CardContent>
            {soProductData.length === 0 ? <EmptyState title="暂无数据" /> : (
              <BarChart data={soProductData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tickFormatter={v => `${v}KG`} /><Tooltip /><Bar dataKey="weight" fill="#000" name="出货量(KG)" /></BarChart>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">进货订单趋势</CardTitle></CardHeader><CardContent>
              {poTrendData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <LineChart data={poTrendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="count" stroke="#000" name="订单数" /><Line type="monotone" dataKey="amount" stroke="#6b7280" name="金额" /></LineChart>
              )}
            </CardContent></Card>

            <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">进货品类占比</CardTitle></CardHeader><CardContent>
              {poCategoryData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <PieChart><Pie data={poCategoryData} cx="50%" cy="50%" outerRadius={80} dataKey="amount" nameKey="name" label>{poCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatMoney(v)} /></PieChart>
              )}
            </CardContent></Card>
          </div>

          <Card className="border-gray-200"><CardHeader><CardTitle className="text-sm">各品类进货量</CardTitle></CardHeader><CardContent>
            {poCategoryData.length === 0 ? <EmptyState title="暂无数据" /> : (
              <BarChart data={poCategoryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tickFormatter={v => `${v}KG`} /><Tooltip /><Bar dataKey="weight" fill="#000" name="进货量(KG)" /></BarChart>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
