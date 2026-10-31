# Medix Billing

A clean, responsive React web application for a medicine home-delivery business in India. Designed with a minimal, professional interface (zero emojis) and mobile-friendly controls.

## Overview & Features

1. **Create Order Page**:
   - Optional customer details (name, phone, address) with 10-digit mobile number validation if entered.
   - Dynamic medicine items table with MRP, quantity, line totals, and a "Not available" toggle that excludes out-of-stock items.
   - Pressing **Enter** in the last input field automatically adds a new medicine row.
   - Payment mode toggle: **COD** or **Paid (UPI)**.
   - **Live Calculation Panel**: Auto-detects 15% (Tier 1) or 17% (Tier 2) discount, displays amount saved, minimum order alerts, and an upgrade hint if within ₹300 of the tier threshold.
   - Duplicate order button to quickly reuse customer and item data.

2. **Customer Receipt (A4/A5)**:
   - Clean, professional layout in brand green (`#14532d`) with lime accents.
   - Auto-generated daily order number format: `MDX-YYYYMMDD-001`.
   - Complete itemized breakdown, discounts, fees, and Bengali & English thank-you footer.
   - No profit margins, pharmacy costs, or commission details shown.

3. **Delivery Label (4x6 inch / Thermal-Friendly)**:
   - High-contrast black-and-white layout optimized for 4x6 inch (100x150 mm) thermal printers.
   - Prominent collect banner: `COLLECT ₹X (COD)` or `PAID - DO NOT COLLECT`.
   - Embedded QR code encoding `{ order, phone, amt, mode }`.

4. **Settings & Backup**:
   - Editable business profile, discount percentages, tier thresholds, fees, pharmacy commission, and delivery costs.
   - One-click JSON backup export and import for device migration.

---

## Economics & Calculation Rules

The pricing logic is encapsulated in the pure function `calculateBill(items, settings)` located in [`src/utils/pricing.js`](file:///home/tarekul/Documents/medix/Medix Whatsapp Delivery/billing_app/src/utils/pricing.js):

- Margin on MRP is **18%** (15% pharmacy discount + 3% commission).
- Under ₹1500 Total MRP: Customer gets **15%**, owner keeps **3%**.
- At or above ₹1500 Total MRP: Customer gets **17%**, owner keeps **1%**.
- **Profit Formula**: `(18% - discount%) * Total MRP + fee - delivery cost`
- Verification examples tested in Vitest:
  - MRP 1000: discount 150, pays 865, profit 20
  - MRP 1500: discount 255, pays 1260, profit 5
  - MRP 2000: discount 340, pays 1675, profit 10

---

## Project Structure

```
billing_app/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── README.md
└── src/
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── components/
    │   ├── CreateOrderView.jsx
    │   ├── CustomerReceipt.jsx
    │   ├── DeliveryLabel.jsx
    │   ├── DocumentModal.jsx
    │   └── SettingsView.jsx
    └── utils/
        ├── pdf.js
        ├── pricing.js
        ├── pricing.test.js
        └── storage.js
```

---

## Installation & Running

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Unit Tests
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open your browser at the local URL (default: `http://localhost:5173`).

### 5. Production Build
```bash
npm run build
```
The optimized production bundle will be placed in the `dist/` directory.
