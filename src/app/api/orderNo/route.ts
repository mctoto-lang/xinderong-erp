import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/sqlite';

const TABLE_MAP: Record<string, string> = {
  JHD: 'purchase_orders',
  CHD: 'sales_orders',
  SCD: 'production_orders',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const prefix = searchParams.get('prefix');
  const date = searchParams.get('date');

  if (!prefix || !date) {
    return NextResponse.json({ error: 'prefix and date are required' }, { status: 400 });
  }

  const table = TABLE_MAP[prefix];
  if (!table) {
    return NextResponse.json({ error: 'Invalid prefix' }, { status: 400 });
  }

  try {
    const datePart = date.replace(/-/g, '');
    const likePattern = `${prefix}-${datePart}-%`;

    const rows = db.prepare(`SELECT orderNo FROM ${table} WHERE orderNo LIKE ?`).all(likePattern) as { orderNo: string }[];
    
    let maxSeq = 0;
    for (const row of rows) {
      const parts = row.orderNo.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }

    const nextSeq = maxSeq + 1;
    const orderNo = `${prefix}-${datePart}-${String(nextSeq).padStart(3, '0')}`;

    return NextResponse.json({ orderNo });
  } catch (error) {
    console.error('Generate orderNo error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
