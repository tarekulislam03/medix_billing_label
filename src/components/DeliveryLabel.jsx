import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatINR } from '../utils/pricing';

export default function DeliveryLabel({ order, settings }) {
  if (!order) return null;

  const customer = order.customer || {};
  const calc = order.calculation || {};
  const isCOD = order.paymentMode === 'COD';
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

  // Dynamic UPI Payment Link (for UPI ID: 8101402916@ybl)
  const upiId = settings?.upiId || '8101402916@ybl';
  const payeeName = encodeURIComponent(settings?.businessName || 'Medix');
  const amountToCollect = Number(calc.amountToPay || 0);
  const formattedAmount = amountToCollect.toFixed(2);
  const note = encodeURIComponent(`Order ${order.orderNumber || ''}`.trim());

  // Standard UPI deep link format
  const upiPaymentUrl = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${formattedAmount}&cu=INR&tn=${note}`;

  const totalItemsCount = (order.items || []).filter(i => !i.notAvailable).length;

  return (
    <div className="label-80mm bg-white text-black font-mono text-[11px] leading-tight p-2 mx-auto w-[76mm] max-w-[76mm] border-2 border-black print:border-2 print:p-1.5 print:w-[76mm] print:max-w-[76mm] select-none">
      {/* Header */}
      <div className="text-center pb-1.5 border-b-2 border-black">
        <div className="text-[10px] font-bold tracking-widest uppercase">MEDIX DISPATCH LABEL</div>
        <div className="text-base font-black tracking-tight mt-0.5">{order.orderNumber}</div>
        <div className="text-[9px] text-gray-700 flex justify-between px-1 mt-0.5">
          <span>{orderDate.toLocaleDateString('en-IN')}</span>
          <span>{orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Collect / Paid Action Box (Prominent) */}
      <div className="my-2 border-2 border-black p-1.5 text-center">
        {isCOD ? (
          <div>
            <div className="text-[9px] font-black uppercase tracking-wider">
              CASH ON DELIVERY
            </div>
            <div className="text-sm font-black tracking-tight mt-0.5">
              COLLECT {formatINR(calc.amountToPay)} (COD)
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[9px] font-black uppercase tracking-wider">
              UPI ONLINE PREPAID
            </div>
            <div className="text-sm font-black tracking-tight mt-0.5">
              PAID - DO NOT COLLECT
            </div>
          </div>
        )}
      </div>

      {/* Customer Info */}
      <div className="pb-1.5 border-b-2 border-dashed border-black space-y-1 text-[10px]">
        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-600">DELIVER TO:</div>
        <div className="text-xs font-black uppercase leading-tight font-sans">
          {customer.name || 'Walk-in Customer'}
        </div>
        {customer.phone && (
          <div className="text-xs font-bold tracking-wider">
            Ph: {customer.phone}
          </div>
        )}
        {customer.address && (
          <div className="font-sans text-[10px] font-medium leading-tight">
            {customer.address}
          </div>
        )}
        {customer.notes && (
          <div className="border-t border-dotted border-black pt-1 italic font-sans text-[9px]">
            Note: {customer.notes}
          </div>
        )}
        {(order.couponCode || calc.couponCode) && (
          <div className="border-t border-dotted border-black pt-1 font-sans text-[9px] font-bold">
            Promo: {order.couponCode || calc.couponCode} (FREE DELIVERY)
          </div>
        )}
      </div>

      {/* Dynamic UPI Payment QR Code & Package Details */}
      <div className="py-2 border-b-2 border-dashed border-black flex items-center justify-between gap-2">
        <div className="space-y-1 text-[10px]">
          <div className="font-bold">
            Items: <span className="text-xs font-black">{totalItemsCount}</span>
          </div>
          <div className="text-[9px] leading-tight font-black uppercase text-black">
            {isCOD ? 'Scan to Pay (UPI)' : 'UPI Payment QR'}
          </div>
          <div className="text-[11px] font-black text-black">
            {formatINR(calc.amountToPay)}
          </div>
          <div className="text-[8px] text-gray-800 font-mono font-bold">
            {upiId}
          </div>
          <div className="text-[7.5px] text-gray-600 font-sans leading-tight">
            GPay • PhonePe • Paytm • BHIM
          </div>
        </div>
        <div className="p-1 border border-black bg-white shrink-0 text-center">
          <QRCodeSVG value={upiPaymentUrl} size={92} level="M" />
          <div className="text-[7px] font-mono font-bold uppercase mt-0.5 tracking-wider">UPI PAY</div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-1.5 text-center text-[9px] space-y-0.5">
        <div className="font-black uppercase tracking-wide">
          HANDLE WITH CARE - MEDICINES
        </div>
        <div className="text-[8px] text-gray-600 leading-snug">
          If undelivered, return to Medix Dispatch
        </div>
      </div>
    </div>
  );
}
