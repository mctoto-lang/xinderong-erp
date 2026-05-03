import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ExportOrder {
  orderNo: string;
  date: string;
  supplierOrCustomer: string;
  items: ExportOrderItem[];
  totalWeight: number;
  totalAmount: number;
  freight: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentStatus: string;
}

interface ExportOrderItem {
  productName: string;
  spec?: string;
  weight: number;
  unitPrice: number;
  amount: number;
}

interface ProductInfo {
  name: string;
  spec?: string;
  displayName: string;
}

const PRODUCT_COLORS = [
  { bg: 'E6F3FF', font: '0066CC' },
  { bg: 'FFF0E6', font: 'CC6600' },
  { bg: 'E6FFE6', font: '009933' },
  { bg: 'FFFDE6', font: '996600' },
  { bg: 'F3E6FF', font: '6600CC' },
];

export function exportToExcel(
  orders: ExportOrder[],
  title: string,
  dateFrom: string | undefined,
  dateTo: string | undefined,
  type: 'purchase' | 'sale'
) {
  const productMap = new Map<string, ProductInfo>();
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.productName;
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: item.productName,
          spec: item.spec,
          displayName: item.spec ? `${item.productName}（${item.spec}）` : item.productName,
        });
      }
    });
  });
  const productList = Array.from(productMap.values());
  const maxProducts = Math.max(3, productList.length);

  const dateRangeText = formatDateRange(dateFrom, dateTo);
  const titleRow = [`${title}${dateRangeText ? `（${dateRangeText}）` : ''}`];
  const headerRow = ['日期', type === 'purchase' ? '供应商' : '客户'];

  for (let i = 0; i < maxProducts; i++) {
    headerRow.push(`产品-${i + 1}`);
    headerRow.push('单价（￥）');
    headerRow.push('重量（KG）');
  }

  headerRow.push('合计重量（KG）', '总金额', '运费', '已付款', '待付款', '付款状态');

  const dataRows: (string | number)[][] = [];
  orders.forEach(order => {
    const row: (string | number)[] = [order.date, order.supplierOrCustomer];
    const itemMap = new Map<string, ExportOrderItem>();
    order.items.forEach(item => {
      itemMap.set(item.productName, item);
    });

    productList.slice(0, maxProducts).forEach(product => {
      const item = itemMap.get(product.name);
      if (item) {
        row.push(item.spec ? `${item.productName}（${item.spec}）` : item.productName);
        row.push(item.unitPrice.toFixed(2));
        row.push(item.weight.toFixed(2));
      } else {
        row.push('', '', '');
      }
    });

    for (let i = productList.length; i < maxProducts; i++) {
      row.push('', '', '');
    }

    row.push(
      order.totalWeight.toFixed(2),
      order.totalAmount.toFixed(2),
      order.freight.toFixed(2),
      order.paidAmount.toFixed(2),
      order.unpaidAmount.toFixed(2),
      order.paymentStatus
    );
    dataRows.push(row);
  });

  const wsData = [titleRow, headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } }];

  ws['!rows'] = [
    { hpt: 30 },
  ];

  const colWidths = [{ wch: 12 }, { wch: 15 }];
  for (let i = 0; i < maxProducts; i++) {
    colWidths.push({ wch: 20 }, { wch: 12 }, { wch: 12 });
  }
  colWidths.push({ wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 });
  ws['!cols'] = colWidths;

  if (!ws['!ref']) {
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: wsData.length - 1, c: headerRow.length - 1 } });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title);

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileDateStr = dateRangeText ? `_${dateRangeText.replace(/\s/g, '')}` : '';
  a.download = `${title}${fileDateStr}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(
  orders: ExportOrder[],
  title: string,
  dateFrom: string | undefined,
  dateTo: string | undefined,
  type: 'purchase' | 'sale'
) {
  const productMap = new Map<string, ProductInfo>();
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.productName;
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: item.productName,
          spec: item.spec,
          displayName: item.spec ? `${item.productName}（${item.spec}）` : item.productName,
        });
      }
    });
  });
  const productList = Array.from(productMap.values());
  const maxProducts = Math.min(productList.length, 5);

  const dateRangeText = formatDateRange(dateFrom, dateTo);
  const titleText = `${title}${dateRangeText ? `（${dateRangeText}）` : ''}`;

  const productHeaders = Array.from({ length: maxProducts }, (_, idx) => {
    const color = PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
    return `
      <th style="background-color: #${color.bg}; color: #${color.font}; padding: 8px 4px; border: 1px solid #333; font-size: 11px; font-weight: 600;">产品-${idx + 1}</th>
      <th style="background-color: #${color.bg}; color: #${color.font}; padding: 8px 4px; border: 1px solid #333; font-size: 11px; font-weight: 600;">单价（￥）</th>
      <th style="background-color: #${color.bg}; color: #${color.font}; padding: 8px 4px; border: 1px solid #333; font-size: 11px; font-weight: 600;">重量（KG）</th>
    `;
  }).join('');

  const rows = orders.map(order => {
    const itemMap = new Map<string, ExportOrderItem>();
    order.items.forEach(item => {
      itemMap.set(item.productName, item);
    });

    const productCells = productList.slice(0, maxProducts).map((product, idx) => {
      const color = PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
      const item = itemMap.get(product.name);
      if (item) {
        const displayProduct = item.spec ? `${item.productName}（${item.spec}）` : item.productName;
        return `
          <td style="background-color: #${color.bg}; padding: 6px 4px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${displayProduct}</td>
          <td style="background-color: #${color.bg}; padding: 6px 4px; border: 1px solid #ddd; text-align: right; font-size: 11px;">${item.unitPrice.toFixed(2)}</td>
          <td style="background-color: #${color.bg}; padding: 6px 4px; border: 1px solid #ddd; text-align: right; font-size: 11px;">${item.weight.toFixed(2)}</td>
        `;
      }
      return `
        <td style="background-color: #${color.bg}; padding: 6px 4px; border: 1px solid #ddd; text-align: center; font-size: 11px;"></td>
        <td style="background-color: #${color.bg}; padding: 6px 4px; border: 1px solid #ddd; text-align: right; font-size: 11px;"></td>
        <td style="background-color: #${color.bg}; padding: 6px 4px; border: 1px solid #ddd; text-align: right; font-size: 11px;"></td>
      `;
    }).join('');

    return `
      <tr>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${order.date}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd;">${order.supplierOrCustomer}</td>
        ${productCells}
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${order.totalWeight.toFixed(2)}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${order.totalAmount.toFixed(2)}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${order.freight.toFixed(2)}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${order.paidAmount.toFixed(2)}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: right;">${order.unpaidAmount.toFixed(2)}</td>
        <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${order.paymentStatus}</td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Microsoft YaHei', 'SimHei', sans-serif; font-size: 12px; }
    h1 { text-align: center; font-size: 18px; margin-bottom: 10px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #f5f5f5; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${titleText}</h1>
  <table>
    <thead>
      <tr>
        <th style="padding: 8px 4px; border: 1px solid #333;">日期</th>
        <th style="padding: 8px 4px; border: 1px solid #333;">${type === 'purchase' ? '供应商' : '客户'}</th>
        ${productHeaders}
        <th style="padding: 8px 4px; border: 1px solid #333;">合计重量</th>
        <th style="padding: 8px 4px; border: 1px solid #333;">总金额</th>
        <th style="padding: 8px 4px; border: 1px solid #333;">运费</th>
        <th style="padding: 8px 4px; border: 1px solid #333;">已付款</th>
        <th style="padding: 8px 4px; border: 1px solid #333;">待付款</th>
        <th style="padding: 8px 4px; border: 1px solid #333;">付款状态</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const pw = window.open(url, '_blank');
  if (pw) {
    pw.document.title = title;
    setTimeout(() => {
      pw.print();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 400);
  }
}

function formatDateRange(dateFrom: string | undefined, dateTo: string | undefined): string {
  if (!dateFrom || !dateTo || dateFrom === '1970-01-01') {
    return '';
  }
  try {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return '';
    }
    const fromStr = format(from, 'yyyy年M月d日', { locale: zhCN });
    const toStr = format(to, 'yyyy年M月d日', { locale: zhCN });
    return `${fromStr} - ${toStr}`;
  } catch {
    return '';
  }
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: '未付款',
  partial: '部分付款',
  paid: '已付清',
};
