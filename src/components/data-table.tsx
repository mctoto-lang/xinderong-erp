'use client';

import * as React from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconLoader,
  IconLayoutColumns,
  IconDotsVertical,
} from '@tabler/icons-react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { formatDate, formatMoney } from '@/lib/format';
import { PAYMENT_STATUSES, PRODUCTION_STATUSES } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────

export interface UnifiedOrder {
  id: string;
  orderNo: string;
  date: string;
  type: 'purchase' | 'sales' | 'production';
  party: string;
  amount: number;
  status: string;
  createdAt?: string;
}

interface DataTableProps {
  purchaseOrders: UnifiedOrder[];
  salesOrders: UnifiedOrder[];
  productionOrders: UnifiedOrder[];
}

// ─── Column Definitions ───────────────────────────────────────

function getOrderColumns(type: 'purchase' | 'sales' | 'production'): ColumnDef<UnifiedOrder>[] {
  const partyHeader = type === 'purchase' ? '供应商' : type === 'sales' ? '客户' : '类型';
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="全选"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="选择行"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'orderNo',
      header: '订单号',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.getValue('orderNo')}</span>
      ),
    },
    {
      accessorKey: 'date',
      header: '日期',
      cell: ({ row }) => formatDate(row.getValue('date')),
    },
    {
      accessorKey: 'party',
      header: partyHeader,
    },
    {
      accessorKey: 'amount',
      header: () => <div className="w-full text-right">金额</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">{formatMoney(row.getValue('amount'))}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        let statusItem: { label: string; color: string } | undefined;
        if (type === 'purchase' || type === 'sales') {
          statusItem = PAYMENT_STATUSES.find(s => s.value === status);
        } else {
          statusItem = PRODUCTION_STATUSES.find(s => s.value === status);
        }
        const isCompleted = status === 'paid' || status === 'completed';
        return (
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            {isCompleted ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              <IconLoader />
            )}
            {statusItem ? statusItem.label : status}
          </Badge>
        );
      },
    },
  ];
}

// ─── Tab Table Component ─────────────────────────────────────

function TabTable({ orders, type }: { orders: UnifiedOrder[]; type: 'purchase' | 'sales' | 'production' }) {
  const columns = React.useMemo(() => getOrderColumns(type), [type]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Column visibility control */}
      <div className="flex items-center justify-end px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconLayoutColumns />
              <span className="hidden lg:inline">自定义列</span>
              <span className="lg:hidden">列</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {table
              .getAllColumns()
              .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id === 'orderNo' ? '订单号' :
                   column.id === 'date' ? '日期' :
                   column.id === 'party' ? (type === 'purchase' ? '供应商' : type === 'sales' ? '客户' : '类型') :
                   column.id === 'amount' ? '金额' :
                   column.id === 'status' ? '状态' : column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          已选择 {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} 行
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              每页行数
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            第 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} 页
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">首页</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">上一页</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">下一页</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">末页</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main DataTable ──────────────────────────────────────────

export function DataTable({
  purchaseOrders,
  salesOrders,
  productionOrders,
}: DataTableProps) {
  return (
    <Tabs defaultValue="sales" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">订单列表</h2>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            管理所有进货、出货和生产订单
          </span>
        </div>
        <TabsList className="hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="sales">
            出货管理
            {salesOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1">{salesOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="purchase">
            进货管理
            {purchaseOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1">{purchaseOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="production">
            生产管理
            {productionOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1">{productionOrders.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="sales" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <TabTable orders={salesOrders} type="sales" />
      </TabsContent>
      <TabsContent value="purchase" className="flex flex-col gap-4 px-4 lg:px-6">
        <TabTable orders={purchaseOrders} type="purchase" />
      </TabsContent>
      <TabsContent value="production" className="flex flex-col gap-4 px-4 lg:px-6">
        <TabTable orders={productionOrders} type="production" />
      </TabsContent>
    </Tabs>
  );
}
