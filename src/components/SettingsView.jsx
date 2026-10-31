import React, { useState } from 'react';
import { DEFAULT_SETTINGS, formatINR } from '../utils/pricing';
import { saveSettings, exportAllData, importAllData } from '../utils/storage';
import { Save, RotateCcw, Download, Upload, Check, AlertCircle } from 'lucide-react';

export default function SettingsView({ settings, onSettingsChange }) {
  const [formData, setFormData] = useState({ ...settings });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (field, val, isNumeric = false) => {
    setFormData(prev => ({
      ...prev,
      [field]: isNumeric ? (val === '' ? '' : Number(val)) : val,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.businessName?.trim()) {
      setErrorMsg('Business name cannot be empty');
      return;
    }

    // Number validations
    const numericFields = [
      'minOrder',
      'tier1DiscountPercent',
      'tier2DiscountPercent',
      'tierThreshold',
      'customerFee',
      'pharmacyDiscountPercent',
      'pharmacyCommissionPercent',
      'deliveryCost',
    ];

    for (const key of numericFields) {
      if (isNaN(Number(formData[key])) || Number(formData[key]) < 0) {
        setErrorMsg(`Invalid positive numeric value for ${key}`);
        return;
      }
    }

    const cleanSettings = {
      ...formData,
      minOrder: Number(formData.minOrder),
      tier1DiscountPercent: Number(formData.tier1DiscountPercent),
      tier2DiscountPercent: Number(formData.tier2DiscountPercent),
      tierThreshold: Number(formData.tierThreshold),
      customerFee: Number(formData.customerFee),
      pharmacyDiscountPercent: Number(formData.pharmacyDiscountPercent),
      pharmacyCommissionPercent: Number(formData.pharmacyCommissionPercent),
      deliveryCost: Number(formData.deliveryCost),
    };

    saveSettings(cleanSettings);
    if (onSettingsChange) onSettingsChange(cleanSettings);

    setErrorMsg('');
    setSuccessMsg('Settings updated and saved successfully');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all settings to default values?')) {
      saveSettings(DEFAULT_SETTINGS);
      setFormData({ ...DEFAULT_SETTINGS });
      if (onSettingsChange) onSettingsChange(DEFAULT_SETTINGS);
      setSuccessMsg('Settings reset to system defaults');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const result = importAllData(content);
        if (result.success) {
          alert(`Successfully restored backup with ${result.count} orders. The app will reload to apply changes.`);
          window.location.reload();
        } else {
          setErrorMsg(`Failed to import data: ${result.error}`);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Business & Pricing Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure business profile, customer discount tiers, and pharmacy margin parameters
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-emerald-700" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-lg flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Identity */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">
            Business Profile (Printed on Receipts)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Name</label>
              <input
                type="text"
                value={formData.businessName || ''}
                onChange={(e) => handleChange('businessName', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Business Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Customer Discount & Pricing Rules */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">
            Customer Pricing & Discount Tiers
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Minimum Order (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minOrder ?? ''}
                onChange={(e) => handleChange('minOrder', e.target.value, true)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Alerts if MRP is below this</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tier Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.tierThreshold ?? ''}
                onChange={(e) => handleChange('tierThreshold', e.target.value, true)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Cutoff for Tier 2 discount</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Customer Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.customerFee ?? ''}
                onChange={(e) => handleChange('customerFee', e.target.value, true)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Delivery + Platform fee</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tier 1 Discount (&lt; Threshold) %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.tier1DiscountPercent ?? ''}
                onChange={(e) => handleChange('tier1DiscountPercent', e.target.value, true)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Default: 15%</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tier 2 Discount (&ge; Threshold) %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.tier2DiscountPercent ?? ''}
                onChange={(e) => handleChange('tier2DiscountPercent', e.target.value, true)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Default: 17%</span>
            </div>
          </div>
        </div>

        {/* Pharmacy & Cost Economics */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">
            Pharmacy Details, Margins & Operating Costs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fulfilling Partner Pharmacy Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apollo Pharmacy / City Meds"
                value={formData.pharmacyName || ''}
                onChange={(e) => handleChange('pharmacyName', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Printed as 'Fulfilled by' on receipts</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pharmacy Drug License No. (DL No.)
              </label>
              <input
                type="text"
                placeholder="e.g. DL-20B-12345/21B-12346"
                value={formData.pharmacyDlNo || ''}
                onChange={(e) => handleChange('pharmacyDlNo', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Printed below fulfilled by on receipts</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pharmacy Discount to Me (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.pharmacyDiscountPercent ?? ''}
                onChange={(e) => handleChange('pharmacyDiscountPercent', e.target.value, true)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Default: 15%</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pharmacy Commission to Me (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.pharmacyCommissionPercent ?? ''}
                onChange={(e) => handleChange('pharmacyCommissionPercent', e.target.value, true)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Default: 3%</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Delivery Boy Cost per Order (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.deliveryCost ?? ''}
                onChange={(e) => handleChange('deliveryCost', e.target.value, true)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:border-[#14532d] outline-none"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">Default: ₹25</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded text-xs text-gray-600 border border-slate-200">
            <span className="font-semibold block text-gray-800">Margin Breakdown Summary:</span>
            Total margin from pharmacy is {Number(formData.pharmacyDiscountPercent) + Number(formData.pharmacyCommissionPercent)}% (Discount + Commission).
            When customer receives {formData.tier1DiscountPercent}%, your net margin on MRP is {Number(formData.pharmacyDiscountPercent) + Number(formData.pharmacyCommissionPercent) - Number(formData.tier1DiscountPercent)}%.
            When customer receives {formData.tier2DiscountPercent}%, your net margin on MRP is {Number(formData.pharmacyDiscountPercent) + Number(formData.pharmacyCommissionPercent) - Number(formData.tier2DiscountPercent)}%.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#14532d] hover:bg-[#166534] rounded shadow-sm uppercase tracking-wider transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </form>

      {/* Backup and Restore Section */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">
          Data Backup & Restore
        </h2>
        <p className="text-xs text-gray-600">
          All data is stored securely in your browser's local storage. You can create a complete backup file to save your data or transfer it to another computer.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={exportAllData}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full Backup (JSON)</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup (JSON)</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
