'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { IconInfoCircle } from '@tabler/icons-react';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

const purchaseChartConfig = {
  avgPrice: {
    label: '回收均价 (元/KG)',
    color: 'hsl(0, 0%, 15%)',
  },
} satisfies ChartConfig;

const salesChartConfig = {
  avgPrice: {
    label: '成品均价 (元/KG)',
    color: 'hsl(0, 0%, 45%)',
  },
} satisfies ChartConfig;

interface ChartDataItem {
  month: string;
  avgPrice: number;
}

interface ChartAreaProps {
  purchaseChartData: ChartDataItem[];
  salesChartData: ChartDataItem[];
  isPurchaseChartDemo: boolean;
  isSalesChartDemo: boolean;
}

function PriceChart({
  title,
  description,
  data,
  config,
  isDemo,
  gradientId,
}: {
  title: string;
  description: string;
  data: ChartDataItem[];
  config: typeof purchaseChartConfig;
  isDemo: boolean;
  gradientId: string;
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span className="hidden @[540px]/card:block">
            {description}
          </span>
          <span className="@[540px]/card:hidden">{description}</span>
          {isDemo && (
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              <IconInfoCircle className="size-3 mr-1" />
              暂无数据，显示示例
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={config}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-avgPrice)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-avgPrice)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `¥${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: number) => [
                    `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}/KG`,
                    '均价',
                  ]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="avgPrice"
              stroke="var(--color-avgPrice)"
              fill={`url(#${gradientId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function ChartAreaInteractive({
  purchaseChartData,
  salesChartData,
  isPurchaseChartDemo,
  isSalesChartDemo,
}: ChartAreaProps) {
  return (
    <div className="flex flex-col gap-4">
      <PriceChart
        title="回收塑料制品均价"
        description="各月平均采购单价走势"
        data={purchaseChartData}
        config={purchaseChartConfig}
        isDemo={isPurchaseChartDemo}
        gradientId="purchasePriceGradient"
      />
      <PriceChart
        title="成品塑料颗粒均价"
        description="各月平均销售单价走势"
        data={salesChartData}
        config={salesChartConfig}
        isDemo={isSalesChartDemo}
        gradientId="salesPriceGradient"
      />
    </div>
  );
}
