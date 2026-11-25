/**
 * ============================================================================
 * Production Management System Model (Phase 7)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 *
 * Dual-mode: PostgreSQL when available, in-memory fallback for offline/testing.
 * Integrates with Phase 3 (BOM/Products), Phase 4 (Sales Orders),
 * Phase 6 (Inventory/Stock Ledger).
 * ============================================================================
 */

const { query, getClient } = require('../config/db');
const masterDataModel = require('./masterDataModel');
const inventoryModel = require('./inventoryModel');

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY SEED DATA (Offline / Test Mode)
// ─────────────────────────────────────────────────────────────────────────────

let isDbOnline = false;

const getDateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

let inMemProductionPlans = [
  {
    id: 1, plan_number: 'PP-2026-001', plan_date: getDateOffset(-5),
    planned_start_date: getDateOffset(-3), planned_end_date: getDateOffset(2),
    sales_order_id: 1, product_id: 1,
    planned_quantity: 200, supervisor_id: 3, supervisor_name: 'Production Supervisor',
    department: 'Production', notes: 'Batter batch for Nilgiris order',
    status: 'APPROVED', created_by: 1, created_at: new Date(Date.now() - 5 * 86400000), updated_at: new Date()
  }
];

let inMemProductionOrders = [
  {
    id: 1, order_number: 'PO-PROD-2026-001', plan_id: 1, sales_order_id: 1,
    product_id: 1, product_sku: 'FG-001', product_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)',
    bom_id: 1, bom_version: 'v1.0',
    planned_quantity: 200, actual_quantity: 0, accepted_quantity: 0,
    rejected_quantity: 0, wastage_quantity: 0,
    planned_start_date: getDateOffset(-3), planned_end_date: getDateOffset(2),
    actual_start_time: null, actual_end_time: null,
    supervisor_id: 3, supervisor_name: 'Production Supervisor',
    status: 'APPROVED', priority: 'HIGH',
    materials_issued: false, fg_receipt_posted: false,
    notes: 'Urgent batch for retail delivery',
    created_by: 1, created_at: new Date(Date.now() - 4 * 86400000), updated_at: new Date()
  }
];

let inMemRequirements = [
  { id: 1, production_order_id: 1, material_type: 'RAW_MATERIAL', material_id: 1, material_name: 'Ponni Idli Rice (Special)', material_code: 'RM-001', unit: 'kg', quantity_per_batch: 65.0, wastage_percentage: 1.5, required_quantity: 132.0, issued_quantity: 0, returned_quantity: 0, bom_item_id: 1, created_at: new Date() },
  { id: 2, production_order_id: 1, material_type: 'RAW_MATERIAL', material_id: 2, material_name: 'Guntur Urad Dal (Skinless/Gundu)', material_code: 'RM-002', unit: 'kg', quantity_per_batch: 16.25, wastage_percentage: 1.0, required_quantity: 32.825, issued_quantity: 0, returned_quantity: 0, bom_item_id: 2, created_at: new Date() },
  { id: 3, production_order_id: 1, material_type: 'RAW_MATERIAL', material_id: 3, material_name: 'Fenugreek Seeds (Vendhayam)', material_code: 'RM-003', unit: 'kg', quantity_per_batch: 0.5, wastage_percentage: 0, required_quantity: 1.0, issued_quantity: 0, returned_quantity: 0, bom_item_id: 3, created_at: new Date() },
  { id: 4, production_order_id: 1, material_type: 'PACKAGING', material_id: 1, material_name: '1 KG Multilayer Fresh Batter Pouch (Printed)', material_code: 'PM-001', unit: 'pieces', quantity_per_batch: 100, wastage_percentage: 2.0, required_quantity: 204, issued_quantity: 0, returned_quantity: 0, bom_item_id: 5, created_at: new Date() }
];

let inMemMaterialIssues = [];
let inMemIssueItems = [];
let inMemReturns = [];
let inMemBatches = [];
let inMemLogs = [];
let inMemDowntime = [];
let inMemFGReceipts = [];
let inMemStatusHistory = [
  { id: 1, production_order_id: 1, old_status: 'PLANNED', new_status: 'APPROVED', changed_by: 1, changed_by_name: 'Admin', reason: 'BOM and materials verified', changed_at: new Date(Date.now() - 3 * 86400000) }
];

let nextPlanId = 2, nextOrderId = 2, nextReqId = 5;
let nextIssueId = 1, nextIssueItemId = 1, nextReturnId = 1;
let nextBatchId = 1, nextLogId = 2, nextDowntimeId = 1;
let nextFGReceiptId = 1, nextStatusHistoryId = 2;

// Counters for auto-numbering
const pad = (n, w) => String(n).padStart(w, '0');
const year = () => new Date().getFullYear();
const getNextPlanNumber = () => `PP-${year()}-${pad(nextPlanId, 3)}`;
const getNextOrderNumber = () => `PO-PROD-${year()}-${pad(nextOrderId, 3)}`;
const getNextIssueNumber = () => `ISS-PROD-${year()}-${pad(nextIssueId, 3)}`;
const getNextReturnNumber = () => `RET-PROD-${year()}-${pad(nextReturnId, 3)}`;
const getNextFGReceiptNumber = () => `FGR-${year()}-${pad(nextFGReceiptId, 3)}`;

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

