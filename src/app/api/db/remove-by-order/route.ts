import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/sqlite';

const TABLE_MAP: Record<string, string> = {
  purchaseOrderItems: 'purchase_order_items',
  salesOrderItems: 'sales_order_items',
  productionOrderItems: 'production_order_items',
  paymentRecords: 'payment_records',
  collectionRecords: 'collection_records',
  inventoryLogs: 'inventory_logs',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, orderId } = body;

    const table = TABLE_MAP[entity];
    if (!table) {
      return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    db.prepare(`DELETE FROM ${table} WHERE orderId = ?`).run(orderId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove by orderId error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
