// ERP Constants

export const COMPANY_NAME = '衡阳鑫德荣新材料科技有限公司';
export const COMPANY_SUBTITLE = '生产销售管理一体化平台';
export const SYSTEM_NAME = 'ERP管理系统';
export const DB_NAME = 'erp-xdr-2024';
export const DB_VERSION = 2;

// Payment methods
export const PAYMENT_METHODS = [
  '银行转账',
  '现金',
  '微信',
  '支付宝',
] as const;

// Order statuses
export const ORDER_STATUSES = [
  { value: 'pending', label: '待处理', color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: '已取消', color: 'bg-red-100 text-red-700' },
] as const;

export const PAYMENT_STATUSES = [
  { value: 'unpaid', label: '未付款', color: 'bg-gray-100 text-gray-700' },
  { value: 'partial', label: '部分付款', color: 'bg-orange-100 text-orange-700' },
  { value: 'paid', label: '已付清', color: 'bg-green-100 text-green-700' },
] as const;

export const PRODUCTION_STATUSES = [
  { value: 'pending', label: '待加工', color: 'bg-gray-100 text-gray-700' },
  { value: 'processing', label: '加工中', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: '已取消', color: 'bg-red-100 text-red-700' },
] as const;

export const LOGISTICS_STATUSES = [
  { value: 'pending', label: '待发货', color: 'bg-gray-100 text-gray-700' },
  { value: 'in_transit', label: '运输中', color: 'bg-blue-100 text-blue-700' },
  { value: 'arrived', label: '已到达', color: 'bg-green-100 text-green-700' },
] as const;

export const CUSTOMER_LEVELS = ['A', 'B', 'C', 'D'] as const;
export const USER_ROLES = [
  { value: 'admin', label: '管理员' },
  { value: 'accountant', label: '会计' },
  { value: 'sales', label: '销售' },
  { value: 'readonly', label: '只读' },
] as const;

// Inventory log types
export const INVENTORY_LOG_TYPES = [
  '进货入库', '进货撤销', '进货删除',
  '成品入库', '原料消耗',
  '出货出库', '生产入库', '生产投料',
  '手动增加', '手动减少',
] as const;

// Default system settings
export const DEFAULT_SETTINGS = [
  { key: 'companyName', value: COMPANY_NAME },
  { key: 'companyAddress', value: '湖南省衡阳市' },
  { key: 'companyPhone', value: '' },
] as const;

// Module navigation items
export const MODULES = [
  { key: 'dashboard', label: '首页仪表盘', icon: 'LayoutDashboard' },
  { key: 'purchase', label: '进货管理', icon: 'ShoppingCart' },
  { key: 'sales', label: '出货管理', icon: 'Truck' },
  { key: 'production', label: '生产加工', icon: 'Factory' },
  { key: 'inventory', label: '库存管理', icon: 'Warehouse' },
  { key: 'finance', label: '财务管理', icon: 'DollarSign' },
  { key: 'customer', label: '客户管理', icon: 'Users' },
  { key: 'supplier', label: '供应商管理', icon: 'Building2' },
  { key: 'logistics', label: '物流运输', icon: 'Package' },
  { key: 'charts', label: '图表分析', icon: 'BarChart3' },
  { key: 'system', label: '系统管理', icon: 'Settings' },
] as const;

// Object store names in IndexedDB
export const STORES = {
  users: 'users',
  customers: 'customers',
  suppliers: 'suppliers',
  productCategories: 'productCategories',
  purchaseOrders: 'purchaseOrders',
  purchaseOrderItems: 'purchaseOrderItems',
  paymentRecords: 'paymentRecords',
  salesOrders: 'salesOrders',
  salesOrderItems: 'salesOrderItems',
  collectionRecords: 'collectionRecords',
  productionOrders: 'productionOrders',
  productionOrderItems: 'productionOrderItems',
  inventory: 'inventory',
  inventoryLogs: 'inventoryLogs',
  logisticsRecords: 'logisticsRecords',
  systemSettings: 'systemSettings',
  auditLogs: 'auditLogs',
  notifications: 'notifications',
} as const;