const initProductionTables = async () => {
  try {
    await query('SELECT 1');
    isDbOnline = true;
    console.log('✅ [Production] PostgreSQL ready. Creating Phase 7 tables...');
    // Create tables
    const sql = require('fs').readFileSync(
      require('path').join(__dirname, '../../database/migrations/006_phase7_production.sql'),
      'utf8'
    );
    await query(sql);
    console.log('✅ [Production] Phase 7 tables initialized.');
  } catch (err) {
    isDbOnline = false;
    console.warn('ℹ️ [Production] PostgreSQL offline → in-memory mode. Error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1: PRODUCTION PLANS
// ─────────────────────────────────────────────────────────────────────────────

const getProductionPlans = async ({ status, product_id, page = 1, limit = 50 } = {}) => {
  if (isDbOnline) {
    try {
      let where = 'WHERE 1=1';
      const params = [];
      if (status) { params.push(status); where += ` AND pp.status = $${params.length}`; }
      if (product_id) { params.push(Number(product_id)); where += ` AND pp.product_id = $${params.length}`; }
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      const res = await query(
        `SELECT pp.*, p.name AS product_name, p.sku AS product_sku
         FROM production_plans pp
         LEFT JOIN products p ON pp.product_id = p.id
         ${where} ORDER BY pp.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      return res.rows;
    } catch (e) { console.error('[Production] getProductionPlans DB error:', e.message); }
  }
  let list = [...inMemProductionPlans];
  const prods = (await masterDataModel.getProducts()).items;
  list = list.map(p => ({ ...p, product_name: prods.find(x => x.id === p.product_id)?.name || '', product_sku: prods.find(x => x.id === p.product_id)?.sku || '' }));
  if (status) list = list.filter(p => p.status === status);
  if (product_id) list = list.filter(p => p.product_id === Number(product_id));
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice((page - 1) * limit, page * limit);
};

const getPlanById = async (id) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `SELECT pp.*, p.name AS product_name, p.sku AS product_sku
         FROM production_plans pp LEFT JOIN products p ON pp.product_id = p.id WHERE pp.id = $1`,
        [id]
      );
      return res.rows[0] || null;
    } catch (e) { console.error('[Production] getPlanById DB error:', e.message); }
  }
  return inMemProductionPlans.find(p => p.id === Number(id)) || null;
};

const createProductionPlan = async (data, userId) => {
  const plan_number = getNextPlanNumber();
  if (isDbOnline) {
    try {
      const res = await query(
        `INSERT INTO production_plans (plan_number, plan_date, planned_start_date, planned_end_date,
          sales_order_id, product_id, planned_quantity, supervisor_id, supervisor_name, department, notes, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'DRAFT',$12) RETURNING *`,
        [plan_number, data.plan_date || new Date().toISOString().split('T')[0],
         data.planned_start_date, data.planned_end_date,
         data.sales_order_id || null, data.product_id, data.planned_quantity,
         data.supervisor_id || null, data.supervisor_name || null,
         data.department || 'Production', data.notes || null, userId]
      );
      nextPlanId++;
      return res.rows[0];
    } catch (e) { console.error('[Production] createProductionPlan DB error:', e.message); }
  }
  const plan = {
    id: nextPlanId++, plan_number,
    plan_date: data.plan_date || new Date().toISOString().split('T')[0],
    planned_start_date: data.planned_start_date, planned_end_date: data.planned_end_date,
    sales_order_id: data.sales_order_id || null, product_id: Number(data.product_id),
    planned_quantity: Number(data.planned_quantity),
    supervisor_id: data.supervisor_id || null, supervisor_name: data.supervisor_name || null,
    department: data.department || 'Production', notes: data.notes || null,
    status: 'DRAFT', created_by: userId, created_at: new Date(), updated_at: new Date()
  };
  inMemProductionPlans.push(plan);
  return plan;
};

const updatePlanStatus = async (id, status, userId) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `UPDATE production_plans SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [status, id]
      );
      return res.rows[0] || null;
    } catch (e) { console.error('[Production] updatePlanStatus DB error:', e.message); }
  }
  const plan = inMemProductionPlans.find(p => p.id === Number(id));
  if (!plan) return null;
  plan.status = status; plan.updated_at = new Date();
  return plan;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2: PRODUCTION ORDERS
// ─────────────────────────────────────────────────────────────────────────────

const getProductionOrders = async ({ status, product_id, page = 1, limit = 50 } = {}) => {
  if (isDbOnline) {
    try {
      let where = 'WHERE 1=1';
      const params = [];
      if (status) { params.push(status); where += ` AND po.status = $${params.length}`; }
      if (product_id) { params.push(Number(product_id)); where += ` AND po.product_id = $${params.length}`; }
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      const res = await query(
        `SELECT po.* FROM production_orders po ${where}
         ORDER BY po.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      return res.rows;
    } catch (e) { console.error('[Production] getProductionOrders DB error:', e.message); }
  }
  let list = [...inMemProductionOrders];
  if (status) list = list.filter(o => o.status === status);
  if (product_id) list = list.filter(o => o.product_id === Number(product_id));
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice((page - 1) * limit, page * limit);
};

const getProductionOrderById = async (id) => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT * FROM production_orders WHERE id=$1', [id]);
      return res.rows[0] || null;
    } catch (e) { console.error('[Production] getProductionOrderById DB error:', e.message); }
  }
  return inMemProductionOrders.find(o => o.id === Number(id)) || null;
};

const createProductionOrder = async (data, userId) => {
  // Look up product + BOM info
  const product = await masterDataModel.getProductById(data.product_id);
  if (!product) throw new Error(`Product ID ${data.product_id} not found`);

  const bom = await masterDataModel.getBomById(data.bom_id);
  if (!bom) throw new Error(`BOM ID ${data.bom_id} not found`);

  const order_number = getNextOrderNumber();

  if (isDbOnline) {
    try {
      const res = await query(
        `INSERT INTO production_orders (order_number, plan_id, sales_order_id, product_id, product_sku,
          product_name, bom_id, bom_version, planned_quantity, planned_start_date, planned_end_date,
          supervisor_id, supervisor_name, priority, notes, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'PLANNED',$16) RETURNING *`,
        [order_number, data.plan_id || null, data.sales_order_id || null,
         data.product_id, product.sku, product.name,
         data.bom_id, bom.bom_version || 'v1.0',
         data.planned_quantity, data.planned_start_date, data.planned_end_date,
         data.supervisor_id || null, data.supervisor_name || null,
         data.priority || 'NORMAL', data.notes || null, userId]
      );
      const order = res.rows[0];
      nextOrderId++;
      // Create BOM snapshot
      await _createBOMSnapshot(order.id, bom, Number(data.planned_quantity));
      // Log creation
      await _addLog(order.id, 'ORDER_CREATED', `Production order ${order_number} created for ${product.name} x ${data.planned_quantity}`, null, 'PLANNED', userId);
      return order;
    } catch (e) { console.error('[Production] createProductionOrder DB error:', e.message); throw e; }
  }

  const order = {
    id: nextOrderId++, order_number,
    plan_id: data.plan_id || null, sales_order_id: data.sales_order_id || null,
    product_id: Number(data.product_id), product_sku: product.sku, product_name: product.name,
    bom_id: Number(data.bom_id), bom_version: bom.bom_version || 'v1.0',
    planned_quantity: Number(data.planned_quantity),
    actual_quantity: 0, accepted_quantity: 0, rejected_quantity: 0, wastage_quantity: 0,
    planned_start_date: data.planned_start_date, planned_end_date: data.planned_end_date,
    actual_start_time: null, actual_end_time: null,
    supervisor_id: data.supervisor_id || null, supervisor_name: data.supervisor_name || null,
    status: 'PLANNED', priority: data.priority || 'NORMAL',
    materials_issued: false, fg_receipt_posted: false,
    notes: data.notes || null, created_by: userId,
    created_at: new Date(), updated_at: new Date()
  };
  inMemProductionOrders.push(order);
  await _createBOMSnapshot(order.id, bom, Number(data.planned_quantity));
  await _addLog(order.id, 'ORDER_CREATED', `Production order ${order_number} created`, null, 'PLANNED', userId);
  return order;
};

const updateProductionOrderStatus = async (id, newStatus, reason, userId, userName) => {
  const order = await getProductionOrderById(id);
  if (!order) throw new Error(`Production order ${id} not found`);

  const oldStatus = order.status;
  const validTransitions = {
    PLANNED: ['APPROVED', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
    ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
    COMPLETED: ['CLOSED'],
    CLOSED: [],
    CANCELLED: []
  };
  if (!validTransitions[oldStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition: ${oldStatus} → ${newStatus}`);
  }

  const updates = { status: newStatus, updated_at: new Date() };
  if (newStatus === 'IN_PROGRESS' && !order.actual_start_time) {
    updates.actual_start_time = new Date();
  }
  if (newStatus === 'COMPLETED' && !order.actual_end_time) {
    updates.actual_end_time = new Date();
  }

  if (isDbOnline) {
    try {
      const setClauses = Object.keys(updates).map((k, i) => `${k}=$${i + 2}`).join(', ');
      await query(
        `UPDATE production_orders SET ${setClauses} WHERE id=$1`,
        [id, ...Object.values(updates)]
      );
      await query(
        `INSERT INTO production_status_history (production_order_id, old_status, new_status, changed_by, changed_by_name, reason)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, oldStatus, newStatus, userId, userName || null, reason || null]
      );
    } catch (e) { console.error('[Production] updateStatus DB error:', e.message); throw e; }
  } else {
    const idx = inMemProductionOrders.findIndex(o => o.id === Number(id));
    Object.assign(inMemProductionOrders[idx], updates);
    inMemStatusHistory.push({
      id: nextStatusHistoryId++, production_order_id: Number(id),
      old_status: oldStatus, new_status: newStatus,
      changed_by: userId, changed_by_name: userName || null,
      reason: reason || null, changed_at: new Date()
    });
  }

  await _addLog(Number(id), 'STATUS_CHANGED', `Status changed from ${oldStatus} to ${newStatus}. ${reason || ''}`, oldStatus, newStatus, userId);
  return await getProductionOrderById(id);
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3: BOM MATERIAL CALCULATION (Snapshot)
// ─────────────────────────────────────────────────────────────────────────────

const _createBOMSnapshot = async (orderId, bom, plannedQty) => {
  if (!bom || !bom.items) return;
  const scale = plannedQty / (bom.batch_output_qty || 100);

  for (const item of bom.items) {
    const rawRequired = item.quantity_required * scale;
    const withWastage = rawRequired * (1 + (item.wastage_percentage || 0) / 100);
    const rounded = Math.round(withWastage * 1000) / 1000;

    // Look up name
    let materialName = item.notes || '';
    let materialCode = '';
    try {
      if (item.material_type === 'RAW_MATERIAL') {
        const rm = await masterDataModel.getRawMaterialById(item.material_id);
        if (rm) { materialName = rm.name; materialCode = rm.code; }
      } else {
        const pm = await masterDataModel.getPackagingMaterialById(item.material_id);
        if (pm) { materialName = pm.name; materialCode = pm.code; }
      }
    } catch (_) {}

    if (isDbOnline) {
      try {
        await query(
          `INSERT INTO production_material_requirements
           (production_order_id, material_type, material_id, material_name, material_code, unit,
            quantity_per_batch, wastage_percentage, required_quantity, bom_item_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [orderId, item.material_type, item.material_id, materialName, materialCode,
           item.unit, item.quantity_required, item.wastage_percentage || 0, rounded, item.id]
        );
      } catch (e) { console.error('[Production] BOM snapshot insert error:', e.message); }
    } else {
      inMemRequirements.push({
        id: nextReqId++, production_order_id: orderId,
        material_type: item.material_type, material_id: item.material_id,
        material_name: materialName, material_code: materialCode, unit: item.unit,
        quantity_per_batch: item.quantity_required, wastage_percentage: item.wastage_percentage || 0,
        required_quantity: rounded, issued_quantity: 0, returned_quantity: 0,
        bom_item_id: item.id, created_at: new Date()
      });
    }
  }
};

const getMaterialRequirements = async (orderId) => {
  if (isDbOnline) {
    try {
      const res = await query(
        'SELECT * FROM production_material_requirements WHERE production_order_id=$1 ORDER BY material_type, id',
        [orderId]
      );
      return res.rows;
    } catch (e) { console.error('[Production] getMaterialRequirements DB error:', e.message); }
  }
  return inMemRequirements.filter(r => r.production_order_id === Number(orderId));
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4: MATERIAL AVAILABILITY CHECK
// ─────────────────────────────────────────────────────────────────────────────

const checkMaterialAvailability = async (orderId) => {
  const requirements = await getMaterialRequirements(orderId);
  const rawMaterials = await inventoryModel.getRawMaterialInventory();
  const packaging = await inventoryModel.getPackagingInventory();

  const results = [];
  for (const req of requirements) {
    let available = 0;
    if (req.material_type === 'RAW_MATERIAL') {
      const inv = rawMaterials.find(r => r.material_id === req.material_id || r.reference_id === req.material_id);
      available = inv ? parseFloat(inv.available_stock || inv.current_stock || 0) : 0;
    } else {
      const inv = packaging.find(p => p.material_id === req.material_id || p.reference_id === req.material_id);
      available = inv ? parseFloat(inv.available_stock || inv.current_stock || 0) : 0;
    }
    const required = parseFloat(req.required_quantity) - parseFloat(req.issued_quantity || 0);
    const shortage = Math.max(0, required - available);
    results.push({
      requirement_id: req.id,
      material_type: req.material_type,
      material_id: req.material_id,
      material_name: req.material_name,
      material_code: req.material_code,
      unit: req.unit,
      required_quantity: parseFloat(req.required_quantity),
      already_issued: parseFloat(req.issued_quantity || 0),
      net_required: Math.max(0, required),
      available_stock: available,
      shortage,
      status: shortage <= 0 ? 'SUFFICIENT' : 'INSUFFICIENT'
    });
  }

  const allSufficient = results.every(r => r.status === 'SUFFICIENT');
  return {
    production_order_id: Number(orderId),
    overall_status: allSufficient ? 'ALL_AVAILABLE' : 'SHORTAGE',
    items: results
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5: MATERIAL ISSUE
// ─────────────────────────────────────────────────────────────────────────────

const getMaterialIssues = async (orderId) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `SELECT mi.*, json_agg(mii.* ORDER BY mii.id) AS items
         FROM material_issues mi
         LEFT JOIN material_issue_items mii ON mii.issue_id = mi.id
         WHERE mi.production_order_id = $1
         GROUP BY mi.id ORDER BY mi.created_at DESC`,
        [orderId]
      );
      return res.rows;
    } catch (e) { console.error('[Production] getMaterialIssues DB error:', e.message); }
  }
  return inMemMaterialIssues
    .filter(i => i.production_order_id === Number(orderId))
    .map(i => ({ ...i, items: inMemIssueItems.filter(it => it.issue_id === i.id) }));
};

const postMaterialIssue = async (data, userId, userName) => {
  const order = await getProductionOrderById(data.production_order_id);
  if (!order) throw new Error('Production order not found');
  if (!['APPROVED', 'IN_PROGRESS'].includes(order.status)) {
    throw new Error('Materials can only be issued for APPROVED or IN_PROGRESS orders');
  }

  const issueNumber = getNextIssueNumber();

  if (isDbOnline) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Create issue header
      const issueRes = await client.query(
        `INSERT INTO material_issues (issue_number, production_order_id, issue_date, issued_by, issued_by_name, received_by, notes, is_posted, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,'POSTED') RETURNING *`,
        [issueNumber, data.production_order_id, data.issue_date || new Date().toISOString().split('T')[0],
         userId, userName, data.received_by || null, data.notes || null]
      );
      const issue = issueRes.rows[0];
      nextIssueId++;

      for (const item of data.items) {
        // Check available stock (prevent negative)
        const avCheck = await client.query(
          `SELECT COALESCE(SUM(quantity), 0) AS bal
           FROM stock_ledger WHERE item_id = $1`,
          [item.inventory_item_id]
        );
        const bal = parseFloat(avCheck.rows[0].bal);
        if (bal < item.issued_quantity) {
          throw new Error(`Insufficient stock for item_id ${item.inventory_item_id}. Available: ${bal}, Requested: ${item.issued_quantity}`);
        }

        // Insert issue item
        await client.query(
          `INSERT INTO material_issue_items (issue_id, requirement_id, material_type, material_id, material_name, batch_number, inventory_batch_id, inventory_item_id, issued_quantity, unit, unit_rate, total_value)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [issue.id, item.requirement_id || null, item.material_type, item.material_id,
           item.material_name, item.batch_number || null, item.inventory_batch_id || null,
           item.inventory_item_id, item.issued_quantity, item.unit, item.unit_rate || 0,
           (item.issued_quantity * (item.unit_rate || 0))]
        );

        // Write stock ledger OUTWARD_PRODUCTION entry
        await client.query(
          `INSERT INTO stock_ledger (transaction_type, item_id, batch_id, location_id, quantity, unit_rate, total_valuation, reference_type, reference_no, remarks, created_by)
           VALUES ('OUTWARD_PRODUCTION',$1,$2,$3,$4,$5,$6,'PRODUCTION_ISSUE',$7,$8,$9)`,
          [item.inventory_item_id, item.inventory_batch_id || null, item.location_id || 1,
           -Math.abs(item.issued_quantity), item.unit_rate || 0,
           -(item.issued_quantity * (item.unit_rate || 0)),
           issueNumber, `Material issue for ${order.order_number}`, userId]
        );

        // Update requirement issued_quantity
        if (item.requirement_id) {
          await client.query(
            `UPDATE production_material_requirements SET issued_quantity = issued_quantity + $1 WHERE id = $2`,
            [item.issued_quantity, item.requirement_id]
          );
        }
      }

      // Mark materials_issued on order
      await client.query(
        `UPDATE production_orders SET materials_issued=TRUE, updated_at=NOW() WHERE id=$1`,
        [data.production_order_id]
      );

      await client.query('COMMIT');
      await _addLog(data.production_order_id, 'MATERIAL_ISSUED', `Issue ${issueNumber} posted`, null, null, userId);
      return issue;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // In-memory mode
  const issue = {
    id: nextIssueId++, issue_number: issueNumber,
    production_order_id: Number(data.production_order_id),
    issue_date: data.issue_date || new Date().toISOString().split('T')[0],
    issued_by: userId, issued_by_name: userName,
    received_by: data.received_by || null, notes: data.notes || null,
    is_posted: true, status: 'POSTED', created_at: new Date(), updated_at: new Date()
  };
  inMemMaterialIssues.push(issue);

  for (const item of data.items) {
    // Check available stock via inventoryModel
    const avail = await inventoryModel.getAvailableStockForItem(item.inventory_item_id);
    if (avail < item.issued_quantity) {
      inMemMaterialIssues.pop();
      throw new Error(`Insufficient stock for item ${item.material_name}. Available: ${avail}, Requested: ${item.issued_quantity}`);
    }

    inMemIssueItems.push({
      id: nextIssueItemId++, issue_id: issue.id,
      requirement_id: item.requirement_id || null,
      material_type: item.material_type, material_id: item.material_id,
      material_name: item.material_name, batch_number: item.batch_number || null,
      inventory_batch_id: item.inventory_batch_id || null, inventory_item_id: item.inventory_item_id,
      issued_quantity: item.issued_quantity, unit: item.unit,
      unit_rate: item.unit_rate || 0, total_value: item.issued_quantity * (item.unit_rate || 0),
      created_at: new Date()
    });

    // Write stock ledger entry
    await inventoryModel.addLedgerEntry({
      transaction_type: 'OUTWARD_PRODUCTION',
      item_id: item.inventory_item_id, batch_id: item.inventory_batch_id || null,
      location_id: item.location_id || 1, quantity: -Math.abs(item.issued_quantity),
      unit_rate: item.unit_rate || 0, reference_type: 'PRODUCTION_ISSUE',
      reference_no: issueNumber, remarks: `Issue for ${order.order_number}`, created_by: userId
    });

    // Update requirement
    const req = inMemRequirements.find(r => r.id === item.requirement_id);
    if (req) req.issued_quantity = (req.issued_quantity || 0) + item.issued_quantity;
  }

  const orderInMem = inMemProductionOrders.find(o => o.id === Number(data.production_order_id));
  if (orderInMem) orderInMem.materials_issued = true;

  await _addLog(data.production_order_id, 'MATERIAL_ISSUED', `Issue ${issueNumber} posted`, null, null, userId);
  return { ...issue, items: inMemIssueItems.filter(i => i.issue_id === issue.id) };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6: MATERIAL RETURN
// ─────────────────────────────────────────────────────────────────────────────

const getMaterialReturns = async (orderId) => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT * FROM material_returns WHERE production_order_id=$1 ORDER BY created_at DESC', [orderId]);
      return res.rows;
    } catch (e) { console.error('[Production] getMaterialReturns DB error:', e.message); }
  }
  return inMemReturns.filter(r => r.production_order_id === Number(orderId));
};

const postMaterialReturn = async (data, userId, userName) => {
  const order = await getProductionOrderById(data.production_order_id);
  if (!order) throw new Error('Production order not found');
  const returnNumber = getNextReturnNumber();
  const returnToStock = !['DAMAGED', 'CONTAMINATED', 'EXPIRED'].includes(data.condition);

  if (isDbOnline) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        `INSERT INTO material_returns (return_number, production_order_id, issue_id, return_date, material_type, material_id, material_name, batch_number, inventory_batch_id, inventory_item_id, returned_quantity, unit, condition, return_reason, returned_by, returned_by_name, return_to_stock, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [returnNumber, data.production_order_id, data.issue_id || null,
         data.return_date || new Date().toISOString().split('T')[0],
         data.material_type, data.material_id, data.material_name,
         data.batch_number || null, data.inventory_batch_id || null, data.inventory_item_id,
         data.returned_quantity, data.unit, data.condition || 'GOOD',
         data.return_reason || null, userId, userName, returnToStock, data.notes || null]
      );
      nextReturnId++;

      if (returnToStock) {
        await client.query(
          `INSERT INTO stock_ledger (transaction_type, item_id, batch_id, location_id, quantity, unit_rate, total_valuation, reference_type, reference_no, remarks, created_by)
           VALUES ('INWARD_PRODUCTION',$1,$2,$3,$4,$5,$6,'PRODUCTION_RETURN',$7,$8,$9)`,
          [data.inventory_item_id, data.inventory_batch_id || null, data.location_id || 1,
           Math.abs(data.returned_quantity), data.unit_rate || 0,
           data.returned_quantity * (data.unit_rate || 0),
           returnNumber, `Material return for ${order.order_number}`, userId]
        );
      }
      await client.query('COMMIT');
      await _addLog(data.production_order_id, 'MATERIAL_RETURNED', `Return ${returnNumber} posted. Return to stock: ${returnToStock}`, null, null, userId);
      return res.rows[0];
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  }

  const ret = {
    id: nextReturnId++, return_number: returnNumber,
    production_order_id: Number(data.production_order_id), issue_id: data.issue_id || null,
    return_date: data.return_date || new Date().toISOString().split('T')[0],
    material_type: data.material_type, material_id: data.material_id, material_name: data.material_name,
    batch_number: data.batch_number || null, inventory_batch_id: data.inventory_batch_id || null,
    inventory_item_id: data.inventory_item_id, returned_quantity: data.returned_quantity,
    unit: data.unit, condition: data.condition || 'GOOD', return_reason: data.return_reason || null,
    returned_by: userId, returned_by_name: userName, return_to_stock: returnToStock,
    notes: data.notes || null, created_at: new Date()
  };
  inMemReturns.push(ret);

  if (returnToStock) {
    await inventoryModel.addLedgerEntry({
      transaction_type: 'INWARD_PRODUCTION',
      item_id: data.inventory_item_id, batch_id: data.inventory_batch_id || null,
      location_id: data.location_id || 1, quantity: Math.abs(data.returned_quantity),
      unit_rate: data.unit_rate || 0, reference_type: 'PRODUCTION_RETURN',
      reference_no: returnNumber, remarks: `Return for ${order.order_number}`, created_by: userId
    });
  }
  await _addLog(data.production_order_id, 'MATERIAL_RETURNED', `Return ${returnNumber}. Return to stock: ${returnToStock}`, null, null, userId);
  return ret;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7: PRODUCTION EXECUTION
// ─────────────────────────────────────────────────────────────────────────────

const updateProductionExecution = async (id, data, userId, userName) => {
  const order = await getProductionOrderById(id);
  if (!order) throw new Error('Production order not found');

  if (data.actual_quantity !== undefined && data.rejected_quantity !== undefined) {
    if (Number(data.rejected_quantity) > Number(data.actual_quantity)) {
      throw new Error('Rejected quantity cannot exceed actual produced quantity');
    }
  }

  if (isDbOnline) {
    try {
      const fields = [];
      const vals = [id];
      const pushField = (col, val) => { vals.push(val); fields.push(`${col}=$${vals.length}`); };

      if (data.actual_quantity !== undefined) pushField('actual_quantity', data.actual_quantity);
      if (data.accepted_quantity !== undefined) pushField('accepted_quantity', data.accepted_quantity);
      if (data.rejected_quantity !== undefined) pushField('rejected_quantity', data.rejected_quantity);
      if (data.wastage_quantity !== undefined) pushField('wastage_quantity', data.wastage_quantity);
      if (data.actual_start_time !== undefined) pushField('actual_start_time', data.actual_start_time);
      if (data.actual_end_time !== undefined) pushField('actual_end_time', data.actual_end_time);
      if (data.supervisor_name !== undefined) pushField('supervisor_name', data.supervisor_name);
      if (data.notes !== undefined) pushField('notes', data.notes);
      pushField('updated_at', new Date());

      if (fields.length > 1) {
        await query(`UPDATE production_orders SET ${fields.join(',')} WHERE id=$1`, vals);
      }
    } catch (e) { console.error('[Production] updateProductionExecution DB error:', e.message); throw e; }
  } else {
    const idx = inMemProductionOrders.findIndex(o => o.id === Number(id));
    if (idx !== -1) {
      ['actual_quantity','accepted_quantity','rejected_quantity','wastage_quantity',
       'actual_start_time','actual_end_time','supervisor_name','notes'].forEach(k => {
        if (data[k] !== undefined) inMemProductionOrders[idx][k] = data[k];
      });
      inMemProductionOrders[idx].updated_at = new Date();
    }
  }

  await _addLog(Number(id), 'EXECUTION_UPDATED', `Production execution data updated`, null, null, userId);
  return await getProductionOrderById(id);
};

// Record downtime
const recordDowntime = async (orderId, data, userId, userName) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `INSERT INTO production_downtime (production_order_id, downtime_start, downtime_end, duration_minutes, reason_category, reason_description, machine_or_line, reported_by, reported_by_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [orderId, data.downtime_start, data.downtime_end || null, data.duration_minutes || null,
         data.reason_category || 'MACHINE', data.reason_description || null,
         data.machine_or_line || null, userId, userName]
      );
      return res.rows[0];
    } catch (e) { console.error('[Production] recordDowntime DB error:', e.message); }
  }
  const dt = {
    id: nextDowntimeId++, production_order_id: Number(orderId),
    downtime_start: data.downtime_start, downtime_end: data.downtime_end || null,
    duration_minutes: data.duration_minutes || null, reason_category: data.reason_category || 'MACHINE',
    reason_description: data.reason_description || null, machine_or_line: data.machine_or_line || null,
    reported_by: userId, reported_by_name: userName, created_at: new Date()
  };
  inMemDowntime.push(dt);
  return dt;
};

const getDowntime = async (orderId) => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT * FROM production_downtime WHERE production_order_id=$1 ORDER BY downtime_start DESC', [orderId]);
      return res.rows;
    } catch (e) { console.error('[Production] getDowntime DB error:', e.message); }
  }
  return inMemDowntime.filter(d => d.production_order_id === Number(orderId));
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 8: PRODUCTION BATCH MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const generateBatchNumber = (productSku, mfgDate) => {
  const d = new Date(mfgDate || Date.now());
  const yyyymmdd = `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
  const seq = pad(Math.floor(Math.random() * 900) + 100, 3);
  return `PB-${(productSku || 'FG').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6)}-${yyyymmdd}-${seq}`;
};

const createProductionBatch = async (data, userId, userName) => {
  const batchNumber = data.batch_number || generateBatchNumber(data.product_sku, data.mfg_date);

  if (isDbOnline) {
    try {
      const res = await query(
        `INSERT INTO production_batches (batch_number, production_order_id, product_id, product_name, product_sku, mfg_date, expiry_date, produced_quantity, accepted_quantity, rejected_quantity, supervisor_id, supervisor_name, batch_status, qc_remarks)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [batchNumber, data.production_order_id, data.product_id, data.product_name, data.product_sku,
         data.mfg_date, data.expiry_date, data.produced_quantity || 0,
         data.accepted_quantity || 0, data.rejected_quantity || 0,
         data.supervisor_id || userId, data.supervisor_name || userName,
         data.batch_status || 'PENDING_QC', data.qc_remarks || null]
      );
      nextBatchId++;
      return res.rows[0];
    } catch (e) { console.error('[Production] createProductionBatch DB error:', e.message); throw e; }
  }
  const batch = {
    id: nextBatchId++, batch_number: batchNumber,
    production_order_id: Number(data.production_order_id), product_id: Number(data.product_id),
    product_name: data.product_name, product_sku: data.product_sku,
    mfg_date: data.mfg_date, expiry_date: data.expiry_date,
    produced_quantity: data.produced_quantity || 0,
    accepted_quantity: data.accepted_quantity || 0, rejected_quantity: data.rejected_quantity || 0,
    supervisor_id: data.supervisor_id || userId, supervisor_name: data.supervisor_name || userName,
    batch_status: data.batch_status || 'PENDING_QC', qc_remarks: data.qc_remarks || null,
    fg_receipt_id: null, created_at: new Date(), updated_at: new Date()
  };
  inMemBatches.push(batch);
  return batch;
};

const getProductionBatches = async (orderId) => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT * FROM production_batches WHERE production_order_id=$1 ORDER BY created_at DESC', [orderId]);
      return res.rows;
    } catch (e) { console.error('[Production] getProductionBatches DB error:', e.message); }
  }
  return inMemBatches.filter(b => b.production_order_id === Number(orderId));
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 9: FINISHED GOODS RECEIPT
// ─────────────────────────────────────────────────────────────────────────────

const getFGReceipts = async (orderId) => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT * FROM finished_goods_receipts WHERE production_order_id=$1 ORDER BY created_at DESC', [orderId]);
      return res.rows;
    } catch (e) { console.error('[Production] getFGReceipts DB error:', e.message); }
  }
  return inMemFGReceipts.filter(r => r.production_order_id === Number(orderId));
};

const postFGReceipt = async (data, userId, userName) => {
  const order = await getProductionOrderById(data.production_order_id);
  if (!order) throw new Error('Production order not found');
  if (order.fg_receipt_posted) throw new Error('Finished goods receipt already posted for this order (HTTP 409)');
  if (!['COMPLETED', 'IN_PROGRESS'].includes(order.status)) {
    throw new Error('FG receipt can only be posted for IN_PROGRESS or COMPLETED orders');
  }
  if (Number(data.accepted_quantity) < 0) throw new Error('Accepted quantity cannot be negative');

  const receiptNumber = getNextFGReceiptNumber();
  const batchNumber = data.batch_number || generateBatchNumber(data.product_sku || order.product_sku, data.mfg_date);

  if (isDbOnline) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Insert FG receipt record
      const receiptRes = await client.query(
        `INSERT INTO finished_goods_receipts (receipt_number, production_order_id, batch_id, product_id, product_name, product_sku, batch_number, mfg_date, expiry_date, produced_quantity, accepted_quantity, rejected_quantity, warehouse_location_id, warehouse_location_name, is_posted, posted_at, posted_by, posted_by_name, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE,NOW(),$15,$16,$17) RETURNING *`,
        [receiptNumber, data.production_order_id, data.batch_id || null,
         order.product_id, order.product_name, order.product_sku, batchNumber,
         data.mfg_date, data.expiry_date, data.produced_quantity || data.accepted_quantity,
         data.accepted_quantity, data.rejected_quantity || 0,
         data.warehouse_location_id || 4, data.warehouse_location_name || 'Finished Goods Store',
         userId, userName, data.notes || null]
      );
      const receipt = receiptRes.rows[0];
      nextFGReceiptId++;

      // Find or create inventory item for this FG product
      const fgItemRes = await client.query(
        `SELECT id, valuation_rate FROM inventory_items WHERE item_type='FINISHED_GOOD' AND reference_id=$1 LIMIT 1`,
        [order.product_id]
      );
      let fgItemId, valRate;
      if (fgItemRes.rows.length > 0) {
        fgItemId = fgItemRes.rows[0].id;
        valRate = parseFloat(fgItemRes.rows[0].valuation_rate) || 0;
      } else {
        const newItem = await client.query(
          `INSERT INTO inventory_items (item_type, reference_id, item_code, item_name, uom, min_stock_level, reorder_level, valuation_rate)
           VALUES ('FINISHED_GOOD',$1,$2,$3,'PACK',50,150,0) RETURNING id`,
          [order.product_id, `FG-PROD-${order.product_id}`, order.product_name]
        );
        fgItemId = newItem.rows[0].id;
        valRate = 0;
      }

      // Create inventory batch
      const invBatchRes = await client.query(
        `INSERT INTO inventory_batches (batch_number, item_id, location_id, mfg_date, expiry_date, initial_quantity, current_quantity, qc_status, source_production_ref, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$6,'PASS',$7,$8) RETURNING id`,
        [batchNumber, fgItemId, data.warehouse_location_id || 4,
         data.mfg_date, data.expiry_date, data.accepted_quantity,
         order.order_number, `FG batch from ${receiptNumber}`]
      );
      const invBatchId = invBatchRes.rows[0].id;

      // Write stock ledger INWARD_PRODUCTION
      const ledgerRes = await client.query(
        `INSERT INTO stock_ledger (transaction_type, item_id, batch_id, location_id, quantity, unit_rate, total_valuation, reference_type, reference_no, remarks, created_by)
         VALUES ('INWARD_PRODUCTION',$1,$2,$3,$4,$5,$6,'FG_RECEIPT',$7,$8,$9) RETURNING id`,
        [fgItemId, invBatchId, data.warehouse_location_id || 4,
         data.accepted_quantity, valRate, data.accepted_quantity * valRate,
         receiptNumber, `FG receipt: ${batchNumber} for ${order.order_number}`, userId]
      );

      // Update stock_ledger_entry_id on receipt
      await client.query(`UPDATE finished_goods_receipts SET stock_ledger_entry_id=$1 WHERE id=$2`, [ledgerRes.rows[0].id, receipt.id]);

      // Mark order fg_receipt_posted
      await client.query(`UPDATE production_orders SET fg_receipt_posted=TRUE, updated_at=NOW() WHERE id=$1`, [data.production_order_id]);

      await client.query('COMMIT');
      await _addLog(data.production_order_id, 'FG_RECEIPT_POSTED', `Receipt ${receiptNumber} posted. Accepted: ${data.accepted_quantity}, Batch: ${batchNumber}`, null, null, userId);
      return receipt;
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  }

  // In-memory mode
  const receipt = {
    id: nextFGReceiptId++, receipt_number: receiptNumber,
    production_order_id: Number(data.production_order_id), batch_id: data.batch_id || null,
    product_id: order.product_id, product_name: order.product_name, product_sku: order.product_sku,
    batch_number: batchNumber, mfg_date: data.mfg_date, expiry_date: data.expiry_date,
    produced_quantity: data.produced_quantity || data.accepted_quantity,
    accepted_quantity: data.accepted_quantity, rejected_quantity: data.rejected_quantity || 0,
    warehouse_location_id: data.warehouse_location_id || 4,
    warehouse_location_name: data.warehouse_location_name || 'Finished Goods Store',
    is_posted: true, posted_at: new Date(), posted_by: userId, posted_by_name: userName,
    notes: data.notes || null, created_at: new Date(), updated_at: new Date()
  };
  inMemFGReceipts.push(receipt);

  // Add to inventory via inventoryModel
  await inventoryModel.recordProductionFGInward({
    product_id: order.product_id, product_name: order.product_name,
    batch_number: batchNumber, mfg_date: data.mfg_date, expiry_date: data.expiry_date,
    quantity: data.accepted_quantity, location_id: data.warehouse_location_id || 4,
    production_ref: order.order_number
  });

  // Mark order
  const orderInMem = inMemProductionOrders.find(o => o.id === Number(data.production_order_id));
  if (orderInMem) orderInMem.fg_receipt_posted = true;

  await _addLog(data.production_order_id, 'FG_RECEIPT_POSTED', `Receipt ${receiptNumber} posted`, null, null, userId);
  return receipt;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 10: PRODUCTION DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const getProductionDashboard = async () => {
  if (isDbOnline) {
    try {
      const [statusCounts, quantities, delayed, recent] = await Promise.all([
        query(`SELECT status, COUNT(*) AS count FROM production_orders GROUP BY status`),
        query(`SELECT SUM(actual_quantity) AS total_produced, SUM(accepted_quantity) AS total_accepted, SUM(rejected_quantity) AS total_rejected FROM production_orders WHERE status NOT IN ('CANCELLED')`),
        query(`SELECT COUNT(*) AS delayed FROM production_orders WHERE status IN ('PLANNED','APPROVED','IN_PROGRESS') AND planned_end_date < CURRENT_DATE`),
        query(`SELECT po.order_number, po.product_name, po.status, po.planned_quantity, po.actual_quantity, po.updated_at FROM production_orders po ORDER BY po.updated_at DESC LIMIT 10`)
      ]);

      const statusMap = {};
      (statusCounts.rows || []).forEach(r => { statusMap[r.status] = parseInt(r.count); });

      return {
        total_orders: Object.values(statusMap).reduce((a, b) => a + b, 0),
        planned: statusMap['PLANNED'] || 0,
        approved: statusMap['APPROVED'] || 0,
        in_progress: statusMap['IN_PROGRESS'] || 0,
        on_hold: statusMap['ON_HOLD'] || 0,
        completed: statusMap['COMPLETED'] || 0,
        closed: statusMap['CLOSED'] || 0,
        cancelled: statusMap['CANCELLED'] || 0,
        delayed: parseInt(delayed.rows[0]?.delayed || 0),
        total_produced: parseFloat(quantities.rows[0]?.total_produced || 0),
        total_accepted: parseFloat(quantities.rows[0]?.total_accepted || 0),
        total_rejected: parseFloat(quantities.rows[0]?.total_rejected || 0),
        recent_activities: recent.rows || []
      };
    } catch (e) { console.error('[Production] getProductionDashboard DB error:', e.message); }
  }

  // In-memory
  const all = inMemProductionOrders;
  const statusMap = {};
  all.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
  const today = new Date().toISOString().split('T')[0];
  const delayed = all.filter(o => ['PLANNED','APPROVED','IN_PROGRESS'].includes(o.status) && o.planned_end_date < today).length;

  return {
    total_orders: all.length,
    planned: statusMap['PLANNED'] || 0,
    approved: statusMap['APPROVED'] || 0,
    in_progress: statusMap['IN_PROGRESS'] || 0,
    on_hold: statusMap['ON_HOLD'] || 0,
    completed: statusMap['COMPLETED'] || 0,
    closed: statusMap['CLOSED'] || 0,
    cancelled: statusMap['CANCELLED'] || 0,
    delayed,
    total_produced: all.reduce((s, o) => s + (o.actual_quantity || 0), 0),
    total_accepted: all.reduce((s, o) => s + (o.accepted_quantity || 0), 0),
    total_rejected: all.reduce((s, o) => s + (o.rejected_quantity || 0), 0),
    recent_activities: [...all].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 10)
      .map(o => ({ order_number: o.order_number, product_name: o.product_name, status: o.status, planned_quantity: o.planned_quantity, actual_quantity: o.actual_quantity, updated_at: o.updated_at }))
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 11: PRODUCTION REPORTS
// ─────────────────────────────────────────────────────────────────────────────

const getProductionReport = async (type, filters = {}) => {
  const { from_date, to_date, product_id } = filters;

  const matchOrder = (o) => {
    if (from_date && o.created_at < new Date(from_date)) return false;
    if (to_date && o.created_at > new Date(to_date + 'T23:59:59')) return false;
    if (product_id && o.product_id !== Number(product_id)) return false;
    return true;
  };

  if (isDbOnline) {
    try {
      let sql, params = [];
      const dateFilter = (col) => {
        let w = '';
        if (from_date) { params.push(from_date); w += ` AND ${col}::date >= $${params.length}`; }
        if (to_date) { params.push(to_date); w += ` AND ${col}::date <= $${params.length}`; }
        return w;
      };
      const prodFilter = (col = 'po.product_id') => {
        if (product_id) { params.push(product_id); return ` AND ${col} = $${params.length}`; }
        return '';
      };

      switch (type) {
        case 'daily':
          sql = `SELECT DATE(created_at) AS date, COUNT(*) AS orders, SUM(planned_quantity) AS planned, SUM(actual_quantity) AS produced, SUM(accepted_quantity) AS accepted, SUM(rejected_quantity) AS rejected FROM production_orders WHERE 1=1 ${dateFilter('created_at')} GROUP BY DATE(created_at) ORDER BY date DESC`;
          break;
        case 'monthly':
          sql = `SELECT TO_CHAR(created_at,'YYYY-MM') AS month, COUNT(*) AS orders, SUM(planned_quantity) AS planned, SUM(actual_quantity) AS produced FROM production_orders WHERE 1=1 ${dateFilter('created_at')} GROUP BY TO_CHAR(created_at,'YYYY-MM') ORDER BY month DESC`;
          break;
        case 'product_wise':
          sql = `SELECT product_name, product_sku, COUNT(*) AS orders, SUM(planned_quantity) AS planned, SUM(actual_quantity) AS produced, SUM(accepted_quantity) AS accepted, SUM(rejected_quantity) AS rejected FROM production_orders WHERE 1=1 ${dateFilter('created_at')} ${prodFilter()} GROUP BY product_name, product_sku ORDER BY produced DESC NULLS LAST`;
          break;
        case 'batch_wise':
          sql = `SELECT pb.batch_number, pb.product_name, pb.mfg_date, pb.expiry_date, pb.produced_quantity, pb.accepted_quantity, pb.rejected_quantity, pb.batch_status, po.order_number FROM production_batches pb JOIN production_orders po ON pb.production_order_id=po.id WHERE 1=1 ${dateFilter('pb.mfg_date')} ORDER BY pb.created_at DESC`;
          break;
        case 'raw_material_consumption':
          sql = `SELECT mii.material_name, mii.material_type, SUM(mii.issued_quantity) AS total_issued, mii.unit, SUM(mii.total_value) AS total_value FROM material_issue_items mii JOIN material_issues mi ON mii.issue_id=mi.id WHERE 1=1 ${dateFilter('mi.issue_date')} AND mii.material_type='RAW_MATERIAL' GROUP BY mii.material_name, mii.material_type, mii.unit ORDER BY total_issued DESC`;
          break;
        case 'packaging_consumption':
          sql = `SELECT mii.material_name, SUM(mii.issued_quantity) AS total_issued, mii.unit FROM material_issue_items mii JOIN material_issues mi ON mii.issue_id=mi.id WHERE 1=1 ${dateFilter('mi.issue_date')} AND mii.material_type='PACKAGING' GROUP BY mii.material_name, mii.unit ORDER BY total_issued DESC`;
          break;
        case 'wastage':
          sql = `SELECT order_number, product_name, planned_quantity, actual_quantity, wastage_quantity, ROUND(wastage_quantity/NULLIF(actual_quantity,0)*100,2) AS wastage_pct FROM production_orders WHERE wastage_quantity > 0 ${dateFilter('created_at')} ORDER BY wastage_pct DESC NULLS LAST`;
          break;
        case 'rejection':
          sql = `SELECT order_number, product_name, actual_quantity, rejected_quantity, ROUND(rejected_quantity/NULLIF(actual_quantity,0)*100,2) AS rejection_pct FROM production_orders WHERE rejected_quantity > 0 ${dateFilter('created_at')} ORDER BY rejection_pct DESC NULLS LAST`;
          break;
        case 'downtime':
          sql = `SELECT pd.reason_category, pd.reason_description, pd.machine_or_line, pd.duration_minutes, po.order_number, pd.downtime_start FROM production_downtime pd JOIN production_orders po ON pd.production_order_id=po.id WHERE 1=1 ${dateFilter('pd.downtime_start')} ORDER BY pd.downtime_start DESC`;
          break;
        case 'completion':
          sql = `SELECT order_number, product_name, planned_quantity, actual_quantity, accepted_quantity, planned_start_date, planned_end_date, actual_start_time, actual_end_time, status FROM production_orders WHERE status IN ('COMPLETED','CLOSED') ${dateFilter('created_at')} ${prodFilter()} ORDER BY actual_end_time DESC NULLS LAST`;
          break;
        default:
          sql = `SELECT * FROM production_orders WHERE 1=1 ${dateFilter('created_at')} ORDER BY created_at DESC LIMIT 100`;
      }

      const res = await query(sql, params);
      return { type, filters, count: res.rows.length, data: res.rows };
    } catch (e) { console.error('[Production] getProductionReport DB error:', e.message); }
  }

  // In-memory fallback
  const orders = inMemProductionOrders.filter(matchOrder);
  switch (type) {
    case 'daily': {
      const byDate = {};
      orders.forEach(o => { const d = o.created_at.toISOString().split('T')[0]; byDate[d] = byDate[d] || { date: d, orders: 0, planned: 0, produced: 0, accepted: 0, rejected: 0 }; byDate[d].orders++; byDate[d].planned += o.planned_quantity; byDate[d].produced += o.actual_quantity || 0; byDate[d].accepted += o.accepted_quantity || 0; byDate[d].rejected += o.rejected_quantity || 0; });
      return { type, data: Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)) };
    }
    case 'product_wise': {
      const byProd = {};
      orders.forEach(o => { byProd[o.product_name] = byProd[o.product_name] || { product_name: o.product_name, product_sku: o.product_sku, orders: 0, planned: 0, produced: 0, accepted: 0, rejected: 0 }; byProd[o.product_name].orders++; byProd[o.product_name].planned += o.planned_quantity; byProd[o.product_name].produced += o.actual_quantity || 0; byProd[o.product_name].accepted += o.accepted_quantity || 0; byProd[o.product_name].rejected += o.rejected_quantity || 0; });
      return { type, data: Object.values(byProd) };
    }
    case 'batch_wise':
      return { type, data: inMemBatches };
    case 'downtime':
      return { type, data: inMemDowntime };
    default:
      return { type, data: orders };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION LOGS (internal helper)
// ─────────────────────────────────────────────────────────────────────────────

const _addLog = async (orderId, logType, message, oldVal, newVal, userId) => {
  if (isDbOnline) {
    try {
      await query(
        `INSERT INTO production_logs (production_order_id, log_type, log_message, old_value, new_value, logged_by) VALUES ($1,$2,$3,$4,$5,$6)`,
        [orderId, logType, message, oldVal || null, newVal || null, userId]
      );
    } catch (_) {}
    return;
  }
  inMemLogs.push({
    id: nextLogId++, production_order_id: Number(orderId),
    log_type: logType, log_message: message, old_value: oldVal || null,
    new_value: newVal || null, logged_by: userId, created_at: new Date()
  });
};

const getProductionLogs = async (orderId) => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT * FROM production_logs WHERE production_order_id=$1 ORDER BY created_at DESC', [orderId]);
      return res.rows;
    } catch (e) { console.error('[Production] getProductionLogs DB error:', e.message); }
  }
  return inMemLogs.filter(l => l.production_order_id === Number(orderId));
};

const getStatusHistory = async (orderId) => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT * FROM production_status_history WHERE production_order_id=$1 ORDER BY changed_at DESC', [orderId]);
      return res.rows;
    } catch (e) { console.error('[Production] getStatusHistory DB error:', e.message); }
  }
  return inMemStatusHistory.filter(s => s.production_order_id === Number(orderId));
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Expose getIsDbOnline for tests
// ─────────────────────────────────────────────────────────────────────────────
const getIsDbOnline = () => isDbOnline;

module.exports = {
  initProductionTables,
  // Plans
  getProductionPlans, getPlanById, createProductionPlan, updatePlanStatus,
  // Orders
  getProductionOrders, getProductionOrderById, createProductionOrder, updateProductionOrderStatus,
  // Materials
  getMaterialRequirements, checkMaterialAvailability,
  // Issues
  getMaterialIssues, postMaterialIssue,
  // Returns
  getMaterialReturns, postMaterialReturn,
  // Execution
  updateProductionExecution, recordDowntime, getDowntime,
  // Batches
  createProductionBatch, getProductionBatches, generateBatchNumber,
  // FG Receipt
  postFGReceipt, getFGReceipts,
  // Dashboard & Reports
  getProductionDashboard, getProductionReport,
  // Logs
  getProductionLogs, getStatusHistory,
  getIsDbOnline,
  // Internal
  _inMemProductionOrders: inMemProductionOrders,
  _inMemRequirements: inMemRequirements,
};
