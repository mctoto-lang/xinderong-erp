import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'data')
  : path.join(process.cwd(), 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'erp.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'readonly',
    status TEXT NOT NULL DEFAULT 'active',
    lastLoginAt TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contactPerson TEXT,
    phone TEXT,
    address TEXT,
    level TEXT DEFAULT 'C',
    creditLimit REAL DEFAULT 0,
    remark TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contactPerson TEXT,
    phone TEXT,
    address TEXT,
    mainProducts TEXT,
    rating TEXT DEFAULT 'B',
    remark TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    spec TEXT,
    sort INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    orderNo TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    supplierId TEXT,
    supplierName TEXT,
    totalAmount REAL DEFAULT 0,
    freight REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    unpaidAmount REAL DEFAULT 0,
    paymentStatus TEXT DEFAULT 'unpaid',
    remark TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    productId TEXT,
    productName TEXT,
    spec TEXT,
    weight REAL DEFAULT 0,
    unitPrice REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    outputWeight REAL,
    yieldRate REAL
  );

  CREATE TABLE IF NOT EXISTS payment_records (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    orderType TEXT NOT NULL,
    amount REAL DEFAULT 0,
    method TEXT,
    date TEXT,
    remark TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS sales_orders (
    id TEXT PRIMARY KEY,
    orderNo TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    customerId TEXT,
    customerName TEXT,
    totalAmount REAL DEFAULT 0,
    freight REAL DEFAULT 0,
    collectedAmount REAL DEFAULT 0,
    uncollectedAmount REAL DEFAULT 0,
    paymentStatus TEXT DEFAULT 'unpaid',
    remark TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS sales_order_items (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    productId TEXT,
    productName TEXT,
    weight REAL DEFAULT 0,
    unitPrice REAL DEFAULT 0,
    amount REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS collection_records (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    amount REAL DEFAULT 0,
    method TEXT,
    date TEXT,
    remark TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS production_orders (
    id TEXT PRIMARY KEY,
    orderNo TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    inputTotal REAL DEFAULT 0,
    outputTotal REAL DEFAULT 0,
    avgYieldRate REAL DEFAULT 0,
    remark TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS production_order_items (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    productId TEXT,
    productName TEXT,
    inputWeight REAL DEFAULT 0,
    currentStock REAL DEFAULT 0,
    outputWeight REAL DEFAULT 0,
    yieldRate REAL DEFAULT 0,
    remark TEXT
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    productName TEXT NOT NULL,
    category TEXT,
    rawMaterialStock REAL DEFAULT 0,
    finishedProductStock REAL DEFAULT 0,
    warningThreshold REAL DEFAULT 0,
    status TEXT DEFAULT 'normal',
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS inventory_logs (
    id TEXT PRIMARY KEY,
    inventoryId TEXT,
    productName TEXT,
    logType TEXT,
    relatedOrderNo TEXT,
    quantity REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    remark TEXT,
    operator TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS logistics_records (
    id TEXT PRIMARY KEY,
    relatedOrderNo TEXT,
    type TEXT,
    plateNumber TEXT,
    driver TEXT,
    freight REAL DEFAULT 0,
    date TEXT,
    fromAddress TEXT,
    toAddress TEXT,
    status TEXT DEFAULT 'pending',
    remark TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime')),
    updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    operator TEXT,
    module TEXT,
    action TEXT,
    detail TEXT,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    content TEXT,
    isRead INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  db.prepare(`
    INSERT INTO users (id, username, password, name, role, status)
    VALUES ('admin', 'admin', 'admin123', '系统管理员', 'admin', 'active')
  `).run();
}

export default db;
