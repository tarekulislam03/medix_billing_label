import React, { useRef } from 'react';
import CustomerReceipt from './CustomerReceipt';
import DeliveryLabel from './DeliveryLabel';
import { downloadElementAsPDF } from '../utils/pdf';
import { captureElementToImage } from '../utils/printer';
import { Printer, Download, Image as ImageIcon, X } from 'lucide-react';

export default function DocumentModal({
  isOpen,
  onClose,
  type = 'receipt', // 'receipt' | 'label' | 'both'
  order,
  settings,
  onPrintImage,
}) {
  const receiptRef = useRef(null);
  const labelRef = useRef(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    if (onPrintImage) {
      onPrintImage(order, type);
    } else {
      window.print();
    }
  };

  const handleDownloadImage = async () => {
    try {
      if ((type === 'receipt' || type === 'both') && receiptRef.current) {
        const url = await captureElementToImage(receiptRef.current, 2);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt_${order.orderNumber}.png`;
        a.click();
      }
      if ((type === 'label' || type === 'both') && labelRef.current) {
        const url = await captureElementToImage(labelRef.current, 2);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Label_${order.orderNumber}.png`;
        a.click();
      }
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (type === 'receipt' && receiptRef.current) {
      await downloadElementAsPDF(receiptRef.current, `Receipt_${order.orderNumber}.pdf`, 'label');
    } else if (type === 'label' && labelRef.current) {
      await downloadElementAsPDF(labelRef.current, `Label_${order.orderNumber}.pdf`, 'label');
    } else if (type === 'both') {
      if (receiptRef.current) {
        await downloadElementAsPDF(receiptRef.current, `Receipt_${order.orderNumber}.pdf`, 'label');
      }
      if (labelRef.current) {
        await downloadElementAsPDF(labelRef.current, `Label_${order.orderNumber}.pdf`, 'label');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto no-print">
      {/* Modal Card */}
      <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {type === 'receipt' ? '80mm Customer Receipt' : type === 'label' ? '80mm Delivery Label' : '80mm Receipt & Label'}
            </h2>
            <p className="text-[11px] text-gray-500">Order: {order.orderNumber}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#14532d] hover:bg-[#166534] rounded transition shadow-sm"
              title="Generate image and print via browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 80mm Image</span>
            </button>

            <button
              onClick={handleDownloadImage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition"
              title="Download image as PNG"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition"
              title="Download as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 80mm Preview Container */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex-1 space-y-6 flex flex-col items-center">
          {(type === 'receipt' || type === 'both') && (
            <div className="w-full flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                80mm Thermal Receipt (76mm roll width)
              </span>
              <div ref={receiptRef} className="shadow-md bg-white">
                <CustomerReceipt order={order} settings={settings} />
              </div>
            </div>
          )}

          {(type === 'label' || type === 'both') && (
            <div className="w-full flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                80mm Thermal Delivery Label
              </span>
              <div ref={labelRef} className="shadow-md bg-white">
                <DeliveryLabel order={order} settings={settings} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
