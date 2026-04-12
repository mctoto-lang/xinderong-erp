'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  statusMap: { value: string; label: string; color: string }[];
}

export function StatusBadge({ status, statusMap }: StatusBadgeProps) {
  const item = statusMap.find(s => s.value === status);
  if (!item) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge variant="secondary" className={cn('text-xs', item.color)}>
      {item.label}
    </Badge>
  );
}
