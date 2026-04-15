'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

// ─── Info Row ────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

export function InfoRow({ label, value, valueClassName = '' }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${valueClassName}`}>{value}</span>
    </div>
  );
}

// ─── Info Section ────────────────────────────────────────────

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-foreground" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      </div>
      <div className="rounded-lg border bg-card/50 px-4 py-1">
        {children}
      </div>
    </div>
  );
}

// ─── Detail Sheet Wrapper ────────────────────────────────────

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export function DetailSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  children,
}: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:w-[520px] p-0 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 pt-6 pb-4">
          <SheetHeader className="space-y-1">
            <div className="flex items-center justify-between pr-6">
              <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Detail Table (compact) ─────────────────────────────────

interface DetailTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  width?: string;
  className?: string;
}

interface DetailTableProps {
  columns: DetailTableColumn[];
  data: Array<Record<string, React.ReactNode>>;
}

export function DetailTable({ columns, data }: DetailTableProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted/50">
          {columns.map(col => (
            <th
              key={col.key}
              className={`px-3 py-2 text-xs font-medium text-muted-foreground ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.width || ''} ${col.className || ''}`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
            {columns.map(col => (
              <td
                key={col.key}
                className={`px-3 py-2.5 ${col.align === 'right' ? 'text-right font-mono text-xs' : 'text-sm'} ${col.className || ''}`}
              >
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Payment / Timeline Record ──────────────────────────────

interface TimelineRecord {
  id: string;
  date: string;
  method?: string;
  amount: number;
  remark?: string;
}

interface RecordListProps {
  title: string;
  records: TimelineRecord[];
}

export function RecordList({ title, records }: RecordListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-foreground" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
        <span className="text-xs text-muted-foreground ml-auto">
          共 {records.length} 条
        </span>
      </div>
      <div className="space-y-2">
        {records.map(record => (
          <div
            key={record.id}
            className="rounded-lg border bg-card/50 px-4 py-3 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{record.date}</span>
              <span className="font-mono text-sm font-semibold text-green-600">
                {record.amount >= 0 ? '+' : ''}{record.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{record.method || '-'}</span>
              {record.remark && <span className="text-muted-foreground">{record.remark}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Summary Cards ───────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}

export function SummaryCards({ cards }: { cards: SummaryCardProps[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card, idx) => (
        <div key={idx} className="rounded-lg border bg-muted/30 px-3 py-2.5 text-center">
          <div className="text-[10px] text-muted-foreground mb-0.5">{card.label}</div>
          <div className={`text-sm font-semibold ${card.valueClassName || ''}`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
