import React, { useState, useRef } from 'react';
import CreateOrderView from './components/CreateOrderView';
import SettingsView from './components/SettingsView';
import DocumentModal from './components/DocumentModal';
import CustomerReceipt from './components/CustomerReceipt';
import DeliveryLabel from './components/DeliveryLabel';
import { getSettings } from './utils/storage';
import { captureElementToImage, printImagesOn80mmRoll } from './utils/printer';
import {
  PlusCircle,
  Sliders,
  Loader2,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [settings, setSettings] = useState(() => getSettings());
  
  // Editing state for order modification or duplicate
  const [editingOrder, setEditingOrder] = useState(null);

  // Hidden off-screen render state for generating 80mm image
  const [orderToRender, setOrderToRender] = useState(null);
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);
  const hiddenReceiptRef = useRef(null);
  const hiddenLabelRef = useRef(null);

  // Preview modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    order: null,
    type: 'receipt', // 'receipt' | 'label' | 'both'
  });

  const handleOrderSaved = () => {
    setEditingOrder(null);
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
  };

  /**
   * Generates high-res 80mm image of receipt and/or label,
   * then launches browser's print dialog via isolated 80mm roll iframe
   */
  const handlePrint80mmImage = async (order, type = 'receipt') => {
    if (!order) return;

    setIsGeneratingPrint(true);
    setOrderToRender(order);

    // Allow browser to render hidden DOM
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const imagesToPrint = [];

      if ((type === 'receipt' || type === 'both') && hiddenReceiptRef.current) {
        const receiptImg = await captureElementToImage(hiddenReceiptRef.current, 2);
        imagesToPrint.push(receiptImg);
      }

      if ((type === 'label' || type === 'both') && hiddenLabelRef.current) {
        const labelImg = await captureElementToImage(hiddenLabelRef.current, 2);
        imagesToPrint.push(labelImg);
      }

      if (imagesToPrint.length > 0) {
        printImagesOn80mmRoll(imagesToPrint);
      }
    } catch (err) {
      console.error('Error generating 80mm print image', err);
      // Fallback to native print if image capture fails
      window.print();
    } finally {
      setIsGeneratingPrint(false);
    }
  };

  // Open Preview Modal
  const openPreviewModal = (order, type = 'receipt') => {
    setModalState({
      isOpen: true,
      order,
      type,
    });
  };

  const closePreviewModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Print Generation Loading Overlay */}
      {isGeneratingPrint && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs text-white">
          <div className="bg-white text-gray-900 px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 border border-gray-200">
            <Loader2 className="w-5 h-5 animate-spin text-[#14532d]" />
            <div className="text-xs">
              <span className="font-bold block">Generating 80mm Print Image...</span>
              <span className="text-gray-500">Opening printer dialog</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-[#14532d] text-white flex items-center justify-center font-black text-sm tracking-wider">
                M
              </div>
              <div>
                <span className="font-black text-sm text-[#14532d] tracking-wider uppercase block">
                  {settings.businessName || 'Medix'}
                </span>
                <span className="text-[10px] text-gray-500 block -mt-0.5">80mm Thermal Billing</span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden sm:flex items-center space-x-1">
              <button
                onClick={() => {
                  if (editingOrder) handleCancelEdit();
                  setActiveTab('create');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition ${
                  activeTab === 'create'
                    ? 'bg-[#14532d] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{editingOrder ? 'Editing Order' : 'Create Order'}</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition ${
                  activeTab === 'settings'
                    ? 'bg-[#14532d] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-20 sm:pb-6 no-print">
        {activeTab === 'create' && (
          <CreateOrderView
            settings={settings}
            editingOrder={editingOrder}
            onOrderSaved={handleOrderSaved}
            onCancelEdit={handleCancelEdit}
            openPrintModal={handlePrint80mmImage}
            openPreviewModal={openPreviewModal}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSettingsChange={(newSettings) => setSettings(newSettings)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex items-center justify-around py-2 shadow-lg no-print">
        <button
          onClick={() => {
            if (editingOrder) handleCancelEdit();
            setActiveTab('create');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition ${
            activeTab === 'create' ? 'text-[#14532d] font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Order</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition ${
            activeTab === 'settings' ? 'text-[#14532d] font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Preview Modal */}
      <DocumentModal
        isOpen={modalState.isOpen}
        onClose={closePreviewModal}
        type={modalState.type}
        order={modalState.order}
        settings={settings}
        onPrintImage={handlePrint80mmImage}
      />

      {/* Hidden Off-Screen Container for Generating Crisp 80mm Images */}
      {orderToRender && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '76mm',
            opacity: 1,
            pointerEvents: 'none',
            background: '#ffffff',
          }}
        >
          <div ref={hiddenReceiptRef} style={{ width: '76mm', background: '#ffffff' }}>
            <CustomerReceipt order={orderToRender} settings={settings} />
          </div>
          <div ref={hiddenLabelRef} style={{ width: '76mm', background: '#ffffff', marginTop: '10px' }}>
            <DeliveryLabel order={orderToRender} />
          </div>
        </div>
      )}
    </div>
  );
}
