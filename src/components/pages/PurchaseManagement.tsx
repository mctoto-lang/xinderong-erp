'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { DetailSheet } from '@/components/shared/DetailSheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination';

import { Plus, Search, FileSpreadsheet, Eye, Pencil, Trash2, CreditCard, CalendarIcon, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { dbPurchaseOrders, dbPurchaseOrderItems, dbPaymentRecords, dbSuppliers, dbAuditLogs, dbInventory, dbInventoryLogs, dbProductCategories, dbSystemSettings } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { format as dateFnsFormat, parse as dateFnsParse } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { formatMoney, formatDate, formatWeight, generateId, getTodayStr, numberToChinese } from '@/lib/format';
import { PAYMENT_STATUSES, PAYMENT_METHODS } from '@/lib/constants';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { IconButton } from '@/components/shared/IconButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { PurchaseOrder, PurchaseOrderItem, Supplier, PaymentRecord, ProductCategory } from '@/lib/types';

// ─── Table Skeleton ────────────────────────────────────────

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
        {['w-28', 'w-20', 'w-24', 'w-16', 'w-16', 'w-16', 'w-16', 'w-16', 'w-20', 'w-24'].map((w, i) => (
          <div key={i} className={`${w} h-3 rounded bg-muted`} />
        ))}
      </div>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
          <div className="w-28 h-4 rounded bg-muted animate-pulse" />
          <div className="w-20 h-4 rounded bg-muted animate-pulse" />
          <div className="w-24 h-4 rounded bg-muted animate-pulse" />
          <div className="w-16 h-4 rounded bg-muted animate-pulse ml-auto" />
          <div className="w-16 h-4 rounded bg-muted animate-pulse" />
          <div className="w-16 h-4 rounded bg-muted animate-pulse" />
          <div className="w-16 h-4 rounded bg-muted animate-pulse" />
          <div className="w-16 h-4 rounded bg-muted animate-pulse" />
          <div className="w-20 h-4 rounded bg-muted animate-pulse" />
          <div className="w-24 h-4 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function PurchaseManagement() {
  const { currentUser } = useAppStore();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dialog states
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [printScale, setPrintScale] = useState(0.55);

  // Auto-scale print preview to fit A4 within dialog
  useEffect(() => {
    if (!showPrintDialog) return;
    const updateScale = () => {
      const el = printContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // A4: 210mm x 297mm, at 96dpi ≈ 794px x 1123px
      const a4W = 794;
      const a4H = 1123;
      const pad = 16;
      const scale = Math.min((rect.width - pad * 2) / a4W, (rect.height - pad * 2) / a4H);
      setPrintScale(Math.min(scale, 1));
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (printContainerRef.current) ro.observe(printContainerRef.current);
    return () => ro.disconnect();
  }, [showPrintDialog]);

  // Order form
  const [orderForm, setOrderForm] = useState({
    date: getTodayStr(),
    supplierId: '',
    freight: 0,
    remark: '',
  });
  const [orderItems, setOrderItems] = useState<Array<{
    productId: string; productName: string; spec: string; weight: number; unitPrice: number;
  }>>([{ productId: '', productName: '', spec: '', weight: 0, unitPrice: 0 }]);

  // Payment form
  const [paymentForm, setPaymentForm] = useState<{
    amount: number;
    method: string;
    date: string;
    remark: string;
  }>({
    amount: 0,
    method: PAYMENT_METHODS[0],
    date: getTodayStr(),
    remark: '',
  });

  // Detail data
  const [detailItems, setDetailItems] = useState<PurchaseOrderItem[]>([]);
  const [detailPayments, setDetailPayments] = useState<PaymentRecord[]>([]);

  // System settings for print
  const [printSettings, setPrintSettings] = useState({ companyName: '', companyAddress: '', companyPhone: '' });

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const [orderList, supplierList, categoryList, companyName, companyAddress, companyPhone] = await Promise.all([
        dbPurchaseOrders.getAll(),
        dbSuppliers.getAll(),
        dbProductCategories.getByCategory('purchase'),
        dbSystemSettings.getByKey('companyName'),
        dbSystemSettings.getByKey('companyAddress'),
        dbSystemSettings.getByKey('companyPhone'),
      ]);
      orderList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      categoryList.sort((a, b) => a.sort - b.sort);
      setOrders(orderList);
      setSuppliers(supplierList);
      setCategories(categoryList.filter(c => c.status === 'active'));
      setPrintSettings({ companyName: companyName || '', companyAddress: companyAddress || '', companyPhone: companyPhone || '' });
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

  // Filter
  const filtered = orders.filter(o => {
    const matchSearch = !searchTerm ||
      o.orderNo.includes(searchTerm) ||
      o.supplierName.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || o.paymentStatus === statusFilter;
    const matchDateFrom = !dateFrom || o.date >= dateFnsFormat(dateFrom, 'yyyy-MM-dd');
    const matchDateTo = !dateTo || o.date <= dateFnsFormat(dateTo, 'yyyy-MM-dd');
    return matchSearch && matchStatus && matchDateFrom && matchDateTo;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(() =>
    filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, dateFrom, dateTo]);

  // Parse date string to Date for Calendar
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const d = dateFnsParse(dateStr, 'yyyy-MM-dd', new Date());
    return isNaN(d.getTime()) ? undefined : d;
  };
  const calendarDate = parseDate(orderForm.date);

  // Pagination page numbers
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('ellipsis');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  // Open new order dialog
  const openNewOrder = () => {
    setEditingOrder(null);
    setOrderForm({ date: getTodayStr(), supplierId: '', freight: 0, remark: '' });
    setOrderItems([{ productId: '', productName: '', spec: '', weight: 0, unitPrice: 0 }]);
    setShowOrderDialog(true);
  };

  // Open edit order dialog
  const openEditOrder = async (order: PurchaseOrder) => {
    setEditingOrder(order);
    setOrderForm({
      date: order.date,
      supplierId: order.supplierId,
      freight: order.freight,
      remark: order.remark,
    });
    const items = await dbPurchaseOrderItems.getByOrderId(order.id);
    setOrderItems(items.map(i => ({
      productId: i.productId, productName: i.productName, spec: i.spec,
      weight: i.weight, unitPrice: i.unitPrice,
    })));
    setShowOrderDialog(true);
  };

  // Save order
  const saveOrder = async () => {
    const supplier = suppliers.find(s => s.id === orderForm.supplierId);
    if (!supplier) { toast.error('请选择供应商'); return; }
    const validItems = orderItems.filter(i => i.productName && i.weight > 0);
    if (validItems.length === 0) { toast.error('请添加至少一项货品'); return; }

    const totalAmount = validItems.reduce((sum, i) => sum + i.weight * i.unitPrice, 0) + orderForm.freight;
    let orderNo: string;
    if (editingOrder) {
      orderNo = editingOrder.orderNo;
    } else {
      const res = await fetch(`/api/orderNo?prefix=JHD&date=${orderForm.date}`);
      const data = await res.json();
      orderNo = data.orderNo;
    }

    if (editingOrder) {
      const oldItems = await dbPurchaseOrderItems.getByOrderId(editingOrder.id);
      for (const oldItem of oldItems) {
        const allInv = await dbInventory.getAll();
        const inv = allInv.find(i => i.productName === oldItem.productName);
        if (inv) {
          const newRaw = Math.max(0, inv.rawMaterialStock - oldItem.weight);
          await dbInventory.put({ ...inv, rawMaterialStock: newRaw });
          await dbInventoryLogs.add({
            inventoryId: inv.id,
            productName: oldItem.productName,
            logType: '编辑回退',
            relatedOrderNo: orderNo,
            quantity: -oldItem.weight,
            balance: newRaw,
            remark: `编辑进货单 ${orderNo} 回退旧数据`,
            operator: currentUser?.name || '',
          });
        }
      }
    }

    const orderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'> = {
      orderNo,
      date: orderForm.date,
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalAmount,
      freight: orderForm.freight,
      paidAmount: editingOrder?.paidAmount || 0,
      unpaidAmount: totalAmount - (editingOrder?.paidAmount || 0),
      paymentStatus: editingOrder?.paymentStatus || 'unpaid',
      remark: orderForm.remark,
      createdBy: currentUser?.name || '',
    };

    let orderId: string;
    if (editingOrder) {
      orderId = editingOrder.id;
      await dbPurchaseOrders.put({ ...editingOrder, ...orderData });
    } else {
      const newOrder = await dbPurchaseOrders.add(orderData);
      orderId = newOrder.id;
    }

    await dbPurchaseOrderItems.removeByOrderId(orderId);
    await dbPurchaseOrderItems.addBatch(
      validItems.map(i => ({
        orderId,
        productId: i.productId || generateId(),
        productName: i.productName,
        spec: i.spec,
        weight: i.weight,
        unitPrice: i.unitPrice,
        amount: i.weight * i.unitPrice,
      }))
    );

    for (const item of validItems) {
      const allInv = await dbInventory.getAll();
      let inv = allInv.find(i => i.productName === item.productName);
      if (!inv) {
        inv = await dbInventory.add({
          productName: item.productName,
          category: '原料',
          rawMaterialStock: 0,
          finishedProductStock: 0,
          warningThreshold: 100,
          status: 'normal',
        });
      }
      const newRaw = inv.rawMaterialStock + item.weight;
      const isWarning = newRaw < inv.warningThreshold;
      await dbInventory.put({ ...inv, rawMaterialStock: newRaw, status: isWarning ? 'warning' : 'normal' });
      await dbInventoryLogs.add({
        inventoryId: inv.id,
        productName: item.productName,
        logType: '进货入库',
        relatedOrderNo: orderNo,
        quantity: item.weight,
        balance: newRaw,
        remark: `${editingOrder ? '编辑' : '新建'}进货单 ${orderNo}`,
        operator: currentUser?.name || '',
      });
    }

    await dbAuditLogs.add({
      operator: currentUser?.name || '',
      module: '进货管理',
      action: editingOrder ? '编辑' : '新建',
      detail: `${editingOrder ? '编辑' : '新建'}进货单 ${orderNo}`,
    });

    toast.success(editingOrder ? '进货单已更新' : '进货单已创建');
    setShowOrderDialog(false);
    loadData();
  };

  // Delete order
  const deleteOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    // Remove inventory
    const items = await dbPurchaseOrderItems.getByOrderId(id);
    for (const item of items) {
      const allInv = await dbInventory.getAll();
      const inv = allInv.find(i => i.productName === item.productName);
      if (inv) {
        const newRaw = Math.max(0, inv.rawMaterialStock - item.weight);
        const isWarning = newRaw < inv.warningThreshold;
        await dbInventory.put({ ...inv, rawMaterialStock: newRaw, status: isWarning ? 'warning' : 'normal' });
        await dbInventoryLogs.add({
          inventoryId: inv.id,
          productName: item.productName,
          logType: '进货删除',
          relatedOrderNo: order.orderNo,
          quantity: -item.weight,
          balance: newRaw,
          remark: `删除进货单 ${order.orderNo}`,
          operator: currentUser?.name || '',
        });
      }
    }

    await dbPurchaseOrderItems.removeByOrderId(id);
    await dbPurchaseOrders.remove(id);

    await dbAuditLogs.add({
      operator: currentUser?.name || '',
      module: '进货管理',
      action: '删除',
      detail: `删除进货单 ${order.orderNo}`,
    });

    toast.success('进货单已删除');
    setConfirmDelete(null);
    loadData();
  };

  // Payment
  const openPayment = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setPaymentForm({ amount: order.unpaidAmount, method: PAYMENT_METHODS[0], date: getTodayStr(), remark: '' });
    setShowPaymentDialog(true);
  };

  const savePayment = async () => {
    if (!selectedOrder) return;
    if (paymentForm.amount <= 0) { toast.error('请输入付款金额'); return; }
    if (paymentForm.amount > selectedOrder.unpaidAmount) { toast.error('付款金额不能大于待付款金额'); return; }

    const newPaid = selectedOrder.paidAmount + paymentForm.amount;
    const newUnpaid = selectedOrder.totalAmount - newPaid;
    const newStatus = newUnpaid <= 0 ? 'paid' as const : 'partial' as const;

    await dbPurchaseOrders.put({
      ...selectedOrder,
      paidAmount: newPaid,
      unpaidAmount: newUnpaid,
      paymentStatus: newStatus,
    });

    await dbPaymentRecords.add({
      orderId: selectedOrder.id,
      orderType: 'purchase',
      amount: paymentForm.amount,
      method: paymentForm.method,
      date: paymentForm.date,
      remark: paymentForm.remark,
      createdBy: currentUser?.name || '',
    });

    toast.success('付款记录已保存');
    setShowPaymentDialog(false);
    loadData();
  };

  // View detail
  const viewDetail = async (order: PurchaseOrder) => {
    setSelectedOrder(order);
    const [items, payments] = await Promise.all([
      dbPurchaseOrderItems.getByOrderId(order.id),
      dbPaymentRecords.getByOrderId(order.id),
    ]);
    setDetailItems(items);
    setDetailPayments(payments);
    setShowDetailSheet(true);
  };

  // Export Excel (CSV with BOM)
  const handleExport = () => {
    if (filtered.length === 0) { toast.error('没有可导出的数据'); return; }
    const headers = ['订单编号', '日期', '供应商', '总金额', '运费', '已付款', '待付款', '付款状态'];
    const rows = filtered.map(o => [
      o.orderNo,
      o.date,
      o.supplierName,
      o.totalAmount,
      o.freight,
      o.paidAmount,
      o.unpaidAmount,
      PAYMENT_STATUSES.find(s => s.value === o.paymentStatus)?.label || o.paymentStatus,
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `进货数据_${getTodayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  };

  // Order item handlers
  const updateOrderItem = (idx: number, field: string, value: string | number) => {
    setOrderItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const selectCategory = (idx: number, categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (cat) {
      setOrderItems(prev => prev.map((item, i) =>
        i === idx ? { ...item, productId: cat.id, productName: cat.name, spec: cat.spec || '' } : item
      ));
    }
  };
  const addOrderItem = () => {
    setOrderItems(prev => [...prev, { productId: '', productName: '', spec: '', weight: 0, unitPrice: 0 }]);
  };
  const removeOrderItem = (idx: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">进货管理</h2>
        <p className="text-sm text-muted-foreground">管理采购进货单、付款记录、打印与导出</p>
      </div>

      {/* Toolbar */}
      <div className="rounded-lg border border-gray-200 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索订单号、供应商..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onSelect={({ from: f, to: t }) => { setDateFrom(f); setDateTo(t); }}
            placeholder="日期筛选"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="付款状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="unpaid">未付款</SelectItem>
              <SelectItem value="partial">部分付款</SelectItem>
              <SelectItem value="paid">已付清</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openNewOrder} className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-1" /> 新建进货单
          </Button>
          <Button variant="outline" onClick={handleExport} className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700">
            <FileSpreadsheet className="h-4 w-4 mr-1" /> 导出Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
          {loading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState title="暂无进货单" description="点击「新建进货单」开始创建" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单编号</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>供应商</TableHead>
                    <TableHead className="text-right">运费</TableHead>
                    <TableHead className="text-right">总金额</TableHead>
                    <TableHead className="w-[140px]">付款进度</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map(order => {
                    const progress = order.totalAmount > 0 ? (order.paidAmount / order.totalAmount) * 100 : 0;
                    return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                      <TableCell>{formatDate(order.date)}</TableCell>
                      <TableCell>{order.supplierName}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney(order.freight)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney(order.totalAmount)}</TableCell>
                      <TableCell className="py-1">
                        <div className="flex items-center gap-2 w-[120px]">
                          <Progress value={progress} className="h-2 flex-1 [&>div]:bg-black" />
                          <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-right shrink-0">{Math.round(progress)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <IconButton icon={<Eye className="h-3.5 w-3.5" />} tooltip="查看详情" onClick={() => viewDetail(order)} />
                          <IconButton icon={<Pencil className="h-3.5 w-3.5" />} tooltip="编辑" onClick={() => openEditOrder(order)} />
                          <IconButton icon={<CreditCard className="h-3.5 w-3.5" />} tooltip="付款" onClick={() => openPayment(order)} />
                          <IconButton icon={<Trash2 className="h-3.5 w-3.5" />} tooltip="删除" onClick={() => setConfirmDelete(order.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50" />
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            共 {filtered.length} 条，第 {safePage}/{totalPages} 页
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={safePage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {pageNumbers.map((page, idx) =>
                page === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === safePage}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={safePage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* New/Edit Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0 pb-1">
            <DialogTitle className="text-base">{editingOrder ? '编辑进货单' : '新建进货单'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">订单日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal gap-2 h-9 ${!orderForm.date ? 'text-muted-foreground' : ''}`}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{orderForm.date ? dateFnsFormat(calendarDate || new Date(), 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={calendarDate}
                      onSelect={(d) => setOrderForm({ ...orderForm, date: d ? dateFnsFormat(d, 'yyyy-MM-dd') : '' })}
                      defaultMonth={calendarDate || new Date()}
                      locale={zhCN}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">供应商</Label>
                <Select value={orderForm.supplierId} onValueChange={v => setOrderForm({ ...orderForm, supplierId: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="选择供应商" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">运费 (¥)</Label>
                <Input type="number" value={orderForm.freight || ''} onChange={e => setOrderForm({ ...orderForm, freight: Number(e.target.value) || 0 })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">备注</Label>
                <Input value={orderForm.remark} onChange={e => setOrderForm({ ...orderForm, remark: e.target.value })} placeholder="选填" className="h-9" />
              </div>
            </div>

            <Separator />

            {/* 货品明细 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">货品明细</span>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={addOrderItem}>
                  <Plus className="h-3.5 w-3.5" /> 添加行
                </Button>
              </div>

              {/* 货品表格 */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[200px] text-xs font-medium">名称</TableHead>
                      <TableHead className="w-[160px] text-xs font-medium">重量(KG)</TableHead>
                      <TableHead className="w-[160px] text-xs font-medium">单价(¥)</TableHead>
                      <TableHead className="text-right text-xs font-medium">金额</TableHead>
                      <TableHead className="w-[48px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, idx) => (
                      <TableRow key={idx} className="group">
                        <TableCell className="py-2 pr-2">
                          <Select
                            value={item.productId || ''}
                            onValueChange={(v) => selectCategory(idx, v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="选择分类" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}{c.spec ? `(${c.spec})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2 px-2">
                          <div className="relative">
                            <Input
                              type="number"
                              value={item.weight || ''}
                              onChange={e => updateOrderItem(idx, 'weight', Number(e.target.value) || 0)}
                              placeholder="KG"
                              className="h-8 text-sm w-full"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2">
                          <div className="relative">
                            <Input
                              type="number"
                              value={item.unitPrice || ''}
                              onChange={e => updateOrderItem(idx, 'unitPrice', Number(e.target.value) || 0)}
                              placeholder="元"
                              className="h-8 text-sm w-full"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-2 pl-2 text-right">
                          <span className="font-mono text-sm font-medium tabular-nums">
                            {item.weight > 0 || item.unitPrice > 0 ? formatMoney(item.weight * item.unitPrice) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 pl-1 w-[48px]">
                          {orderItems.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOrderItem(idx)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 合计 */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <span className="text-sm text-muted-foreground">合计金额</span>
                <span className="text-base font-semibold font-mono tabular-nums">
                  {formatMoney(orderItems.reduce((sum, i) => sum + i.weight * i.unitPrice, 0) + orderForm.freight)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-3 border-t mt-0">
            <Button variant="outline" onClick={() => setShowOrderDialog(false)} className="h-9 px-5">取消</Button>
            <Button onClick={saveOrder} className="bg-black text-white hover:bg-gray-800 h-9 px-5">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>记录付款</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-md p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>订单号:</span><span className="font-mono">{selectedOrder.orderNo}</span></div>
                <div className="flex justify-between"><span>供应商:</span><span>{selectedOrder.supplierName}</span></div>
                <div className="flex justify-between"><span>订单金额:</span><span className="font-mono">{formatMoney(selectedOrder.totalAmount)}</span></div>
                <div className="flex justify-between"><span>已付款:</span><span className="font-mono">{formatMoney(selectedOrder.paidAmount)}</span></div>
                <div className="flex justify-between font-medium"><span>待付款:</span><span className="font-mono text-orange-600">{formatMoney(selectedOrder.unpaidAmount)}</span></div>
              </div>
              <div className="space-y-2">
                <Label>付款金额 (¥)</Label>
                <Input type="number" value={paymentForm.amount || ''} onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>付款方式</Label>
                <Select value={paymentForm.method} onValueChange={v => setPaymentForm({ ...paymentForm, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>付款日期</Label>
                <Input type="date" value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Input value={paymentForm.remark} onChange={e => setPaymentForm({ ...paymentForm, remark: e.target.value })} placeholder="选填" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>取消</Button>
            <Button onClick={savePayment} className="bg-black text-white hover:bg-gray-800">确认付款</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <DetailSheet
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        title="进货单详情"
        subtitle={selectedOrder?.orderNo}
        badge={selectedOrder && <StatusBadge status={selectedOrder.paymentStatus} statusMap={[...PAYMENT_STATUSES]} />}
      >
        {selectedOrder && (
          <>
            {/* ── Financial Summary Card ── */}
            <div className="rounded-lg border bg-card p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">总金额</span>
                <span className="text-base font-semibold font-mono">{formatMoney(selectedOrder.totalAmount)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">运费</span>
                <span className="text-sm font-mono text-muted-foreground">
                  {selectedOrder.freight > 0 ? formatMoney(selectedOrder.freight) : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">已付款</span>
                <span className="text-sm font-mono text-green-600 font-medium">{formatMoney(selectedOrder.paidAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">待付款</span>
                <span className="text-sm font-mono text-red-500 font-medium">{formatMoney(selectedOrder.unpaidAmount)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">付款状态</span>
                <StatusBadge status={selectedOrder.paymentStatus} statusMap={[...PAYMENT_STATUSES]} />
              </div>
            </div>

            {/* ── Basic Info ── */}
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">供应商</div>
                  <div className="text-sm font-medium">{selectedOrder.supplierName}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">日期</div>
                  <div className="text-sm font-medium">{formatDate(selectedOrder.date)}</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">订单编号</div>
                  <div className="text-sm font-mono">{selectedOrder.orderNo}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">创建人</div>
                  <div className="text-sm">{selectedOrder.createdBy || '-'}</div>
                </div>
              </div>
              {selectedOrder.remark && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">备注</div>
                    <div className="text-sm text-muted-foreground">{selectedOrder.remark}</div>
                  </div>
                </>
              )}
            </div>

            {/* ── Items Table ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  货品明细
                </h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="ml-auto h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setShowPrintDialog(true)}
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>打印进货单</TooltipContent>
                </Tooltip>
              </div>
              {detailItems.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left py-2 px-3 font-medium">产品</th>
                        <th className="text-right py-2 px-3 font-medium">重量</th>
                        <th className="text-right py-2 px-3 font-medium">单价</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailItems.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-b-0">
                          <td className="py-2 px-3">
                            <span className="font-medium">{item.productName}</span>
                            {item.spec && <span className="text-muted-foreground ml-1">({item.spec})</span>}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums">{formatWeight(item.weight)}</td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums">{formatMoney(item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/20 py-6 text-center text-xs text-muted-foreground">
                  暂无货品信息
                </div>
              )}
            </div>

            {/* ── Payment Records ── */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  付款记录
                </h4>
                <span className="text-xs text-muted-foreground ml-auto">
                  {detailPayments.length} 笔
                </span>
              </div>
              {detailPayments.length > 0 ? (
                <div className="space-y-2">
                  {detailPayments.map(p => (
                    <div key={p.id} className="rounded-lg border bg-card px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                        <span className="font-mono text-sm font-semibold text-green-600">
                          +{p.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{p.method || '-'}</span>
                        {p.remark && <span className="text-muted-foreground">{p.remark}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/20 py-6 text-center text-xs text-muted-foreground">
                  暂无付款记录
                </div>
              )}
            </div>


          </>
        )}
      </DetailSheet>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="w-auto max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col !p-0">
          <DialogHeader className="shrink-0 px-6 pt-5 pb-2">
            <DialogTitle className="text-base">打印预览</DialogTitle>
          </DialogHeader>
          <div
            ref={printContainerRef}
            className="flex-1 overflow-hidden flex items-center justify-center bg-[#e5e7eb] px-4 pb-2"
          >
            {selectedOrder && (
              <div
                style={{
                  width: `${794 * printScale}px`,
                  height: `${1123 * printScale}px`,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <div
                  id="print-a4-content"
                  style={{
                    width: '794px',
                    height: '1123px',
                    transform: `scale(${printScale})`,
                    transformOrigin: 'top left',
                    background: '#fff',
                    padding: '40px 48px',
                    fontFamily: "'Microsoft YaHei', 'SimHei', sans-serif",
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#111',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* ── 页眉：公司名称 + 地址电话 ── */}
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '3px' }}>
                      {printSettings.companyName || '公司名称'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '3px' }}>
                      {printSettings.companyAddress && `地址：${printSettings.companyAddress}`}{printSettings.companyPhone && `${printSettings.companyAddress ? '\u00A0\u00A0\u00A0\u00A0' : ''}电话：${printSettings.companyPhone}`}
                    </div>
                  </div>

                  {/* ── 标题 ── */}
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '8px' }}>
                      进 货 单
                    </div>
                  </div>

                  {/* ── 基础信息区 ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px' }}>
                    <div><span style={{ color: '#555' }}>收货单位：</span><span style={{ fontWeight: 500 }}>{selectedOrder.supplierName}</span></div>
                    <div><span style={{ color: '#555' }}>时间：</span><span>{formatDate(selectedOrder.date)}</span></div>
                    <div><span style={{ color: '#555' }}>订单号：</span><span style={{ fontWeight: 500 }}>{selectedOrder.orderNo}</span></div>
                  </div>

                  {/* ── 核心数据表 ── */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1.5px solid #000' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #000' }}>
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #000', width: '45px' }}>序号</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #000', width: '150px' }}>名称</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #000', width: '110px' }}>（数量/KG）</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #000', width: '120px' }}>单价（元/KG）</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, width: '130px' }}>金额（元）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                          <td style={{ padding: '7px 6px', textAlign: 'center', borderRight: '1px solid #ddd' }}>{idx + 1}</td>
                          <td style={{ padding: '7px 6px', textAlign: 'center', borderRight: '1px solid #ddd', fontWeight: 500 }}>{item.productName}{item.spec ? `(${item.spec})` : ''}</td>
                          <td style={{ padding: '7px 6px', textAlign: 'center', borderRight: '1px solid #ddd', fontFamily: 'monospace' }}>{item.weight.toFixed(2)}</td>
                          <td style={{ padding: '7px 6px', textAlign: 'center', borderRight: '1px solid #ddd', fontFamily: 'monospace' }}>{item.unitPrice.toFixed(2)}</td>
                          <td style={{ padding: '7px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>{formatMoney(item.amount)}</td>
                        </tr>
                      ))}
                      {/* 合计行 */}
                      <tr>
                        <td colSpan={4} style={{ padding: '10px 8px', borderTop: '1.5px solid #000', fontWeight: 600, textAlign: 'left' }}>
                          合计（大写）：{numberToChinese(selectedOrder.totalAmount)}
                        </td>
                        <td style={{ padding: '10px 8px', borderTop: '1.5px solid #000', fontWeight: 'bold', textAlign: 'center', fontFamily: 'monospace', fontSize: '15px' }}>
                          {formatMoney(selectedOrder.totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* ── 页脚签字区 ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', fontSize: '12px', color: '#444' }}>
                    <div>客户及经手人(签名）：________________</div>
                    <div>开单及制单人（签名）：________________</div>
                    <div>入库签收（签名）：________________</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 px-6 py-3 !justify-center">
            <Button
              className="h-9 gap-1.5 bg-black text-white hover:bg-gray-800 text-sm px-8"
              onClick={() => {
                const el = document.getElementById('print-a4-content');
                if (!el) return;
                const html = `<!DOCTYPE html><html><head><title> </title>
<style>
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:210mm;min-height:297mm}
body{font-family:'Microsoft YaHei','SimHei',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:15mm 12mm}
@media print{body{margin:0}}
</style></head><body>${el.innerHTML}</body></html>`;
                const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                const pw = window.open(blobUrl, '_blank');
                if (pw) {
                  pw.document.title = ' ';
                  setTimeout(() => {
                    pw.print();
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                  }, 400);
                }
              }}
            >
              <Printer className="h-4 w-4" /> 打印单据
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="确认删除"
        description="删除进货单将同时回退库存变动，确定要删除吗？"
        onConfirm={() => confirmDelete && deleteOrder(confirmDelete)}
        confirmText="删除"
      />
    </div>
  );
}
