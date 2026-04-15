'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination';
import { Search, FileDown, CreditCard, Wallet, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { dbPurchaseOrders, dbSalesOrders, dbPaymentRecords, dbCollectionRecords } from '@/lib/api';
import { formatMoney, formatDate } from '@/lib/format';
import { PAYMENT_STATUSES } from '@/lib/constants';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import type { PurchaseOrder, SalesOrder, PaymentRecord, CollectionRecord } from '@/lib/types';

export default function FinanceManagement() {
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const [po, so, p, c] = await Promise.all([
        dbPurchaseOrders.getAll(), dbSalesOrders.getAll(),
        dbPaymentRecords.getAll(), dbCollectionRecords.getAll(),
      ]);
      setPurchaseOrders(po);
      setSalesOrders(so);
      setPayments(p);
      setCollections(c);
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

  // Payable stats
  const payableOrders = purchaseOrders.filter(o => o.paymentStatus !== 'paid');
  const payableTotal = payableOrders.reduce((s, o) => s + o.unpaidAmount, 0);
  const payableSuppliers = new Set(payableOrders.map(o => o.supplierId)).size;

  // Receivable stats
  const receivableOrders = salesOrders.filter(o => o.paymentStatus !== 'paid');
  const receivableTotal = receivableOrders.reduce((s, o) => s + o.uncollectedAmount, 0);
  const receivableCustomers = new Set(receivableOrders.map(o => o.customerId)).size;

  // Cash flow stats
  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalCollections = collections.reduce((s, c) => s + c.amount, 0);
  const netCashFlow = totalCollections - totalPayments;

  // Profit stats
  const totalRevenue = salesOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCost = purchaseOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalFreight = purchaseOrders.reduce((s, o) => s + o.freight, 0);
  const totalCostWithoutFreight = totalCost - totalFreight;
  const totalGrossProfit = totalRevenue - totalCostWithoutFreight;
  const totalNetProfit = totalGrossProfit - totalFreight;

  // All transactions
  const allTransactions = [
    ...payments.map(p => {
      const po = purchaseOrders.find(o => o.id === p.orderId);
      return { date: p.date, type: '付款' as const, orderNo: po?.orderNo || '(订单已删除)', target: po?.supplierName || p.remark || '-', amount: -p.amount, method: p.method, remark: p.remark };
    }),
    ...collections.map(c => {
      const so = salesOrders.find(o => o.id === c.orderId);
      return { date: c.date, type: '回款' as const, orderNo: so?.orderNo || '(订单已删除)', target: so?.customerName || c.remark || '-', amount: c.amount, method: c.method, remark: c.remark };
    }),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filteredTransactions = allTransactions.filter(t => !searchTerm || t.orderNo.includes(searchTerm));

  // Pagination helpers
  const getPaginationData = (items: unknown[]) => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);
    const pageNumbers: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      if (safePage > 3) pageNumbers.push('ellipsis');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pageNumbers.push(i);
      if (safePage < totalPages - 2) pageNumbers.push('ellipsis');
      pageNumbers.push(totalPages);
    }
    return { totalPages, safePage, paginatedItems, pageNumbers };
  };

  const payablePagination = useMemo(() => getPaginationData(payableOrders), [payableOrders, currentPage]);
  const receivablePagination = useMemo(() => getPaginationData(receivableOrders), [receivableOrders, currentPage]);
  const transactionPagination = useMemo(() => getPaginationData(filteredTransactions), [filteredTransactions, currentPage]);

  // Monthly profit
  const monthMap: Record<string, { revenue: number; cost: number; freight: number }> = {};
  purchaseOrders.forEach(o => {
    const m = o.date.substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { revenue: 0, cost: 0, freight: 0 };
    monthMap[m].cost += o.totalAmount;
    monthMap[m].freight += o.freight;
  });
  salesOrders.forEach(o => {
    const m = o.date.substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { revenue: 0, cost: 0, freight: 0 };
    monthMap[m].revenue += o.totalAmount;
  });
  const monthlyProfit = Object.entries(monthMap).sort().reverse().map(([month, data]) => ({
    month,
    revenue: data.revenue,
    cost: data.cost,
    freight: data.freight,
    grossProfit: data.revenue - (data.cost - data.freight),
    netProfit: data.revenue - data.cost,
    margin: data.revenue > 0 ? ((data.revenue - (data.cost - data.freight)) / data.revenue * 100) : 0,
  }));

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">财务管理</h2><p className="text-sm text-muted-foreground">应付账款、应收账款、收支流水和利润分析</p></div>

      <Tabs defaultValue="payable">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="payable"><CreditCard className="h-4 w-4 mr-1.5" />应付账款</TabsTrigger>
          <TabsTrigger value="receivable"><Wallet className="h-4 w-4 mr-1.5" />应收账款</TabsTrigger>
          <TabsTrigger value="cashflow"><ArrowLeftRight className="h-4 w-4 mr-1.5" />收支流水</TabsTrigger>
          <TabsTrigger value="profit"><TrendingUp className="h-4 w-4 mr-1.5" />利润分析</TabsTrigger>
        </TabsList>

        {/* Payable */}
        <TabsContent value="payable" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">应付总额</div><div className="text-2xl font-bold text-orange-600 mt-1">{formatMoney(payableTotal)}</div></CardContent></Card>
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">欠款供应商数</div><div className="text-2xl font-bold mt-1">{payableSuppliers}</div></CardContent></Card>
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">未结订单数</div><div className="text-2xl font-bold mt-1">{payableOrders.length}</div></CardContent></Card>
          </div>
          <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
            {payableOrders.length === 0 ? <EmptyState title="暂无应付账款" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>订单号</TableHead><TableHead>供应商</TableHead><TableHead>日期</TableHead><TableHead className="text-right">订单金额</TableHead><TableHead className="text-right">已付款</TableHead><TableHead className="text-right">待付款</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
                  <TableBody>{payablePagination.paginatedItems.map(o => (
                    <TableRow key={(o as PurchaseOrder).id}>
                      <TableCell className="font-mono text-xs">{(o as PurchaseOrder).orderNo}</TableCell>
                      <TableCell>{(o as PurchaseOrder).supplierName}</TableCell>
                      <TableCell>{formatDate((o as PurchaseOrder).date)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney((o as PurchaseOrder).totalAmount)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney((o as PurchaseOrder).paidAmount)}</TableCell>
                      <TableCell className="text-right font-mono text-orange-600">{formatMoney((o as PurchaseOrder).unpaidAmount)}</TableCell>
                      <TableCell><StatusBadge status={(o as PurchaseOrder).paymentStatus} statusMap={[...PAYMENT_STATUSES]} /></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
            )}
          </div>
          {payableOrders.length > 0 && payablePagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                共 {payableOrders.length} 条，第 {payablePagination.safePage}/{payablePagination.totalPages} 页
              </span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={payablePagination.safePage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                  {payablePagination.pageNumbers.map((page, idx) => page === 'ellipsis' ? <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem> : <PaginationItem key={page}><PaginationLink isActive={page === payablePagination.safePage} onClick={() => setCurrentPage(page)} className="cursor-pointer">{page}</PaginationLink></PaginationItem>)}
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage(p => Math.min(payablePagination.totalPages, p + 1))} className={payablePagination.safePage >= payablePagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>

        {/* Receivable */}
        <TabsContent value="receivable" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">应收总额</div><div className="text-2xl font-bold text-orange-600 mt-1">{formatMoney(receivableTotal)}</div></CardContent></Card>
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">欠款客户数</div><div className="text-2xl font-bold mt-1">{receivableCustomers}</div></CardContent></Card>
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">未结订单数</div><div className="text-2xl font-bold mt-1">{receivableOrders.length}</div></CardContent></Card>
          </div>
          <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
            {receivableOrders.length === 0 ? <EmptyState title="暂无应收账款" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>订单号</TableHead><TableHead>客户</TableHead><TableHead>日期</TableHead><TableHead className="text-right">订单金额</TableHead><TableHead className="text-right">已回款</TableHead><TableHead className="text-right">待回款</TableHead><TableHead>状态</TableHead></TableRow></TableHeader>
                  <TableBody>{receivablePagination.paginatedItems.map(o => (
                    <TableRow key={(o as SalesOrder).id}>
                      <TableCell className="font-mono text-xs">{(o as SalesOrder).orderNo}</TableCell>
                      <TableCell>{(o as SalesOrder).customerName}</TableCell>
                      <TableCell>{formatDate((o as SalesOrder).date)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney((o as SalesOrder).totalAmount)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney((o as SalesOrder).collectedAmount)}</TableCell>
                      <TableCell className="text-right font-mono text-orange-600">{formatMoney((o as SalesOrder).uncollectedAmount)}</TableCell>
                      <TableCell><StatusBadge status={(o as SalesOrder).paymentStatus} statusMap={[...PAYMENT_STATUSES]} /></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
            )}
          </div>
          {receivableOrders.length > 0 && receivablePagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                共 {receivableOrders.length} 条，第 {receivablePagination.safePage}/{receivablePagination.totalPages} 页
              </span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={receivablePagination.safePage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                  {receivablePagination.pageNumbers.map((page, idx) => page === 'ellipsis' ? <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem> : <PaginationItem key={page}><PaginationLink isActive={page === receivablePagination.safePage} onClick={() => setCurrentPage(page)} className="cursor-pointer">{page}</PaginationLink></PaginationItem>)}
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage(p => Math.min(receivablePagination.totalPages, p + 1))} className={receivablePagination.safePage >= receivablePagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">付款总额</div><div className="text-2xl font-bold text-red-600 mt-1">{formatMoney(totalPayments)}</div></CardContent></Card>
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">回款总额</div><div className="text-2xl font-bold text-green-600 mt-1">{formatMoney(totalCollections)}</div></CardContent></Card>
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">净现金流</div><div className={`text-2xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(netCashFlow)}</div></CardContent></Card>
          </div>
          <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
            {filteredTransactions.length === 0 ? <EmptyState title="暂无收支记录" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>日期</TableHead><TableHead>类型</TableHead><TableHead>关联单据</TableHead><TableHead>对象</TableHead><TableHead>方式</TableHead><TableHead className="text-right">金额</TableHead><TableHead>备注</TableHead></TableRow></TableHeader>
                  <TableBody>{transactionPagination.paginatedItems.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell><Badge variant="secondary" className={t.type === '回款' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{t.type}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{t.orderNo}</TableCell>
                      <TableCell>{t.target}</TableCell>
                      <TableCell>{t.method}</TableCell>
                      <TableCell className={`text-right font-mono font-medium ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{t.amount >= 0 ? '+' : ''}{formatMoney(t.amount)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{t.remark}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
            )}
          </div>
          {filteredTransactions.length > 0 && transactionPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                共 {filteredTransactions.length} 条，第 {transactionPagination.safePage}/{transactionPagination.totalPages} 页
              </span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={transactionPagination.safePage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                  {transactionPagination.pageNumbers.map((page, idx) => page === 'ellipsis' ? <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem> : <PaginationItem key={page}><PaginationLink isActive={page === transactionPagination.safePage} onClick={() => setCurrentPage(page)} className="cursor-pointer">{page}</PaginationLink></PaginationItem>)}
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage(p => Math.min(transactionPagination.totalPages, p + 1))} className={transactionPagination.safePage >= transactionPagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>

        {/* Profit */}
        <TabsContent value="profit" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">总营收</div><div className="text-2xl font-bold mt-1">{formatMoney(totalRevenue)}</div></CardContent></Card>
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">总成本</div><div className="text-2xl font-bold mt-1 text-red-600">{formatMoney(totalCost)}</div></CardContent></Card>
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">总毛利</div><div className={`text-2xl font-bold mt-1 ${totalGrossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(totalGrossProfit)}</div></CardContent></Card>
            <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">总净利</div><div className={`text-2xl font-bold mt-1 ${totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(totalNetProfit)}</div></CardContent></Card>
          </div>
          <Card className="border-gray-200"><CardContent className="p-0">
            {monthlyProfit.length === 0 ? <EmptyState title="暂无利润数据" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>月份</TableHead><TableHead className="text-right">营收</TableHead><TableHead className="text-right">成本</TableHead><TableHead className="text-right">运费</TableHead><TableHead className="text-right">毛利</TableHead><TableHead className="text-right">净利</TableHead><TableHead className="text-right">毛利率</TableHead></TableRow></TableHeader>
                  <TableBody>{monthlyProfit.map(m => {
                    const currentMonth = new Date().toISOString().substring(0, 7);
                    return (
                      <TableRow key={m.month} className={m.month === currentMonth ? 'bg-gray-50 font-medium' : ''}>
                        <TableCell>{m.month}</TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(m.revenue)}</TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(m.cost)}</TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(m.freight)}</TableCell>
                        <TableCell className={`text-right font-mono ${m.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(m.grossProfit)}</TableCell>
                        <TableCell className={`text-right font-mono ${m.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(m.netProfit)}</TableCell>
                        <TableCell className="text-right">{m.margin.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}</TableBody>
                </Table>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
