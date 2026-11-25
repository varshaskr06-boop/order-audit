-- ============================================================================
-- Sri Meenakshi Agro & Traditional Foods Pvt Ltd
-- Benchmark Seed Data (Tamil Nadu Food Manufacturing Ecosystem)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS & ROLES
-- Benchmark Passwords (hashed with bcrypt, 10 salt rounds):
-- Owner:      owner@meenakshifoods.in      / Owner@123
-- Admin:      admin@meenakshifoods.in      / Admin@123
-- Salesman:   sales@meenakshifoods.in      / Sales@123
-- Production: production@meenakshifoods.in / Production@123
-- Accountant: auditor@meenakshifoods.in    / Auditor@123
-- ----------------------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role, phone) VALUES
('Meenakshi Sundaram', 'owner@meenakshifoods.in', '$2a$10$YKKTtfmyvk/mueCoXfi/pOICYWrEnMbvU7rlhUYUQ7f71EC6TWV3S', 'OWNER', '+91 98420 11111'),
('Senthil Nathan', 'admin@meenakshifoods.in', '$2a$10$ae2XZzi2.F.gJzDes8WzkeEtAM70KlhKIt/dshOqre/QMtYmOQ5uK', 'ADMIN', '+91 98420 22222'),
('Karthik Raja', 'sales@meenakshifoods.in', '$2a$10$V.1pSZdHJBcqoLHtvAgFuOfKDMr7xFo7kUK.dDWaxda3fuCw.06my', 'SALESMAN', '+91 98420 33333'),
('Murugesan Velu', 'production@meenakshifoods.in', '$2a$10$nVAvKTQl36O6fMfgwjg82u8UTT87tes/qTs/96Dr4xCbpfVQn3N3y', 'PRODUCTION', '+91 98420 44444'),
('Radha Raman', 'auditor@meenakshifoods.in', '$2a$10$MiA.Cj3Z9uVWYjafMFY48uUyiaznHldCsA8yBRjJUj.CLnrqdpFVu', 'ACCOUNTANT', '+91 98420 55555');

-- ----------------------------------------------------------------------------
-- 2. SUPPLIERS (South Indian Agro Commodity Vendors)
-- ----------------------------------------------------------------------------
INSERT INTO suppliers (code, name, contact_person, gstin, state_code, state_name, phone, email, address) VALUES
('SUP-001', 'Kaveri Delta Agro Millers', 'M. Shanmugam', '33AABCK1234F1Z1', '33', 'Tamil Nadu', '+91 94431 10001', 'sales@kaveriagro.com', 'Rice Mill Road, Thanjavur, TN - 613001'),
('SUP-002', 'Guntur Dal & Pulses Syndicate', 'V. Venkatesh', '37AABCG5678K1Z3', '37', 'Andhra Pradesh', '+91 98480 20002', 'orders@gunturdal.com', 'Market Yard, Guntur, AP - 522004'),
('SUP-003', 'Erode Turmeric & Spice Traders', 'K. Arumugam', '33AADCE9012M1Z8', '33', 'Tamil Nadu', '+91 98427 30003', 'erodespices@gmail.com', 'Perundurai Road, Erode, TN - 638011'),
('SUP-004', 'Aavin / Tamil Nadu Milk Producers', 'Dairy Division', '33AAACT0890Q1Z2', '33', 'Tamil Nadu', '+91 44234 40004', 'ghee@aavin.tn.gov.in', 'Pasumalai, Madurai, TN - 625004'),
('SUP-005', 'Sri Balaji Flexible Packaging Ltd', 'R. Balaji', '33AACCS3321L1Z0', '33', 'Tamil Nadu', '+91 98410 50005', 'balaji@sbpack.in', 'Sipcot Phase 2, Hosur, TN - 635130');

-- ----------------------------------------------------------------------------
-- 3. CUSTOMERS (Intrastate Tamil Nadu & Interstate Karnataka)
-- ----------------------------------------------------------------------------
INSERT INTO customers (code, business_name, contact_person, gstin, state_code, state_name, phone, email, billing_address, credit_limit) VALUES
('CUST-001', 'Nilgiris Supermarket - Anna Nagar', 'P. Selvam', '33AABCN4321B1Z9', '33', 'Tamil Nadu', '+91 98400 90001', 'annanagar@nilgiris.in', '2nd Avenue, Anna Nagar, Chennai - 600040', 100000.00),
('CUST-002', 'Kovai Pazhamudir Nilayam - RS Puram', 'T. Duraisamy', '33AAACK7788P1Z6', '33', 'Tamil Nadu', '+91 98430 80002', 'orders@kpnretail.com', 'DB Road, RS Puram, Coimbatore - 641002', 150000.00),
('CUST-003', 'Madurai Pandian Provision Stores', 'M. Pandian', '33AAAPP9988D1Z4', '33', 'Tamil Nadu', '+91 94432 70003', 'pandianstores@gmail.com', 'South Masi Street, Madurai - 625001', 50000.00),
('CUST-004', 'MTR Bangalore Distribution Hub', 'Anand Kumar', '29AABCM6655L1Z7', '29', 'Karnataka', '+91 80265 60004', 'hub@mtrdistributors.com', 'Koramangala 4th Block, Bengaluru, KA - 560034', 250000.00);

