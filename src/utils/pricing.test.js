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
});
