/**
 * ============================================================================
 * Inventory Management System Model (Phase 6)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * 
 * Centralized Stock Ledger Architecture:
 * - Single source of truth: stock_ledger (Available = Inward - Outward + Adjustments)
 * - Zero direct balance tampering; all changes flow through ledger transactions.
 * - Dual-mode: PostgreSQL with transaction support + resilient in-memory fallback.
 * ============================================================================
 */

const { query, pool } = require('../config/db');
const { getRawMaterials, getPackagingMaterials, getProducts } = require('./masterDataModel');
const { getGRNById } = require('./purchaseModel');

// ----------------------------------------------------------------------------
// IN-MEMORY STORAGE SEED DATA (For Offline & Automated Testing)
// ----------------------------------------------------------------------------

const inMemoryLocations = [
  { id: 1, location_code: 'WH-RM-01', location_name: 'Madurai Central Raw Material Warehouse', location_type: 'RAW_MATERIAL_WAREHOUSE', is_active: true },
  { id: 2, location_code: 'WH-PKG-01', location_name: 'Packaging Material Store A', location_type: 'PACKAGING_STORE', is_active: true },
  { id: 3, location_code: 'PROD-FLR-01', location_name: 'Batter & Snack Processing Floor', location_type: 'PRODUCTION_FLOOR', is_active: true },
  { id: 4, location_code: 'WH-FG-01', location_name: 'Finished Goods Cold Storage & Dispatch', location_type: 'FINISHED_GOODS_STORE', is_active: true },
  { id: 5, location_code: 'WH-QC-01', location_name: 'Quarantine & Inspection Area', location_type: 'QUARANTINE_AREA', is_active: true },
  { id: 6, location_code: 'WH-REJ-01', location_name: 'Damaged / Rejected Goods Scrap Bay', location_type: 'REJECTED_STORE', is_active: true }
];

const inMemoryInventoryItems = [
  // Raw Materials (reference_id matches raw_materials id)
  { id: 1, item_type: 'RAW_MATERIAL', reference_id: 1, item_code: 'RM-RICE-001', item_name: 'Ponni Boiled Rice', uom: 'KG', min_stock_level: 100, reorder_level: 250, valuation_rate: 42.00 },
  { id: 2, item_type: 'RAW_MATERIAL', reference_id: 2, item_code: 'RM-DAL-002', item_name: 'Urad Dal Guntur Grade A', uom: 'KG', min_stock_level: 50, reorder_level: 100, valuation_rate: 115.00 },
  { id: 3, item_type: 'RAW_MATERIAL', reference_id: 3, item_code: 'RM-FEN-003', item_name: 'Fenugreek Seeds Small', uom: 'KG', min_stock_level: 10, reorder_level: 20, valuation_rate: 85.00 },
  { id: 4, item_type: 'RAW_MATERIAL', reference_id: 4, item_code: 'RM-IRICE-004', item_name: 'Idli Rice Premium IR20', uom: 'KG', min_stock_level: 150, reorder_level: 300, valuation_rate: 38.00 },
  { id: 5, item_type: 'RAW_MATERIAL', reference_id: 5, item_code: 'RM-OIL-005', item_name: 'Refined Sunflower Oil', uom: 'LTR', min_stock_level: 40, reorder_level: 80, valuation_rate: 130.00 },

  // Packaging Materials (reference_id matches packaging_materials id)
  { id: 6, item_type: 'PACKAGING', reference_id: 1, item_code: 'PKG-POUCH-250', item_name: 'BOPP Printed Pouch 250g', uom: 'PCS', min_stock_level: 1000, reorder_level: 2500, valuation_rate: 1.80 },
  { id: 7, item_type: 'PACKAGING', reference_id: 2, item_code: 'PKG-POUCH-500', item_name: 'BOPP Printed Pouch 500g', uom: 'PCS', min_stock_level: 1000, reorder_level: 2500, valuation_rate: 2.20 },
  { id: 8, item_type: 'PACKAGING', reference_id: 3, item_code: 'PKG-CARTON-20', item_name: 'Corrugated Master Carton 20kg', uom: 'PCS', min_stock_level: 100, reorder_level: 300, valuation_rate: 28.50 },

  // Finished Goods (reference_id matches products id)
  { id: 9, item_type: 'FINISHED_GOOD', reference_id: 1, item_code: 'FG-BAT-1KG', item_name: 'Fresh Idli & Dosa Batter 1kg', uom: 'PACK', min_stock_level: 50, reorder_level: 150, valuation_rate: 55.00 },
  { id: 10, item_type: 'FINISHED_GOOD', reference_id: 2, item_code: 'FG-MIX-200G', item_name: 'Traditional Madras Mixture 200g', uom: 'PACK', min_stock_level: 100, reorder_level: 250, valuation_rate: 45.00 },
  { id: 11, item_type: 'FINISHED_GOOD', reference_id: 3, item_code: 'FG-MUR-200G', item_name: 'Butter Murukku Crunch 200g', uom: 'PACK', min_stock_level: 80, reorder_level: 200, valuation_rate: 42.00 }
];

// Helper to generate ISO dates relative to today
const getDateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const inMemoryBatches = [
  // Ponni Rice Batch 1 (Expires in 90 days - Good)
  {
    id: 1,
    batch_number: 'RM-RICE-2026-B01',
    item_type: 'RAW_MATERIAL',
    item_id: 1,
    location_id: 1,
    mfg_date: getDateOffset(-30),
    expiry_date: getDateOffset(90),
    initial_quantity: 500,
    current_quantity: 350,
    qc_status: 'PASS',
    supplier_id: 1,
    source_grn_id: 1,
    notes: 'Kaveri Delta Super Ponni, moisture 11.2%'
  },
  // Ponni Rice Batch 2 (Expiring Soon - in 12 days!)
  {
    id: 2,
    batch_number: 'RM-RICE-2026-B00',
    item_type: 'RAW_MATERIAL',
    item_id: 1,
    location_id: 1,
    mfg_date: getDateOffset(-168),
    expiry_date: getDateOffset(12),
    initial_quantity: 150,
    current_quantity: 40,
    qc_status: 'PASS',
    supplier_id: 1,
    source_grn_id: null,
    notes: 'Near expiry stock, prioritize for batter grinding (FEFO)'
  },
  // Urad Dal Batch 1 (Expires in 60 days)
  {
    id: 3,
    batch_number: 'RM-DAL-2026-B01',
    item_type: 'RAW_MATERIAL',
    item_id: 2,
    location_id: 1,
    mfg_date: getDateOffset(-45),
    expiry_date: getDateOffset(60),
    initial_quantity: 200,
    current_quantity: 120,
    qc_status: 'PASS',
    supplier_id: 2,
    source_grn_id: 1,
    notes: 'Grade A Guntur polished urad dal'
  },
  // Fenugreek Batch - EXPIRED 10 days ago (For alert verification)
  {
    id: 4,
    batch_number: 'RM-FEN-2025-OLD',
    item_type: 'RAW_MATERIAL',
    item_id: 3,
    location_id: 1,
    mfg_date: getDateOffset(-200),
    expiry_date: getDateOffset(-10),
    initial_quantity: 25,
    current_quantity: 5,
    qc_status: 'PASS',
    supplier_id: 1,
    source_grn_id: null,
    notes: 'Expired stock flagged for discard/adjustment'
  },
  // BOPP Pouch 250g Batch
  {
    id: 5,
    batch_number: 'PKG-P250-2026-B01',
    item_type: 'PACKAGING',
    item_id: 6,
    location_id: 2,
    mfg_date: getDateOffset(-60),
    expiry_date: getDateOffset(300),
    initial_quantity: 5000,
    current_quantity: 3200,
    qc_status: 'PASS',
    supplier_id: 3,
    source_grn_id: null,
    notes: 'Food grade multi-layer pouch roll'
  },
  // Finished Goods Batter Batch 1 (Fresh, 5 days shelf life)
  {
    id: 6,
    batch_number: 'FG-BAT-260320-A',
    item_type: 'FINISHED_GOOD',
    item_id: 9,
    location_id: 4,
    mfg_date: getDateOffset(-1),
    expiry_date: getDateOffset(4),
    initial_quantity: 200,
    current_quantity: 160,
    qc_status: 'PASS',
    supplier_id: null,
    source_production_ref: 'PROD-2026-03-20',
    notes: 'Fermented stone-ground traditional batter'
  }
];

