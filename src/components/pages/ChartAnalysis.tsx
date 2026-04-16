'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

const CHART_COLORS = [
  '#93c5fd', '#6ee7b7', '#fcd34d', '#f9a8d4',
  '#a5b4fc', '#5eead4', '#fdba74', '#bef264',
];

const SOLID_COLORS = [
  '#93c5fd', '#6ee7b7', '#fcd34d', '#f9a8d4',
  '#a5b4fc', '#5eead4', '#fdba74', '#bef264',
];

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

  const clearRange = () => { setDateFrom(undefined); setDateTo(undefined); };

  const dateFromStr = dateFrom ? dateFnsFormat(dateFrom, 'yyyy-MM-dd') : '';
  const dateToStr = dateTo ? dateFnsFormat(dateTo, 'yyyy-MM-dd') : '';

  // ============ PURCHASE CHARTS ============
  const poFiltered = purchaseOrders.filter(o => (!dateFromStr || o.date >= dateFromStr) && (!dateToStr || o.date <= dateToStr));

  // 1. 进货规格占比
  const poSpecMap: Record<string, number> = {};
  poFiltered.forEach(o => {
    purchaseItems.filter(i => i.orderId === o.id).forEach(item => {
      const spec = item.spec || item.productName;
      poSpecMap[spec] = (poSpecMap[spec] || 0) + item.weight;
    });
  });
  const poSpecData = Object.entries(poSpecMap).map(([name, weight], i) => ({
    name, weight, fill: CHART_COLORS[i % CHART_COLORS.length],
  })).sort((a, b) => b.weight - a.weight);

  const poSpecConfig: ChartConfig = { weight: { label: '重量(KG)' } };
  poSpecData.forEach((item, i) => {
    poSpecConfig[item.name] = { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  // 2. 进货供应商占比
  const poSupplierMap: Record<string, number> = {};
  poFiltered.forEach(o => {
    poSupplierMap[o.supplierName || '未知'] = (poSupplierMap[o.supplierName || '未知'] || 0) + o.totalAmount;
  });
  const poSupplierPieData = Object.entries(poSupplierMap).map(([name, value], i) => ({
    name, value, fill: CHART_COLORS[i % CHART_COLORS.length],
  })).sort((a, b) => b.value - a.value);

  const poSupplierConfig: ChartConfig = { value: { label: '金额' } };
  poSupplierPieData.forEach((item, i) => {
    poSupplierConfig[item.name] = { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  // 3. 不同供应商供应不同产品量
  const poSupplierProductMap: Record<string, Record<string, number>> = {};
  const poProductNames = new Set<string>();
  poFiltered.forEach(o => {
    purchaseItems.filter(i => i.orderId === o.id).forEach(item => {
      const key = o.supplierName || '未知';
      if (!poSupplierProductMap[key]) poSupplierProductMap[key] = {};
      poSupplierProductMap[key][item.productName] = (poSupplierProductMap[key][item.productName] || 0) + item.weight;
      poProductNames.add(item.productName);
    });
  });
  const poSupplierProductData = Object.entries(poSupplierProductMap).map(([supplier, products]) => ({ supplier, ...products }));
  const poProductNamesArr = Array.from(poProductNames);

  const poSupplierProductConfig: ChartConfig = {};
  poProductNamesArr.forEach((name, i) => {
    poSupplierProductConfig[name] = { label: name, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  // 4. 进货均价
  const poPriceMap: Record<string, { totalAmount: number; totalWeight: number }> = {};
  poFiltered.forEach(o => {
    purchaseItems.filter(i => i.orderId === o.id).forEach(item => {
      if (!poPriceMap[item.productName]) poPriceMap[item.productName] = { totalAmount: 0, totalWeight: 0 };
      poPriceMap[item.productName].totalAmount += item.amount;
      poPriceMap[item.productName].totalWeight += item.weight;
    });
  });
  const poAvgPriceData = Object.entries(poPriceMap).map(([name, data]) => ({
    name, avgPrice: data.totalWeight > 0 ? Math.round((data.totalAmount / data.totalWeight) * 100) / 100 : 0,
  })).sort((a, b) => b.avgPrice - a.avgPrice);

  const poAvgPriceConfig: ChartConfig = { avgPrice: { label: '均价(元/KG)', color: 'var(--chart-1)' } };

  // ============ SALES CHARTS ============
  const soFiltered = salesOrders.filter(o => (!dateFromStr || o.date >= dateFromStr) && (!dateToStr || o.date <= dateToStr));

  // 1. 出货产品占比（新增饼状图）
  const soProductMap: Record<string, number> = {};
  soFiltered.forEach(o => {
    salesItems.filter(i => i.orderId === o.id).forEach(item => {
      soProductMap[item.productName] = (soProductMap[item.productName] || 0) + item.weight;
    });
  });
  const soProductPieData = Object.entries(soProductMap).map(([name, weight], i) => ({
    name, weight, fill: CHART_COLORS[i % CHART_COLORS.length],
  })).sort((a, b) => b.weight - a.weight);

  const soProductConfig: ChartConfig = { weight: { label: '重量(KG)' } };
  soProductPieData.forEach((item, i) => {
    soProductConfig[item.name] = { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  // 2. 已回款和未回款占比（新增饼状图）
  const totalCollected = soFiltered.reduce((sum, o) => sum + o.collectedAmount, 0);
  const totalUncollected = soFiltered.reduce((sum, o) => sum + o.uncollectedAmount, 0);
  const soPaymentPieData = [
    { name: '已回款', value: totalCollected, fill: '#6ee7b7' },
    { name: '未回款', value: totalUncollected, fill: '#fcd34d' },
  ];
  const soPaymentConfig: ChartConfig = {
    value: { label: '金额' },
    '已回款': { label: '已回款', color: '#6ee7b7' },
    '未回款': { label: '未回款', color: '#fcd34d' },
  };

  // 3. 不同客户出货规格分布
  const soCustomerSpecMap: Record<string, Record<string, number>> = {};
  const soSpecNames = new Set<string>();
  soFiltered.forEach(o => {
    salesItems.filter(i => i.orderId === o.id).forEach(item => {
      const key = o.customerName || '未知';
      if (!soCustomerSpecMap[key]) soCustomerSpecMap[key] = {};
      soCustomerSpecMap[key][item.productName] = (soCustomerSpecMap[key][item.productName] || 0) + item.weight;
      soSpecNames.add(item.productName);
    });
  });
  const soCustomerSpecData = Object.entries(soCustomerSpecMap).map(([customer, specs]) => ({ customer, ...specs }));
  const soSpecNamesArr = Array.from(soSpecNames);

  const soCustomerSpecConfig: ChartConfig = {};
  soSpecNamesArr.forEach((name, i) => {
    soCustomerSpecConfig[name] = { label: name, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  // 4. 货品出货金额排行
  const soAmountMap: Record<string, number> = {};
  soFiltered.forEach(o => {
    salesItems.filter(i => i.orderId === o.id).forEach(item => {
      soAmountMap[item.productName] = (soAmountMap[item.productName] || 0) + item.amount;
    });
  });
  const soAmountRankData = Object.entries(soAmountMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);

  const soAmountConfig: ChartConfig = { amount: { label: '出货金额', color: 'var(--chart-2)' } };

  // 5. 货品出货重量排行
  const soWeightMap: Record<string, number> = {};
  soFiltered.forEach(o => {
    salesItems.filter(i => i.orderId === o.id).forEach(item => {
      soWeightMap[item.productName] = (soWeightMap[item.productName] || 0) + item.weight;
    });
  });
  const soWeightRankData = Object.entries(soWeightMap).map(([name, weight]) => ({ name, weight })).sort((a, b) => b.weight - a.weight);

  const soWeightConfig: ChartConfig = { weight: { label: '出货重量(KG)', color: 'var(--chart-3)' } };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">图表分析</h2><p className="text-sm text-muted-foreground">通过图表分析采购和出货业务数据</p></div>

      <div className="rounded-lg border border-gray-200 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker from={dateFrom} to={dateTo} onSelect={({ from: f, to: t }) => { setDateFrom(f); setDateTo(t); }} placeholder="日期筛选" />
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setQuickRange('week')} className="h-8 px-3 text-xs">本周</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('month')} className="h-8 px-3 text-xs">本月</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange('year')} className="h-8 px-3 text-xs">本年</Button>
          </div>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearRange} className="h-8 px-2"><X className="h-3.5 w-3.5 mr-1" />清除</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="purchase">
        <TabsList className="bg-gray-100"><TabsTrigger value="purchase">进货图表</TabsTrigger><TabsTrigger value="sales">出货图表</TabsTrigger></TabsList>

        <TabsContent value="purchase" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">进货规格占比</CardTitle><CardDescription className="text-xs">按规格重量统计</CardDescription></CardHeader>
              <CardContent>
                {poSpecData.length === 0 ? <EmptyState title="暂无数据" /> : (
                  <div className="space-y-4">
                    <ChartContainer config={poSpecConfig} className="mx-auto aspect-square max-h-[250px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={poSpecData} dataKey="weight" nameKey="name" innerRadius={50} outerRadius={80} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                      {poSpecData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-1.5 text-xs">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground">{item.name}</span>
                          <span className="font-medium">{((item.weight / poSpecData.reduce((s, d) => s + d.weight, 0)) * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">进货供应商占比</CardTitle><CardDescription className="text-xs">按供应商金额统计</CardDescription></CardHeader>
              <CardContent>
                {poSupplierPieData.length === 0 ? <EmptyState title="暂无数据" /> : (
                  <div className="space-y-4">
                    <ChartContainer config={poSupplierConfig} className="mx-auto aspect-square max-h-[250px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={poSupplierPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                      {poSupplierPieData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-1.5 text-xs">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground">{item.name}</span>
                          <span className="font-medium">{((item.value / poSupplierPieData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">不同供应商供应不同产品量</CardTitle><CardDescription className="text-xs">按供应商和产品重量统计</CardDescription></CardHeader>
            <CardContent>{poSupplierProductData.length === 0 ? <EmptyState title="暂无数据" /> : (
              <ChartContainer config={poSupplierProductConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={poSupplierProductData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="supplier" tickLine={false} tickMargin={10} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {poProductNamesArr.map((name, i) => (
                    <Bar key={name} dataKey={name} stackId="a" fill={SOLID_COLORS[i % SOLID_COLORS.length]} />
                  ))}
                </BarChart>
              </ChartContainer>
            )}</CardContent>
          </Card>

          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">进货均价 (元/KG)</CardTitle><CardDescription className="text-xs">各产品平均进货单价</CardDescription></CardHeader>
            <CardContent>{poAvgPriceData.length === 0 ? <EmptyState title="暂无数据" /> : (
              <ChartContainer config={poAvgPriceConfig} className="h-[250px] w-full">
                <BarChart accessibilityLayer data={poAvgPriceData} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `¥${v}`} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120} 
                    tickLine={false} 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value: string) => value.length > 8 ? `${value.slice(0, 8)}...` : value}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value, name, item) => [`¥${Number(value).toFixed(2)}/KG`, item.payload.name]} />} />
                  <Bar dataKey="avgPrice" fill="#93c5fd" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#666', fontSize: 11, formatter: (v: number) => `¥${v.toFixed(2)}` }} />
                </BarChart>
              </ChartContainer>
            )}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4 mt-4">
          {/* 新增：出货饼状图区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">回款状态占比</CardTitle><CardDescription className="text-xs">已回款与未回款金额统计</CardDescription></CardHeader>
              <CardContent>
                {(totalCollected + totalUncollected) === 0 ? <EmptyState title="暂无数据" /> : (
                  <div className="space-y-4">
                    <ChartContainer config={soPaymentConfig} className="mx-auto aspect-square max-h-[250px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={soPaymentPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#6ee7b7' }} />
                        <span className="text-muted-foreground">已回款</span>
                        <span className="font-medium text-green-600">{formatMoney(totalCollected)}</span>
                        <span className="text-muted-foreground">({((totalCollected / (totalCollected + totalUncollected)) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#fcd34d' }} />
                        <span className="text-muted-foreground">未回款</span>
                        <span className="font-medium text-orange-600">{formatMoney(totalUncollected)}</span>
                        <span className="text-muted-foreground">({((totalUncollected / (totalCollected + totalUncollected)) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">出货产品占比</CardTitle><CardDescription className="text-xs">按产品重量统计</CardDescription></CardHeader>
              <CardContent>
                {soProductPieData.length === 0 ? <EmptyState title="暂无数据" /> : (
                  <div className="space-y-4">
                    <ChartContainer config={soProductConfig} className="mx-auto aspect-square max-h-[250px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={soProductPieData} dataKey="weight" nameKey="name" innerRadius={50} outerRadius={80} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                      {soProductPieData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-1.5 text-xs">
                          <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground">{item.name}</span>
                          <span className="font-medium">{((item.weight / soProductPieData.reduce((s, d) => s + d.weight, 0)) * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">不同客户出货规格分布</CardTitle><CardDescription className="text-xs">按客户和产品重量统计</CardDescription></CardHeader>
            <CardContent>{soCustomerSpecData.length === 0 ? <EmptyState title="暂无数据" /> : (
              <ChartContainer config={soCustomerSpecConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={soCustomerSpecData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="customer" tickLine={false} tickMargin={10} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {soSpecNamesArr.map((name, i) => (
                    <Bar key={name} dataKey={name} stackId="a" fill={SOLID_COLORS[i % SOLID_COLORS.length]} />
                  ))}
                </BarChart>
              </ChartContainer>
            )}</CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">货品出货金额排行</CardTitle><CardDescription className="text-xs">按产品金额从高到低</CardDescription></CardHeader>
              <CardContent>{soAmountRankData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <ChartContainer config={soAmountConfig} className="h-[250px] w-full">
                  <BarChart accessibilityLayer data={soAmountRankData} layout="vertical" margin={{ left: 20, right: 40 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120} 
                      tickLine={false} 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value: string) => value.length > 8 ? `${value.slice(0, 8)}...` : value}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => [`¥${Number(value).toLocaleString('zh-CN')}`, '金额']} />} />
                    <Bar dataKey="amount" fill="#6ee7b7" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#666', fontSize: 11, formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k` }} />
                  </BarChart>
                </ChartContainer>
              )}</CardContent>
            </Card>

            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">货品出货重量排行</CardTitle><CardDescription className="text-xs">按产品重量从高到低</CardDescription></CardHeader>
              <CardContent>{soWeightRankData.length === 0 ? <EmptyState title="暂无数据" /> : (
                <ChartContainer config={soWeightConfig} className="h-[250px] w-full">
                  <BarChart accessibilityLayer data={soWeightRankData} layout="vertical" margin={{ left: 20, right: 40 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickFormatter={v => `${v}KG`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={120} 
                      tickLine={false} 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value: string) => value.length > 8 ? `${value.slice(0, 8)}...` : value}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => [`${Number(value).toLocaleString('zh-CN')} KG`, '重量']} />} />
                    <Bar dataKey="weight" fill="#fcd34d" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#666', fontSize: 11, formatter: (v: number) => `${v}KG` }} />
                  </BarChart>
                </ChartContainer>
              )}</CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
