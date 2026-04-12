import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface KpiData {
  monthPurchaseWeight: number;
  monthSalesWeight: number;
  monthPayable: number;
  monthReceivable: number;
  purchaseWeightTrend: number;
  salesWeightTrend: number;
}

function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SectionCards({ kpi }: { kpi: KpiData }) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {/* 本月进货 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>本月进货</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpi.monthPurchaseWeight.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
            <span className="text-sm font-normal text-muted-foreground ml-1">KG</span>
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {kpi.purchaseWeightTrend >= 0 ? (
                <>
                  <IconTrendingUp className="size-3" />
                  +{Math.abs(kpi.purchaseWeightTrend).toFixed(1)}%
                </>
              ) : (
                <>
                  <IconTrendingDown className="size-3" />
                  {kpi.purchaseWeightTrend.toFixed(1)}%
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {kpi.purchaseWeightTrend >= 0 ? (
              <>进货量较上月增长 <IconTrendingUp className="size-4" /></>
            ) : (
              <>进货量较上月下降 <IconTrendingDown className="size-4" /></>
            )}
          </div>
          <div className="text-muted-foreground">
            本月回收塑料原料采购总量
          </div>
        </CardFooter>
      </Card>

      {/* 本月出货 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>本月出货</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {kpi.monthSalesWeight.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
            <span className="text-sm font-normal text-muted-foreground ml-1">KG</span>
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {kpi.salesWeightTrend >= 0 ? (
                <>
                  <IconTrendingUp className="size-3" />
                  +{Math.abs(kpi.salesWeightTrend).toFixed(1)}%
                </>
              ) : (
                <>
                  <IconTrendingDown className="size-3" />
                  {kpi.salesWeightTrend.toFixed(1)}%
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {kpi.salesWeightTrend >= 0 ? (
              <>出货量较上月增长 <IconTrendingUp className="size-4" /></>
            ) : (
              <>出货量较上月下降 <IconTrendingDown className="size-4" /></>
            )}
          </div>
          <div className="text-muted-foreground">
            本月成品塑料颗粒销售总量
          </div>
        </CardFooter>
      </Card>

      {/* 本月应付 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>本月应付</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMoney(kpi.monthPayable)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              应付款
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            未付进货款合计
          </div>
          <div className="text-muted-foreground">
            本月采购订单应付余额总计
          </div>
        </CardFooter>
      </Card>

      {/* 本月应收 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>本月应收</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatMoney(kpi.monthReceivable)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              应收款
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            未收出货款合计
          </div>
          <div className="text-muted-foreground">
            本月销售订单应收余额总计
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