const inMemoryStockLedger = [
  {
    id: 1,
    entry_date: getDateOffset(-30) + 'T09:00:00Z',
    transaction_type: 'INWARD_GRN',
    item_id: 1,
    batch_id: 1,
    location_id: 1,
    quantity: 500,
    unit_rate: 42.00,
    total_valuation: 21000.00,
    reference_type: 'GRN',
    reference_id: 1,
    reference_no: 'GRN-2026-001',
    running_balance: 500,
    remarks: 'Initial receipt against PO-2026-001',
    created_by: 3
  },
  {
    id: 2,
    entry_date: getDateOffset(-15) + 'T14:30:00Z',
    transaction_type: 'OUTWARD_PRODUCTION',
    item_id: 1,
    batch_id: 1,
    location_id: 1,
    quantity: -150,
    unit_rate: 42.00,
    total_valuation: -6300.00,
    reference_type: 'PRODUCTION_ISSUE',
    reference_id: 1,
    reference_no: 'ISS-2026-001',
    running_balance: 350,
    remarks: 'Issued to batter processing unit',
    created_by: 3
  },
  {
    id: 3,
    entry_date: getDateOffset(-168) + 'T10:00:00Z',
    transaction_type: 'INWARD_GRN',
    item_id: 1,
    batch_id: 2,
    location_id: 1,
    quantity: 150,
    unit_rate: 41.50,
    total_valuation: 6225.00,
    reference_type: 'GRN',
    reference_id: null,
    reference_no: 'GRN-2026-PREV',
    running_balance: 500,
    remarks: 'Previous batch remaining stock',
    created_by: 1
  },
  {
    id: 4,
    entry_date: getDateOffset(-45) + 'T11:00:00Z',
    transaction_type: 'INWARD_GRN',
    item_id: 2,
    batch_id: 3,
    location_id: 1,
    quantity: 200,
    unit_rate: 115.00,
    total_valuation: 23000.00,
    reference_type: 'GRN',
    reference_id: 1,
    reference_no: 'GRN-2026-001',
    running_balance: 200,
    remarks: 'Urad dal stock receipt',
    created_by: 3
  },
  {
    id: 5,
    entry_date: getDateOffset(-10) + 'T16:00:00Z',
    transaction_type: 'OUTWARD_PRODUCTION',
    item_id: 2,
    batch_id: 3,
    location_id: 1,
    quantity: -80,
    unit_rate: 115.00,
    total_valuation: -9200.00,
    reference_type: 'PRODUCTION_ISSUE',
    reference_id: 1,
    reference_no: 'ISS-2026-001',
    running_balance: 120,
    remarks: 'Issued dal to production',
    created_by: 3
  },
  {
    id: 6,
    entry_date: getDateOffset(-200) + 'T10:00:00Z',
    transaction_type: 'INWARD_GRN',
    item_id: 3,
    batch_id: 4,
    location_id: 1,
    quantity: 25,
    unit_rate: 85.00,
    total_valuation: 2125.00,
    reference_type: 'GRN',
    reference_id: null,
    reference_no: 'GRN-2025-SEED',
    running_balance: 25,
    remarks: 'Fenugreek inward',
    created_by: 1
  },
  {
    id: 7,
    entry_date: getDateOffset(-100) + 'T11:00:00Z',
    transaction_type: 'OUTWARD_PRODUCTION',
    item_id: 3,
    batch_id: 4,
    location_id: 1,
    quantity: -20,
    unit_rate: 85.00,
    total_valuation: -1700.00,
    reference_type: 'PRODUCTION_ISSUE',
    reference_id: null,
    reference_no: 'ISS-PREV',
    running_balance: 5,
    remarks: 'Issued to production',
    created_by: 3
  },
  {
    id: 8,
    entry_date: getDateOffset(-60) + 'T10:00:00Z',
    transaction_type: 'INWARD_GRN',
    item_id: 6,
    batch_id: 5,
    location_id: 2,
    quantity: 5000,
    unit_rate: 1.80,
    total_valuation: 9000.00,
    reference_type: 'GRN',
    reference_id: null,
    reference_no: 'GRN-PKG-001',
    running_balance: 5000,
    remarks: 'Packaging inward',
    created_by: 1
  },
  {
    id: 9,
    entry_date: getDateOffset(-20) + 'T11:00:00Z',
    transaction_type: 'OUTWARD_PRODUCTION',
    item_id: 6,
    batch_id: 5,
    location_id: 2,
    quantity: -1800,
    unit_rate: 1.80,
    total_valuation: -3240.00,
    reference_type: 'PRODUCTION_ISSUE',
    reference_id: 1,
    reference_no: 'ISS-2026-001',
    running_balance: 3200,
    remarks: 'Pouches issued to packaging station',
    created_by: 3
  },
  {
    id: 10,
    entry_date: getDateOffset(-1) + 'T18:00:00Z',
    transaction_type: 'INWARD_PRODUCTION',
    item_id: 9,
    batch_id: 6,
    location_id: 4,
    quantity: 200,
    unit_rate: 55.00,
    total_valuation: 11000.00,
    reference_type: 'PRODUCTION_RECEIPT',
    reference_id: 1,
    reference_no: 'PRD-REC-001',
    running_balance: 200,
    remarks: 'Produced idli batter 1kg packs',
    created_by: 3
  },
  {
    id: 11,
    entry_date: getDateOffset(0) + 'T08:00:00Z',
    transaction_type: 'OUTWARD_DISPATCH',
    item_id: 9,
    batch_id: 6,
    location_id: 4,
    quantity: -40,
    unit_rate: 55.00,
    total_valuation: -2200.00,
    reference_type: 'SALES_DISPATCH',
    reference_id: 1,
    reference_no: 'SO-DISP-001',
    running_balance: 160,
    remarks: 'Dispatched for Madurai retail delivery',
    created_by: 2
  }
];

const inMemoryStockIssues = [];
const inMemoryStockIssueItems = [];
const inMemoryStockAdjustments = [];
const inMemoryStockTransfers = [];
const inMemoryPhysicalStockCounts = [];
const inMemoryPhysicalStockCountItems = [];
const postedGRNs = new Set(); // Prevent duplicate GRN stock inward
let isDbOnline = false;

// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------

const initInventoryTables = async () => {
  try {
    const test = await query('SELECT 1');
    if (test) {
      isDbOnline = true;
      console.log('✅ [Inventory] PostgreSQL verified. Tables initialized via migrations.');
      return true;
    }
  } catch (err) {
    isDbOnline = false;
    console.log('ℹ️ [Inventory] PostgreSQL offline. Using resilient in-memory stock repository.');
  }
  return true;
};

// ----------------------------------------------------------------------------
// HELPER CALCULATIONS
// ----------------------------------------------------------------------------

/**
 * Calculates current available stock for an item across all locations or at a specific location
 * Strictly follows: Available Stock = Inward - Outward + Adjustments from the stock_ledger
 */
const calculateItemStock = (itemId, locationId = null) => {
  const entries = inMemoryStockLedger.filter(l => {
    if (l.item_id !== itemId) return false;
    if (locationId && l.location_id !== Number(locationId)) return false;
    return true;
  });

  let totalInward = 0;
  let totalOutward = 0;
  let totalAdjustments = 0;
  let currentBalance = 0;

  for (const entry of entries) {
    currentBalance += Number(entry.quantity);
    if (entry.quantity > 0) {
      if (entry.transaction_type.startsWith('INWARD')) {
        totalInward += Number(entry.quantity);
      } else {
        totalAdjustments += Number(entry.quantity);
      }
    } else {
      if (entry.transaction_type.startsWith('OUTWARD')) {
        totalOutward += Math.abs(Number(entry.quantity));
      } else {
        totalAdjustments += Number(entry.quantity); // negative adjustment
      }
    }
  }

  return {
    item_id: itemId,
    location_id: locationId,
    current_stock: Math.round(currentBalance * 1000) / 1000,
    total_inward: Math.round(totalInward * 1000) / 1000,
    total_outward: Math.round(totalOutward * 1000) / 1000,
    total_adjustments: Math.round(totalAdjustments * 1000) / 1000
  };
};

