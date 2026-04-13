import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/sqlite';
import { generateId } from '@/lib/format';

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

const TABLES_WITH_CREATED_AT = [
  'users', 'customers', 'suppliers', 'product_categories',
  'purchase_orders', 'payment_records', 'sales_orders',
  'collection_records', 'production_orders', 'inventory',
  'inventory_logs', 'logistics_records', 'audit_logs', 'notifications',
];

const TABLES_WITH_UPDATED_AT = [
  'users', 'customers', 'suppliers', 'product_categories',
  'purchase_orders', 'sales_orders', 'production_orders',
  'inventory', 'logistics_records',
];

function getTable(entity: string): string | null {
  return TABLE_MAP[entity] || null;
}

function parseBody(body: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const table = getTable(entity);
  if (!table) {
    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const key = searchParams.get('key');
    const category = searchParams.get('category');
    const orderId = searchParams.get('orderId');
    const inventoryId = searchParams.get('inventoryId');
    const username = searchParams.get('username');

    if (id) {
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      return NextResponse.json(row || null);
    }

    if (username && table === 'users') {
      const row = db.prepare(`SELECT * FROM ${table} WHERE username = ?`).get(username);
      return NextResponse.json(row || null);
    }

    if (key && table === 'system_settings') {
      const row = db.prepare(`SELECT * FROM ${table} WHERE key = ?`).get(key);
      return NextResponse.json((row as { value?: string } | undefined)?.value || null);
    }

    let sql = `SELECT * FROM ${table}`;
    const conditions: string[] = [];
    const paramsArr: (string | number)[] = [];

    if (category && table === 'product_categories') {
      conditions.push('category = ?');
      paramsArr.push(category);
    }
    if (orderId && (table === 'purchase_order_items' || table === 'sales_order_items' || table === 'production_order_items' || table === 'payment_records' || table === 'collection_records')) {
      conditions.push('orderId = ?');
      paramsArr.push(orderId);
    }
    if (inventoryId && table === 'inventory_logs') {
      conditions.push('inventoryId = ?');
      paramsArr.push(inventoryId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const rows = db.prepare(sql).all(...paramsArr);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(`GET ${entity} error:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const table = getTable(entity);
  if (!table) {
    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const data = parseBody(body);

    if (!data.id) {
      data.id = generateId();
    }

    const now = new Date().toISOString();
    if (TABLES_WITH_CREATED_AT.includes(table) && !data.createdAt) {
      data.createdAt = now;
    }
    if (TABLES_WITH_UPDATED_AT.includes(table) && !data.updatedAt) {
      data.updatedAt = now;
    }

    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(c => data[c]);

    db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`).run(...values);

    return NextResponse.json(data);
  } catch (error) {
    console.error(`POST ${entity} error:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const table = getTable(entity);
  if (!table) {
    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (TABLES_WITH_UPDATED_AT.includes(table)) {
      data.updatedAt = new Date().toISOString();
    }

    const columns = Object.keys(data);
    if (columns.length === 0) {
      return NextResponse.json({ id });
    }

    const setClause = columns.map(c => `${c} = ?`).join(', ');
    const values = columns.map(c => data[c]);

    db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values, id);

    return NextResponse.json({ id, ...data });
  } catch (error) {
    console.error(`PUT ${entity} error:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const table = getTable(entity);
  if (!table) {
    return NextResponse.json({ error: 'Unknown entity' }, { status: 400 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE ${entity} error:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
