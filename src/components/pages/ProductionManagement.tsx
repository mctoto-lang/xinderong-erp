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
import { Plus, Search, FileDown, Eye, Trash2, Play, CheckCircle2, X, ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format as dateFnsFormat, parse as dateFnsParse } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { dbProductionOrders, dbProductionOrderItems, dbPurchaseOrderItems, dbInventory, dbInventoryLogs, dbAuditLogs } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatMoney, formatDate, formatWeight, formatYieldRate, getTodayStr } from '@/lib/format';
import { IconButton } from '@/components/shared/IconButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import type { ProductionOrder, ProductionOrderItem, PurchaseOrderItem } from '@/lib/types';

// Tag colors for raw material selection (max 3)
const TAG_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
];

// Breathing dot status component
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

  // Available raw materials from purchase orders
  const [availableMaterials, setAvailableMaterials] = useState<PurchaseOrderItem[]>([]);

  const [formDate, setFormDate] = useState(getTodayStr());
  const [formRemark, setFormRemark] = useState('');
  // Max 3 selected materials, each with inputWeight
  const [formItems, setFormItems] = useState<Array<{ productId: string; productName: string; inputWeight: number; remark: string }>>([]);
  const [completeItems, setCompleteItems] = useState<ProductionOrderItem[]>([]);
  const [detailItems, setDetailItems] = useState<ProductionOrderItem[]>([]);
  // Cache: orderId -> items
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, ProductionOrderItem[]>>({});

  // Load available materials (unique products from purchase order items)
  const loadMaterials = useCallback(async () => {
    const allItems = await dbPurchaseOrderItems.getAll();
    // Deduplicate by productName
    const seen = new Map<string, PurchaseOrderItem>();
    for (const item of allItems) {
      if (!seen.has(item.productName)) {
        seen.set(item.productName, item);
      }
    }
    setAvailableMaterials(Array.from(seen.values()));
  }, []);

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const [list] = await Promise.all([
        dbProductionOrders.getAll(),
        loadMaterials(),
      ]);
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
  }, [loadMaterials]);

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

  // Select a raw material (max 3)
  const selectMaterial = (item: PurchaseOrderItem) => {
    if (formItems.length >= 3) {
      toast.error('最多选择3项原料');
      return;
    }
    if (formItems.some(f => f.productId === item.productId && f.productName === item.productName)) {
      toast.error('该原料已选择');
      return;
    }
    setFormItems(prev => [...prev, {
      productId: item.productId || item.productName,
      productName: item.productName,
      inputWeight: 0,
      remark: '',
    }]);
  };

  const removeFormItem = (idx: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== idx));
  };

  const createOrder = async () => {
    const validItems = formItems.filter(i => i.productName && i.inputWeight > 0);
    if (validItems.length === 0) { toast.error('请选择至少一项原料并输入重量'); return; }

    const res = await fetch(`/api/orderNo?prefix=SCD&date=${formDate}`);
    const data = await res.json();
    const orderNo = data.orderNo;
    const inputTotal = validItems.reduce((s, i) => s + i.inputWeight, 0);
    const order = await dbProductionOrders.add({
      orderNo, date: formDate, status: 'pending', inputTotal, outputTotal: 0, avgYieldRate: 0,
      remark: formRemark, createdBy: currentUser?.name || '',
    });

    await dbProductionOrderItems.addBatch(validItems.map(i => ({
      orderId: order.id, productId: i.productId || '', productName: i.productName,
      inputWeight: i.inputWeight, currentStock: 0, outputWeight: 0, yieldRate: 0, remark: i.remark,
    })));

    await dbAuditLogs.add({ operator: currentUser?.name || '', module: '生产加工', action: '新建', detail: `新建生产单 ${orderNo}` });
    toast.success('生产单已创建');
    setShowNewDialog(false);
    setFormItems([]);
    loadData();
  };

  const startProcessing = async (order: ProductionOrder) => {
    const items = await dbProductionOrderItems.getByOrderId(order.id);
    // Lock raw materials
    for (const item of items) {
      const allInv = await dbInventory.getAll();
      const inv = allInv.find(i => i.productName === item.productName);
      if (inv) {
        const newStock = Math.max(0, inv.rawMaterialStock - item.inputWeight);
        await dbInventory.put({ ...inv, rawMaterialStock: newStock });
        await dbInventoryLogs.add({
          inventoryId: inv.id, productName: item.productName, logType: '生产投料',
          relatedOrderNo: order.orderNo, quantity: -item.inputWeight, balance: newStock,
          remark: `生产单 ${order.orderNo}`, operator: currentUser?.name || '',
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
    setCompleteItems(items);
    setShowCompleteDialog(true);
  };

  const completeOrder = async () => {
    if (!selectedOrder) return;
    let totalInput = 0, totalOutput = 0;
    const updatedItems: ProductionOrderItem[] = [];

    for (const item of completeItems) {
      if (item.outputWeight > 0) {
        updatedItems.push({ ...item, yieldRate: item.inputWeight > 0 ? item.outputWeight / item.inputWeight : 0 });
        totalInput += item.inputWeight;
        totalOutput += item.outputWeight;
      } else {
        updatedItems.push(item);
        totalInput += item.inputWeight;
      }
    }

    // Add finished products to inventory
    for (const item of updatedItems) {
      if (item.outputWeight > 0) {
        const allInv = await dbInventory.getAll();
        let inv = allInv.find(i => i.productName === item.productName);
        if (!inv) {
          inv = await dbInventory.add({ productName: item.productName, category: '成品', rawMaterialStock: 0, finishedProductStock: 0, warningThreshold: 100, status: 'normal' });
        }
        const newStock = inv.finishedProductStock + item.outputWeight;
        await dbInventory.put({ ...inv, finishedProductStock: newStock });
        await dbInventoryLogs.add({
          inventoryId: inv.id, productName: item.productName, logType: '生产入库',
          relatedOrderNo: selectedOrder.orderNo, quantity: item.outputWeight, balance: newStock,
          remark: `生产单 ${selectedOrder.orderNo}`, operator: currentUser?.name || '',
        });
      }
      await dbProductionOrderItems.put(item);
    }

    const avgYield = totalInput > 0 ? totalOutput / totalInput : 0;
    await dbProductionOrders.put({ ...selectedOrder, status: 'completed', outputTotal: totalOutput, avgYieldRate: avgYield });
    await dbAuditLogs.add({ operator: currentUser?.name || '', module: '生产加工', action: '完工', detail: `完工生产单 ${selectedOrder.orderNo}` });
    toast.success('生产已完成，原料已转换为成品');
    setShowCompleteDialog(false);
    loadData();
  };

  // Delete order in ANY status with proper inventory rollback
  const deleteOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const items = await dbProductionOrderItems.getByOrderId(id);

    if (order.status === 'processing') {
      // Rollback: return locked raw materials
      for (const item of items) {
        const allInv = await dbInventory.getAll();
        const inv = allInv.find(i => i.productName === item.productName);
        if (inv) {
          const newStock = inv.rawMaterialStock + item.inputWeight;
          await dbInventory.put({ ...inv, rawMaterialStock: newStock });
          await dbInventoryLogs.add({
            inventoryId: inv.id, productName: item.productName, logType: '生产撤销',
            relatedOrderNo: order.orderNo, quantity: item.inputWeight, balance: newStock,
            remark: `删除加工中生产单 ${order.orderNo}`, operator: currentUser?.name || '',
          });
        }
      }
    }

    if (order.status === 'completed') {
      // Rollback: remove finished products, return raw materials
      for (const item of items) {
        const allInv = await dbInventory.getAll();
        const inv = allInv.find(i => i.productName === item.productName);
        if (inv) {
          // Remove finished products
          const newFinished = Math.max(0, inv.finishedProductStock - (item.outputWeight || 0));
          // Return raw materials
          const newRaw = inv.rawMaterialStock + item.inputWeight;
          await dbInventory.put({ ...inv, finishedProductStock: newFinished, rawMaterialStock: newRaw });
          await dbInventoryLogs.add({
            inventoryId: inv.id, productName: item.productName, logType: '生产撤销',
            relatedOrderNo: order.orderNo, quantity: -(item.outputWeight || 0), balance: newFinished,
            remark: `删除已完成生产单 ${order.orderNo}，退回原料`, operator: currentUser?.name || '',
          });
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">待加工</div><div className="text-2xl font-bold mt-1">{stats.pending}</div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">加工中</div><div className="text-2xl font-bold mt-1 text-blue-600">{stats.processing}</div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">已完成</div><div className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">平均成品率</div><div className="text-2xl font-bold mt-1">{formatYieldRate(stats.avgYield)}</div></CardContent></Card>
      </div>

      {/* Toolbar */}
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
          <Button onClick={() => { setFormDate(getTodayStr()); setFormRemark(''); setFormItems([]); setShowNewDialog(true); }} className="bg-black text-white hover:bg-gray-800"><Plus className="h-4 w-4 mr-1" />新建生产单</Button>
          <Button variant="outline" onClick={handleExport} className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"><FileDown className="h-4 w-4 mr-1" />导出Excel</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="暂无生产单" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>生产编号</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>生产原料</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">投入总量</TableHead>
                <TableHead className="text-right">产出总量</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginatedOrders.map(order => {
                  const items = orderItemsMap[order.id] || [];
                  return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                    <TableCell>{formatDate(order.date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {items.map((item, idx) => (
                          <span key={item.id} className="text-sm text-black">
                            {item.productName}
                          </span>
                        ))}
                      </div>
                    </TableCell>
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

      {/* Pagination */}
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

      {/* New Dialog - Select raw materials */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center justify-between">
                <Label className="font-medium">选择生产原料（最多3项）</Label>
                <Badge variant="secondary" className="text-xs">{formItems.length}/3</Badge>
              </div>
              {availableMaterials.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">暂无可选原料，请先创建进货单</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {availableMaterials
                    .filter(m => !formItems.some(f => f.productId === m.productId && f.productName === m.productName))
                    .map(item => (
                      <Button key={item.productId} variant="outline" size="sm" className="text-xs" onClick={() => selectMaterial(item)}>
                        <Plus className="h-3 w-3 mr-1" />{item.productName}
                      </Button>
                    ))}
                </div>
              )}
            </div>

            {formItems.length > 0 && (
              <div className="space-y-2">
                <Label className="font-medium">已选原料</Label>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>原料</TableHead>
                      <TableHead className="w-36">投入重量(KG)</TableHead>
                      <TableHead className="w-24">备注</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {formItems.map((item, idx) => (
                        <TableRow key={`${item.productId}-${idx}`}>
                          <TableCell>
                            <Badge variant="outline" className={TAG_COLORS[idx % TAG_COLORS.length]}>{item.productName}</Badge>
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={item.inputWeight || ''} onChange={e => setFormItems(prev => prev.map((i, j) => j === idx ? { ...i, inputWeight: Number(e.target.value) || 0 } : i))} className="h-8" placeholder="重量" />
                          </TableCell>
                          <TableCell>
                            <Input value={item.remark} onChange={e => setFormItems(prev => prev.map((i, j) => j === idx ? { ...i, remark: e.target.value } : i))} className="h-8" placeholder="选填" />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFormItem(idx)}>
                              <X className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNewDialog(false)}>取消</Button><Button onClick={createOrder} className="bg-black text-white hover:bg-gray-800">创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>完工录入</DialogTitle></DialogHeader>
          <Table>
            <TableHeader><TableRow><TableHead>产品</TableHead><TableHead className="text-right">投入</TableHead><TableHead className="text-right">产出(KG)</TableHead><TableHead className="text-right">成品率</TableHead></TableRow></TableHeader>
            <TableBody>
              {completeItems.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="text-right font-mono">{formatWeight(item.inputWeight)}</TableCell>
                  <TableCell><Input type="number" value={item.outputWeight || ''} onChange={e => setCompleteItems(prev => prev.map((i, j) => j === idx ? { ...i, outputWeight: Number(e.target.value) || 0 } : i))} className="h-8 w-28" /></TableCell>
                  <TableCell className="text-right">{formatYieldRate(item.inputWeight > 0 ? (item.outputWeight || 0) / item.inputWeight : 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="text-sm text-muted-foreground text-right">
            总投入: {formatWeight(completeItems.reduce((s, i) => s + i.inputWeight, 0))} | 总产出: {formatWeight(completeItems.reduce((s, i) => s + (i.outputWeight || 0), 0))} | 成品率: {formatYieldRate(completeItems.reduce((s, i) => s + i.inputWeight, 0) > 0 ? completeItems.reduce((s, i) => s + (i.outputWeight || 0), 0) / completeItems.reduce((s, i) => s + i.inputWeight, 0) : 0)}
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
            {/* Summary */}
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

            {/* Basic Info */}
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

            {/* Production Items */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">生产明细</h4>
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{detailItems.length} 项</Badge>
              </div>
              <DetailTable
                columns={[
                  { key: 'productName', label: '原料' },
                  { key: 'inputWeight', label: '投入(KG)', align: 'right' },
                  { key: 'outputWeight', label: '产出(KG)', align: 'right' },
                  { key: 'yieldRate', label: '成品率', align: 'right' },
                ]}
                data={detailItems.map((item, idx) => ({
                  productName: <Badge variant="outline" className={TAG_COLORS[idx % TAG_COLORS.length]}>{item.productName}</Badge>,
                  inputWeight: formatWeight(item.inputWeight),
                  outputWeight: formatWeight(item.outputWeight),
                  yieldRate: formatYieldRate(item.yieldRate),
                }))}
              />
            </div>
          </>
        )}
      </DetailSheet>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)} title="确认删除" description="删除生产单将同时回退库存变动，确定要删除吗？" onConfirm={() => confirmDelete && deleteOrder(confirmDelete)} confirmText="删除" />
    </div>
  );
}