const getAvailableStockForItem = async (itemId) => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT COALESCE(SUM(quantity), 0) AS bal FROM stock_ledger WHERE item_id = $1', [itemId]);
      return parseFloat(res.rows[0].bal || 0);
    } catch (_) {}
  }
  const calc = calculateItemStock(Number(itemId));
  return calc.current_stock;
};

const addLedgerEntry = async (entry) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `INSERT INTO stock_ledger (transaction_type, item_id, batch_id, location_id, quantity, unit_rate, total_valuation, reference_type, reference_no, remarks, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [entry.transaction_type, entry.item_id, entry.batch_id || null, entry.location_id || 1,
         entry.quantity, entry.unit_rate || 0, (entry.quantity * (entry.unit_rate || 0)),
         entry.reference_type, entry.reference_no, entry.remarks || '', entry.created_by]
      );
      return res.rows[0];
    } catch (e) {
      console.error('[Inventory] addLedgerEntry DB error:', e.message);
    }
  }
  const newEntry = {
    id: inMemoryStockLedger.length + 1,
    entry_date: new Date().toISOString(),
    transaction_type: entry.transaction_type,
    item_id: Number(entry.item_id),
    batch_id: entry.batch_id ? Number(entry.batch_id) : null,
    location_id: entry.location_id ? Number(entry.location_id) : 1,
    quantity: Number(entry.quantity),
    unit_rate: Number(entry.unit_rate || 0),
    total_valuation: Number(entry.quantity) * Number(entry.unit_rate || 0),
    reference_type: entry.reference_type,
    reference_id: entry.reference_id || null,
    reference_no: entry.reference_no,
    remarks: entry.remarks || '',
    created_by: entry.created_by
  };
  inMemoryStockLedger.push(newEntry);
  return newEntry;
};

// ----------------------------------------------------------------------------
// 1. LOCATIONS MANAGEMENT
// ----------------------------------------------------------------------------

const getLocations = async () => {
  try {
    const res = await query('SELECT * FROM inventory_locations WHERE is_active = TRUE ORDER BY id ASC');
    if (res && res.rows) return res.rows;
  } catch (err) {
    // offline
  }
  return inMemoryLocations.filter(l => l.is_active);
};

const getLocationById = async (id) => {
  const locs = await getLocations();
  return locs.find(l => l.id === Number(id)) || null;
};

// ----------------------------------------------------------------------------
// 2. UNIFIED INVENTORY ITEMS & LISTINGS (RM, PKG, FG)
// ----------------------------------------------------------------------------

const getInventoryItems = async (filters = {}) => {
  const { item_type, search, low_stock } = filters;
  let items = [...inMemoryInventoryItems];

  if (item_type) {
    items = items.filter(i => i.item_type === item_type.toUpperCase());
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(i => 
      i.item_code.toLowerCase().includes(q) || 
      i.item_name.toLowerCase().includes(q)
    );
  }

  // Enrich each item with calculated stock ledger totals and batch counts
  const enriched = items.map(item => {
    const stock = calculateItemStock(item.id);
    const itemBatches = inMemoryBatches.filter(b => b.item_id === item.id && b.current_quantity > 0);
    const isLowStock = stock.current_stock <= Number(item.min_stock_level);
    const isReorder = stock.current_stock <= Number(item.reorder_level);

    return {
      ...item,
      current_stock: stock.current_stock,
      total_inward: stock.total_inward,
      total_outward: stock.total_outward,
      total_valuation: Math.round(stock.current_stock * item.valuation_rate * 100) / 100,
      active_batches_count: itemBatches.length,
      is_low_stock: isLowStock,
      is_reorder_level: isReorder,
      batches: itemBatches
    };
  });

  if (low_stock === 'true' || low_stock === true) {
    return enriched.filter(i => i.is_low_stock);
  }

  return enriched;
};

const getInventoryItemById = async (id) => {
  const items = await getInventoryItems();
  return items.find(i => i.id === Number(id)) || null;
};

/**
 * Module 1: Raw Material Inventory
 */
const getRawMaterialInventory = async (filters = {}) => {
  return await getInventoryItems({ ...filters, item_type: 'RAW_MATERIAL' });
};

/**
 * Module 2: Packaging Material Inventory
 */
const getPackagingInventory = async (filters = {}) => {
  return await getInventoryItems({ ...filters, item_type: 'PACKAGING' });
};

/**
 * Module 3: Finished Goods Inventory
 */
const getFinishedGoodsInventory = async (filters = {}) => {
  return await getInventoryItems({ ...filters, item_type: 'FINISHED_GOOD' });
};

// ----------------------------------------------------------------------------
// 3. MODULE 4: STOCK INWARD (From Phase 5 GRN & Production Receipts)
// ----------------------------------------------------------------------------

/**
 * Posts an approved/inspected GRN from Phase 5 into the Centralized Stock Ledger
 * Prevents duplicate posting of the same GRN.
 */
const postGRNStockInward = async (grnId, userId) => {
  const grnNum = Number(grnId);

  if (postedGRNs.has(grnNum)) {
    throw new Error(`GRN #${grnNum} has already been posted to inventory stock ledger. Duplicate posting is strictly prohibited.`);
  }

  // Fetch GRN from Phase 5 model
  const grn = await getGRNById(grnNum);
  if (!grn) {
    throw new Error(`Goods Received Note #${grnNum} not found.`);
  }

  if (grn.status !== 'POSTED' && grn.status !== 'COMPLETED' && grn.status !== 'INSPECTED') {
    throw new Error(`GRN #${grnNum} must be in POSTED or INSPECTED status before posting to inventory.`);
  }

  const inwardEntries = [];
  const locationId = 1; // Default Central Warehouse

  for (const item of (grn.items || [])) {
    // Only accept items with accepted_quantity > 0
    const acceptedQty = Number(item.accepted_qty || item.accepted_quantity || item.current_received_qty || item.received_quantity || 0);
    if (acceptedQty <= 0) continue;

    // Determine inventory item
    const invItem = inMemoryInventoryItems.find(i => 
      (i.item_type === (item.item_type || 'RAW_MATERIAL')) && 
      i.reference_id === Number(item.material_id)
    );

    if (!invItem) continue;

    // Create or append batch
    const batchNumber = item.batch_number || `BATCH-GRN-${grn.grn_number}-${invItem.id}`;
    let batch = inMemoryBatches.find(b => b.batch_number === batchNumber && b.item_id === invItem.id);

    const mfgDate = item.mfg_date || item.manufacturing_date || getDateOffset(-2);
    const expDate = item.expiry_date || getDateOffset(180);

    if (!batch) {
      batch = {
        id: inMemoryBatches.length + 1,
        batch_number: batchNumber,
        item_type: invItem.item_type,
        item_id: invItem.id,
        location_id: locationId,
        mfg_date: mfgDate,
        expiry_date: expDate,
        initial_quantity: acceptedQty,
        current_quantity: acceptedQty,
        qc_status: 'PASS',
        supplier_id: grn.supplier_id,
        source_grn_id: grn.id,
        notes: `Received from GRN ${grn.grn_number}`
      };
      inMemoryBatches.push(batch);
    } else {
      batch.current_quantity += acceptedQty;
    }

    // Centralized Ledger Entry
    const prevStock = calculateItemStock(invItem.id, locationId).current_stock;
    const runningBal = prevStock + acceptedQty;
    const unitRate = Number(item.unit_price || invItem.valuation_rate);

    const ledgerEntry = {
      id: inMemoryStockLedger.length + 1,
      entry_date: new Date().toISOString(),
      transaction_type: 'INWARD_GRN',
      item_id: invItem.id,
      batch_id: batch.id,
      location_id: locationId,
      quantity: acceptedQty,
      unit_rate: unitRate,
      total_valuation: Math.round(acceptedQty * unitRate * 100) / 100,
      reference_type: 'GRN',
      reference_id: grn.id,
      reference_no: grn.grn_number,
      running_balance: runningBal,
      remarks: `GRN Inward: ${acceptedQty} ${invItem.uom} accepted from ${grn.supplier_name || 'Vendor'}`,
      created_by: userId
    };

    inMemoryStockLedger.push(ledgerEntry);
    inwardEntries.push(ledgerEntry);
  }

  postedGRNs.add(grnNum);

  return {
    success: true,
    grn_id: grnNum,
    grn_number: grn.grn_number,
    entries_count: inwardEntries.length,
    inward_entries: inwardEntries
  };
};