-- ----------------------------------------------------------------------------
-- 4. RAW MATERIALS
-- ----------------------------------------------------------------------------
INSERT INTO raw_materials (code, name, category, unit, current_stock, min_stock_alert, avg_unit_cost) VALUES
('RM-001', 'Ponni Idli Rice (Special)', 'Grains & Pulses', 'KG', 1200.0000, 200.0000, 42.0000),
('RM-002', 'Guntur Urad Dal (Skinless/Gundu)', 'Grains & Pulses', 'KG', 450.0000, 80.0000, 125.0000),
('RM-003', 'Fenugreek Seeds (Vendhayam/Methi)', 'Spices & Seasoning', 'KG', 60.0000, 10.0000, 95.0000),
('RM-004', 'Pure Desi Ghee (Cow Butter Ghee)', 'Oils & Fats', 'KG', 120.0000, 25.0000, 580.0000),
('RM-005', 'Refined Sunflower Oil', 'Oils & Fats', 'LITER', 300.0000, 50.0000, 115.0000),
('RM-006', 'Gram Flour (Kadalai Maavu / Besan)', 'Grains & Pulses', 'KG', 500.0000, 100.0000, 82.0000),
('RM-007', 'Rice Flour (Arisi Maavu)', 'Grains & Pulses', 'KG', 400.0000, 80.0000, 48.0000),
('RM-008', 'Guntur Red Chilli Powder', 'Spices & Seasoning', 'KG', 75.0000, 15.0000, 240.0000),
('RM-009', 'Perungayam / Hing (Compounded Asafoetida)', 'Spices & Seasoning', 'KG', 18.0000, 5.0000, 850.0000),
('RM-010', 'Refined Crystal Salt (Thool Uppu)', 'Seasoning', 'KG', 350.0000, 50.0000, 18.0000),
('RM-011', 'Sugar (White Crystal)', 'Sweeteners', 'KG', 250.0000, 50.0000, 42.0000);

-- ----------------------------------------------------------------------------
-- 5. PACKAGING MATERIALS
-- ----------------------------------------------------------------------------
INSERT INTO packaging_materials (code, name, unit, current_stock, min_stock_alert, avg_unit_cost) VALUES
('PM-001', '1 KG Multilayer Fresh Batter Pouch (Printed)', 'PCS', 4500.0000, 1000.0000, 3.2000),
('PM-002', '250g Metallized Zip Pouch (Mixture)', 'PCS', 3000.0000, 800.0000, 4.5000),
('PM-003', '200g Polybag with Nitrogen Flushing (Murukku)', 'PCS', 2500.0000, 600.0000, 2.8000),
('PM-004', '250g Food-Grade Sweet Box with Butter Paper (Mysore Pak)', 'PCS', 1800.0000, 500.0000, 8.5000),
('PM-005', 'Outer Master Corrugated Carton (Holds 24 units)', 'PCS', 350.0000, 80.0000, 28.0000);

