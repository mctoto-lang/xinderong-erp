'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DetailSheet, DetailTable,
} from '@/components/shared/DetailSheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Search, FileDown, Eye, Trash2, Play, CheckCircle2, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format as dateFnsFormat, parse as dateFnsParse } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { dbProductionOrders, dbProductionOrderItems, dbProductCategories, dbInventory, dbInventoryLogs, dbAuditLogs } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatMoney, formatDate, formatWeight, formatYieldRate, getTodayStr } from '@/lib/format';
import { IconButton } from '@/components/shared/IconButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import type { ProductionOrder, ProductionOrderItem, ProductCategory } from '@/lib/types';

function StatusDot({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string; bgColor: string; borderColor: string }> = {
    completed: { color: 'bg-green-500', label: '完成', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    processing: { color: 'bg-blue-500', label: '加工中', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    pending: { color: 'bg-gray-400', label: '待加工', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
    cancelled: { color: 'bg-red-400', label: '已取消', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  };
  const { color, label, bgColor, borderColor } = config[status] || config.pending;
  const isBreathing = status === 'processing';

  return (
    <div className={`inline-flex items-center justify-center gap-2 px-3 py-1 border rounded-md ${bgColor} ${borderColor} min-w-[72px]`}>
      <span className={`inline-block h-2 w-2 rounded-full ${color} ${isBreathing ? 'animate-pulse' : ''}`} />
      <span className="text-sm whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function ProductionManagement() {
  const { currentUser } = useAppStore();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Raw materials (purchase categories) and finished products (sale categories)
  const [rawMaterials, setRawMaterials] = useState<ProductCategory[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<ProductCategory[]>([]);

  // Form state
  const [formDate, setFormDate] = useState(getTodayStr());
  const [formRemark, setFormRemark] = useState('');
  const [formRawMaterialId, setFormRawMaterialId] = useState('');
  const [formRawMaterialName, setFormRawMaterialName] = useState('');
  const [formInputWeight, setFormInputWeight] = useState(0);
  const [formOutputProductId, setFormOutputProductId] = useState('');
  const [formOutputProductName, setFormOutputProductName] = useState('');

  // Complete dialog state
  const [completeOutputWeight, setCompleteOutputWeight] = useState(0);
  const [completeInputWeight, setCompleteInputWeight] = useState(0);

  const [detailItems, setDetailItems] = useState<ProductionOrderItem[]>([]);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, ProductionOrderItem[]>>({});

  const loadCategories = useCallback(async () => {
    const [purchase, sale] = await Promise.all([
      dbProductCategories.getByCategory('purchase'),
      dbProductCategories.getByCategory('sale'),
    ]);
    setRawMaterials(purchase.filter(c => c.status === 'active'));
    setFinishedProducts(sale.filter(c => c.status === 'active'));
  }, []);

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const [list] = await Promise.all([
        dbProductionOrders.getAll(),
        loadCategories(),
      ]);
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setOrders(list);

      const allProductionItems = await dbProductionOrderItems.getAll();
      const map: Record<string, ProductionOrderItem[]> = {};
      for (const item of allProductionItems) {
        if (!map[item.orderId]) map[item.orderId] = [];
        map[item.orderId].push(item);
      }
      setOrderItemsMap(map);
    } finally {
      if (initialLoadRef.current) {
        setLoading(false);
        initialLoadRef.current = false;
      }
    }
  }, [loadCategories]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, [loadData]);

  const filtered = orders.filter(o => {
    const matchSearch = !searchTerm || o.orderNo.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(() =>
    filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

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

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    avgYield: orders.filter(o => o.status === 'completed' && o.avgYieldRate > 0).length > 0
      ? orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.avgYieldRate, 0) / orders.filter(o => o.status === 'completed').length
      : 0,
  };

  const selectRawMaterial = (id: string) => {
    const material = rawMaterials.find(m => m.id === id);
    if (material) {
      setFormRawMaterialId(id);
      setFormRawMaterialName(material.name);
    }
  };

  const selectOutputProduct = (id: string) => {
    const product = finishedProducts.find(p => p.id === id);
    if (product) {
      setFormOutputProductId(id);
      setFormOutputProductName(product.name);
    }
  };

  const createOrder = async () => {
    if (!formRawMaterialId) {
      toast.error('请选择生产原料');
      return;
    }
    if (!formOutputProductId) {
      toast.error('请选择产出成品');
      return;
    }
    if (formInputWeight <= 0) {
      toast.error('请输入投入重量');
      return;
    }

    const res = await fetch(`/api/orderNo?prefix=SCD&date=${formDate}`);
    const data = await res.json();
    const orderNo = data.orderNo;

    const order = await dbProductionOrders.add({
      orderNo,
      date: formDate,
      status: 'pending',
      inputTotal: formInputWeight,
      outputTotal: 0,
      avgYieldRate: 0,
      remark: formRemark,
      createdBy: currentUser?.name || '',
    });

    await dbProductionOrderItems.addBatch([{
      orderId: order.id,
      productId: formRawMaterialId,
      productName: formRawMaterialName,
      inputWeight: formInputWeight,
      currentStock: 0,
      outputWeight: 0,
      outputProductName: formOutputProductName,
      yieldRate: 0,
      remark: '',
    }]);

    await dbAuditLogs.add({ operator: currentUser?.name || '', module: '生产加工', action: '新建', detail: `新建生产单 ${orderNo}` });
    toast.success('生产单已创建');
    setShowNewDialog(false);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormDate(getTodayStr());
    setFormRemark('');
    setFormRawMaterialId('');
    setFormRawMaterialName('');
    setFormInputWeight(0);
    setFormOutputProductId('');
    setFormOutputProductName('');
  };

  const startProcessing = async (order: ProductionOrder) => {
    const items = await dbProductionOrderItems.getByOrderId(order.id);
    for (const item of items) {
      const allInv = await dbInventory.getAll();
      const inv = allInv.find(i => i.productName === item.productName);
      if (inv) {
        const newStock = Math.max(0, inv.rawMaterialStock - item.inputWeight);
        await dbInventory.put({ ...inv, rawMaterialStock: newStock });
        await dbInventoryLogs.add({
          inventoryId: inv.id,
          productName: item.productName,
          logType: '生产投料',
          relatedOrderNo: order.orderNo,
          quantity: -item.inputWeight,
          balance: newStock,
          remark: `生产单 ${order.orderNo}`,
          operator: currentUser?.name || '',
        });
      }
    }
    await dbProductionOrders.put({ ...order, status: 'processing' });
    toast.success('生产已开始，原料已锁定');
    loadData();
  };

  const openComplete = async (order: ProductionOrder) => {
    setSelectedOrder(order);
    const items = await dbProductionOrderItems.getByOrderId(order.id);
    if (items.length > 0) {
      setCompleteInputWeight(items[0].inputWeight);
    }
    setCompleteOutputWeight(0);
    setShowCompleteDialog(true);
  };

  const completeOrder = async () => {
    if (!selectedOrder) return;
    if (completeOutputWeight <= 0) {
      toast.error('请输入产出重量');
      return;
    }

    const items = await dbProductionOrderItems.getByOrderId(selectedOrder.id);
    const yieldRate = completeInputWeight > 0 ? completeOutputWeight / completeInputWeight : 0;
    const outputProductName = items[0]?.outputProductName || '';

    // Update production order items with output info
    for (const item of items) {
      await dbProductionOrderItems.put({
        ...item,
        outputWeight: completeOutputWeight,
        yieldRate,
      });
    }

    // Add finished product to inventory
    const allInv = await dbInventory.getAll();
    let inv = allInv.find(i => i.productName === outputProductName);
    if (!inv) {
      inv = await dbInventory.add({
        productName: outputProductName,
        category: '成品',
        rawMaterialStock: 0,
        finishedProductStock: 0,
        warningThreshold: 100,
        status: 'normal',
      });
    }
    const newFinishedStock = inv.finishedProductStock + completeOutputWeight;
    await dbInventory.put({ ...inv, finishedProductStock: newFinishedStock });
    await dbInventoryLogs.add({
      inventoryId: inv.id,
      productName: outputProductName,
      logType: '生产入库',
      relatedOrderNo: selectedOrder.orderNo,
      quantity: completeOutputWeight,
      balance: newFinishedStock,
      remark: `生产单 ${selectedOrder.orderNo}`,
      operator: currentUser?.name || '',
    });

    await dbProductionOrders.put({
      ...selectedOrder,
      status: 'completed',
      outputTotal: completeOutputWeight,
      avgYieldRate: yieldRate,
    });
    await dbAuditLogs.add({ operator: currentUser?.name || '', module: '生产加工', action: '完工', detail: `完工生产单 ${selectedOrder.orderNo}` });
    toast.success('生产已完成，成品已入库');
    setShowCompleteDialog(false);
    loadData();
  };

  const deleteOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const items = await dbProductionOrderItems.getByOrderId(id);

    if (order.status === 'processing') {
      for (const item of items) {
        const allInv = await dbInventory.getAll();
        const inv = allInv.find(i => i.productName === item.productName);
        if (inv) {
          const newStock = inv.rawMaterialStock + item.inputWeight;
          await dbInventory.put({ ...inv, rawMaterialStock: newStock });
          await dbInventoryLogs.add({
            inventoryId: inv.id,
            productName: item.productName,
            logType: '生产撤销',
            relatedOrderNo: order.orderNo,
            quantity: item.inputWeight,
            balance: newStock,
            remark: `删除加工中生产单 ${order.orderNo}`,
            operator: currentUser?.name || '',
          });
        }
      }
    }

    if (order.status === 'completed') {
      for (const item of items) {
        // Return raw material
        const allInvRaw = await dbInventory.getAll();
        const invRaw = allInvRaw.find(i => i.productName === item.productName);
        if (invRaw) {
          const newRaw = invRaw.rawMaterialStock + item.inputWeight;
          await dbInventory.put({ ...invRaw, rawMaterialStock: newRaw });
          await dbInventoryLogs.add({
            inventoryId: invRaw.id,
            productName: item.productName,
            logType: '生产撤销',
            relatedOrderNo: order.orderNo,
            quantity: item.inputWeight,
            balance: newRaw,
            remark: `删除已完成生产单 ${order.orderNo}，退回原料`,
            operator: currentUser?.name || '',
          });
        }
        // Remove finished product
        if (item.outputWeight > 0 && item.outputProductName) {
          const allInvFinished = await dbInventory.getAll();
          const invFinished = allInvFinished.find(i => i.productName === item.outputProductName);
          if (invFinished) {
            const newFinished = Math.max(0, invFinished.finishedProductStock - item.outputWeight);
            await dbInventory.put({ ...invFinished, finishedProductStock: newFinished });
            await dbInventoryLogs.add({
              inventoryId: invFinished.id,
              productName: item.outputProductName,
              logType: '生产撤销',
              relatedOrderNo: order.orderNo,
              quantity: -item.outputWeight,
              balance: newFinished,
              remark: `删除已完成生产单 ${order.orderNo}，扣减成品`,
              operator: currentUser?.name || '',
            });
          }
        }
      }
    }

    await dbProductionOrderItems.removeByOrderId(id);
    await dbProductionOrders.remove(id);
    await dbAuditLogs.add({ operator: currentUser?.name || '', module: '生产加工', action: '删除', detail: `删除生产单 ${order.orderNo}` });
    toast.success('生产单已删除，库存已回退');
    setConfirmDelete(null);
    loadData();
  };

  const viewDetail = async (order: ProductionOrder) => {
    setSelectedOrder(order);
    const items = await dbProductionOrderItems.getByOrderId(order.id);
    setDetailItems(items);
    setShowDetailSheet(true);
  };

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('没有可导出的数据'); return; }
    const headers = ['生产编号', '日期', '状态', '投入总量', '产出总量', '成品率', '备注'];
    const statusLabels: Record<string, string> = { pending: '待加工', processing: '加工中', completed: '已完成', cancelled: '已取消' };
    const rows = filtered.map(o => [
      o.orderNo, o.date, statusLabels[o.status] || o.status,
      o.inputTotal, o.outputTotal, formatYieldRate(o.avgYieldRate), o.remark,
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `生产数据_${getTodayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">生产加工</h2><p className="text-sm text-muted-foreground">管理生产单、投料、完工和成品率</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">待加工</div><div className="text-2xl font-bold mt-1">{stats.pending}</div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">加工中</div><div className="text-2xl font-bold mt-1 text-blue-600">{stats.processing}</div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">已完成</div><div className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">平均成品率</div><div className="text-2xl font-bold mt-1">{formatYieldRate(stats.avgYield)}</div></CardContent></Card>
      </div>

      <div className="rounded-lg border border-gray-200 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索生产单号..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">待加工</SelectItem>
              <SelectItem value="processing">加工中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { resetForm(); setShowNewDialog(true); }} className="bg-black text-white hover:bg-gray-800"><Plus className="h-4 w-4 mr-1" />新建生产单</Button>
          <Button variant="outline" onClick={handleExport} className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"><FileDown className="h-4 w-4 mr-1" />导出Excel</Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="暂无生产单" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>生产编号</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>生产原料</TableHead>
                <TableHead>产出成品</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">投入量</TableHead>
                <TableHead className="text-right">产出量</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginatedOrders.map(order => {
                  const items = orderItemsMap[order.id] || [];
                  const rawMaterial = items[0]?.productName || '-';
                  const outputProduct = items[0]?.outputProductName || '-';
                  return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                    <TableCell>{formatDate(order.date)}</TableCell>
                    <TableCell>{rawMaterial}</TableCell>
                    <TableCell>{outputProduct}</TableCell>
                    <TableCell><StatusDot status={order.status} /></TableCell>
                    <TableCell className="text-right font-mono">{formatWeight(order.inputTotal)}</TableCell>
                    <TableCell className="text-right font-mono">{formatWeight(order.outputTotal)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton icon={<Eye className="h-3.5 w-3.5" />} tooltip="查看详情" onClick={() => viewDetail(order)} />
                        {order.status === 'pending' && (
                          <IconButton icon={<Play className="h-3.5 w-3.5" />} tooltip="开始加工" onClick={() => startProcessing(order)} />
                        )}
                        {order.status === 'processing' && (
                          <IconButton icon={<CheckCircle2 className="h-3.5 w-3.5" />} tooltip="完工录入" onClick={() => openComplete(order)} />
                        )}
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

      {filtered.length > 0 && totalPages > 1 && (
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
              {pageNumbers.map((p, idx) => (
                <PaginationItem key={idx}>
                  {p === 'ellipsis' ? (
                    <span className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(p)}
                      isActive={p === safePage}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
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

      {/* New Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>新建生产单</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>加工日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={`w-full justify-start text-left font-normal gap-2 h-9 ${!formDate ? 'text-muted-foreground' : ''}`}>
                      <CalendarIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{formDate ? dateFnsFormat(dateFnsParse(formDate, 'yyyy-MM-dd', new Date()), 'yyyy年MM月dd日', { locale: zhCN }) : '选择日期'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formDate ? dateFnsParse(formDate, 'yyyy-MM-dd', new Date()) : undefined} onSelect={(d) => setFormDate(d ? dateFnsFormat(d, 'yyyy-MM-dd') : '')} defaultMonth={formDate ? dateFnsParse(formDate, 'yyyy-MM-dd', new Date()) : new Date()} locale={zhCN} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2"><Label>备注</Label><Input value={formRemark} onChange={e => setFormRemark(e.target.value)} /></div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="font-medium">生产原料 <span className="text-red-500">*</span></Label>
              <Select value={formRawMaterialId} onValueChange={selectRawMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="选择生产原料（进货分类）" />
                </SelectTrigger>
                <SelectContent>
                  {rawMaterials.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}{m.spec ? ` (${m.spec})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rawMaterials.length === 0 && (
                <p className="text-xs text-muted-foreground">暂无可选原料，请先在系统管理中添加进货分类</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-medium">产出成品 <span className="text-red-500">*</span></Label>
              <Select value={formOutputProductId} onValueChange={selectOutputProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="选择产出成品（出货分类）" />
                </SelectTrigger>
                <SelectContent>
                  {finishedProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}{p.spec ? ` (${p.spec})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {finishedProducts.length === 0 && (
                <p className="text-xs text-muted-foreground">暂无可选成品，请先在系统管理中添加出货分类</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-medium">投入重量 (KG) <span className="text-red-500">*</span></Label>
              <Input type="number" value={formInputWeight || ''} onChange={e => setFormInputWeight(Number(e.target.value) || 0)} placeholder="输入投入重量" />
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNewDialog(false)}>取消</Button><Button onClick={createOrder} className="bg-black text-white hover:bg-gray-800">创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>完工录入</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>生产单号:</span><span className="font-medium">{selectedOrder?.orderNo}</span></div>
              <div className="flex justify-between"><span>投入重量:</span><span className="font-mono">{formatWeight(completeInputWeight)}</span></div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="font-medium">产出成品</Label>
              <div className="text-sm font-medium text-green-600 bg-green-50 rounded-md px-3 py-2">
                {(() => {
                  const items = selectedOrder ? orderItemsMap[selectedOrder.id] : [];
                  return items[0]?.outputProductName || '-';
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">产出重量 (KG) <span className="text-red-500">*</span></Label>
              <Input type="number" value={completeOutputWeight || ''} onChange={e => setCompleteOutputWeight(Number(e.target.value) || 0)} placeholder="输入产出重量" />
            </div>

            <div className="bg-blue-50 rounded-md p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">成品率:</span>
                <span className="font-mono font-medium text-blue-600">
                  {formatYieldRate(completeInputWeight > 0 ? completeOutputWeight / completeInputWeight : 0)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCompleteDialog(false)}>取消</Button><Button onClick={completeOrder} className="bg-black text-white hover:bg-gray-800">确认完工</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <DetailSheet
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        title="生产单详情"
        subtitle={selectedOrder?.orderNo}
        badge={selectedOrder && <StatusDot status={selectedOrder.status} />}
      >
        {selectedOrder && (
          <>
            <div className="rounded-lg border bg-card p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">投入总量</span>
                <span className="text-base font-semibold font-mono">{formatWeight(selectedOrder.inputTotal)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">产出总量</span>
                <span className="text-sm font-mono text-green-600 font-medium">{formatWeight(selectedOrder.outputTotal)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">成品率</span>
                <span className="text-sm font-mono text-blue-600 font-medium">{formatYieldRate(selectedOrder.avgYieldRate)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">状态</span>
                <StatusDot status={selectedOrder.status} />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">生产编号</div>
                  <div className="text-sm font-mono">{selectedOrder.orderNo}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">日期</div>
                  <div className="text-sm">{formatDate(selectedOrder.date)}</div>
                </div>
              </div>
              {selectedOrder.remark && (
                <><Separator /><div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">备注</div>
                  <div className="text-sm text-muted-foreground">{selectedOrder.remark}</div>
                </div></>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">生产明细</h4>
              </div>
              {detailItems.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left py-2 px-3 font-medium">原料</th>
                        <th className="text-left py-2 px-3 font-medium">成品</th>
                        <th className="text-right py-2 px-3 font-medium">产出(KG)</th>
                        <th className="text-right py-2 px-3 font-medium">成品率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailItems.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-b-0">
                          <td className="py-2 px-3 font-medium">{item.productName}</td>
                          <td className="py-2 px-3 text-green-600">{item.outputProductName || '-'}</td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums">{formatWeight(item.outputWeight)}</td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums">{formatYieldRate(item.yieldRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/20 py-6 text-center text-xs text-muted-foreground">
                  暂无生产明细
                </div>
              )}
            </div>
          </>
        )}
      </DetailSheet>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)} title="确认删除" description="删除生产单将同时回退库存变动，确定要删除吗？" onConfirm={() => confirmDelete && deleteOrder(confirmDelete)} confirmText="删除" />
    </div>
  );
}