/**
 * Record production receipt of finished goods into finished goods storage
 */
const recordProductionFGInward = async (data, userId) => {
  const { product_id, quantity, batch_number, mfg_date, expiry_date, location_id = 4, notes } = data;

  if (!product_id || !quantity || Number(quantity) <= 0) {
    throw new Error('Product ID and valid quantity greater than 0 are required.');
  }

  const invItem = inMemoryInventoryItems.find(i => 
    i.item_type === 'FINISHED_GOOD' && i.reference_id === Number(product_id)
  );

  if (!invItem) {
    throw new Error(`Finished good inventory item not found for product ID ${product_id}`);
  }

  const batchNum = batch_number || `FG-BAT-${Date.now().toString().slice(-6)}`;
  const mfg = mfg_date || getDateOffset(0);
  const exp = expiry_date || getDateOffset(7); // fresh idli batter 7 days

  let batch = inMemoryBatches.find(b => b.batch_number === batchNum && b.item_id === invItem.id);
  if (!batch) {
    batch = {
      id: inMemoryBatches.length + 1,
      batch_number: batchNum,
      item_type: 'FINISHED_GOOD',
      item_id: invItem.id,
      location_id: Number(location_id),
      mfg_date: mfg,
      expiry_date: exp,
      initial_quantity: Number(quantity),
      current_quantity: Number(quantity),
      qc_status: 'PASS',
      supplier_id: null,
      source_production_ref: notes || 'Production Floor Batch',
      notes: notes || 'Received from production'
    };
    inMemoryBatches.push(batch);
  } else {
    batch.current_quantity += Number(quantity);
  }

  const prevStock = calculateItemStock(invItem.id, Number(location_id)).current_stock;
  const runningBal = prevStock + Number(quantity);

  const ledgerEntry = {
    id: inMemoryStockLedger.length + 1,
    entry_date: new Date().toISOString(),
    transaction_type: 'INWARD_PRODUCTION',
    item_id: invItem.id,
    batch_id: batch.id,
    location_id: Number(location_id),
    quantity: Number(quantity),
    unit_rate: invItem.valuation_rate,
    total_valuation: Math.round(Number(quantity) * invItem.valuation_rate * 100) / 100,
    reference_type: 'PRODUCTION_RECEIPT',
    reference_id: null,
    reference_no: batchNum,
    running_balance: runningBal,
    remarks: notes || `Production Inward: ${quantity} ${invItem.uom} of ${invItem.item_name}`,
    created_by: userId
  };

  inMemoryStockLedger.push(ledgerEntry);

  return {
    success: true,
    item: invItem,
    batch,
    ledger_entry: ledgerEntry
  };
};

// ----------------------------------------------------------------------------
// 4. MODULE 5: STOCK OUTWARD (Issues to Production)
// ----------------------------------------------------------------------------

/**
 * Issues raw materials and packaging materials to production
 * Enforces:
 * - Positive quantity
 * - Available stock check (strictly prevent negative stock or over-issue)
 * - Expiry check (strictly block expired stock from normal production)
 */
