// Formatting utilities

/**
 * Format money amount in CNY
 */
export function formatMoney(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format weight in KG
 */
export function formatWeight(weight: number): string {
  return `${weight.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG`;
}

/**
 * Format date string
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Format date time string
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Format yield rate
 */
export function formatYieldRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Generate order number
 */
export function generateOrderNo(prefix: string): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `${prefix}D-${datePart}-${seq}`;
}

/**
 * Generate UUID
 */
export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert number to Chinese uppercase amount (大写金额)
 */
export function numberToChinese(n: number): string {
  if (n === 0) return '零元整';
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿'];

  const isNeg = n < 0;
  n = Math.abs(n);

  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
  const jiao = Math.floor(decPart / 10);
  const fen = decPart % 10;

  let result = isNeg ? '负' : '';

  if (intPart > 0) {
    const intStr = String(intPart);
    const len = intStr.length;
    let zeroFlag = false;
    for (let i = 0; i < len; i++) {
      const d = parseInt(intStr[i]);
      const pos = len - 1 - i;
      const unitIdx = pos % 4;
      const bigIdx = Math.floor(pos / 4);

      if (d === 0) {
        zeroFlag = true;
        if (unitIdx === 0 && bigIdx > 0) {
          // Remove trailing zero before big unit
          result = result.replace(/零+$/, '');
          result += bigUnits[bigIdx];
        }
      } else {
        if (zeroFlag) {
          result += '零';
          zeroFlag = false;
        }
        result += digits[d] + units[unitIdx];
        if (unitIdx === 0 && bigIdx > 0) {
          result += bigUnits[bigIdx];
        }
      }
    }
    result = result.replace(/零+$/, '');
    result += '元';
  }

  if (jiao > 0) {
    result += digits[jiao] + '角';
  }
  if (fen > 0) {
    result += digits[fen] + '分';
  } else if (jiao === 0 && intPart > 0) {
    result += '整';
  } else if (jiao > 0) {
    result += '整';
  }

  return result || '零元整';
}
