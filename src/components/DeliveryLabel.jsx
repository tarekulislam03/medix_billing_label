import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatINR } from '../utils/pricing';

export default function DeliveryLabel({ order }) {
  if (!order) return null;

  const customer = order.customer || {};
  const calc = order.calculation || {};
  const isCOD = order.paymentMode === 'COD';
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

  // QR Payload JSON
  const qrData = JSON.stringify({
    order: order.orderNumber,
    phone: customer.phone || '',
    amt: calc.amountToPay || 0,
    mode: order.paymentMode || 'COD',
  });

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
      </div>

      {/* QR Code & Package Details */}
      <div className="py-2 border-b-2 border-dashed border-black flex items-center justify-between gap-2">
        <div className="space-y-1 text-[10px]">
          <div className="font-bold">
            Items: <span className="text-xs font-black">{totalItemsCount}</span>
          </div>
          <div className="text-[9px] leading-tight">
            Scan QR code to mark delivered
          </div>
          <div className="text-[8px] text-gray-600 font-bold">
            {order.orderNumber}
          </div>
        </div>
        <div className="p-1 border border-black bg-white shrink-0">
          <QRCodeSVG value={qrData} size={88} level="M" />
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
