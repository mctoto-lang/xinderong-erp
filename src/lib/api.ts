import type {
  User, Customer, Supplier, ProductCategory,
  PurchaseOrder, PurchaseOrderItem, PaymentRecord,
  SalesOrder, SalesOrderItem, CollectionRecord,
  ProductionOrder, ProductionOrderItem,
  Inventory, InventoryLog, LogisticsRecord,
  SystemSetting, AuditLog, Notification,
} from './types';

async function apiGet(entity: string, params?: Record<string, string>) {
  const url = new URL(`/api/db/${entity}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPost(entity: string, data: unknown) {
  const res = await fetch(`/api/db/${entity}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPut(entity: string, data: unknown) {
  const res = await fetch(`/api/db/${entity}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiDelete(entity: string, id: string) {
  const res = await fetch(`/api/db/${entity}?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiClear(entity: string) {
  const res = await fetch('/api/db/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiRemoveByOrderId(entity: string, orderId: string) {
  const res = await fetch('/api/db/remove-by-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity, orderId }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function createEntityApi<T extends { id: string }>(entity: string) {
  return {
    getAll: () => apiGet(entity) as Promise<T[]>,
    getById: (id: string) => apiGet(entity, { id }) as Promise<T | null>,
    add: (data: Omit<T, 'id'> & { id?: string }) => apiPost(entity, data) as Promise<T>,
    put: (data: T) => apiPut(entity, data) as Promise<T>,
    remove: (id: string) => apiDelete(entity, id) as Promise<{ success: boolean }>,
    clear: () => apiClear(entity) as Promise<{ success: boolean }>,
  };
}

export const dbUsers = {
  ...createEntityApi<User>('users'),
  getByUsername: async (username: string) => {
    return apiGet('users', { username }) as Promise<User | null>;
  },
};

export const dbCustomers = createEntityApi<Customer>('customers');

export const dbSuppliers = createEntityApi<Supplier>('suppliers');

export const dbProductCategories = {
  ...createEntityApi<ProductCategory>('productCategories'),
  getByCategory: async (category: 'purchase' | 'sale') => {
    return apiGet('productCategories', { category }) as Promise<ProductCategory[]>;
  },
};

export const dbPurchaseOrders = createEntityApi<PurchaseOrder>('purchaseOrders');

export const dbPurchaseOrderItems = {
  ...createEntityApi<PurchaseOrderItem>('purchaseOrderItems'),
  getByOrderId: async (orderId: string) => {
    return apiGet('purchaseOrderItems', { orderId }) as Promise<PurchaseOrderItem[]>;
  },
  addBatch: async (items: Omit<PurchaseOrderItem, 'id'>[]) => {
    return Promise.all(items.map(item => apiPost('purchaseOrderItems', item)));
  },
  removeByOrderId: async (orderId: string) => {
    return apiRemoveByOrderId('purchaseOrderItems', orderId);
  },
};

export const dbPaymentRecords = {
  ...createEntityApi<PaymentRecord>('paymentRecords'),
  getByOrderId: async (orderId: string) => {
    return apiGet('paymentRecords', { orderId }) as Promise<PaymentRecord[]>;
  },
  removeByOrderId: async (orderId: string) => {
    return apiRemoveByOrderId('paymentRecords', orderId);
  },
};

export const dbSalesOrders = createEntityApi<SalesOrder>('salesOrders');

export const dbSalesOrderItems = {
  ...createEntityApi<SalesOrderItem>('salesOrderItems'),
  getByOrderId: async (orderId: string) => {
    return apiGet('salesOrderItems', { orderId }) as Promise<SalesOrderItem[]>;
  },
  addBatch: async (items: Omit<SalesOrderItem, 'id'>[]) => {
    return Promise.all(items.map(item => apiPost('salesOrderItems', item)));
  },
  removeByOrderId: async (orderId: string) => {
    return apiRemoveByOrderId('salesOrderItems', orderId);
  },
};

export const dbCollectionRecords = {
  ...createEntityApi<CollectionRecord>('collectionRecords'),
  getByOrderId: async (orderId: string) => {
    return apiGet('collectionRecords', { orderId }) as Promise<CollectionRecord[]>;
  },
  removeByOrderId: async (orderId: string) => {
    return apiRemoveByOrderId('collectionRecords', orderId);
  },
};

export const dbProductionOrders = createEntityApi<ProductionOrder>('productionOrders');

export const dbProductionOrderItems = {
  ...createEntityApi<ProductionOrderItem>('productionOrderItems'),
  getByOrderId: async (orderId: string) => {
    return apiGet('productionOrderItems', { orderId }) as Promise<ProductionOrderItem[]>;
  },
  addBatch: async (items: Omit<ProductionOrderItem, 'id'>[]) => {
    return Promise.all(items.map(item => apiPost('productionOrderItems', item)));
  },
  removeByOrderId: async (orderId: string) => {
    return apiRemoveByOrderId('productionOrderItems', orderId);
  },
};

export const dbInventory = createEntityApi<Inventory>('inventory');

export const dbInventoryLogs = {
  ...createEntityApi<InventoryLog>('inventoryLogs'),
  getByInventoryId: async (inventoryId: string) => {
    return apiGet('inventoryLogs', { inventoryId }) as Promise<InventoryLog[]>;
  },
};

export const dbLogisticsRecords = createEntityApi<LogisticsRecord>('logisticsRecords');

export const dbSystemSettings = {
  getByKey: async (key: string) => {
    const value = await apiGet('systemSettings', { key });
    return value as string | null;
  },
  set: async (key: string, value: string) => {
    const res = await fetch('/api/db/system-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  getAll: () => apiGet('systemSettings') as Promise<SystemSetting[]>,
};

export const dbAuditLogs = createEntityApi<AuditLog>('auditLogs');

export const dbNotifications = createEntityApi<Notification>('notifications');

export async function initDatabase() {
  return Promise.resolve();
}
