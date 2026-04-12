'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DetailSheet, InfoSection, InfoRow, SummaryCards,
} from '@/components/shared/DetailSheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { dbLogisticsRecords, dbAuditLogs } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatMoney, formatDate, getTodayStr } from '@/lib/format';
import { LOGISTICS_STATUSES } from '@/lib/constants';
import { IconButton } from '@/components/shared/IconButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { LogisticsRecord } from '@/lib/types';

export default function LogisticsManagement() {
  const { currentUser } = useAppStore();
  const [records, setRecords] = useState<LogisticsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showDialog, setShowDialog] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing] = useState<LogisticsRecord | null>(null);
  const [selected, setSelected] = useState<LogisticsRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({ type: 'purchase' as const, relatedOrderNo: '', plateNumber: '', driver: '', freight: 0, date: getTodayStr(), fromAddress: '', toAddress: '', status: 'pending' as const, remark: '' });

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try { const list = await dbLogisticsRecords.getAll(); list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); setRecords(list); } finally {
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

  const filtered = records.filter(r => {
    const matchSearch = !searchTerm || r.relatedOrderNo.includes(searchTerm) || r.plateNumber.includes(searchTerm) || r.driver.includes(searchTerm);
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() =>
    filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, typeFilter, statusFilter]);

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

  const openNew = () => { setEditing(null); setForm({ type: 'purchase', relatedOrderNo: '', plateNumber: '', driver: '', freight: 0, date: getTodayStr(), fromAddress: '', toAddress: '', status: 'pending', remark: '' }); setShowDialog(true); };
  const openEdit = (r: LogisticsRecord) => { setEditing(r); setForm({ type: r.type, relatedOrderNo: r.relatedOrderNo, plateNumber: r.plateNumber, driver: r.driver, freight: r.freight, date: r.date, fromAddress: r.fromAddress, toAddress: r.toAddress, status: r.status, remark: r.remark }); setShowDialog(true); };

  const save = async () => {
    if (!form.relatedOrderNo) { toast.error('请输入关联单据'); return; }
    if (editing) { await dbLogisticsRecords.put({ ...editing, ...form }); toast.success('记录已更新'); }
    else { await dbLogisticsRecords.add(form); toast.success('记录已创建'); }
    await dbAuditLogs.add({ operator: currentUser?.name || '', module: '物流运输', action: editing ? '编辑' : '新建', detail: `${editing ? '编辑' : '新建'}物流记录 ${form.relatedOrderNo}` });
    setShowDialog(false); loadData();
  };

  const deleteRecord = async (id: string) => { await dbLogisticsRecords.remove(id); toast.success('记录已删除'); setConfirmDelete(null); loadData(); };

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('没有可导出的数据'); return; }
    const headers = ['关联单据', '类型', '车牌号', '司机', '运费', '发地址', '收地址', '运输日期', '状态'];
    const typeLabels: Record<string, string> = { purchase: '采购', sale: '出货' };
    const statusLabels: Record<string, string> = { pending: '待发货', in_transit: '运输中', arrived: '已到达' };
    const rows = filtered.map(r => [
      r.relatedOrderNo, typeLabels[r.type] || r.type, r.plateNumber, r.driver,
      r.freight, r.fromAddress, r.toAddress, r.date, statusLabels[r.status] || r.status,
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `物流数据_${getTodayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">物流运输</h2><p className="text-sm text-muted-foreground">管理采购与出货相关的物流运输记录</p></div>
      <div className="rounded-lg border border-gray-200 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="搜索单据号/车牌/司机..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" /></div>
          <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-28"><SelectValue placeholder="类型" /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="purchase">采购</SelectItem><SelectItem value="sale">出货</SelectItem></SelectContent></Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-28"><SelectValue placeholder="状态" /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="pending">待发货</SelectItem><SelectItem value="in_transit">运输中</SelectItem><SelectItem value="arrived">已到达</SelectItem></SelectContent></Select>
          <Button onClick={openNew} className="bg-black text-white hover:bg-gray-800"><Plus className="h-4 w-4 mr-1" />新增</Button>
          <Button variant="outline" onClick={handleExport} className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"><FileDown className="h-4 w-4 mr-1" />导出Excel</Button>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="暂无物流记录" /> : (
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>关联单据</TableHead><TableHead>类型</TableHead><TableHead>车牌号</TableHead><TableHead>司机</TableHead><TableHead className="text-right">运费</TableHead><TableHead>收发地址</TableHead><TableHead>运输日期</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
            <TableBody>{paginatedRecords.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.relatedOrderNo}</TableCell>
                <TableCell><Badge variant="secondary" className={r.type === 'purchase' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}>{r.type === 'purchase' ? '采购' : '出货'}</Badge></TableCell>
                <TableCell>{r.plateNumber}</TableCell><TableCell>{r.driver}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(r.freight)}</TableCell>
                <TableCell className="max-w-[150px] truncate text-xs">{r.fromAddress} → {r.toAddress}</TableCell>
                <TableCell>{formatDate(r.date)}</TableCell>
                <TableCell><StatusBadge status={r.status} statusMap={[...LOGISTICS_STATUSES]} /></TableCell>
                <TableCell className="text-right"><div className="flex items-center justify-end gap-0.5">
                  <IconButton icon={<Eye className="h-3.5 w-3.5" />} tooltip="查看详情" onClick={() => { setSelected(r); setShowDetail(true); }} />
                  <IconButton icon={<Pencil className="h-3.5 w-3.5" />} tooltip="编辑" onClick={() => openEdit(r)} />
                  <IconButton icon={<Trash2 className="h-3.5 w-3.5" />} tooltip="删除" onClick={() => setConfirmDelete(r.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50" />
                </div></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table></div>
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing ? '编辑' : '新增'}物流记录</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>类型</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v as 'purchase' | 'sale' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="purchase">采购</SelectItem><SelectItem value="sale">出货</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>关联单据 *</Label><Input value={form.relatedOrderNo} onChange={e => setForm({ ...form, relatedOrderNo: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>车牌号</Label><Input value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} /></div>
            <div className="space-y-2"><Label>司机</Label><Input value={form.driver} onChange={e => setForm({ ...form, driver: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>运费 (¥)</Label><Input type="number" value={form.freight || ''} onChange={e => setForm({ ...form, freight: Number(e.target.value) || 0 })} /></div>
            <div className="space-y-2"><Label>运输日期</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>发地址</Label><Input value={form.fromAddress} onChange={e => setForm({ ...form, fromAddress: e.target.value })} /></div>
            <div className="space-y-2"><Label>收地址</Label><Input value={form.toAddress} onChange={e => setForm({ ...form, toAddress: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>状态</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v as LogisticsRecord['status'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">待发货</SelectItem><SelectItem value="in_transit">运输中</SelectItem><SelectItem value="arrived">已到达</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>备注</Label><Input value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button><Button onClick={save} className="bg-black text-white hover:bg-gray-800">保存</Button></DialogFooter>
      </DialogContent></Dialog>

      {/* Detail Sheet */}
      <DetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        title="物流详情"
        subtitle={selected?.relatedOrderNo}
        badge={selected && <StatusBadge status={selected.status} statusMap={[...LOGISTICS_STATUSES]} />}
      >
        {selected && (<>
          <SummaryCards cards={[
            { label: '运费', value: formatMoney(selected.freight), valueClassName: 'font-mono' },
            { label: '类型', value: selected.type === 'purchase' ? '采购' : '出货' },
            { label: '运输日期', value: formatDate(selected.date) },
            { label: '状态', value: LOGISTICS_STATUSES.find(s => s.value === selected.status)?.label || '-' },
          ]} />

          <InfoSection title="运输信息">
            <InfoRow label="关联单据" value={<span className="font-mono text-xs">{selected.relatedOrderNo}</span>} />
            <InfoRow label="车牌号" value={selected.plateNumber || '-'} />
            <InfoRow label="司机" value={selected.driver || '-'} />
            <InfoRow label="发地址" value={selected.fromAddress || '-'} />
            <InfoRow label="收地址" value={selected.toAddress || '-'} />
            {selected.remark && <InfoRow label="备注" value={selected.remark} />}
          </InfoSection>
        </>)}
      </DetailSheet>
      <ConfirmDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)} title="确认删除" description="确定删除该物流记录？" onConfirm={() => confirmDelete && deleteRecord(confirmDelete)} confirmText="删除" />
    </div>
  );
}