-- ----------------------------------------------------------------------------
-- 6. PRODUCTS (FINISHED GOODS)
-- ----------------------------------------------------------------------------
INSERT INTO products (sku, name, description, pack_size, unit, hsn_code, gst_rate, selling_price, current_stock, min_stock_alert) VALUES
('FG-001', 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', 'Naturally fermented stone-ground batter with Ponni rice and RO water', '1 KG Pouch', 'PKT', '2106', 5.00, 60.00, 320.0000, 50.0000),
('FG-002', 'Madurai Special Madras Mixture (250g)', 'Crispy traditional snack prepared in 100% sunflower oil with roasted cashews and curry leaves', '250g Pouch', 'PKT', '2106', 12.00, 95.00, 180.0000, 30.0000),
('FG-003', 'Traditional Kai Murukku / Thenkuzhal (200g)', 'Authentic butter murukku made with pure rice flour and hing', '200g Packet', 'PKT', '2106', 12.00, 75.00, 140.0000, 25.0000),
('FG-004', 'Melt-in-Mouth Pure Ghee Mysore Pak (250g)', 'Classic royal South Indian delicacy made with aromatic cow ghee and besan', '250g Box', 'PKT', '2106', 5.00, 180.00, 90.0000, 20.0000);

-- ----------------------------------------------------------------------------
-- 7. BILL OF MATERIALS (BOM RECIPES)
-- Example 1: 100 Packets (100 kg) of Fresh Idli & Dosa Batter
-- ----------------------------------------------------------------------------
INSERT INTO bom_recipes (id, product_id, recipe_name, standard_batch_size, standard_batch_unit, notes) VALUES
(1, 1, 'Standard 100-Pack Fresh Batter Batch (100 KG)', 100.00, 'PKT', 'Soaking time 5 hrs, stone grinding 45 mins, natural fermentation 8-10 hrs');

INSERT INTO bom_items (bom_id, material_type, material_id, quantity_required, unit, notes) VALUES
(1, 'RAW_MATERIAL', 1, 65.0000, 'KG', 'Ponni Idli Rice (4:1 Ratio)'),
(1, 'RAW_MATERIAL', 2, 16.2500, 'KG', 'Guntur Urad Dal'),
(1, 'RAW_MATERIAL', 3, 0.5000, 'KG', 'Fenugreek Seeds (for fluffy idlis)'),
(1, 'RAW_MATERIAL', 10, 1.2000, 'KG', 'Crystal Salt'),
(1, 'PACKAGING', 1, 100.0000, 'PCS', '1 KG Multilayer Printed Pouch');

-- Example 2: 100 Packets (25 kg) of Madurai Special Madras Mixture
INSERT INTO bom_recipes (id, product_id, recipe_name, standard_batch_size, standard_batch_unit, notes) VALUES
(2, 2, 'Standard 100-Pack Madras Mixture Batch (25 KG)', 100.00, 'PKT', 'Boondi, sev, omapodi, fried peanuts and curry leaves seasoned with chili & hing');

INSERT INTO bom_items (bom_id, material_type, material_id, quantity_required, unit, notes) VALUES
(2, 'RAW_MATERIAL', 6, 14.0000, 'KG', 'Besan / Gram Flour'),
(2, 'RAW_MATERIAL', 7, 5.0000, 'KG', 'Rice Flour'),
(2, 'RAW_MATERIAL', 5, 8.0000, 'LITER', 'Refined Sunflower Oil (for deep frying)'),
(2, 'RAW_MATERIAL', 8, 0.7500, 'KG', 'Guntur Chilli Powder'),
(2, 'RAW_MATERIAL', 9, 0.1500, 'KG', 'Hing Powder'),
(2, 'RAW_MATERIAL', 10, 0.4500, 'KG', 'Salt'),
(2, 'PACKAGING', 2, 100.0000, 'PCS', '250g Zip Pouch');

-- ----------------------------------------------------------------------------
-- 8. INITIAL STOCK LEDGER OPENING BALANCES (AUDIT BENCHMARK)
-- ----------------------------------------------------------------------------
INSERT INTO stock_ledger (item_type, item_id, transaction_type, quantity_change, balance_after, unit_cost, total_value, reference_type, remarks, created_by) VALUES
('RAW_MATERIAL', 1, 'PURCHASE_RECEIPT', 1200.0000, 1200.0000, 42.0000, 50400.00, 'OPENING_AUDIT', 'Opening benchmark audit inventory', 1),
('RAW_MATERIAL', 2, 'PURCHASE_RECEIPT', 450.0000, 450.0000, 125.0000, 56250.00, 'OPENING_AUDIT', 'Opening benchmark audit inventory', 1),
('RAW_MATERIAL', 3, 'PURCHASE_RECEIPT', 60.0000, 60.0000, 95.0000, 5700.00, 'OPENING_AUDIT', 'Opening benchmark audit inventory', 1),
('RAW_MATERIAL', 4, 'PURCHASE_RECEIPT', 120.0000, 120.0000, 580.0000, 69600.00, 'OPENING_AUDIT', 'Opening benchmark audit inventory', 1),
('RAW_MATERIAL', 5, 'PURCHASE_RECEIPT', 300.0000, 300.0000, 115.0000, 34500.00, 'OPENING_AUDIT', 'Opening benchmark audit inventory', 1),
('PACKAGING', 1, 'PURCHASE_RECEIPT', 4500.0000, 4500.0000, 3.2000, 14400.00, 'OPENING_AUDIT', 'Opening benchmark audit packaging', 1),
('FINISHED_GOOD', 1, 'PRODUCTION_OUTPUT', 320.0000, 320.0000, 38.5000, 12320.00, 'OPENING_AUDIT', 'Opening benchmark finished goods stock', 1),
('FINISHED_GOOD', 2, 'PRODUCTION_OUTPUT', 180.0000, 180.0000, 52.0000, 9360.00, 'OPENING_AUDIT', 'Opening benchmark finished goods stock', 1);
