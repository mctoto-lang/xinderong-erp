'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  DetailSheet, DetailTable,
} from '@/components/shared/DetailSheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Eye, RotateCcw, Settings2 } from 'lucide-react';
import { dbInventory, dbInventoryLogs } from '@/lib/api';
import { formatWeight, formatDate, formatDateTime } from '@/lib/format';
import { INVENTORY_LOG_TYPES } from '@/lib/constants';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { IconButton } from '@/components/shared/IconButton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { toast } from 'sonner';
import type { Inventory, InventoryLog } from '@/lib/types';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | '原料' | '成品'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [showThresholdDialog, setShowThresholdDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Inventory | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [thresholdValue, setThresholdValue] = useState(0);

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const list = await dbInventory.getAll();
      let needsUpdate = false;
      const updated = list.map(item => {
        const isWarning = item.rawMaterialStock < item.warningThreshold || item.finishedProductStock < item.warningThreshold;
        if (item.status !== (isWarning ? 'warning' : 'normal')) {
          needsUpdate = true;
          return { ...item, status: isWarning ? 'warning' as const : 'normal' as const };
        }
        return item;
      });
      if (needsUpdate) {
        for (const item of updated) {
          if (item.status !== list.find(i => i.id === item.id)?.status) {
            await dbInventory.put(item);
          }
        }
      }
      setInventory(needsUpdate ? updated : list);
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

  // Split inventory into raw/finished rows
  const inventoryRows: Array<Inventory & { displayType: string; displayStock: number }> = [];
  for (const item of inventory) {
    if (item.rawMaterialStock > 0) {
      inventoryRows.push({ ...item, displayType: '原料库存', displayStock: item.rawMaterialStock });
    }
    if (item.finishedProductStock > 0) {
      inventoryRows.push({ ...item, displayType: '成品库存', displayStock: item.finishedProductStock });
    }
    if (item.rawMaterialStock === 0 && item.finishedProductStock === 0) {
      inventoryRows.push({ ...item, displayType: item.category || '原料库存', displayStock: 0 });
    }
  }

  const filtered = inventoryRows.filter(i => {
    const matchSearch = !searchTerm || i.productName.includes(searchTerm);
    const matchTab = tabFilter === 'all' || i.displayType === `${tabFilter}库存`;
    return matchSearch && matchTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() =>
    filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, tabFilter]);

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
    rawTotal: inventory.reduce((s, i) => s + i.rawMaterialStock, 0),
    finishedTotal: inventory.reduce((s, i) => s + i.finishedProductStock, 0),
    warningCount: inventoryRows.filter(i => i.displayStock < i.warningThreshold).length,
    productCount: inventory.length,
  };

  const viewLogs = async (item: Inventory) => {
    setSelectedProduct(item);
    const allLogs = await dbInventoryLogs.getAll();
    setLogs(allLogs.filter(l => l.productName === item.productName).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setLogTypeFilter('all');
    setShowLogSheet(true);
  };

  const openThreshold = (item: Inventory) => {
    setSelectedProduct(item);
    setThresholdValue(item.warningThreshold);
    setShowThresholdDialog(true);
  };

  const saveThreshold = async () => {
    if (!selectedProduct) return;
    const isWarning = selectedProduct.rawMaterialStock < thresholdValue && selectedProduct.finishedProductStock < thresholdValue;
    await dbInventory.put({ 
      id: selectedProduct.id,
      productName: selectedProduct.productName,
      category: selectedProduct.category,
      rawMaterialStock: selectedProduct.rawMaterialStock,
      finishedProductStock: selectedProduct.finishedProductStock,
      warningThreshold: thresholdValue, 
      status: isWarning ? 'warning' : 'normal',
      createdAt: selectedProduct.createdAt,
      updatedAt: new Date().toISOString(),
    });
    toast.success('预警阈值已更新');
    setShowThresholdDialog(false);
    loadData();
  };

  const filteredLogs = logs.filter(l => logTypeFilter === 'all' || l.logType === logTypeFilter);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">库存管理</h2><p className="text-sm text-muted-foreground">查看原料/成品库存、预警设置和库存变动日志</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">原料库存总量</div><div className="text-2xl font-bold mt-1">{formatWeight(stats.rawTotal)}</div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">成品库存总量</div><div className="text-2xl font-bold mt-1">{formatWeight(stats.finishedTotal)}</div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">库存预警数量</div><div className="text-2xl font-bold mt-1 text-red-600">{stats.warningCount}</div></CardContent></Card>
        <Card className="border-gray-200"><CardContent className="pt-6"><div className="text-sm text-muted-foreground">产品种类数</div><div className="text-2xl font-bold mt-1">{stats.productCount}</div></CardContent></Card>
      </div>

      <div className="rounded-lg border border-gray-200 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索产品名称..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <div className="flex rounded-md border overflow-hidden">
            {(['all', '原料', '成品'] as const).map(tab => (
              <Button
                key={tab}
                variant="ghost"
                size="sm"
                className={`rounded-none border-0 px-3 text-xs ${tabFilter === tab ? 'bg-black text-white hover:bg-black hover:text-white' : 'hover:bg-muted'}`}
                onClick={() => setTabFilter(tab)}
              >
                {tab === 'all' ? '全部' : `${tab}库存`}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setTabFilter('all'); loadData(); }}><RotateCcw className="h-4 w-4 mr-1" />重置</Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="暂无库存数据" description="进货或生产后库存数据将自动更新" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>名称</TableHead><TableHead>分类</TableHead><TableHead className="text-right">库存数量</TableHead>
                <TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {paginatedItems.map((item, idx) => {
                  const isWarning = item.displayStock < item.warningThreshold;
                  const typeColor = item.displayType === '原料库存' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
                  return (
                    <TableRow key={`${item.id}-${idx}`} className={isWarning ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell><Badge variant="secondary" className={typeColor}>{item.displayType}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{formatWeight(item.displayStock)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={isWarning ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {isWarning ? '预警' : '正常'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <IconButton icon={<Eye className="h-3.5 w-3.5" />} tooltip="查看日志" onClick={() => viewLogs(item)} />
                          <IconButton icon={<Settings2 className="h-3.5 w-3.5" />} tooltip="设置预警阈值" onClick={() => openThreshold(item)} />
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

      {/* Threshold Dialog */}
      <Dialog open={showThresholdDialog} onOpenChange={setShowThresholdDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>设置预警阈值</DialogTitle></DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="text-sm">
                产品: <span className="font-medium">{selectedProduct.productName}</span>
              </div>
              <div className="space-y-2">
                <Label>预警阈值 (KG)</Label>
                <Input
                  type="number"
                  value={thresholdValue || ''}
                  onChange={e => setThresholdValue(Number(e.target.value) || 0)}
                  placeholder="当库存低于此值时预警"
                />
                <p className="text-xs text-muted-foreground">当原料库存或成品库存低于此值时，将显示预警状态</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowThresholdDialog(false)}>取消</Button>
            <Button onClick={saveThreshold} className="bg-black text-white hover:bg-gray-800">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Sheet */}
      <DetailSheet
        open={showLogSheet}
        onOpenChange={setShowLogSheet}
        title={`库存变动 - ${selectedProduct?.productName || ''}`}
        badge={selectedProduct && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${selectedProduct.status === 'warning' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {selectedProduct.status === 'warning' ? '预警' : '正常'}
          </span>
        )}
      >
        {selectedProduct && (
          <>
            {/* Summary */}
            <div className="rounded-lg border bg-card p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">原料库存</span>
                <span className="text-base font-semibold font-mono">{formatWeight(selectedProduct.rawMaterialStock)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">成品库存</span>
                <span className="text-sm font-mono text-green-600 font-medium">{formatWeight(selectedProduct.finishedProductStock)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">预警阈值</span>
                <span className="text-sm font-mono text-muted-foreground">{formatWeight(selectedProduct.warningThreshold)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">状态</span>
                <Badge variant="secondary" className={selectedProduct.status === 'warning' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                  {selectedProduct.status === 'warning' ? '预警' : '正常'}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
                <SelectTrigger className="w-full"><SelectValue placeholder="日志类型" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {INVENTORY_LOG_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {filteredLogs.length === 0 ? <EmptyState title="暂无日志" /> : filteredLogs.map(log => (
                <div key={log.id} className="rounded-lg border bg-card/50 px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">{log.logType}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                  </div>
                  <div className="text-sm">{log.remark}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{log.operator} | {log.relatedOrderNo}</span>
                    <span className={log.quantity >= 0 ? 'text-green-600 font-mono' : 'text-red-600 font-mono'}>
                      {log.quantity >= 0 ? '+' : ''}{formatWeight(log.quantity)} → 余额: {formatWeight(log.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DetailSheet>
    </div>
  );
}
