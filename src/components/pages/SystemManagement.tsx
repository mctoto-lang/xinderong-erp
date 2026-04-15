'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Save, Settings, Users, ShoppingCart, Truck, FileText, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { dbUsers, dbProductCategories, dbSystemSettings, dbAuditLogs, dbPurchaseOrders, dbPurchaseOrderItems, dbSalesOrders, dbSalesOrderItems, dbSuppliers, dbCustomers, dbInventory, dbInventoryLogs } from '@/lib/api';
import * as XLSX from 'xlsx';
import { useAppStore } from '@/lib/store';
import { COMPANY_NAME } from '@/lib/constants';
import { formatDateTime, generateId } from '@/lib/format';
import { USER_ROLES } from '@/lib/constants';
import { IconButton } from '@/components/shared/IconButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { User, ProductCategory, AuditLog, SystemSetting, Supplier, Customer } from '@/lib/types';

export default function SystemManagement() {
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [purchaseCategories, setPurchaseCategories] = useState<ProductCategory[]>([]);
  const [saleCategories, setSaleCategories] = useState<ProductCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({ companyName: COMPANY_NAME, companyAddress: '', companyPhone: '' });

  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ username: '', name: '', role: 'readonly' as User['role'], password: '', status: 'active' as User['status'] });

  const [showCatDialog, setShowCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<ProductCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', category: 'purchase' as const, spec: '', sort: 0, status: 'active' as const });
  const [catTarget, setCatTarget] = useState<'purchase' | 'sale'>('purchase');

  const [userSearch, setUserSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [logModule, setLogModule] = useState('');
  const [logAction, setLogAction] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null);

  const initialLoadRef = useRef(true);
  const loadData = useCallback(async () => {
    try {
      const [u, pc, sc, logs, sups, custs] = await Promise.all([
        dbUsers.getAll(),
        dbProductCategories.getAll(),
        dbProductCategories.getAll(),
        dbAuditLogs.getAll(),
        dbSuppliers.getAll(),
        dbCustomers.getAll(),
      ]);
      setUsers(u);
      setPurchaseCategories(pc.filter(c => c.category === 'purchase'));
      setSaleCategories(sc.filter(c => c.category === 'sale'));
      setAuditLogs(logs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      setSuppliers(sups);
      setCustomers(custs);
      const [name, addr, phone] = await Promise.all([
        dbSystemSettings.getByKey('companyName'),
        dbSystemSettings.getByKey('companyAddress'),
        dbSystemSettings.getByKey('companyPhone'),
      ]);
      setSettings({ companyName: name || COMPANY_NAME, companyAddress: addr || '', companyPhone: phone || '' });
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

  const saveSettings = async () => {
    await Promise.all([
      dbSystemSettings.set('companyName', settings.companyName),
      dbSystemSettings.set('companyAddress', settings.companyAddress),
      dbSystemSettings.set('companyPhone', settings.companyPhone),
    ]);
    toast.success('系统设置已保存');
  };

  const openNewUser = () => { setEditingUser(null); setUserForm({ username: '', name: '', role: 'readonly', password: '', status: 'active' }); setShowUserDialog(true); };
  const openEditUser = (u: User) => { setEditingUser(u); setUserForm({ username: u.username, name: u.name, role: u.role, password: '', status: u.status }); setShowUserDialog(true); };
  const saveUser = async () => {
    if (!userForm.username || !userForm.name) { toast.error('请填写完整信息'); return; }
    if (editingUser) {
      await dbUsers.put({ ...editingUser, name: userForm.name, role: userForm.role, status: userForm.status, ...(userForm.password ? { password: userForm.password } : {}) });
      toast.success('用户已更新');
    } else {
      if (!userForm.password) { toast.error('请设置密码'); return; }
      await dbUsers.add({ ...userForm });
      toast.success('用户已创建');
    }
    setShowUserDialog(false); loadData();
  };
  const deleteUser = async (id: string) => { if (id === currentUser?.id) { toast.error('不能删除当前登录用户'); return; } await dbUsers.remove(id); toast.success('用户已删除'); setConfirmDelete(null); loadData(); };
  const toggleUserStatus = async (u: User) => { await dbUsers.put({ ...u, status: u.status === 'active' ? 'disabled' : 'active' }); toast.success('用户状态已更新'); loadData(); };

  const openNewCat = (target: 'purchase' | 'sale') => { setEditingCat(null); setCatTarget(target); setCatForm({ name: '', category: target, spec: '', sort: 0, status: 'active' }); setShowCatDialog(true); };
  const openEditCat = (c: ProductCategory) => { setEditingCat(c); setCatTarget(c.category); setCatForm({ name: c.name, category: c.category, spec: c.spec, sort: c.sort, status: c.status }); setShowCatDialog(true); };
  const saveCat = async () => {
    if (!catForm.name) { toast.error('请输入分类名称'); return; }
    if (editingCat) { await dbProductCategories.put({ ...editingCat, ...catForm }); toast.success('分类已更新'); }
    else { await dbProductCategories.add(catForm); toast.success('分类已创建'); }
    setShowCatDialog(false); loadData();
  };
  const deleteCat = async (id: string) => { await dbProductCategories.remove(id); toast.success('分类已删除'); setConfirmDelete(null); loadData(); };
  const toggleCatStatus = async (c: ProductCategory) => { await dbProductCategories.put({ ...c, status: c.status === 'active' ? 'disabled' : 'active' }); loadData(); };

  const filteredLogs = auditLogs.filter(l => {
    const matchModule = !logModule || l.module.includes(logModule);
    const matchAction = !logAction || l.action.includes(logAction);
    return matchModule && matchAction;
  });

  const filteredUsers = users.filter(u => !userSearch || u.username.includes(userSearch) || u.name.includes(userSearch));
  const filteredPurchaseCats = purchaseCategories.filter(c => !catSearch || c.name.includes(catSearch));
  const filteredSaleCats = saleCategories.filter(c => !catSearch || c.name.includes(catSearch));

  const parseExcelDate = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        const m = String(date.m).padStart(2, '0');
        const d = String(date.d).padStart(2, '0');
        return `${date.y}-${m}-${d}`;
      }
    }
    if (value instanceof Date) {
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, '0');
      const d = String(value.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const str = String(value).trim();
    const match = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return '';
  };

  const downloadPurchaseTemplate = () => {
    const headers = ['订单日期', '供应商名称', '产品名称', '规格', '重量(KG)', '单价(元)', '运费(元)', '备注'];
    const example = ['2024-01-15', '供应商A', '产品名称1', '规格描述', '100', '10.5', '50', '备注信息'];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '进货订单导入模板');
    XLSX.writeFile(wb, '进货订单导入模板.xlsx');
  };

  const downloadSalesTemplate = () => {
    const headers = ['订单日期', '客户名称', '产品名称', '重量(KG)', '单价(元)', '运费(元)', '备注'];
    const example = ['2024-01-15', '客户A', '产品名称1', '100', '15.5', '30', '备注信息'];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '出货订单导入模板');
    XLSX.writeFile(wb, '出货订单导入模板.xlsx');
  };

  const handleImportPurchase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][];
      if (rows.length < 2) { toast.error('文件为空或格式错误'); return; }
      const headers = rows[0] as string[];
      const dateIdx = headers.findIndex(h => h?.includes('日期'));
      const supplierIdx = headers.findIndex(h => h?.includes('供应商'));
      const productIdx = headers.findIndex(h => h?.includes('产品'));
      const specIdx = headers.findIndex(h => h?.includes('规格'));
      const weightIdx = headers.findIndex(h => h?.includes('重量'));
      const priceIdx = headers.findIndex(h => h?.includes('单价'));
      const freightIdx = headers.findIndex(h => h?.includes('运费'));
      const remarkIdx = headers.findIndex(h => h?.includes('备注'));
      if (dateIdx === -1 || supplierIdx === -1 || productIdx === -1 || weightIdx === -1 || priceIdx === -1) {
        toast.error('模板格式错误，请下载最新模板'); return;
      }
      let successCount = 0;
      let errorCount = 0;
      const orderMap: Record<string, { items: Array<{ productName: string; spec: string; weight: number; unitPrice: number }>; freight: number; remark: string }> = {};
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[dateIdx] || !row[productIdx]) continue;
        const date = parseExcelDate(row[dateIdx]);
        const supplierName = String(row[supplierIdx] || '').trim();
        const productName = String(row[productIdx] || '').trim();
        const spec = String(row[specIdx] || '').trim();
        const weight = Number(row[weightIdx]) || 0;
        const unitPrice = Number(row[priceIdx]) || 0;
        const freight = Number(row[freightIdx]) || 0;
        const remark = String(row[remarkIdx] || '').trim();
        if (!supplierName || !date) { errorCount++; continue; }
        const key = `${date}|${supplierName}`;
        if (!orderMap[key]) orderMap[key] = { items: [], freight: 0, remark: '' };
        orderMap[key].items.push({ productName, spec, weight, unitPrice });
        orderMap[key].freight = Math.max(orderMap[key].freight, freight);
        orderMap[key].remark = remark || orderMap[key].remark;
      }
      for (const [key, orderData] of Object.entries(orderMap)) {
        const [date, supplierName] = key.split('|');
        const supplier = suppliers.find(s => s.name === supplierName);
        if (!supplier) { errorCount += orderData.items.length; continue; }
        const totalAmount = orderData.items.reduce((sum, item) => sum + item.weight * item.unitPrice, 0) + orderData.freight;
        const res = await fetch(`/api/orderNo?prefix=JHD&date=${date}`);
        const { orderNo } = await res.json();
        const order = await dbPurchaseOrders.add({
          orderNo, date, supplierId: supplier.id, supplierName: supplier.name,
          totalAmount, freight: orderData.freight, paidAmount: 0, unpaidAmount: totalAmount,
          paymentStatus: 'unpaid', remark: orderData.remark, createdBy: currentUser?.name || '',
        });
        await dbPurchaseOrderItems.addBatch(orderData.items.map(item => ({
          orderId: order.id, productId: generateId(), productName: item.productName,
          spec: item.spec, weight: item.weight, unitPrice: item.unitPrice, amount: item.weight * item.unitPrice,
        })));
        for (const item of orderData.items) {
          const allInv = await dbInventory.getAll();
          let inv = allInv.find(i => i.productName === item.productName);
          if (!inv) {
            inv = await dbInventory.add({
              productName: item.productName, category: '原料', rawMaterialStock: 0,
              finishedProductStock: 0, warningThreshold: 100, status: 'normal',
            });
          }
          const newRaw = inv.rawMaterialStock + item.weight;
          await dbInventory.put({ ...inv, rawMaterialStock: newRaw });
          await dbInventoryLogs.add({
            inventoryId: inv.id, productName: item.productName, logType: '批量导入',
            relatedOrderNo: orderNo, quantity: item.weight, balance: newRaw,
            remark: `批量导入进货单 ${orderNo}`, operator: currentUser?.name || '',
          });
        }
        successCount += orderData.items.length;
      }
      await dbAuditLogs.add({ operator: currentUser?.name || '', module: '批量导入', action: '进货订单', detail: `成功导入 ${successCount} 条，失败 ${errorCount} 条` });
      toast.success(`导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('导入失败，请检查文件格式');
    }
    e.target.value = '';
  };

  const handleImportSales = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][];
      if (rows.length < 2) { toast.error('文件为空或格式错误'); return; }
      const headers = rows[0] as string[];
      const dateIdx = headers.findIndex(h => h?.includes('日期'));
      const customerIdx = headers.findIndex(h => h?.includes('客户'));
      const productIdx = headers.findIndex(h => h?.includes('产品'));
      const weightIdx = headers.findIndex(h => h?.includes('重量'));
      const priceIdx = headers.findIndex(h => h?.includes('单价'));
      const freightIdx = headers.findIndex(h => h?.includes('运费'));
      const remarkIdx = headers.findIndex(h => h?.includes('备注'));
      if (dateIdx === -1 || customerIdx === -1 || productIdx === -1 || weightIdx === -1 || priceIdx === -1) {
        toast.error('模板格式错误，请下载最新模板'); return;
      }
      let successCount = 0;
      let errorCount = 0;
      const orderMap: Record<string, { items: Array<{ productName: string; weight: number; unitPrice: number }>; freight: number; remark: string }> = {};
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[dateIdx] || !row[productIdx]) continue;
        const date = parseExcelDate(row[dateIdx]);
        const customerName = String(row[customerIdx] || '').trim();
        const productName = String(row[productIdx] || '').trim();
        const weight = Number(row[weightIdx]) || 0;
        const unitPrice = Number(row[priceIdx]) || 0;
        const freight = Number(row[freightIdx]) || 0;
        const remark = String(row[remarkIdx] || '').trim();
        if (!customerName || !date) { errorCount++; continue; }
        const key = `${date}|${customerName}`;
        if (!orderMap[key]) orderMap[key] = { items: [], freight: 0, remark: '' };
        orderMap[key].items.push({ productName, weight, unitPrice });
        orderMap[key].freight = Math.max(orderMap[key].freight, freight);
        orderMap[key].remark = remark || orderMap[key].remark;
      }
      for (const [key, orderData] of Object.entries(orderMap)) {
        const [date, customerName] = key.split('|');
        const customer = customers.find(c => c.name === customerName);
        if (!customer) { errorCount += orderData.items.length; continue; }
        const totalAmount = orderData.items.reduce((sum, item) => sum + item.weight * item.unitPrice, 0) + orderData.freight;
        const res = await fetch(`/api/orderNo?prefix=CHD&date=${date}`);
        const { orderNo } = await res.json();
        const order = await dbSalesOrders.add({
          orderNo, date, customerId: customer.id, customerName: customer.name,
          totalAmount, freight: orderData.freight, collectedAmount: 0, uncollectedAmount: totalAmount,
          paymentStatus: 'unpaid', remark: orderData.remark, createdBy: currentUser?.name || '',
        });
        await dbSalesOrderItems.addBatch(orderData.items.map(item => ({
          orderId: order.id, productId: generateId(), productName: item.productName,
          weight: item.weight, unitPrice: item.unitPrice, amount: item.weight * item.unitPrice,
        })));
        for (const item of orderData.items) {
          const allInv = await dbInventory.getAll();
          let inv = allInv.find(i => i.productName === item.productName);
          if (!inv) {
            inv = await dbInventory.add({
              productName: item.productName, category: '成品', rawMaterialStock: 0,
              finishedProductStock: 0, warningThreshold: 100, status: 'normal',
            });
          }
          const newFinished = Math.max(0, inv.finishedProductStock - item.weight);
          await dbInventory.put({ ...inv, finishedProductStock: newFinished });
          await dbInventoryLogs.add({
            inventoryId: inv.id, productName: item.productName, logType: '批量导入',
            relatedOrderNo: orderNo, quantity: -item.weight, balance: newFinished,
            remark: `批量导入出货单 ${orderNo}`, operator: currentUser?.name || '',
          });
        }
        successCount += orderData.items.length;
      }
      await dbAuditLogs.add({ operator: currentUser?.name || '', module: '批量导入', action: '出货订单', detail: `成功导入 ${successCount} 条，失败 ${errorCount} 条` });
      toast.success(`导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('导入失败，请检查文件格式');
    }
    e.target.value = '';
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 space-y-3">
      <div><h2 className="text-lg font-semibold">系统管理</h2><p className="text-sm text-muted-foreground">维护系统配置、用户、产品分类和操作日志</p></div>

      <Tabs defaultValue="settings">
        <TabsList className="bg-gray-100 flex-wrap">
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="size-3.5" />系统设置</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="size-3.5" />用户管理</TabsTrigger>
          <TabsTrigger value="purchaseCats" className="gap-1.5"><ShoppingCart className="size-3.5" />进货分类</TabsTrigger>
          <TabsTrigger value="saleCats" className="gap-1.5"><Truck className="size-3.5" />出货分类</TabsTrigger>
          <TabsTrigger value="import" className="gap-1.5"><Upload className="size-3.5" />批量导入</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5"><FileText className="size-3.5" />操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card className="border-gray-200"><CardHeader><h3 className="font-medium">打印抬头配置</h3></CardHeader><CardContent>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2"><Label>公司名称</Label><Input value={settings.companyName} onChange={e => setSettings({ ...settings, companyName: e.target.value })} /></div>
              <div className="space-y-2"><Label>公司地址</Label><Input value={settings.companyAddress} onChange={e => setSettings({ ...settings, companyAddress: e.target.value })} /></div>
              <div className="space-y-2"><Label>联系电话</Label><Input value={settings.companyPhone} onChange={e => setSettings({ ...settings, companyPhone: e.target.value })} /></div>
              <Button onClick={saveSettings} className="bg-black text-white hover:bg-gray-800"><Save className="h-4 w-4 mr-1" />保存</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="搜索用户名或姓名..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9" /></div>
            <Button onClick={openNewUser} className="bg-black text-white hover:bg-gray-800"><Plus className="h-4 w-4 mr-1" />新增用户</Button>
          </div>
          <Card className="border-gray-200"><CardContent className="p-0">
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>用户名</TableHead><TableHead>姓名</TableHead><TableHead>角色</TableHead><TableHead>状态</TableHead><TableHead>最后登录</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
              <TableBody>{filteredUsers.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.username}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="bg-gray-100">{USER_ROLES.find(r => r.value === u.role)?.label || u.role}</Badge></TableCell>
                  <TableCell>
                    <Switch checked={u.status === 'active'} onCheckedChange={() => toggleUserStatus(u)} disabled={u.id === currentUser?.id} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.lastLoginAt || '')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <IconButton icon={<Pencil className="h-3.5 w-3.5" />} tooltip="编辑" onClick={() => openEditUser(u)} />
                      {u.id !== currentUser?.id && <IconButton icon={<Trash2 className="h-3.5 w-3.5" />} tooltip="删除" onClick={() => setConfirmDelete({ type: 'user', id: u.id })} className="text-red-500 hover:text-red-600 hover:bg-red-50" />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="purchaseCats" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="搜索分类名..." value={catSearch} onChange={e => setCatSearch(e.target.value)} className="pl-9" /></div>
            <Button onClick={() => openNewCat('purchase')} className="bg-black text-white hover:bg-gray-800"><Plus className="h-4 w-4 mr-1" />新增分类</Button>
          </div>
          <Card className="border-gray-200"><CardContent className="p-0">
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>名称</TableHead><TableHead>规格</TableHead><TableHead>排序</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
              <TableBody>{filteredPurchaseCats.map(c => (
                <TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell>{c.spec}</TableCell><TableCell>{c.sort}</TableCell>
                  <TableCell><Switch checked={c.status === 'active'} onCheckedChange={() => toggleCatStatus(c)} /></TableCell>
                  <TableCell className="text-right"><div className="flex items-center justify-end gap-0.5"><IconButton icon={<Pencil className="h-3.5 w-3.5" />} tooltip="编辑" onClick={() => openEditCat(c)} /><IconButton icon={<Trash2 className="h-3.5 w-3.5" />} tooltip="删除" onClick={() => setConfirmDelete({ type: 'cat', id: c.id })} className="text-red-500 hover:text-red-600 hover:bg-red-50" /></div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="saleCats" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="搜索分类名..." value={catSearch} onChange={e => setCatSearch(e.target.value)} className="pl-9" /></div>
            <Button onClick={() => openNewCat('sale')} className="bg-black text-white hover:bg-gray-800"><Plus className="h-4 w-4 mr-1" />新增分类</Button>
          </div>
          <Card className="border-gray-200"><CardContent className="p-0">
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>名称</TableHead><TableHead>规格</TableHead><TableHead>排序</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
              <TableBody>{filteredSaleCats.map(c => (
                <TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell>{c.spec}</TableCell><TableCell>{c.sort}</TableCell>
                  <TableCell><Switch checked={c.status === 'active'} onCheckedChange={() => toggleCatStatus(c)} /></TableCell>
                  <TableCell className="text-right"><div className="flex items-center justify-end gap-0.5"><IconButton icon={<Pencil className="h-3.5 w-3.5" />} tooltip="编辑" onClick={() => openEditCat(c)} /><IconButton icon={<Trash2 className="h-3.5 w-3.5" />} tooltip="删除" onClick={() => setConfirmDelete({ type: 'cat', id: c.id })} className="text-red-500 hover:text-red-600 hover:bg-red-50" /></div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-gray-200">
              <CardHeader><h3 className="font-medium">进货订单批量导入</h3></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">下载模板填写进货订单数据后上传导入。同一天同一供应商的订单将自动合并。</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadPurchaseTemplate}><Download className="h-4 w-4 mr-1" />下载模板</Button>
                  <label>
                    <Button className="bg-black text-white hover:bg-gray-800 cursor-pointer" asChild>
                      <span><Upload className="h-4 w-4 mr-1" />导入数据</span>
                    </Button>
                    <input type="file" accept=".xlsx,.xls" onChange={handleImportPurchase} className="hidden" />
                  </label>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>模板字段：订单日期、供应商名称、产品名称、规格、重量(KG)、单价(元)、运费(元)、备注</div>
                  <div>注意：供应商名称必须与系统中已有的供应商名称完全一致</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200">
              <CardHeader><h3 className="font-medium">出货订单批量导入</h3></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">下载模板填写出货订单数据后上传导入。同一天同一客户的订单将自动合并。</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadSalesTemplate}><Download className="h-4 w-4 mr-1" />下载模板</Button>
                  <label>
                    <Button className="bg-black text-white hover:bg-gray-800 cursor-pointer" asChild>
                      <span><Upload className="h-4 w-4 mr-1" />导入数据</span>
                    </Button>
                    <input type="file" accept=".xlsx,.xls" onChange={handleImportSales} className="hidden" />
                  </label>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>模板字段：订单日期、客户名称、产品名称、重量(KG)、单价(元)、运费(元)、备注</div>
                  <div>注意：客户名称必须与系统中已有的客户名称完全一致</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[150px] max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="模块" value={logModule} onChange={e => setLogModule(e.target.value)} className="pl-9" /></div>
            <div className="relative flex-1 min-w-[150px] max-w-xs"><Input placeholder="操作" value={logAction} onChange={e => setLogAction(e.target.value)} /></div>
            <Button variant="outline" size="sm" onClick={() => { setLogModule(''); setLogAction(''); }}>重置</Button>
          </div>
          <Card className="border-gray-200"><CardContent className="p-0">
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>时间</TableHead><TableHead>操作人</TableHead><TableHead>模块</TableHead><TableHead>操作</TableHead><TableHead>详情</TableHead></TableRow></TableHeader>
              <TableBody>{filteredLogs.slice(0, 100).map(l => (
                <TableRow key={l.id}><TableCell className="text-xs whitespace-nowrap">{formatDateTime(l.createdAt || '')}</TableCell><TableCell>{l.operator}</TableCell><TableCell><Badge variant="secondary" className="bg-gray-100">{l.module}</Badge></TableCell><TableCell>{l.action}</TableCell><TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{l.detail}</TableCell></TableRow>
              ))}</TableBody>
            </Table></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>用户名</Label><Input value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} disabled={!!editingUser} /></div>
          <div className="space-y-2"><Label>姓名</Label><Input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>角色</Label><Select value={userForm.role} onValueChange={v => setUserForm({ ...userForm, role: v as User['role'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{USER_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>{editingUser ? '新密码（留空不修改）' : '密码'}</Label><Input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} /></div>
          {editingUser && (<div className="space-y-2"><Label>状态</Label><Select value={userForm.status} onValueChange={v => setUserForm({ ...userForm, status: v as User['status'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">启用</SelectItem><SelectItem value="disabled">禁用</SelectItem></SelectContent></Select></div>)}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setShowUserDialog(false)}>取消</Button><Button onClick={saveUser} className="bg-black text-white hover:bg-gray-800">保存</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editingCat ? '编辑分类' : '新增分类'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>名称</Label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>规格</Label><Input value={catForm.spec} onChange={e => setCatForm({ ...catForm, spec: e.target.value })} /></div>
          <div className="space-y-2"><Label>排序</Label><Input type="number" value={catForm.sort || ''} onChange={e => setCatForm({ ...catForm, sort: Number(e.target.value) || 0 })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setShowCatDialog(false)}>取消</Button><Button onClick={saveCat} className="bg-black text-white hover:bg-gray-800">保存</Button></DialogFooter>
      </DialogContent></Dialog>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)} title="确认删除" description="确定删除？" onConfirm={() => { if (confirmDelete) { if (confirmDelete.type === 'user') deleteUser(confirmDelete.id); else deleteCat(confirmDelete.id); } }} confirmText="删除" />
    </div>
  );
}
