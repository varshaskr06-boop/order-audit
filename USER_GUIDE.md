# End-User Operational Guide
## Sri Meenakshi Agro & Traditional Foods ERP System

This guide outlines day-to-day operations for each designated role in the food manufacturing facility.

---

## 1. Sales Executive Workflow

### 1.1 Managing Customers & Price Lists
1. Log in with your sales account (`sales@meenakshifoods.in`).
2. Navigate to **Master Data > Customers** to view authorized retail chains and distributors.
3. Review GSTIN, credit limits, and billing addresses before order placement.

### 1.2 Creating and Submitting Sales Orders
1. Go to **Sales Orders > Create Order**.
2. Select the customer from the dropdown. The delivery address and GST rate (5.0%) auto-populate.
3. Add finished goods lines (e.g. *Fresh Idli/Dosa Batter 1 KG*, *Madras Mixture 200g*).
4. Review the calculated subtotal and GST breakdown using the interactive preview.
5. Click **Save as Draft** to review later, or **Submit Order** to send for management approval.
6. Track order progress under **Sales Orders > My Orders**.

---

## 2. Production Supervisor Workflow

### 2.1 Requisitioning Raw Materials
1. Go to **Procurement > Purchase Requisitions**.
2. Create a replenishment request when agro grains (Ponni Rice, Guntur Urad Dal, Asafoetida) reach reorder thresholds.
3. Track approvals from the purchase officer.

### 2.2 Manufacturing Execution
1. Navigate to **Production > Production Orders**.
2. Review scheduled production batches approved by management.
3. Click **Issue Materials** to pull raw materials and poly packaging pouches from warehouse stock into the wet grinding line. The ERP validates inventory balances in real time.
4. Update the order status to `IN_PROGRESS`.
5. Upon batch completion, click **Record FG Receipt** to log actual output quantity and automatically generate the traceability batch code (e.g., `PB-FG001-20261125-001`).

---

## 3. Quality Inspector Workflow

### 3.1 Raw Material GRN Inspection
1. Navigate to **Quality Control > Inspections**.
2. Perform physical and organoleptic testing on incoming agro commodities (moisture %, foreign matter, insect infestation).
3. Mark inspection status as `PASSED` or log a non-conformance for supplier return.

### 3.2 Finished Goods Batch Release
1. Select the finished production batch waiting for release.
2. Verify pH/acidity, aroma, batter consistency, and packaging seal integrity.
3. Mark status as `PASSED`. This updates the quality release ledger and immediately unlocks the batch for dispatch.

---

## 4. Accounts & Billing Executive Workflow

### 4.1 Generating GST Tax Invoices
1. Navigate to **Invoicing > Tax Invoices**.
2. Select the customer and the released batch lines.
3. The system validates whether supply is **Intra-State** (Madurai / Tamil Nadu: 2.5% CGST + 2.5% SGST) or **Inter-State** (5.0% IGST).
4. Click **Generate Invoice** to lock the sequential invoice number (e.g., `INV-2026-0012`).

### 4.2 Recording Customer Receipts & Payouts
1. Go to **Payments > Customer Receipts**.
2. Record bank transfers (NEFT/RTGS/Cheque) against outstanding invoice balances.
3. Navigate to **Bank Reconciliation** to match bank statements with recorded ledger entries.

---

## 5. Logistics & Dispatch Workflow

1. Go to **Dispatch > Dispatch Orders**.
2. Select an approved sales order. Verify that all finished goods items are flagged with `Quality Approved: YES`.
3. Enter transporter name, vehicle registration number (e.g., `TN-59-AZ-9988`), and driver contact.
4. Print the Delivery Challan and dispatch the shipment.
5. Upon arrival at the customer destination, upload or record the **Proof of Delivery (POD)** to close the order lifecycle.
