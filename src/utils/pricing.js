/**
 * Medix Default Settings
 */
export const DEFAULT_SETTINGS = {
  businessName: 'Medix',
  tagline: 'Medicine Home Delivery',
  phone: '9876543210',
  address: 'Kolkata, West Bengal, India',
  pharmacyName: 'Medix Partner Pharmacy',
  pharmacyDlNo: 'DL-20B-12345/21B-12346',
  minOrder: 500,
  tier1DiscountPercent: 15, // Total MRP under threshold (General)
  tier2DiscountPercent: 17, // Total MRP threshold or above (General)
  babyCareDiscountPercent: 5, // Baby care products fixed discount
  tierThreshold: 1500,
  customerFee: 15,          // delivery + platform combined
  pharmacyDiscountPercent: 15,
  pharmacyCommissionPercent: 3,
  deliveryCost: 25,         // delivery boy cost per order
};

/**
 * Round to 2 decimal places internally
 */
export function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Format number to Indian Rupee format without paise (en-IN)
 */
export function formatINR(num) {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const rounded = Math.round(Number(num));
  return `₹${rounded.toLocaleString('en-IN')}`;
}

/**
 * Format plain number with en-IN separators
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const rounded = Math.round(Number(num));
  return rounded.toLocaleString('en-IN');
}

/**
 * Pure calculation function for order economics
 * 
 * @param {Array} items Array of { name, mrp, qty, notAvailable, isBabyCare }
 * @param {Object} customSettings Optional partial settings override
 * @returns {Object} Bill calculation results
 */
export function calculateBill(items = [], customSettings = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...customSettings };

  // Calculate gross Total MRP for available items
  let totalMrp = 0;
  for (const item of items || []) {
    if (!item.notAvailable) {
      const mrp = Number(item.mrp) || 0;
      const qty = Number(item.qty) || 0;
      if (mrp > 0 && qty > 0) {
        totalMrp += mrp * qty;
      }
    }
  }
  totalMrp = round2(totalMrp);

  if (totalMrp <= 0) {
    return {
      totalMrp: 0,
      discountPercent: 0,
      discountTier: null,
      discountAmount: 0,
      customerFee: 0,
      amountToPay: 0,
      customerSaves: 0,
      customerPaysMedicines: 0,
      pharmacyBill: 0,
      commission: 0,
      deliveryCost: 0,
      profit: 0,
      isBelowMinimum: false,
      thresholdHint: null,
      profitStatus: 'amber',
      itemsWithCalc: (items || []).map(i => ({
        ...i,
        lineMrp: 0,
        discountPercent: i.isBabyCare ? (settings.babyCareDiscountPercent || 5) : settings.tier1DiscountPercent,
        discountAmount: 0,
        lineNet: 0,
      })),
    };
  }

  // General tier determination
  const isTier2 = totalMrp >= settings.tierThreshold;
  const generalDiscountPercent = isTier2 ? settings.tier2DiscountPercent : settings.tier1DiscountPercent;
  const discountTier = isTier2 ? 2 : 1;
  const babyDiscountPercent = settings.babyCareDiscountPercent ?? 5;

  let totalDiscountAmount = 0;
  let totalOwnerMarginMedicines = 0;

  const totalPharmacyMarginPercent = Number(settings.pharmacyDiscountPercent) + Number(settings.pharmacyCommissionPercent); // 18%

  const itemsWithCalc = (items || []).map(item => {
    const mrp = Number(item.mrp) || 0;
    const qty = Number(item.qty) || 0;
    const lineMrp = round2(mrp * qty);

    if (item.notAvailable || mrp <= 0 || qty <= 0) {
      return {
        ...item,
        lineMrp: 0,
        discountPercent: item.isBabyCare ? babyDiscountPercent : generalDiscountPercent,
        discountAmount: 0,
        lineNet: 0,
      };
    }

    const itemDiscountPercent = item.isBabyCare ? babyDiscountPercent : generalDiscountPercent;
    const itemDiscountAmount = round2((lineMrp * itemDiscountPercent) / 100);
    const lineNet = round2(lineMrp - itemDiscountAmount);

    totalDiscountAmount += itemDiscountAmount;

    // Owner margin on this item
    const itemOwnerMargin = round2(((totalPharmacyMarginPercent - itemDiscountPercent) / 100) * lineMrp);
    totalOwnerMarginMedicines += itemOwnerMargin;

    return {
      ...item,
      lineMrp,
      discountPercent: itemDiscountPercent,
      discountAmount: itemDiscountAmount,
      lineNet,
    };
  });

  totalDiscountAmount = round2(totalDiscountAmount);
  const customerFee = settings.customerFee;
  const amountToPay = round2(totalMrp - totalDiscountAmount + customerFee);
  const customerSaves = totalDiscountAmount;

  // Owner calculations
  const customerPaysMedicines = round2(totalMrp - totalDiscountAmount);
  const pharmacyBill = round2(totalMrp * (1 - settings.pharmacyDiscountPercent / 100));
  const commission = round2(totalMrp * (settings.pharmacyCommissionPercent / 100));

  // Profit: totalOwnerMarginMedicines + customerFee - deliveryCost
  const profit = round2(totalOwnerMarginMedicines + customerFee - settings.deliveryCost);

  let profitStatus = 'amber';
  if (profit >= 6) {
    profitStatus = 'green';
  } else if (profit < 0) {
    profitStatus = 'red';
  } else {
    profitStatus = 'amber';
  }

  // Warnings and Hints
  const isBelowMinimum = totalMrp < settings.minOrder;
  let thresholdHint = null;
  if (!isTier2) {
    const diffToThreshold = round2(settings.tierThreshold - totalMrp);
    if (diffToThreshold > 0 && diffToThreshold <= 300) {
      thresholdHint = `Add ₹${Math.round(diffToThreshold).toLocaleString('en-IN')} more to unlock ${settings.tier2DiscountPercent}% off`;
    }
  }

  return {
    totalMrp,
    discountPercent: generalDiscountPercent,
    discountTier,
    discountAmount: totalDiscountAmount,
    customerFee,
    amountToPay,
    customerSaves,
    customerPaysMedicines,
    pharmacyBill,
    commission,
    deliveryCost: settings.deliveryCost,
    profit,
    isBelowMinimum,
    thresholdHint,
    profitStatus,
    itemsWithCalc,
  };
}
