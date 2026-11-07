import { describe, it, expect } from 'vitest';
import { calculateBill, DEFAULT_SETTINGS } from './pricing';

describe('calculateBill - Economics Rules', () => {
  it('Example 1: MRP 1000 => discount 150, pays 865, profit 20', () => {
    const items = [
      { name: 'Medicine A', mrp: 500, qty: 2, notAvailable: false },
    ];
    const bill = calculateBill(items, DEFAULT_SETTINGS);

    expect(bill.totalMrp).toBe(1000);
    expect(bill.discountPercent).toBe(15);
    expect(bill.discountAmount).toBe(150);
    expect(bill.customerFee).toBe(15);
    expect(bill.amountToPay).toBe(865);
    expect(bill.customerSaves).toBe(150);
    expect(bill.profit).toBe(20);
    expect(bill.profitStatus).toBe('green');
  });

  it('Example 2: MRP 1500 => discount 255, pays 1260, profit 5', () => {
    const items = [
      { name: 'Medicine B', mrp: 750, qty: 2, notAvailable: false },
    ];
    const bill = calculateBill(items, DEFAULT_SETTINGS);

    expect(bill.totalMrp).toBe(1500);
    expect(bill.discountPercent).toBe(17);
    expect(bill.discountAmount).toBe(255);
    expect(bill.customerFee).toBe(15);
    expect(bill.amountToPay).toBe(1260);
    expect(bill.customerSaves).toBe(255);
    expect(bill.profit).toBe(5);
    expect(bill.profitStatus).toBe('amber');
  });

  it('Example 3: MRP 2000 => discount 340, pays 1675, profit 10', () => {
    const items = [
      { name: 'Medicine C', mrp: 1000, qty: 2, notAvailable: false },
    ];
    const bill = calculateBill(items, DEFAULT_SETTINGS);

    expect(bill.totalMrp).toBe(2000);
    expect(bill.discountPercent).toBe(17);
    expect(bill.discountAmount).toBe(340);
    expect(bill.customerFee).toBe(15);
    expect(bill.amountToPay).toBe(1675);
    expect(bill.customerSaves).toBe(340);
    expect(bill.profit).toBe(10);
    expect(bill.profitStatus).toBe('green');
  });

  it('ignores notAvailable items', () => {
    const items = [
      { name: 'Medicine A', mrp: 1000, qty: 1, notAvailable: false },
      { name: 'Medicine Out of Stock', mrp: 500, qty: 2, notAvailable: true },
    ];
    const bill = calculateBill(items, DEFAULT_SETTINGS);

    expect(bill.totalMrp).toBe(1000);
    expect(bill.amountToPay).toBe(865);
    expect(bill.profit).toBe(20);
  });

  it('shows minimum order warning when under minimum order limit', () => {
    const items = [
      { name: 'Medicine Cheap', mrp: 200, qty: 1, notAvailable: false },
    ];
    const bill = calculateBill(items, DEFAULT_SETTINGS);

    expect(bill.isBelowMinimum).toBe(true);
  });

  it('shows threshold hint when within 300 of threshold', () => {
    const items = [
      { name: 'Medicine A', mrp: 1300, qty: 1, notAvailable: false },
    ];
    const bill = calculateBill(items, DEFAULT_SETTINGS);

    expect(bill.thresholdHint).toBe('Add ₹200 more to unlock 17% off');
  });

  it('applies 5% discount on Baby Care products and tier discount on general products', () => {
    const items = [
      { name: 'Baby Diaper', mrp: 500, qty: 1, isBabyCare: true, notAvailable: false }, // 5% = 25
      { name: 'Paracetamol', mrp: 500, qty: 1, isBabyCare: false, notAvailable: false }, // 15% = 75
    ];
    const bill = calculateBill(items, DEFAULT_SETTINGS);

    // Total MRP = 1000 (< 1500 => general gets 15%, baby care gets 5%)
    // Baby care discount: 500 * 5% = 25
    // Paracetamol discount: 500 * 15% = 75
    // Total discount = 100
    expect(bill.totalMrp).toBe(1000);
    expect(bill.discountAmount).toBe(100);
    expect(bill.amountToPay).toBe(1000 - 100 + 15); // 915
  });

  it('supports manual discount edits per item without auto tier override', () => {
    // 2 items totaling 2000 (which would be 17% in auto mode)
    // but manually set to 10% and 5%
    const items = [
      { name: 'Med 1', mrp: 1000, qty: 1, discountPercent: 10, notAvailable: false },
      { name: 'Med 2', mrp: 1000, qty: 1, discountPercent: 5, notAvailable: false },
    ];
    const bill = calculateBill(items, DEFAULT_SETTINGS);

    expect(bill.totalMrp).toBe(2000);
    // 1000 * 10% = 100, 1000 * 5% = 50 => total discount = 150 (7.5%)
    expect(bill.discountAmount).toBe(150);
    expect(bill.discountPercent).toBe(7.5);
    expect(bill.amountToPay).toBe(2000 - 150 + 15); // 1865
    expect(bill.discountTier).toBeNull(); // not an auto tier
  });

  it('supports 0% manual discount', () => {
    const items = [
      { name: 'Costly Injection', mrp: 1200, qty: 1, discountPercent: 0, notAvailable: false },
    ];
    const bill = calculateBill(items, DEFAULT_SETTINGS);

    expect(bill.totalMrp).toBe(1200);
    expect(bill.discountAmount).toBe(0);
    expect(bill.discountPercent).toBe(0);
    expect(bill.amountToPay).toBe(1215);
  });

  it('waives customer delivery fee when using coupon ZARIFA17', () => {
    const items = [
      { name: 'Paracetamol', mrp: 500, qty: 2, discountPercent: 15, notAvailable: false },
    ];
    const bill = calculateBill(items, { ...DEFAULT_SETTINGS, couponCode: 'ZARIFA17' });

    expect(bill.totalMrp).toBe(1000);
    expect(bill.discountAmount).toBe(150);
    expect(bill.isFreeDelivery).toBe(true);
    expect(bill.originalCustomerFee).toBe(15);
    expect(bill.customerFee).toBe(0);
    // 1000 - 150 + 0 = 850 (without fee)
    expect(bill.amountToPay).toBe(850);
    expect(bill.customerSaves).toBe(165); // 150 discount + 15 delivery fee
  });

  it('keeps normal delivery fee for unknown coupon', () => {
    const items = [
      { name: 'Paracetamol', mrp: 500, qty: 2, discountPercent: 15, notAvailable: false },
    ];
    const bill = calculateBill(items, { ...DEFAULT_SETTINGS, couponCode: 'WRONGCODE' });

    expect(bill.isFreeDelivery).toBe(false);
    expect(bill.customerFee).toBe(15);
    expect(bill.amountToPay).toBe(865);
  });
});