const issueStockToProduction = async (data, userId) => {
  const { department = 'PRODUCTION', issued_to, bom_id, production_batch_ref, notes, items = [] } = data;

  if (!issued_to) {
    throw new Error('The recipient employee (issued_to) is required.');
  }

  if (!items || items.length === 0) {
    throw new Error('At least one material must be specified for production issue.');
  }

  const todayStr = getDateOffset(0);

  // Validation phase: check every item before applying any changes
  for (const item of items) {
    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid issue quantity ${item.quantity} for item ID ${item.item_id}`);
    }

    const invItem = inMemoryInventoryItems.find(i => i.id === Number(item.item_id));
    if (!invItem) {
      throw new Error(`Inventory item ID ${item.item_id} not found.`);
    }

    const locId = Number(item.location_id || 1);
    const stockSummary = calculateItemStock(invItem.id, locId);

    if (stockSummary.current_stock < qty) {
      throw new Error(
        `Insufficient stock for "${invItem.item_name}" (${invItem.item_code}). Requested: ${qty} ${invItem.uom}, Available: ${stockSummary.current_stock} ${invItem.uom}. Over-issue is strictly blocked.`
      );
    }

    // If batch specified, check batch balance and expiry
    if (item.batch_id) {
      const batch = inMemoryBatches.find(b => b.id === Number(item.batch_id));
      if (!batch) {
        throw new Error(`Batch ID ${item.batch_id} not found.`);
      }
      if (batch.current_quantity < qty) {
        throw new Error(
          `Insufficient batch quantity in batch ${batch.batch_number}. Requested: ${qty}, Batch Available: ${batch.current_quantity}`
        );
      }
      // Check expiry date
      if (batch.expiry_date < todayStr) {
        throw new Error(
          `Batch "${batch.batch_number}" expired on ${batch.expiry_date}. Expired material CANNOT be issued to normal production.`
        );
      }
    }
  }

  // Execution phase: Create stock issue and post outward ledger entries atomically
  const issueNumber = `ISS-${new Date().getFullYear()}-${String(inMemoryStockIssues.length + 1).padStart(4, '0')}`;
  const stockIssue = {
    id: inMemoryStockIssues.length + 1,
    issue_number: issueNumber,
    issue_date: todayStr,
    issue_type: 'PRODUCTION_ISSUE',
    department,
    issued_to,
    bom_id: bom_id ? Number(bom_id) : null,
    production_batch_ref,
    notes,
    total_items: items.length,
    created_by: userId,
    created_at: new Date().toISOString()
  };

  inMemoryStockIssues.push(stockIssue);

  const issueItems = [];
  const ledgerEntries = [];

  for (const item of items) {
    const qty = Number(item.quantity);
    const invItem = inMemoryInventoryItems.find(i => i.id === Number(item.item_id));
    const locId = Number(item.location_id || 1);

    let batch = null;
    if (item.batch_id) {
      batch = inMemoryBatches.find(b => b.id === Number(item.batch_id));
      batch.current_quantity = Math.round((batch.current_quantity - qty) * 1000) / 1000;
    }

    const prevStock = calculateItemStock(invItem.id, locId).current_stock;
    const runningBal = prevStock - qty;

    const issueItem = {
      id: inMemoryStockIssueItems.length + 1,
      stock_issue_id: stockIssue.id,
      item_id: invItem.id,
      batch_id: batch ? batch.id : null,
      location_id: locId,
      quantity: qty,
      uom: invItem.uom,
      purpose: item.purpose || 'Production floor consumption'
    };
    inMemoryStockIssueItems.push(issueItem);
    issueItems.push(issueItem);

    const ledgerEntry = {
      id: inMemoryStockLedger.length + 1,
      entry_date: new Date().toISOString(),
      transaction_type: 'OUTWARD_PRODUCTION',
      item_id: invItem.id,
      batch_id: batch ? batch.id : null,
      location_id: locId,
      quantity: -qty, // negative in ledger
      unit_rate: invItem.valuation_rate,
      total_valuation: -Math.round(qty * invItem.valuation_rate * 100) / 100,
      reference_type: 'PRODUCTION_ISSUE',
      reference_id: stockIssue.id,
      reference_no: issueNumber,
      running_balance: runningBal,
      remarks: `Issued to ${issued_to} for ${department} (${item.purpose || 'Production'})`,
      created_by: userId
    };

    inMemoryStockLedger.push(ledgerEntry);
    ledgerEntries.push(ledgerEntry);
  }

  return {
    success: true,
    stock_issue: stockIssue,
    items: issueItems,
    ledger_entries: ledgerEntries
  };
};

const getStockIssues = async (filters = {}) => {
  return inMemoryStockIssues.map(issue => {
    const items = inMemoryStockIssueItems.filter(i => i.stock_issue_id === issue.id).map(i => {
      const invItem = inMemoryInventoryItems.find(item => item.id === i.item_id);
      const batch = inMemoryBatches.find(b => b.id === i.batch_id);
      const loc = inMemoryLocations.find(l => l.id === i.location_id);
      return {
        ...i,
        item_name: invItem ? invItem.item_name : '',
        item_code: invItem ? invItem.item_code : '',
        batch_number: batch ? batch.batch_number : '',
        location_name: loc ? loc.location_name : ''
      };
    });
    return {
      ...issue,
      items
    };
  });
};

// ----------------------------------------------------------------------------
// 5. MODULE 6: STOCK ADJUSTMENT (Damage, Expired, Missing, Excess)
// ----------------------------------------------------------------------------

/**
 * Creates a stock adjustment request requiring Admin or Owner approval
 */
const requestStockAdjustment = async (data, userId) => {
  const { item_id, batch_id, location_id = 1, adjustment_type, quantity, reason } = data;

  if (!item_id || !adjustment_type || !quantity || Number(quantity) <= 0 || !reason) {
    throw new Error('Item ID, adjustment type (EXCESS, SHORTAGE, DAMAGED, EXPIRED), positive quantity, and reason are required.');
  }

  const validTypes = ['EXCESS', 'SHORTAGE', 'DAMAGED', 'EXPIRED'];
  if (!validTypes.includes(adjustment_type.toUpperCase())) {
    throw new Error(`Invalid adjustment type "${adjustment_type}". Must be one of: ${validTypes.join(', ')}`);
  }

  const invItem = inMemoryInventoryItems.find(i => i.id === Number(item_id));
  if (!invItem) {
    throw new Error(`Inventory item ID ${item_id} not found.`);
  }

  const adjNumber = `ADJ-${new Date().getFullYear()}-${String(inMemoryStockAdjustments.length + 1).padStart(4, '0')}`;
  const adjustment = {
    id: inMemoryStockAdjustments.length + 1,
    adjustment_number: adjNumber,
    item_id: invItem.id,
    item_name: invItem.item_name,
    item_code: invItem.item_code,
    uom: invItem.uom,
    batch_id: batch_id ? Number(batch_id) : null,
    location_id: Number(location_id),
    adjustment_type: adjustment_type.toUpperCase(),
    quantity: Number(quantity),
    reason,
    status: 'PENDING',
    requested_by: userId,
    requested_at: new Date().toISOString(),
    approved_by: null,
    approved_at: null,
    approval_notes: null
  };

  inMemoryStockAdjustments.push(adjustment);
  return adjustment;
};

const getStockAdjustments = async (filters = {}) => {
  const { status, type } = filters;
  let adjs = [...inMemoryStockAdjustments];

  if (status) {
    adjs = adjs.filter(a => a.status === status.toUpperCase());
  }

  if (type) {
    adjs = adjs.filter(a => a.adjustment_type === type.toUpperCase());
  }

  return adjs;
};

/**
 * Admin or Owner approves or rejects stock adjustment
 * When approved, automatically writes balancing entry to stock_ledger!
 */
const approveStockAdjustment = async (adjustmentId, approverId, decision, approvalNotes) => {
  const adj = inMemoryStockAdjustments.find(a => a.id === Number(adjustmentId));
  if (!adj) {
    throw new Error(`Stock adjustment #${adjustmentId} not found.`);
  }

  if (adj.status !== 'PENDING') {
    throw new Error(`Stock adjustment #${adjustmentId} has already been ${adj.status}.`);
  }

  const dec = decision.toUpperCase();
  if (dec !== 'APPROVED' && dec !== 'REJECTED') {
    throw new Error('Decision must be APPROVED or REJECTED.');
  }

  adj.status = dec;
  adj.approved_by = approverId;
  adj.approved_at = new Date().toISOString();
  adj.approval_notes = approvalNotes || (dec === 'APPROVED' ? 'Approved by authority' : 'Rejected');

  let ledgerEntry = null;

  if (dec === 'APPROVED') {
    const invItem = inMemoryInventoryItems.find(i => i.id === adj.item_id);
    const locId = adj.location_id;
    const isPositive = adj.adjustment_type === 'EXCESS';
    const adjQty = isPositive ? adj.quantity : -adj.quantity;

    const prevStock = calculateItemStock(invItem.id, locId).current_stock;
    const runningBal = prevStock + adjQty;

    // Adjust batch if specified
    if (adj.batch_id) {
      const batch = inMemoryBatches.find(b => b.id === adj.batch_id);
      if (batch) {
        batch.current_quantity = Math.max(0, batch.current_quantity + adjQty);
      }
    }

    const transactionType = `ADJUSTMENT_${adj.adjustment_type}`;

    ledgerEntry = {
      id: inMemoryStockLedger.length + 1,
      entry_date: new Date().toISOString(),
      transaction_type: transactionType,
      item_id: invItem.id,
      batch_id: adj.batch_id,
      location_id: locId,
      quantity: adjQty,
      unit_rate: invItem.valuation_rate,
      total_valuation: Math.round(adjQty * invItem.valuation_rate * 100) / 100,
      reference_type: 'ADJUSTMENT',
      reference_id: adj.id,
      reference_no: adj.adjustment_number,
      running_balance: runningBal,
      remarks: `Stock Adjustment (${adj.adjustment_type}): ${adj.reason}`,
      created_by: approverId
    };

    inMemoryStockLedger.push(ledgerEntry);
  }

  return {
    success: true,
    adjustment: adj,
    ledger_entry: ledgerEntry
  };
};

// ----------------------------------------------------------------------------
// 6. MODULE 7: BATCH AND EXPIRY MANAGEMENT & FEFO RECOMMENDATION
// ----------------------------------------------------------------------------

