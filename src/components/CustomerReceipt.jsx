import React from 'react';
import { formatINR } from '../utils/pricing';

export default function CustomerReceipt({ order, settings }) {
  if (!order) return null;

  const customer = order.customer || {};
  const calc = order.calculation || {};
  const items = order.items || [];
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

  const pharmacyName = settings?.pharmacyName || 'Medix Partner Pharmacy';
  const pharmacyDlNo = settings?.pharmacyDlNo || 'DL-20B-12345/21B-12346';

  return (
    <div className="receipt-80mm bg-white text-black font-mono text-[11px] leading-tight p-2 mx-auto w-[76mm] max-w-[76mm] border border-black print:border-0 print:p-0 print:w-[76mm] print:max-w-[76mm] select-none">
      {/* Invoice Header */}
      <div className="text-center pb-1 border-b-2 border-dashed border-black">
        <div className="text-sm font-black tracking-widest uppercase">
          INVOICE
        </div>
      </div>

      {/* Order Meta & Date */}
      <div className="py-1.5 border-b border-dashed border-black text-[10px]">
        <div className="flex justify-between">
          <span>ORDER NO:</span>
          <span className="font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>DATE:</span>
          <span>{orderDate.toLocaleDateString('en-IN')} {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex justify-between">
          <span>PAY MODE:</span>
          <span className="font-bold uppercase">{order.paymentMode === 'PAID' ? 'PAID (UPI)' : 'COD'}</span>
        </div>

        {/* Pharmacy Fulfillment & Drug License */}
        <div className="mt-1 pt-1 border-t border-dotted border-black text-[9px] leading-tight">
          <div>
            Fulfilled by: <span className="font-bold text-[10px]">{pharmacyName}</span>
          </div>
          <div>
            Drug License No: <span className="font-bold font-mono text-[9px]">{pharmacyDlNo}</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="py-1.5 border-b-2 border-dashed border-black text-[10px]">
        <div className="font-bold uppercase">CUSTOMER DETAILS:</div>
        <div className="font-bold text-[11px] mt-0.5">{customer.name || 'Walk-in Customer'}</div>
        {customer.phone && <div className="font-bold">Phone: {customer.phone}</div>}
        {customer.address && (
          <div className="mt-0.5 leading-tight font-sans text-[10px]">
            Address: {customer.address}
          </div>
        )}
        {customer.notes && (
          <div className="mt-0.5 italic text-[9px] font-sans">
            Note: {customer.notes}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="py-1.5 border-b border-dashed border-black">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-black text-[9px] font-bold uppercase">
              <th className="text-left py-1 w-[36%]">ITEM</th>
              <th className="text-center py-1 w-[12%]">QTY</th>
              <th className="text-right py-1 w-[18%]">RATE</th>
              <th className="text-center py-1 w-[16%]">DISC</th>
              <th className="text-right py-1 w-[18%]">AMT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-gray-400">
            {items.map((item, idx) => {
              const isNA = item.notAvailable;
              const mrp = Number(item.mrp) || 0;
              const qty = Number(item.qty) || 0;
              const lineMrp = mrp * qty;

              // Item discount percent (supports manual edit)
              const discPercent = item.discountPercent !== undefined && item.discountPercent !== null && item.discountPercent !== ''
                ? Number(item.discountPercent)
                : (item.isBabyCare ? (settings?.babyCareDiscountPercent || 5) : (calc.discountPercent || 15));
              const discAmt = Math.round((lineMrp * discPercent) / 100);
              const lineNet = Math.max(0, lineMrp - discAmt);

              return (
                <tr key={idx} className={isNA ? 'line-through text-gray-500' : ''}>
                  <td className="py-1 pr-1 font-sans text-[10px] leading-tight">
                    <div>{idx + 1}. {item.name}</div>
                    {item.isBabyCare && !isNA && (
                      <span className="text-[8px] font-mono text-gray-700 block">[Baby Care]</span>
                    )}
                    {isNA && <span className="block text-[8px] no-underline font-mono font-bold">[NOT AVAILABLE]</span>}
                  </td>
                  <td className="py-1 text-center font-mono">{qty}</td>
                  <td className="py-1 text-right font-mono">{formatINR(mrp)}</td>
                  <td className="py-1 text-center font-mono font-bold">
                    {isNA ? '-' : `${discPercent}%`}
                  </td>
                  <td className="py-1 text-right font-mono font-bold">
                    {isNA ? '0' : formatINR(lineNet)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Totals */}
      <div className="py-1.5 border-b-2 border-dashed border-black text-[10px] space-y-1">
        <div className="flex justify-between">
          <span>TOTAL MRP:</span>
          <span className="font-bold">{formatINR(calc.totalMrp)}</span>
        </div>
        <div className="flex justify-between">
          <span>DISCOUNT:</span>
          <span className="font-bold">-{formatINR(calc.discountAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>DELIVERY & FEE:</span>
          {calc.isFreeDelivery || order.couponCode?.toUpperCase() === 'ZARIFA17' ? (
            <span className="font-bold">
              <span className="line-through text-gray-500 font-normal mr-1">{formatINR(calc.originalCustomerFee || settings?.customerFee || 15)}</span>
              FREE
            </span>
          ) : (
            <span>+{formatINR(calc.customerFee)}</span>
          )}
        </div>
        {(calc.isFreeDelivery || order.couponCode?.toUpperCase() === 'ZARIFA17') && (
          <div className="flex justify-between text-[9px] font-bold">
            <span>PROMO (ZARIFA17):</span>
            <span>FREE DELIVERY</span>
          </div>
        )}

        {/* Amount to pay box */}
        <div className="border-2 border-black p-1 text-center my-1">
          <div className="text-[9px] font-bold uppercase tracking-wider">
            {order.paymentMode === 'PAID' ? 'TOTAL AMOUNT (PAID)' : 'NET AMOUNT TO PAY (COD)'}
          </div>
          <div className="text-base font-black tracking-tight mt-0.5">
            {formatINR(calc.amountToPay)}
          </div>
        </div>

        <div className="text-center font-bold text-[10px] pt-0.5">
          YOU SAVED {formatINR(calc.customerSaves)} ON THIS ORDER
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 text-center text-[9px] space-y-1 leading-snug">
        <div className="font-bold uppercase tracking-wider">Delivery within 24 hours</div>
        <div>Thank you for choosing Medix!</div>
        <div className="font-sans font-bold text-[9px]">
          ধন্যবাদ! মেডিক্সের সাথে থাকার জন্য।
        </div>
        <div className="text-[8px] text-gray-600 pt-1 border-t border-dotted border-gray-400">
          *** End of Receipt ***
        </div>
      </div>
    </div>
  );
}
