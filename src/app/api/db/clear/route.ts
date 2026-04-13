import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/sqlite';

const TABLE_MAP: Record<string, string> = {
  users: 'users',
  customers: 'customers',
  suppliers: 'suppliers',
  productCategories: 'product_categories',
  purchaseOrders: 'purchase_orders',
  purchaseOrderItems: 'purchase_order_items',
  paymentRecords: 'payment_records',
  salesOrders: 'sales_orders',
  salesOrderItems: 'sales_order_items',
  collectionRecords: 'collection_records',
  productionOrders: 'production_orders',
  productionOrderItems: 'production_order_items',
  inventory: 'inventory',
  inventoryLogs: 'inventory_logs',
  logisticsRecords: 'logistics_records',
  systemSettings: 'system_settings',
  auditLogs: 'audit_logs',
  notifications: 'notifications',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity } = body;

    const table = TABLE_MAP[entity];
    if (!table) {
      return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
    }

    db.prepare(`DELETE FROM ${table}`).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear store error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
