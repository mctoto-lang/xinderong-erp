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
  weight: number;
  unitPrice: number;
  amount: number;
}

const PRODUCT_COLORS = [
  { bg: 'FFE6F3FF', font: 'FF0066CC' },
  { bg: 'FFFFF0E6', font: 'FFCC6600' },
  { bg: 'FFE6FFE6', font: 'FF009933' },
  { bg: 'FFFFFDE6', font: 'FF996600' },
  { bg: 'FFF3E6FF', font: 'FF6600CC' },
];

export function exportToExcel(
  orders: ExportOrder[],
  title: string,
  dateFrom: string,
  dateTo: string,
  type: 'purchase' | 'sale'
) {
  const allProducts = new Set<string>();
  orders.forEach(order => {
    order.items.forEach(item => {
      allProducts.add(item.productName);
    });
  });
  const productList = Array.from(allProducts);
  const maxProducts = Math.max(3, productList.length);

  const dateRangeText = formatDateRange(dateFrom, dateTo);
  const titleRow = [`${title}（${dateRangeText}）`];
  const headerRow = ['日期', type === 'purchase' ? '供应商' : '客户'];

  productList.slice(0, maxProducts).forEach((product, idx) => {
    headerRow.push(`产品${idx + 1}（${product}）`);
    headerRow.push(`产品${idx + 1}单价（￥）`);
    headerRow.push(`产品${idx + 1}重量（KG）`);
  });

  for (let i = productList.length; i < maxProducts; i++) {
    headerRow.push(`产品${i + 1}`);
    headerRow.push(`产品${i + 1}单价（￥）`);
    headerRow.push(`产品${i + 1}重量（KG）`);
  }

  headerRow.push('合计重量（KG）', '总金额', '运费', '已付款', '待付款', '付款状态');

  const dataRows: (string | number)[][] = [];
  orders.forEach(order => {
    const row: (string | number)[] = [order.date, order.supplierOrCustomer];
    const productMap = new Map<string, ExportOrderItem>();
    order.items.forEach(item => {
      productMap.set(item.productName, item);
    });

    productList.slice(0, maxProducts).forEach(product => {
      const item = productMap.get(product);
      if (item) {
        row.push(item.productName);
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

  const colWidths = [{ wch: 12 }, { wch: 15 }];
  for (let i = 0; i < maxProducts; i++) {
    colWidths.push({ wch: 18 }, { wch: 14 }, { wch: 14 });
  }
  colWidths.push({ wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 });
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
  a.download = `${title}_${formatDateRange(dateFrom, dateTo).replace(/\s/g, '')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(
  orders: ExportOrder[],
  title: string,
  dateFrom: string,
  dateTo: string,
  type: 'purchase' | 'sale'
) {
  const allProducts = new Set<string>();
  orders.forEach(order => {
    order.items.forEach(item => {
      allProducts.add(item.productName);
    });
  });
  const productList = Array.from(allProducts);
  const maxProducts = Math.min(productList.length, 5);

  const dateRangeText = formatDateRange(dateFrom, dateTo);

  const productHeaders = productList.slice(0, maxProducts).map((product, idx) => {
    const color = PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
    return `
      <th style="background-color: #${color.bg}; color: #${color.font}; padding: 8px 4px; border: 1px solid #333; font-size: 11px;">产品${idx + 1}（${product}）</th>
      <th style="background-color: #${color.bg}; color: #${color.font}; padding: 8px 4px; border: 1px solid #333; font-size: 11px;">单价</th>
      <th style="background-color: #${color.bg}; color: #${color.font}; padding: 8px 4px; border: 1px solid #333; font-size: 11px;">重量</th>
    `;
  }).join('');

  const rows = orders.map(order => {
    const productMap = new Map<string, ExportOrderItem>();
    order.items.forEach(item => {
      productMap.set(item.productName, item);
    });

    const productCells = productList.slice(0, maxProducts).map((product, idx) => {
      const color = PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
      const item = productMap.get(product);
      if (item) {
        return `
          <td style="background-color: #${color.bg}; padding: 6px 4px; border: 1px solid #ddd; text-align: center; font-size: 11px;">${item.productName}</td>
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
    h1 { text-align: center; font-size: 18px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #f5f5f5; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${title}（${dateRangeText}）</h1>
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

function formatDateRange(dateFrom: string, dateTo: string): string {
  try {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const fromStr = format(from, 'yyyy年M月d日', { locale: zhCN });
    const toStr = format(to, 'yyyy年M月d日', { locale: zhCN });
    return `${fromStr} - ${toStr}`;
  } catch {
    return `${dateFrom} - ${dateTo}`;
  }
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: '未付款',
  partial: '部分付款',
  paid: '已付清',
};
