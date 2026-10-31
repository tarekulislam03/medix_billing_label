import React, { useState, useEffect, useRef } from 'react';
import { calculateBill, formatINR } from '../utils/pricing';
import { generateOrderNumber, saveOrders, getOrders } from '../utils/storage';
import {
  Plus,
  Trash2,
  AlertCircle,
  Info,
  Check,
  Printer,
  FileText,
  Tag,
  RefreshCw,
  Eye,
} from 'lucide-react';

export default function CreateOrderView({
  settings,
  onOrderSaved,
  editingOrder,
  onCancelEdit,
  openPrintModal,
  openPreviewModal,
}) {
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [paymentMode, setPaymentMode] = useState('COD');
  const [items, setItems] = useState([
    { name: '', mrp: '', qty: 1, isBabyCare: false, notAvailable: false },
  ]);

  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const lastInputRef = useRef(null);

  // If editing existing order or duplicating
  useEffect(() => {
    if (editingOrder) {
      setCustomer({
        name: editingOrder.customer?.name || '',
        phone: editingOrder.customer?.phone || '',
        address: editingOrder.customer?.address || '',
        notes: editingOrder.customer?.notes || '',
      });
      setPaymentMode(editingOrder.paymentMode || 'COD');
      if (editingOrder.items && editingOrder.items.length > 0) {
        setItems(editingOrder.items.map(i => ({ ...i })));
      }
    }
  }, [editingOrder]);

  // Live bill calculation
  const calc = calculateBill(items, settings);

  // Phone validation (10 digits)
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCustomer(prev => ({ ...prev, phone: val }));
    if (val && val.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  // Medicine items handlers
  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'qty') {
        const intVal = parseInt(value, 10);
        updated[index][field] = isNaN(intVal) ? '' : Math.max(1, intVal);
      } else if (field === 'mrp') {
        const numVal = parseFloat(value);
        updated[index][field] = isNaN(numVal) ? '' : Math.max(0, numVal);
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { name: '', mrp: '', qty: 1, isBabyCare: false, notAvailable: false }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) {
      setItems([{ name: '', mrp: '', qty: 1, isBabyCare: false, notAvailable: false }]);
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e, index, isLastField) => {
    if (e.key === 'Enter' && isLastField) {
      e.preventDefault();
      addItemRow();
      setTimeout(() => {
        if (lastInputRef.current) {
          lastInputRef.current.focus();
        }
      }, 50);
    }
  };

  // Validation
  const validateForm = () => {
    if (customer.phone && customer.phone.length !== 10) {
      setFormError('Please enter a valid 10-digit phone number or leave blank');
      return false;
    }

    const validItems = items.filter(i => i.name.trim() !== '');
    if (validItems.length === 0) {
      setFormError('Please add at least one medicine item');
      return false;
    }

    for (const item of validItems) {
      const mrp = Number(item.mrp);
      const qty = Number(item.qty);
      if (isNaN(mrp) || mrp <= 0) {
        setFormError(`Please enter a valid MRP for ${item.name || 'item'}`);
        return false;
      }
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        setFormError(`Quantity for ${item.name || 'item'} must be a positive integer`);
        return false;
      }
    }

    setFormError('');
    return true;
  };

  const buildOrderObject = () => {
    const existingOrders = getOrders();
    const orderNumber = editingOrder?.orderNumber || generateOrderNumber(existingOrders);
    const validItems = items
      .filter(i => i.name.trim() !== '')
      .map(i => ({
        name: i.name.trim(),
        mrp: Number(i.mrp) || 0,
        qty: parseInt(i.qty, 10) || 1,
        isBabyCare: Boolean(i.isBabyCare),
        notAvailable: Boolean(i.notAvailable),
      }));

    const bill = calculateBill(validItems, settings);

    return {
      id: editingOrder?.id || Date.now().toString(),
      orderNumber,
      createdAt: editingOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone,
        address: customer.address.trim(),
        notes: customer.notes.trim(),
      },
      paymentMode,
      status: editingOrder?.status || 'Pending',
      items: validItems,
      calculation: bill,
    };
  };

  const handleSaveOrder = (actionAfter = null) => {
    if (!validateForm()) return null;

    const orderObj = buildOrderObject();
    const allOrders = getOrders();

    let updatedOrders;
    if (editingOrder && !editingOrder.isDuplicate) {
      updatedOrders = allOrders.map(o => (o.id === editingOrder.id ? orderObj : o));
    } else {
      updatedOrders = [orderObj, ...allOrders];
    }

    saveOrders(updatedOrders);
    setSaveSuccessMsg(`Order ${orderObj.orderNumber} saved successfully`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);

    if (onOrderSaved) {
      onOrderSaved(orderObj);
    }

    // Direct browser print
    if (actionAfter === 'printReceipt') {
      openPrintModal(orderObj, 'receipt');
    } else if (actionAfter === 'printLabel') {
      openPrintModal(orderObj, 'label');
    } else if (actionAfter === 'printBoth') {
      openPrintModal(orderObj, 'both');
    } else if (actionAfter === 'preview') {
      if (openPreviewModal) openPreviewModal(orderObj, 'both');
    }

    // Reset if it was a new order and not in edit mode
    if (!editingOrder && !actionAfter) {
      resetForm();
    }

    return orderObj;
  };

  const resetForm = () => {
    setCustomer({ name: '', phone: '', address: '', notes: '' });
    setPaymentMode('COD');
    setItems([{ name: '', mrp: '', qty: 1, isBabyCare: false, notAvailable: false }]);
    setFormError('');
    setPhoneError('');
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700" />
            <span className="font-medium">{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {formError && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {editingOrder ? (editingOrder.isDuplicate ? 'Duplicate Order' : `Edit Order: ${editingOrder.orderNumber}`) : 'Create New Order'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manual customer entry, live 80mm billing calculation, and 1-click thermal printing
          </p>
        </div>

        {editingOrder && (
          <button
            onClick={resetForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded shadow-sm self-start"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cancel Edit / New Order</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Details */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-2">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                1. Customer Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma (optional)"
                  value={customer.name}
                  onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#14532d] focus:border-[#14532d] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  10-Digit Mobile Phone <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210 (optional)"
                  value={customer.phone}
                  onChange={handlePhoneChange}
                  className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 outline-none ${
                    phoneError ? 'border-rose-400 focus:ring-rose-400' : 'border-gray-300 focus:ring-[#14532d] focus:border-[#14532d]'
                  }`}
                />
                {phoneError && (
                  <p className="text-[11px] text-rose-600 mt-1">{phoneError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Full Delivery Address <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="House/Flat, Street, Landmark, City & PIN (optional)"
                value={customer.address}
                onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#14532d] focus:border-[#14532d] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Optional Notes / Delivery Instructions
              </label>
              <input
                type="text"
                placeholder="e.g. Call before delivery, Gate code 1234"
                value={customer.notes}
                onChange={(e) => setCustomer(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#14532d] focus:border-[#14532d] outline-none"
              />
            </div>
          </div>

          {/* Medicine Rows */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  2. Medicines List
                </h2>
                <p className="text-[11px] text-gray-500">
                  Press Enter in quantity field to automatically add a new medicine row
                </p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const mrp = Number(item.mrp) || 0;
                const qty = Number(item.qty) || 0;
                const lineMrp = mrp * qty;
                const discPercent = item.isBabyCare ? 5 : (calc.discountPercent || (calc.totalMrp >= 1500 ? 17 : 15));
                const lineNet = Math.max(0, lineMrp - Math.round((lineMrp * discPercent) / 100));
                const isLast = index === items.length - 1;

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-xs transition ${
                      item.notAvailable
                        ? 'bg-gray-50/80 border-dashed border-gray-300 opacity-75'
                        : item.isBabyCare
                        ? 'bg-blue-50/30 border-blue-200 hover:border-blue-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-0.5 sm:hidden">
                          Medicine Name
                        </label>
                        <input
                          type="text"
                          ref={isLast ? lastInputRef : null}
                          placeholder="Medicine name & dosage"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className={`w-full px-2.5 py-1.5 border rounded outline-none ${
                            item.notAvailable ? 'line-through text-gray-400 bg-gray-100' : 'border-gray-300 focus:border-[#14532d]'
                          }`}
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-0.5 sm:hidden">
                          MRP/Unit
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-gray-400 font-sans">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={item.mrp}
                            onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
                            className="w-full pl-5 pr-2 py-1.5 border border-gray-300 rounded focus:border-[#14532d] outline-none"
                          />
                        </div>
                      </div>

                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-0.5 sm:hidden">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, isLast)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:border-[#14532d] outline-none text-center"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1 text-center">
                        <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-0.5 sm:hidden">
                          Disc
                        </label>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${item.isBabyCare ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {item.notAvailable ? '-' : `${discPercent}%`}
                        </span>
                      </div>

                      <div className="col-span-3 sm:col-span-2 text-right">
                        <label className="block text-[10px] text-gray-500 uppercase font-semibold mb-0.5 sm:hidden">
                          Net
                        </label>
                        <span className={`font-semibold block py-1.5 ${item.notAvailable ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {item.notAvailable ? '₹0' : formatINR(lineNet)}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          title="Remove item"
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-gray-700 select-none text-[11px]">
                          <input
                            type="checkbox"
                            checked={item.isBabyCare || false}
                            onChange={(e) => handleItemChange(index, 'isBabyCare', e.target.checked)}
                            className="rounded text-blue-700 focus:ring-blue-600 h-3.5 w-3.5"
                          />
                          <span className={item.isBabyCare ? 'text-blue-800 font-bold' : ''}>
                            Baby Care Product (5% discount)
                          </span>
                        </label>

                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-gray-600 select-none text-[11px]">
                          <input
                            type="checkbox"
                            checked={item.notAvailable || false}
                            onChange={(e) => handleItemChange(index, 'notAvailable', e.target.checked)}
                            className="rounded text-[#14532d] focus:ring-[#14532d] h-3.5 w-3.5"
                          />
                          <span className={item.notAvailable ? 'text-rose-600 font-medium' : ''}>
                            Not Available
                          </span>
                        </label>
                      </div>

                      {item.notAvailable && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Excluded from bill
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note below items details table */}
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-700 leading-snug">
              <span className="font-bold">Note:</span> 15% discount applied on general medicine products below mrp rs.1500 and 17% disocunt over rs.1500. Only 5% discount will be applied on &quot;Baby Care&quot; products.
            </div>

            <div className="pt-1 flex justify-start">
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs font-semibold text-[#14532d] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another medicine</span>
              </button>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              3. Payment Mode
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
                  paymentMode === 'COD'
                    ? 'border-[#14532d] bg-emerald-50/50 ring-1 ring-[#14532d]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="COD"
                    checked={paymentMode === 'COD'}
                    onChange={() => setPaymentMode('COD')}
                    className="text-[#14532d] focus:ring-[#14532d]"
                  />
                  <div>
                    <span className="font-semibold text-xs text-gray-900 block">COD</span>
                    <span className="text-[11px] text-gray-500">Cash on Delivery</span>
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${
                  paymentMode === 'PAID'
                    ? 'border-[#14532d] bg-emerald-50/50 ring-1 ring-[#14532d]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="PAID"
                    checked={paymentMode === 'PAID'}
                    onChange={() => setPaymentMode('PAID')}
                    className="text-[#14532d] focus:ring-[#14532d]"
                  />
                  <div>
                    <span className="font-semibold text-xs text-gray-900 block">Paid (UPI)</span>
                    <span className="text-[11px] text-gray-500">Prepaid Online</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Calculation & Print Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Calculation Panel */}
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4 sticky top-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Live Calculation
              </h2>
              {calc.discountTier && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Tag className="w-3 h-3" />
                  {calc.discountPercent}% tier applied
                </span>
              )}
            </div>

            {/* Threshold Warning / Hint */}
            {calc.isBelowMinimum && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold block">Below Minimum Order</span>
                  Minimum order amount is {formatINR(settings.minOrder)}. Total MRP is {formatINR(calc.totalMrp)}.
                </div>
              </div>
            )}

            {calc.thresholdHint && (
              <div className="p-3 bg-lime-50 border border-lime-300 rounded-md text-lime-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-lime-700 mt-0.5" />
                <div>
                  <span className="font-semibold block">Discount Upgrade Available</span>
                  {calc.thresholdHint}
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total MRP (available items)</span>
                <span className="font-medium text-gray-900">{formatINR(calc.totalMrp)}</span>
              </div>

              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span className="font-semibold">-{formatINR(calc.discountAmount)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Customer Fee (Delivery + Platform)</span>
                <span className="font-medium text-gray-900">+{formatINR(calc.customerFee)}</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Amount to Pay</span>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">
                    Mode: {paymentMode === 'PAID' ? 'PAID (UPI)' : 'COD'}
                  </span>
                </div>
                <span className="text-2xl font-black text-[#14532d]">
                  {formatINR(calc.amountToPay)}
                </span>
              </div>

              <div className="bg-lime-50 border border-lime-300 text-lime-900 px-3 py-2 rounded text-xs font-medium text-center">
                Customer saves {formatINR(calc.customerSaves)} on MRP
              </div>
            </div>

            {/* Print & Action Buttons (80mm Thermal Friendly) */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveOrder('printBoth')}
                className="w-full py-2.5 px-4 bg-[#14532d] hover:bg-[#166534] text-white rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>Save & Print Both (80mm)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveOrder('printReceipt')}
                  className="py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-medium text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveOrder('printLabel')}
                  className="py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-medium text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Print Label</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveOrder(null)}
                  className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#14532d] border border-emerald-300 rounded font-semibold text-xs transition"
                >
                  Save (No Print)
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveOrder('preview')}
                  className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview / PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
