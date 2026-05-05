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
  DetailSheet, InfoSection, InfoRow, DetailTable, SummaryCards,
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
import { dbCustomers, dbSalesOrders, dbAuditLogs } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatMoney, formatDate } from '@/lib/format';
import { CUSTOMER_LEVELS } from '@/lib/constants';
import { IconButton } from '@/components/shared/IconButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { hasPermission } from '@/lib/permissions';
import type { Customer, SalesOrder } from '@/lib/types';

export default function CustomerManagement() {
  const { currentUser } = useAppStore();
  const userRole = currentUser?.role || 'readonly';
  const canEdit = hasPermission(userRole, 'canEdit');
  const canCreate = hasPermission(userRole, 'canCreate');
  const canDelete = hasPermission(userRole, 'canDelete');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showDialog, setShowDialog] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState<{ name: string; contactPerson: string; phone: string; address: string; level: Customer['level']; creditLimit: number; remark: string }>({ name: '', contactPerson: '', phone: '', address: '', level: 'C', creditLimit: 0, remark: '' });
  const [recentOrders, setRecentOrders] = useState<SalesOrder[]>([]);

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([dbCustomers.getAll(), dbSalesOrders.getAll()]);
      setCustomers(c);
      setSalesOrders(s);
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

  const filtered = customers.filter(c => {
    const matchSearch = !searchTerm || c.name.includes(searchTerm) || c.contactPerson.includes(searchTerm) || c.phone.includes(searchTerm);
    const matchLevel = levelFilter === 'all' || c.level === levelFilter;
    return matchSearch && matchLevel;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCustomers = useMemo(() =>
    filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, levelFilter]);

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

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', contactPerson: '', phone: '', address: '', level: 'C', creditLimit: 0, remark: '' });
    setShowDialog(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, contactPerson: c.contactPerson, phone: c.phone, address: c.address, level: c.level, creditLimit: c.creditLimit, remark: c.remark });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.name) { toast.error('请输入客户名称'); return; }
    if (editing) {
      await dbCustomers.put({ ...editing, ...form });
      toast.success('客户信息已更新');
    } else {
      await dbCustomers.add(form);
      toast.success('客户已创建');
    }
    await dbAuditLogs.add({ operator: currentUser?.name || '', module: '客户管理', action: editing ? '编辑' : '新建', detail: `${editing ? '编辑' : '新建'}客户 ${form.name}` });
    setShowDialog(false);
    loadData();
  };

  const deleteCustomer = async (id: string) => {
    await dbCustomers.remove(id);
    toast.success('客户已删除');
    setConfirmDelete(null);
    loadData();
  };

  const viewDetail = async (c: Customer) => {
    setSelected(c);
    const related = salesOrders.filter(o => o.customerId === c.id).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 10);
    setRecentOrders(related);
    setShowDetail(true);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">客户管理</h2><p className="text-sm text-muted-foreground">管理客户信息与出货统计</p></div>

      <div className="rounded-lg border border-gray-200 bg-background px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索客户名称、联系人、电话..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="等级" /></SelectTrigger>
            <SelectContent><SelectItem value="all">全部</SelectItem>{CUSTOMER_LEVELS.map(l => <SelectItem key={l} value={l}>{l} 级</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={openNew} className="bg-black text-white hover:bg-gray-800" disabled={!canCreate}><Plus className="h-4 w-4 mr-1" />新增客户</Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-background overflow-hidden">
        {filtered.length === 0 ? <EmptyState title="暂无客户" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>客户名称</TableHead><TableHead>联系人</TableHead><TableHead>联系电话</TableHead><TableHead>地址</TableHead><TableHead>等级</TableHead><TableHead className="text-right">信用额度</TableHead><TableHead className="text-right">出货单数</TableHead><TableHead className="text-right">欠款金额</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
              <TableBody>{paginatedCustomers.map(c => {
                const orderCount = salesOrders.filter(o => o.customerId === c.id).length;
                const debt = salesOrders.filter(o => o.customerId === c.id).reduce((s, o) => s + o.uncollectedAmount, 0);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.contactPerson}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{c.address}</TableCell>
                    <TableCell><Badge variant="secondary" className="bg-gray-100">{c.level}级</Badge></TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(c.creditLimit)}</TableCell>
                    <TableCell className="text-right">{orderCount}</TableCell>
                    <TableCell className={`text-right font-mono ${debt > 0 ? 'text-orange-600' : ''}`}>{formatMoney(debt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton icon={<Eye className="h-3.5 w-3.5" />} tooltip="查看详情" onClick={() => viewDetail(c)} />
                        {canEdit && <IconButton icon={<Pencil className="h-3.5 w-3.5" />} tooltip="编辑" onClick={() => openEdit(c)} />}
                        {canDelete && <IconButton icon={<Trash2 className="h-3.5 w-3.5" />} tooltip="删除" onClick={() => setConfirmDelete(c.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50" />}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}</TableBody>
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

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing ? '编辑客户' : '新增客户'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>客户名称 *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>联系人</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div className="space-y-2"><Label>电话</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>地址</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>客户等级</Label>
              <Select value={form.level} onValueChange={v => setForm({ ...form, level: v as Customer['level'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CUSTOMER_LEVELS.map(l => <SelectItem key={l} value={l}>{l}级</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>信用额度 (¥)</Label><Input type="number" value={form.creditLimit || ''} onChange={e => setForm({ ...form, creditLimit: Number(e.target.value) || 0 })} /></div>
          </div>
          <div className="space-y-2"><Label>备注</Label><Input value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button><Button onClick={save} className="bg-black text-white hover:bg-gray-800">保存</Button></DialogFooter>
      </DialogContent></Dialog>

      {/* Detail Sheet */}
      <DetailSheet
        open={showDetail}
        onOpenChange={setShowDetail}
        title="客户详情"
        subtitle={selected?.name}
        badge={selected && <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">{selected.level}级</span>}
      >
        {selected && (<>
          <SummaryCards cards={[
            { label: '出货单数', value: String(recentOrders.length) },
            { label: '出货总额', value: formatMoney(recentOrders.reduce((s, o) => s + o.totalAmount, 0)), valueClassName: 'font-mono text-xs' },
            { label: '欠款金额', value: formatMoney(recentOrders.reduce((s, o) => s + o.uncollectedAmount, 0)), valueClassName: 'font-mono text-xs text-orange-600' },
            { label: '信用额度', value: formatMoney(selected.creditLimit), valueClassName: 'font-mono text-xs' },
          ]} />

          <InfoSection title="基本信息">
            <InfoRow label="客户名称" value={selected.name} />
            <InfoRow label="联系人" value={selected.contactPerson || '-'} />
            <InfoRow label="电话" value={selected.phone || '-'} />
            <InfoRow label="地址" value={selected.address || '-'} />
            <InfoRow label="创建时间" value={formatDate(selected.createdAt || '')} />
            {selected.remark && <InfoRow label="备注" value={selected.remark} />}
          </InfoSection>

          {recentOrders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  最近出货单
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

      <ConfirmDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)} title="确认删除" description="确定删除该客户？" onConfirm={() => confirmDelete && deleteCustomer(confirmDelete)} confirmText="删除" />
    </div>
  );
}
