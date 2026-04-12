'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onSelect,
  placeholder = '选择日期范围',
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    onSelect({ from: range?.from, to: range?.to });
  };

  const hasValue = from || to;

  const displayValue = React.useMemo(() => {
    if (from && to) {
      return `${format(from, 'MM/dd', { locale: zhCN })} ~ ${format(to, 'MM/dd', { locale: zhCN })}`;
    }
    if (from) return `${format(from, 'MM/dd', { locale: zhCN })} 起`;
    if (to) return `至 ${format(to, 'MM/dd', { locale: zhCN })}`;
    return null;
  }, [from, to]);

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'gap-1.5 font-normal',
              hasValue && 'border-black/20 bg-black/5',
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{displayValue || placeholder}</span>
            {hasValue && (
              <X
                className="h-3 w-3 ml-0.5 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({ from: undefined, to: undefined });
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            mode="range"
            selected={{ from, to }}
            onSelect={handleSelect}
            numberOfMonths={2}
            defaultMonth={from || new Date()}
            locale={zhCN}
            formatters={{
              formatMonthDropdown: (date) =>
                format(date, 'yyyy年M月', { locale: zhCN }),
            }}
            classNames={{
              weekdays: 'flex',
              weekday: cn(
                'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none',
              ),
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
