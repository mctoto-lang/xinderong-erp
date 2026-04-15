// ERP System Type Definitions
// 衡阳鑫德荣新材料科技有限公司

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'accountant' | 'sales' | 'readonly';
  status: 'active' | 'disabled';
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  level: 'A' | 'B' | 'C' | 'D';
  creditLimit: number;
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  mainProducts: string;
  rating: 'A' | 'B' | 'C' | 'D';
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  category: 'purchase' | 'sale';
  spec: string;
  sort: number;
  status: 'active' | 'disabled';
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type ProductionStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type LogisticsStatus = 'pending' | 'in_transit' | 'arrived';

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  freight: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentStatus: PaymentStatus;
  remark: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  spec: string;
  weight: number;
  unitPrice: number;
  amount: number;
  outputWeight?: number;
  yieldRate?: number;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderType: 'purchase' | 'sale';
  amount: number;
  method: string;
  date: string;
  remark: string;
  createdBy: string;
  createdAt?: string;
}

export interface SalesOrder {
  id: string;
  orderNo: string;
  date: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  freight: number;
  collectedAmount: number;
  uncollectedAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  remark: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  weight: number;
  unitPrice: number;
  amount: number;
}

export interface CollectionRecord {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  date: string;
  remark: string;
  createdBy: string;
  createdAt?: string;
}

export interface ProductionOrder {
  id: string;
  orderNo: string;
  date: string;
  status: ProductionStatus;
  inputTotal: number;
  outputTotal: number;
  avgYieldRate: number;
  remark: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  inputWeight: number;
  currentStock: number;
  outputWeight: number;
  outputProductName: string;
  yieldRate: number;
  remark: string;
}

export interface Inventory {
  id: string;
  productName: string;
  category: string;
  rawMaterialStock: number;
  finishedProductStock: number;
  warningThreshold: number;
  status: 'normal' | 'warning';
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryLog {
  id: string;
  inventoryId: string;
  productName: string;
  logType: string;
  relatedOrderNo: string;
  quantity: number;
  balance: number;
  remark: string;
  operator: string;
  createdAt?: string;
}

export interface LogisticsRecord {
  id: string;
  relatedOrderNo: string;
  type: 'purchase' | 'sale';
  plateNumber: string;
  driver: string;
  freight: number;
  date: string;
  fromAddress: string;
  toAddress: string;
  status: LogisticsStatus;
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
}

export interface AuditLog {
  id: string;
  operator: string;
  module: string;
  action: string;
  detail: string;
  createdAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt?: string;
}

export type ModuleKey =
  | 'dashboard'
  | 'purchase'
  | 'sales'
  | 'production'
  | 'inventory'
  | 'finance'
  | 'customer'
  | 'supplier'
  | 'logistics'
  | 'charts'
  | 'system';
