'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  DetailSheet, InfoSection, InfoRow, SummaryCards,
} from '@/components/shared/DetailSheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { dbSuppliers, dbPurchaseOrders, dbAuditLogs } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatMoney, formatDate } from '@/lib/format';
import { IconButton } from '@/components/shared/IconButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { hasPermission } from '@/lib/permissions';
import type { Supplier, PurchaseOrder } from '@/lib/types';

export default function SupplierManagement() {
  const { currentUser } = useAppStore();
  const userRole = currentUser?.role || 'readonly';
  const canEdit = hasPermission(userRole, 'canEdit');
  const canCreate = hasPermission(userRole, 'canCreate');
  const canDelete = hasPermission(userRole, 'canDelete');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showDialog, setShowDialog] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', address: '', mainProducts: '', rating: 'B' as 'A' | 'B' | 'C' | 'D', remark: '' });
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([dbSuppliers.getAll(), dbPurchaseOrders.getAll()]);
      setSuppliers(s);
      setPurchaseOrders(p);
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

  const filtered = suppliers.filter(s => {
    const matchSearch = !searchTerm || s.name.includes(searchTerm) || s.contactPerson.includes(searchTerm) || s.phone.includes(searchTerm);
    const matchRating = ratingFilter === 'all' || s.rating === ratingFilter;
    return matchSearch && matchRating;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSuppliers = useMemo(() =>
    filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, ratingFilter]);

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

  const openNew = () => { setEditing(null); setForm({ name: '', contactPerson: '', phone: '', address: '', mainProducts: '', rating: 'B', remark: '' }); setShowDialog(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ name: s.name, contactPerson: s.contactPerson, phone: s.phone, address: s.address, mainProducts: s.mainProducts, rating: s.rating, remark: s.remark }); setShowDialog(true); };

  const save = async () => {
    if (!form.name) { toast.error('请输入供应商名称'); return; }
    if (editing) { await dbSuppliers.put({ ...editing, ...form }); toast.success('供应商已更新'); }
    else { await dbSuppliers.add(form); toast.success('供应商已创建'); }
    await dbAuditLogs.add({ operator: currentUser?.name || '', module: '供应商管理', action: editing ? '编辑' : '新建', detail: `${editing ? '编辑' : '新建'}供应商 ${form.name}` });
    setShowDialog(false); loadData();
  };

  const deleteSupplier = async (id: string) => { await dbSuppliers.remove(id); toast.success('供应商已删除'); setConfirmDelete(null); loadData(); };

  const viewDetail = async (s: Supplier) => {
    setSelected(s);
    const related = purchaseOrders.filter(o => o.supplierId === s.id).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 10);
    setRecentOrders(related);
    setShowDetail(true);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">供应商管理</h2><p className="text-sm text-muted-foreground">管理供应商信息与进货统计</p></div>
      <div className="rounded-lg border border-gray-200 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="搜索供应商名称、联系人、电话..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" /></div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}><SelectTrigger className="w-32"><SelectValue placeholder="评级" /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem>{['A','B','C','D'].map(r => <SelectItem key={r} value={r}>{r}级</SelectItem>)}</SelectContent></Select>
          <Button onClick={openNew} className="bg-black text-white hover:bg-gray-800" disabled={!canCreate}><Plus className="h-4 w-4 mr-1" />新增供应商</Button>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="暂无供应商" /> : (
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>供应商名称</TableHead><TableHead>联系人</TableHead><TableHead>电话</TableHead><TableHead>地址</TableHead><TableHead>主要货品</TableHead><TableHead>评级</TableHead><TableHead className="text-right">进货单数</TableHead><TableHead className="text-right">欠款金额</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
            <TableBody>{paginatedSuppliers.map(s => {
              const oc = purchaseOrders.filter(o => o.supplierId === s.id).length;
              const debt = purchaseOrders.filter(o => o.supplierId === s.id).reduce((sum, o) => sum + o.unpaidAmount, 0);
              return (<TableRow key={s.id}><TableCell className="font-medium">{s.name}</TableCell><TableCell>{s.contactPerson}</TableCell><TableCell>{s.phone}</TableCell><TableCell className="max-w-[120px] truncate">{s.address}</TableCell><TableCell>{s.mainProducts}</TableCell><TableCell><Badge variant="secondary" className="bg-gray-100">{s.rating}级</Badge></TableCell><TableCell className="text-right">{oc}</TableCell><TableCell className={`text-right font-mono ${debt > 0 ? 'text-orange-600' : ''}`}>{formatMoney(debt)}</TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-0.5"><IconButton icon={<Eye className="h-3.5 w-3.5" />} tooltip="查看详情" onClick={() => viewDetail(s)} />
                        {canEdit && <IconButton icon={<Pencil className="h-3.5 w-3.5" />} tooltip="编辑" onClick={() => openEdit(s)} />}
                        {canDelete && <IconButton icon={<Trash2 className="h-3.5 w-3.5" />} tooltip="删除" onClick={() => setConfirmDelete(s.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50" />}</div></TableCell></TableRow>);
            })}</TableBody>
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing ? '编辑供应商' : '新增供应商'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>供应商名称 *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>联系人</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div><div className="space-y-2"><Label>电话</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div></div>
          <div className="space-y-2"><Label>地址</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="space-y-2"><Label>主要货品</Label><Input value={form.mainProducts} onChange={e => setForm({ ...form, mainProducts: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>合作评级</Label><Select value={form.rating} onValueChange={v => setForm({ ...form, rating: v as Supplier['rating'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['A','B','C','D'].map(r => <SelectItem key={r} value={r}>{r}级</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>备注</Label><Input value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button><Button onClick={save} className="bg-black text-white hover:bg-gray-800">保存</Button></DialogFooter>
      </DialogContent></Dialog>

      {/* Detail Sheet */}
      <DetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        title="供应商详情"
        subtitle={selected?.name}
        badge={selected && <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">{selected.rating}级</span>}
      >
        {selected && (<>
          <SummaryCards cards={[
            { label: '进货单数', value: String(recentOrders.length) },
            { label: '进货总额', value: formatMoney(recentOrders.reduce((s, o) => s + o.totalAmount, 0)), valueClassName: 'font-mono text-xs' },
            { label: '欠款金额', value: formatMoney(recentOrders.reduce((s, o) => s + o.unpaidAmount, 0)), valueClassName: 'font-mono text-xs text-orange-600' },
            { label: '评级', value: `${selected.rating}级` },
          ]} />

          <InfoSection title="基本信息">
            <InfoRow label="供应商名称" value={selected.name} />
            <InfoRow label="联系人" value={selected.contactPerson || '-'} />
            <InfoRow label="电话" value={selected.phone || '-'} />
            <InfoRow label="地址" value={selected.address || '-'} />
            <InfoRow label="主要货品" value={selected.mainProducts || '-'} />
            {selected.remark && <InfoRow label="备注" value={selected.remark} />}
          </InfoSection>

          {recentOrders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  最近进货单
                </h4>
                <span className="text-xs text-muted-foreground ml-auto">
                  {recentOrders.length} 条
                </span>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="text-left py-2 px-3 font-medium">单号</th>
                      <th className="text-left py-2 px-3 font-medium">日期</th>
                      <th className="text-right py-2 px-3 font-medium">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.slice(0, 5).map(o => (
                      <tr key={o.id} className="border-b last:border-b-0">
                        <td className="py-2 px-3 font-mono">{o.orderNo}</td>
                        <td className="py-2 px-3">{formatDate(o.date)}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">{formatMoney(o.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>)}
      </DetailSheet>
      <ConfirmDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)} title="确认删除" description="确定删除该供应商？" onConfirm={() => confirmDelete && deleteSupplier(confirmDelete)} confirmText="删除" />
    </div>
  );
}
