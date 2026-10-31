import { DEFAULT_SETTINGS } from './pricing';

const STORAGE_KEYS = {
  SETTINGS: 'medix_billing_settings',
  ORDERS: 'medix_billing_orders',
};

export function getSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (e) {
    console.error('Failed to parse settings from localStorage', e);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Failed to save settings', e);
    return false;
  }
}

export function getOrders() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse orders from localStorage', e);
    return [];
  }
}

export function saveOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return true;
  } catch (e) {
    console.error('Failed to save orders', e);
    return false;
  }
}

/**
 * Format date to YYYYMMDD
 */
export function getFormattedDateString(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generates MDX-YYYYMMDD-001 format
 */
export function generateOrderNumber(existingOrders = [], date = new Date()) {
  const dateStr = getFormattedDateString(date);
  const prefix = `MDX-${dateStr}-`;

  let maxSeq = 0;
  for (const order of existingOrders) {
    if (order.orderNumber && order.orderNumber.startsWith(prefix)) {
      const seqPart = order.orderNumber.slice(prefix.length);
      const seqNum = parseInt(seqPart, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * Export all data to JSON
 */
export function exportAllData() {
  const data = {
    app: 'Medix Billing',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    orders: getOrders(),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medix_backup_${getFormattedDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import data from JSON string
 */
export function importAllData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.settings) {
      saveSettings(data.settings);
    }
    if (Array.isArray(data.orders)) {
      saveOrders(data.orders);
    }
    return { success: true, count: data.orders ? data.orders.length : 0 };
  } catch (e) {
    console.error('Import failed', e);
    return { success: false, error: e.message };
  }
}

/**
 * Export Orders to CSV
 */
export function exportOrdersToCSV(orders = []) {
  if (!orders.length) return;

  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Phone',
    'Address',
    'Payment Mode',
    'Status',
    'Total MRP',
    'Discount %',
    'Discount Amount',
    'Customer Fee',
    'Amount To Pay',
    'Owner Profit',
    'Items Summary',
    'Delivered At',
  ];

  const rows = orders.map(o => {
    const itemsSummary = (o.items || [])
      .map(i => `${i.name}${i.isBabyCare ? ' (Baby Care)' : ''}${i.notAvailable ? ' (N/A)' : ''} [${i.qty} x ${i.mrp}]`)
      .join('; ');

    return [
      `"${o.orderNumber || ''}"`,
      `"${o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : ''}"`,
      `"${(o.customer?.name || '').replace(/"/g, '""')}"`,
      `"${o.customer?.phone || ''}"`,
      `"${(o.customer?.address || '').replace(/"/g, '""')}"`,
      `"${o.paymentMode || 'COD'}"`,
      `"${o.status || 'Pending'}"`,
      o.calculation?.totalMrp ?? 0,
      o.calculation?.discountPercent ?? 0,
      o.calculation?.discountAmount ?? 0,
      o.calculation?.customerFee ?? 0,
      o.calculation?.amountToPay ?? 0,
      o.calculation?.profit ?? 0,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      `"${o.deliveredAt ? new Date(o.deliveredAt).toLocaleString('en-IN') : ''}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medix_orders_${getFormattedDateString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
