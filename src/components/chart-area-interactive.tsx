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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface ProductPriceData {
  productName: string;
  chartData: ChartDataItem[];
}

interface ChartAreaProps {
  purchaseChartData: ChartDataItem[];
  salesChartData: ChartDataItem[];
  purchaseProductPrices: ProductPriceData[];
  salesProductPrices: ProductPriceData[];
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
  productPrices,
  selectedProduct,
  onProductChange,
}: {
  title: string;
  description: string;
  data: ChartDataItem[];
  config: typeof purchaseChartConfig;
  isDemo: boolean;
  gradientId: string;
  productPrices: ProductPriceData[];
  selectedProduct: string;
  onProductChange: (product: string) => void;
}) {
  const displayData = selectedProduct === 'all' 
    ? data 
    : productPrices.find(p => p.productName === selectedProduct)?.chartData || data;

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">
              <span className="hidden @[540px]/card:block">
                {description}
              </span>
              <span className="@[540px]/card:hidden">{description}</span>
              {isDemo && selectedProduct === 'all' && (
                <Badge variant="outline" className="ml-2 text-xs font-normal text-muted-foreground">
                  <IconInfoCircle className="size-3 mr-1" />
                  暂无数据，显示示例
                </Badge>
              )}
            </CardDescription>
          </div>
          {productPrices.length > 0 && (
            <Select value={selectedProduct} onValueChange={onProductChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="选择产品" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部产品</SelectItem>
                {productPrices.map(p => (
                  <SelectItem key={p.productName} value={p.productName}>
                    {p.productName.length > 8 ? `${p.productName.slice(0, 8)}...` : p.productName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={config}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              dataKey="avgPrice"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={60}
              tickFormatter={(value) => `¥${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    `¥${(value as number).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}/KG`,
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
  purchaseProductPrices,
  salesProductPrices,
  isPurchaseChartDemo,
  isSalesChartDemo,
}: ChartAreaProps) {
  const [selectedPurchaseProduct, setSelectedPurchaseProduct] = React.useState('all');
  const [selectedSalesProduct, setSelectedSalesProduct] = React.useState('all');

  return (
    <div className="flex flex-col gap-4">
      <PriceChart
        title="回收塑料制品均价"
        description="各月平均采购单价走势"
        data={purchaseChartData}
        config={purchaseChartConfig}
        isDemo={isPurchaseChartDemo}
        gradientId="purchasePriceGradient"
        productPrices={purchaseProductPrices}
        selectedProduct={selectedPurchaseProduct}
        onProductChange={setSelectedPurchaseProduct}
      />
      <PriceChart
        title="成品塑料颗粒均价"
        description="各月平均销售单价走势"
        data={salesChartData}
        config={salesChartConfig}
        isDemo={isSalesChartDemo}
        gradientId="salesPriceGradient"
        productPrices={salesProductPrices}
        selectedProduct={selectedSalesProduct}
        onProductChange={setSelectedSalesProduct}
      />
    </div>
  );
}