const getBatches = async (filters = {}) => {
  const { item_id, qc_status, search } = filters;
  let batches = [...inMemoryBatches];

  if (item_id) {
    batches = batches.filter(b => b.item_id === Number(item_id));
  }

  if (qc_status) {
    batches = batches.filter(b => b.qc_status === qc_status.toUpperCase());
  }

  if (search) {
    const q = search.toLowerCase();
    batches = batches.filter(b => b.batch_number.toLowerCase().includes(q));
  }

  const todayStr = getDateOffset(0);

  return batches.map(b => {
    const invItem = inMemoryInventoryItems.find(i => i.id === b.item_id);
    const loc = inMemoryLocations.find(l => l.id === b.location_id);
    const isExpired = b.expiry_date < todayStr;
    const daysUntilExpiry = Math.ceil((new Date(b.expiry_date) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

    return {
      ...b,
      item_name: invItem ? invItem.item_name : '',
      item_code: invItem ? invItem.item_code : '',
      uom: invItem ? invItem.uom : '',
      location_name: loc ? loc.location_name : '',
      is_expired: isExpired,
      is_expiring_soon: isExpiringSoon,
      days_until_expiry: daysUntilExpiry
    };
  });
};

/**
 * Returns materials/batches that have already expired
 */
const getExpiredBatches = async () => {
  const all = await getBatches();
  return all.filter(b => b.is_expired && b.current_quantity > 0);
};

/**
 * Returns materials/batches expiring within a given threshold (default 30 days)
 */
const getExpiringSoonBatches = async (days = 30) => {
  const all = await getBatches();
  return all.filter(b => !b.is_expired && b.days_until_expiry <= days && b.current_quantity > 0);
};

/**
 * FEFO (First Expiry, First Out) Recommendation Engine
 * Recommends which batches to pick for a requested quantity to minimize wastage!
 */
const getFEFORecommendation = async (itemId, requestedQty) => {
  const qtyNeeded = Number(requestedQty);
  if (isNaN(qtyNeeded) || qtyNeeded <= 0) {
    throw new Error('Valid requested quantity greater than 0 is required.');
  }

  const allBatches = await getBatches({ item_id: itemId });
  // Exclude expired batches and empty batches; sort by expiry_date ASC (earliest expiry first)
  const availableBatches = allBatches
    .filter(b => !b.is_expired && b.current_quantity > 0 && b.qc_status === 'PASS')
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

  let remainingToPick = qtyNeeded;
  const picks = [];

  for (const b of availableBatches) {
    if (remainingToPick <= 0) break;
    const take = Math.min(b.current_quantity, remainingToPick);
    picks.push({
      batch_id: b.id,
      batch_number: b.batch_number,
      expiry_date: b.expiry_date,
      days_until_expiry: b.days_until_expiry,
      available_in_batch: b.current_quantity,
      recommended_pick_quantity: take,
      uom: b.uom
    });
    remainingToPick -= take;
  }

  return {
    item_id: Number(itemId),
    requested_quantity: qtyNeeded,
    total_allocated: qtyNeeded - remainingToPick,
    shortfall: Math.max(0, remainingToPick),
    is_fully_fulfillable: remainingToPick <= 0,
    recommendations: picks
  };
};

// ----------------------------------------------------------------------------
// 7. MODULE 8: STOCK TRANSFER (Warehouse Inter-Location Movement)
// ----------------------------------------------------------------------------

/**
 * Transfers stock between warehouse/storage locations
 * Ensures stock conservation: debits source location, credits destination location.
 */
const transferStock = async (data, userId) => {
  const { from_location_id, to_location_id, item_id, batch_id, quantity, notes } = data;

  if (!from_location_id || !to_location_id || !item_id || !quantity || Number(quantity) <= 0) {
    throw new Error('Source location, destination location, item ID, and positive quantity are required.');
  }

  const fromLoc = Number(from_location_id);
  const toLoc = Number(to_location_id);

  if (fromLoc === toLoc) {
    throw new Error('Source and destination locations cannot be identical.');
  }

  const qty = Number(quantity);
  const invItem = inMemoryInventoryItems.find(i => i.id === Number(item_id));
  if (!invItem) {
    throw new Error(`Inventory item ID ${item_id} not found.`);
  }

  const sourceStock = calculateItemStock(invItem.id, fromLoc).current_stock;
  if (sourceStock < qty) {
    throw new Error(`Insufficient stock at source location. Available: ${sourceStock} ${invItem.uom}, Requested transfer: ${qty} ${invItem.uom}.`);
  }

  let batch = null;
  if (batch_id) {
    batch = inMemoryBatches.find(b => b.id === Number(batch_id));
    if (batch && batch.current_quantity < qty) {
      throw new Error(`Insufficient quantity in batch ${batch.batch_number}. Available: ${batch.current_quantity}`);
    }
  }

  const transferNumber = `TRF-${new Date().getFullYear()}-${String(inMemoryStockTransfers.length + 1).padStart(4, '0')}`;
  const transfer = {
    id: inMemoryStockTransfers.length + 1,
    transfer_number: transferNumber,
    transfer_date: getDateOffset(0),
    item_id: invItem.id,
    batch_id: batch ? batch.id : null,
    from_location_id: fromLoc,
    to_location_id: toLoc,
    quantity: qty,
    uom: invItem.uom,
    notes,
    status: 'COMPLETED',
    transferred_by: userId,
    created_at: new Date().toISOString()
  };

  inMemoryStockTransfers.push(transfer);

  // 1. Debit Source Location (-qty)
  const fromBal = sourceStock - qty;
  const ledgerOut = {
    id: inMemoryStockLedger.length + 1,
    entry_date: new Date().toISOString(),
    transaction_type: 'TRANSFER_OUT',
    item_id: invItem.id,
    batch_id: batch ? batch.id : null,
    location_id: fromLoc,
    quantity: -qty,
    unit_rate: invItem.valuation_rate,
    total_valuation: -Math.round(qty * invItem.valuation_rate * 100) / 100,
    reference_type: 'TRANSFER',
    reference_id: transfer.id,
    reference_no: transferNumber,
    running_balance: fromBal,
    remarks: `Transfer Out to ${toLoc}: ${notes || ''}`,
    created_by: userId
  };
  inMemoryStockLedger.push(ledgerOut);

  // 2. Credit Destination Location (+qty)
  const destStock = calculateItemStock(invItem.id, toLoc).current_stock;
  const toBal = destStock + qty;
  const ledgerIn = {
    id: inMemoryStockLedger.length + 1,
    entry_date: new Date().toISOString(),
    transaction_type: 'TRANSFER_IN',
    item_id: invItem.id,
    batch_id: batch ? batch.id : null,
    location_id: toLoc,
    quantity: qty,
    unit_rate: invItem.valuation_rate,
    total_valuation: Math.round(qty * invItem.valuation_rate * 100) / 100,
    reference_type: 'TRANSFER',
    reference_id: transfer.id,
    reference_no: transferNumber,
    running_balance: toBal,
    remarks: `Transfer In from ${fromLoc}: ${notes || ''}`,
    created_by: userId
  };
  inMemoryStockLedger.push(ledgerIn);

  return {
    success: true,
    transfer,
    ledger_out: ledgerOut,
    ledger_in: ledgerIn
  };
};

const getStockTransfers = async () => {
  return inMemoryStockTransfers.map(t => {
    const invItem = inMemoryInventoryItems.find(i => i.id === t.item_id);
    const fromLoc = inMemoryLocations.find(l => l.id === t.from_location_id);
    const toLoc = inMemoryLocations.find(l => l.id === t.to_location_id);
    const batch = inMemoryBatches.find(b => b.id === t.batch_id);

    return {
      ...t,
      item_name: invItem ? invItem.item_name : '',
      item_code: invItem ? invItem.item_code : '',
      from_location_name: fromLoc ? fromLoc.location_name : '',
      to_location_name: toLoc ? toLoc.location_name : '',
      batch_number: batch ? batch.batch_number : ''
    };
  });
};

// ----------------------------------------------------------------------------
// 8. MODULE 9: PHYSICAL STOCK VERIFICATION
// ----------------------------------------------------------------------------

/**
 * Creates physical stock count sheet with auto-populated system balances
 */
const createPhysicalStockCount = async (data, userId) => {
  const { location_id = 1, counted_by, notes, items = [] } = data;

  if (!counted_by) {
    throw new Error('Counted By auditor/employee name is required.');
  }

  const countNumber = `STK-CNT-${new Date().getFullYear()}-${String(inMemoryPhysicalStockCounts.length + 1).padStart(4, '0')}`;
  const stockCount = {
    id: inMemoryPhysicalStockCounts.length + 1,
    count_number: countNumber,
    count_date: getDateOffset(0),
    location_id: Number(location_id),
    counted_by,
    status: 'DRAFT',
    created_by: userId,
    approved_by: null,
    approved_at: null,
    notes,
    created_at: new Date().toISOString()
  };

  inMemoryPhysicalStockCounts.push(stockCount);

  // If specific items not provided, load all items for this location
  const countItems = [];
  const targetItems = items.length > 0 
    ? items 
    : inMemoryInventoryItems.map(i => ({ item_id: i.id, counted_quantity: null }));

  for (const item of targetItems) {
    const invItem = inMemoryInventoryItems.find(i => i.id === Number(item.item_id));
    if (!invItem) continue;

    const sysQty = calculateItemStock(invItem.id, Number(location_id)).current_stock;
    const countedQty = item.counted_quantity !== null && item.counted_quantity !== undefined 
      ? Number(item.counted_quantity) 
      : sysQty;
    const diffQty = Math.round((countedQty - sysQty) * 1000) / 1000;
    const valDiff = Math.round(diffQty * invItem.valuation_rate * 100) / 100;

    const countItem = {
      id: inMemoryPhysicalStockCountItems.length + 1,
      stock_count_id: stockCount.id,
      item_id: invItem.id,
      item_name: invItem.item_name,
      item_code: invItem.item_code,
      uom: invItem.uom,
      system_quantity: sysQty,
      counted_quantity: countedQty,
      difference_quantity: diffQty,
      valuation_difference: valDiff,
      remarks: item.remarks || (diffQty === 0 ? 'Verified Match' : `${diffQty > 0 ? '+' : ''}${diffQty} Discrepancy`)
    };

    inMemoryPhysicalStockCountItems.push(countItem);
    countItems.push(countItem);
  }

  return {
    ...stockCount,
    items: countItems
  };
};

const getPhysicalStockCounts = async () => {
  return inMemoryPhysicalStockCounts.map(count => {
    const loc = inMemoryLocations.find(l => l.id === count.location_id);
    const items = inMemoryPhysicalStockCountItems.filter(i => i.stock_count_id === count.id);
    const hasDiscrepancy = items.some(i => i.difference_quantity !== 0);
    return {
      ...count,
      location_name: loc ? loc.location_name : '',
      items_count: items.length,
      has_discrepancy: hasDiscrepancy,
      items
    };
  });
};

const getPhysicalStockCountById = async (id) => {
  const all = await getPhysicalStockCounts();
  return all.find(c => c.id === Number(id)) || null;
};

const updatePhysicalStockCountItems = async (countId, items) => {
  const count = inMemoryPhysicalStockCounts.find(c => c.id === Number(countId));
  if (!count) throw new Error(`Stock count #${countId} not found.`);
  if (count.status !== 'DRAFT') throw new Error(`Only DRAFT counts can be updated.`);

  for (const update of items) {
    const existing = inMemoryPhysicalStockCountItems.find(
      i => i.stock_count_id === count.id && i.item_id === Number(update.item_id)
    );
    if (existing) {
      existing.counted_quantity = Number(update.counted_quantity);
      existing.difference_quantity = Math.round((existing.counted_quantity - existing.system_quantity) * 1000) / 1000;
      const invItem = inMemoryInventoryItems.find(i => i.id === existing.item_id);
      const rate = invItem ? invItem.valuation_rate : 0;
      existing.valuation_difference = Math.round(existing.difference_quantity * rate * 100) / 100;
      existing.remarks = update.remarks || existing.remarks;
    }
  }

  count.status = 'SUBMITTED';
  return await getPhysicalStockCountById(countId);
};

const approvePhysicalStockCount = async (countId, approverId, decision, notes) => {
  const count = inMemoryPhysicalStockCounts.find(c => c.id === Number(countId));
  if (!count) throw new Error(`Stock count #${countId} not found.`);
  if (count.status === 'APPROVED') throw new Error(`Stock count #${countId} is already approved.`);

  const dec = decision.toUpperCase();
  if (dec !== 'APPROVED' && dec !== 'REJECTED') {
    throw new Error('Decision must be APPROVED or REJECTED.');
  }

  count.status = dec;
  count.approved_by = approverId;
  count.approved_at = new Date().toISOString();
  count.notes = notes || count.notes;

  const ledgerPostings = [];

  // If approved, post non-zero variances to the stock ledger!
  if (dec === 'APPROVED') {
    const items = inMemoryPhysicalStockCountItems.filter(i => i.stock_count_id === count.id);

    for (const item of items) {
      if (item.difference_quantity === 0) continue;

      const invItem = inMemoryInventoryItems.find(i => i.id === item.item_id);
      const prevStock = calculateItemStock(invItem.id, count.location_id).current_stock;
      const runningBal = prevStock + item.difference_quantity;

      const ledgerEntry = {
        id: inMemoryStockLedger.length + 1,
        entry_date: new Date().toISOString(),
        transaction_type: 'PHYSICAL_COUNT_VARIANCE',
        item_id: invItem.id,
        batch_id: null,
        location_id: count.location_id,
        quantity: item.difference_quantity,
        unit_rate: invItem.valuation_rate,
        total_valuation: Math.round(item.difference_quantity * invItem.valuation_rate * 100) / 100,
        reference_type: 'STOCK_COUNT',
        reference_id: count.id,
        reference_no: count.count_number,
        running_balance: runningBal,
        remarks: `Physical Audit Variance Reconciliation: ${item.remarks || ''}`,
        created_by: approverId
      };

      inMemoryStockLedger.push(ledgerEntry);
      ledgerPostings.push(ledgerEntry);
    }
  }

  return {
    success: true,
    count,
    ledger_postings: ledgerPostings
  };
};

// ----------------------------------------------------------------------------
// 9. MODULE 10: INVENTORY DASHBOARD ANALYTICS
// ----------------------------------------------------------------------------

const getInventoryDashboardStats = async () => {
  const rawMaterials = await getRawMaterialInventory();
  const packaging = await getPackagingInventory();
  const finishedGoods = await getFinishedGoodsInventory();
  const expiredBatches = await getExpiredBatches();
  const expiringSoonBatches = await getExpiringSoonBatches(30);

  // Totals and valuations
  const totalRMStock = rawMaterials.reduce((acc, i) => acc + i.current_stock, 0);
  const totalRMValuation = rawMaterials.reduce((acc, i) => acc + i.total_valuation, 0);

  const totalPkgStock = packaging.reduce((acc, i) => acc + i.current_stock, 0);
  const totalPkgValuation = packaging.reduce((acc, i) => acc + i.total_valuation, 0);

  const totalFGStock = finishedGoods.reduce((acc, i) => acc + i.current_stock, 0);
  const totalFGValuation = finishedGoods.reduce((acc, i) => acc + i.total_valuation, 0);

  const lowStockRM = rawMaterials.filter(i => i.is_low_stock);
  const lowStockPkg = packaging.filter(i => i.is_low_stock);
  const lowStockFG = finishedGoods.filter(i => i.is_low_stock);
  const totalLowStockCount = lowStockRM.length + lowStockPkg.length + lowStockFG.length;

  // Recent 10 stock ledger movements
  const recentMovements = inMemoryStockLedger.slice(-10).reverse().map(l => {
    const invItem = inMemoryInventoryItems.find(i => i.id === l.item_id);
    const loc = inMemoryLocations.find(loc => loc.id === l.location_id);
    const batch = inMemoryBatches.find(b => b.id === l.batch_id);
    return {
      ...l,
      item_name: invItem ? invItem.item_name : '',
      item_code: invItem ? invItem.item_code : '',
      uom: invItem ? invItem.uom : '',
      location_name: loc ? loc.location_name : '',
      batch_number: batch ? batch.batch_number : ''
    };
  });

  // Fast-moving raw materials (highest outward quantity)
  const outwardByItem = {};
  for (const l of inMemoryStockLedger) {
    if (l.quantity < 0) {
      outwardByItem[l.item_id] = (outwardByItem[l.item_id] || 0) + Math.abs(l.quantity);
    }
  }

  const fastMovingRM = rawMaterials
    .map(rm => ({
      ...rm,
      total_consumed: outwardByItem[rm.id] || 0
    }))
    .sort((a, b) => b.total_consumed - a.total_consumed)
    .slice(0, 5);

  // Inward vs Outward summary
  let totalInwardQty = 0;
  let totalOutwardQty = 0;
  for (const l of inMemoryStockLedger) {
    if (l.quantity > 0) totalInwardQty += l.quantity;
    else totalOutwardQty += Math.abs(l.quantity);
  }

  return {
    raw_materials: {
      total_count: rawMaterials.length,
      total_stock: Math.round(totalRMStock * 1000) / 1000,
      total_valuation: Math.round(totalRMValuation * 100) / 100,
      low_stock_count: lowStockRM.length,
      items: rawMaterials
    },
    packaging: {
      total_count: packaging.length,
      total_stock: Math.round(totalPkgStock * 1000) / 1000,
      total_valuation: Math.round(totalPkgValuation * 100) / 100,
      low_stock_count: lowStockPkg.length,
      items: packaging
    },
    finished_goods: {
      total_count: finishedGoods.length,
      total_stock: Math.round(totalFGStock * 1000) / 1000,
      total_valuation: Math.round(totalFGValuation * 100) / 100,
      low_stock_count: lowStockFG.length,
      items: finishedGoods
    },
    alerts: {
      total_low_stock_count: totalLowStockCount,
      low_stock_items: [...lowStockRM, ...lowStockPkg, ...lowStockFG],
      expired_count: expiredBatches.length,
      expired_batches: expiredBatches,
      expiring_soon_count: expiringSoonBatches.length,
      expiring_soon_batches: expiringSoonBatches
    },
    movements_summary: {
      total_inward_quantity: Math.round(totalInwardQty * 1000) / 1000,
      total_outward_quantity: Math.round(totalOutwardQty * 1000) / 1000,
      net_stock_variance: Math.round((totalInwardQty - totalOutwardQty) * 1000) / 1000,
      recent_movements: recentMovements
    },
    fast_moving_materials: fastMovingRM,
    total_inventory_valuation: Math.round((totalRMValuation + totalPkgValuation + totalFGValuation) * 100) / 100
  };
};

// ----------------------------------------------------------------------------
// 10. MODULE 11: INVENTORY REPORTS & CSV EXPORT
// ----------------------------------------------------------------------------

const getInventoryReports = async (type = 'current_stock', filters = {}) => {
  const { start_date, end_date, item_type } = filters;

  const enrichLedger = (entries) => entries.map(l => {
    const invItem = inMemoryInventoryItems.find(i => i.id === l.item_id);
    const loc = inMemoryLocations.find(loc => loc.id === l.location_id);
    const batch = inMemoryBatches.find(b => b.id === l.batch_id);
    return {
      id: l.id,
      date: l.entry_date ? l.entry_date.split('T')[0] : '',
      transaction_type: l.transaction_type,
      item_type: invItem ? invItem.item_type : '',
      item_code: invItem ? invItem.item_code : '',
      item_name: invItem ? invItem.item_name : '',
      uom: invItem ? invItem.uom : '',
      batch_number: batch ? batch.batch_number : '-',
      location: loc ? loc.location_name : '-',
      quantity: l.quantity,
      unit_rate: l.unit_rate,
      total_valuation: l.total_valuation,
      reference_no: l.reference_no || '-',
      running_balance: l.running_balance,
      remarks: l.remarks || ''
    };
  });

  switch (type) {
    case 'current_stock': {
      let items = await getInventoryItems({ item_type });
      return {
        title: 'Current Stock & Inventory Valuation Report',
        generated_at: new Date().toISOString(),
        rows: items.map(i => ({
          item_code: i.item_code,
          item_name: i.item_name,
          item_type: i.item_type,
          uom: i.uom,
          current_stock: i.current_stock,
          min_stock_level: i.min_stock_level,
          reorder_level: i.reorder_level,
          unit_rate: i.valuation_rate,
          total_valuation: i.total_valuation,
          is_low_stock: i.is_low_stock ? 'YES' : 'NO'
        }))
      };
    }

    case 'stock_inward': {
      let entries = inMemoryStockLedger.filter(l => l.quantity > 0);
      return {
        title: 'Stock Inward Register Report',
        generated_at: new Date().toISOString(),
        rows: enrichLedger(entries)
      };
    }

    case 'stock_outward': {
      let entries = inMemoryStockLedger.filter(l => l.quantity < 0);
      return {
        title: 'Stock Outward Register Report',
        generated_at: new Date().toISOString(),
        rows: enrichLedger(entries)
      };
    }

    case 'movement_history': {
      return {
        title: 'Comprehensive Stock Movement Ledger Audit Trail',
        generated_at: new Date().toISOString(),
        rows: enrichLedger(inMemoryStockLedger)
      };
    }

    case 'low_stock': {
      const items = await getInventoryItems({ low_stock: true });
      return {
        title: 'Low Stock & Reorder Warning Report',
        generated_at: new Date().toISOString(),
        rows: items.map(i => ({
          item_code: i.item_code,
          item_name: i.item_name,
          item_type: i.item_type,
          uom: i.uom,
          current_stock: i.current_stock,
          min_stock_level: i.min_stock_level,
          reorder_level: i.reorder_level,
          shortfall: Math.max(0, i.reorder_level - i.current_stock)
        }))
      };
    }

    case 'expired_stock': {
      const batches = await getExpiredBatches();
      return {
        title: 'Expired Stock Audit Report',
        generated_at: new Date().toISOString(),
        rows: batches.map(b => ({
          batch_number: b.batch_number,
          item_name: b.item_name,
          item_code: b.item_code,
          location: b.location_name,
          current_quantity: b.current_quantity,
          uom: b.uom,
          mfg_date: b.mfg_date,
          expiry_date: b.expiry_date,
          days_expired: Math.abs(b.days_until_expiry)
        }))
      };
    }

    case 'near_expiry': {
      const batches = await getExpiringSoonBatches(30);
      return {
        title: 'Near-Expiry (Within 30 Days) Stock Alert Report',
        generated_at: new Date().toISOString(),
        rows: batches.map(b => ({
          batch_number: b.batch_number,
          item_name: b.item_name,
          item_code: b.item_code,
          location: b.location_name,
          current_quantity: b.current_quantity,
          uom: b.uom,
          mfg_date: b.mfg_date,
          expiry_date: b.expiry_date,
          days_until_expiry: b.days_until_expiry
        }))
      };
    }

    case 'damaged_stock': {
      const damages = inMemoryStockAdjustments.filter(a => a.adjustment_type === 'DAMAGED' || a.adjustment_type === 'EXPIRED');
      return {
        title: 'Damaged & Quality Write-off Material Report',
        generated_at: new Date().toISOString(),
        rows: damages.map(d => ({
          adjustment_number: d.adjustment_number,
          item_name: d.item_name,
          item_code: d.item_code,
          type: d.adjustment_type,
          quantity: d.quantity,
          uom: d.uom,
          reason: d.reason,
          status: d.status,
          requested_at: d.requested_at
        }))
      };
    }

    case 'batch_wise': {
      const batches = await getBatches();
      return {
        title: 'Batch-Wise Inventory Breakdown Report',
        generated_at: new Date().toISOString(),
        rows: batches.map(b => ({
          batch_number: b.batch_number,
          item_code: b.item_code,
          item_name: b.item_name,
          location: b.location_name,
          current_quantity: b.current_quantity,
          uom: b.uom,
          qc_status: b.qc_status,
          mfg_date: b.mfg_date,
          expiry_date: b.expiry_date,
          status: b.is_expired ? 'EXPIRED' : b.is_expiring_soon ? 'EXPIRING_SOON' : 'ACTIVE'
        }))
      };
    }

    case 'physical_variance': {
      const items = inMemoryPhysicalStockCountItems.filter(i => i.difference_quantity !== 0);
      return {
        title: 'Physical Stock Count Variance Report',
        generated_at: new Date().toISOString(),
        rows: items.map(i => ({
          item_code: i.item_code,
          item_name: i.item_name,
          system_quantity: i.system_quantity,
          counted_quantity: i.counted_quantity,
          difference_quantity: i.difference_quantity,
          valuation_difference: i.valuation_difference,
          remarks: i.remarks
        }))
      };
    }

    default:
      throw new Error(`Unknown report type: ${type}`);
  }
};

module.exports = {
  initInventoryTables,
  getLocations,
  getLocationById,
  getInventoryItems,
  getInventoryItemById,
  getRawMaterialInventory,
  getPackagingInventory,
  getFinishedGoodsInventory,
  postGRNStockInward,
  recordProductionFGInward,
  issueStockToProduction,
  getStockIssues,
  requestStockAdjustment,
  getStockAdjustments,
  approveStockAdjustment,
  getBatches,
  getExpiredBatches,
  getExpiringSoonBatches,
  getFEFORecommendation,
  transferStock,
  getStockTransfers,
  createPhysicalStockCount,
  getPhysicalStockCounts,
  getPhysicalStockCountById,
  updatePhysicalStockCountItems,
  approvePhysicalStockCount,
  getInventoryDashboardStats,
  getInventoryReports,
  getAvailableStockForItem,
  addLedgerEntry,
  calculateItemStock,
  inMemoryStockLedger,
  inMemoryInventoryItems,
  inMemoryBatches
};
