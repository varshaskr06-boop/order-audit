/**
 * ============================================================================
 * Quality Control Management System Model (Phase 8)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 *
 * Dual-mode: PostgreSQL when available, in-memory fallback for offline/testing.
 * Integrates with:
 * - Phase 3 (Raw Materials, Packaging, Products)
 * - Phase 5 (GRNs & Suppliers)
 * - Phase 6 (Inventory Batches & Central Stock Ledger)
 * - Phase 7 (Production Orders & Production Batches)
 * ============================================================================
 */

const { query, getClient } = require('../config/db');
const inventoryModel = require('./inventoryModel');
const productionModel = require('./productionModel');

let isDbOnline = false;

const getDateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY STORAGE SEED DATA (For Offline & Automated Testing)
// ─────────────────────────────────────────────────────────────────────────────

let inMemStandards = [
  {
    id: 1, standard_code: 'STD-RM-RICE-01', standard_name: 'Raw Material Spec: Ponni Boiled Rice',
    target_type: 'RAW_MATERIAL', target_id: 1, target_name: 'Ponni Boiled Rice', standard_version: 'v1.0',
    description: 'FSSAI standards for moisture, broken grain percentage, and organoleptic properties',
    effective_date: '2026-01-01', is_active: true, created_by: 1, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01')
  },
  {
    id: 2, standard_code: 'STD-PKG-POUCH-01', standard_name: 'Packaging Spec: 1 KG Multilayer Pouch',
    target_type: 'PACKAGING', target_id: 1, target_name: '1 KG Multilayer Fresh Batter Pouch (Printed)', standard_version: 'v1.0',
    description: 'Tensile barrier thickness, optical barcode print readability, and heat sealing integrity',
    effective_date: '2026-01-01', is_active: true, created_by: 1, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01')
  },
  {
    id: 3, standard_code: 'STD-FG-BATTER-01', standard_name: 'Finished Good Spec: Fresh Idli & Dosa Batter',
    target_type: 'FINISHED_GOOD', target_id: 1, target_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', standard_version: 'v1.0',
    description: 'Post-fermentation pH, viscosity index, absence of coliforms, airtight nitrogen seal',
    effective_date: '2026-01-01', is_active: true, created_by: 1, created_at: new Date('2026-01-01'), updated_at: new Date('2026-01-01')
  }
];

let inMemParameters = [
  // Ponni Rice Specs
  { id: 1, standard_id: 1, parameter_name: 'Moisture Content', parameter_type: 'NUMERIC', uom: '%', min_value: 10.0, max_value: 14.0, target_value: 12.0, acceptable_text_values: null, stage: 'INCOMING', is_mandatory: true, sort_order: 1 },
  { id: 2, standard_id: 1, parameter_name: 'Foreign Matter / Stones', parameter_type: 'NUMERIC', uom: '%', min_value: 0.0, max_value: 0.5, target_value: 0.0, acceptable_text_values: null, stage: 'INCOMING', is_mandatory: true, sort_order: 2 },
  { id: 3, standard_id: 1, parameter_name: 'Odour / Smell', parameter_type: 'TEXT', uom: 'Descriptive', min_value: null, max_value: null, target_value: null, acceptable_text_values: 'Fresh,Normal,Clean,No Musty Odour', stage: 'INCOMING', is_mandatory: true, sort_order: 3 },
  { id: 4, standard_id: 1, parameter_name: 'Infestation / Insects', parameter_type: 'TEXT', uom: 'Visual', min_value: null, max_value: null, target_value: null, acceptable_text_values: 'Nil,Absent,None', stage: 'INCOMING', is_mandatory: true, sort_order: 4 },

  // Packaging Specs
  { id: 5, standard_id: 2, parameter_name: 'Film Thickness', parameter_type: 'NUMERIC', uom: 'Microns', min_value: 80.0, max_value: 105.0, target_value: 90.0, acceptable_text_values: null, stage: 'INCOMING', is_mandatory: true, sort_order: 1 },
  { id: 6, standard_id: 2, parameter_name: 'Sealing Integrity & Burst Strength', parameter_type: 'TEXT', uom: 'Leak Test', min_value: null, max_value: null, target_value: null, acceptable_text_values: 'Pass,No Leakage,Strong', stage: 'INCOMING', is_mandatory: true, sort_order: 2 },
  { id: 7, standard_id: 2, parameter_name: 'Print & Barcode Alignment', parameter_type: 'TEXT', uom: 'Visual', min_value: null, max_value: null, target_value: null, acceptable_text_values: 'Sharp,Clear,Accurate', stage: 'INCOMING', is_mandatory: true, sort_order: 3 },

  // Finished Goods Specs
  { id: 8, standard_id: 3, parameter_name: 'Fermentation pH Acidity', parameter_type: 'NUMERIC', uom: 'pH', min_value: 4.0, max_value: 4.8, target_value: 4.3, acceptable_text_values: null, stage: 'FINAL', is_mandatory: true, sort_order: 1 },
  { id: 9, standard_id: 3, parameter_name: 'Apparent Viscosity', parameter_type: 'NUMERIC', uom: 'cP', min_value: 3500, max_value: 5500, target_value: 4500, acceptable_text_values: null, stage: 'FINAL', is_mandatory: true, sort_order: 2 },
  { id: 10, standard_id: 3, parameter_name: 'Package Net Weight', parameter_type: 'NUMERIC', uom: 'g', min_value: 1000, max_value: 1030, target_value: 1015, acceptable_text_values: null, stage: 'FINAL', is_mandatory: true, sort_order: 3 },
  { id: 11, standard_id: 3, parameter_name: 'Sensory Taste & Texture', parameter_type: 'TEXT', uom: 'Organoleptic', min_value: null, max_value: null, target_value: null, acceptable_text_values: 'Pleasant,Traditional Sour,Smooth Stone Ground', stage: 'FINAL', is_mandatory: true, sort_order: 4 }
];

let inMemInspections = [
  {
    id: 1, inspection_number: 'QC-INS-2026-001', inspection_type: 'RAW_MATERIAL', stage: 'INCOMING',
    standard_id: 1, grn_id: 1, supplier_id: 1, supplier_name: 'Kaveri Delta Agro Millers',
    production_order_id: null, production_order_number: null, production_batch_id: null, inventory_batch_id: 1,
    item_type: 'RAW_MATERIAL', item_id: 1, item_name: 'Ponni Boiled Rice', item_code: 'RM-RICE-001',
    batch_number: 'RM-RICE-2026-B01', received_quantity: 500, inspected_quantity: 25, accepted_quantity: 500, rejected_quantity: 0,
    uom: 'KG', inspection_date: getDateOffset(-28), inspector_id: 1, inspector_name: 'QC Manager Raman',
    status: 'PASSED', overall_result: 'PASS', remarks: 'Moisture 11.2%, excellent clean grade A lot.',
    inventory_updated: true, created_by: 1, created_at: new Date(Date.now() - 28 * 86400000), updated_at: new Date()
  },
  {
    id: 2, inspection_number: 'QC-INS-2026-002', inspection_type: 'FINISHED_GOOD', stage: 'FINAL',
    standard_id: 3, grn_id: null, supplier_id: null, supplier_name: null,
    production_order_id: 1, production_order_number: 'PRD-2026-001', production_batch_id: 1, inventory_batch_id: 6,
    item_type: 'PRODUCT', item_id: 1, item_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', item_code: 'FG-BAT-1KG',
    batch_number: 'FG-BAT-260320-A', received_quantity: 200, inspected_quantity: 10, accepted_quantity: 200, rejected_quantity: 0,
    uom: 'PKT', inspection_date: getDateOffset(-2), inspector_id: 1, inspector_name: 'QC Manager Raman',
    status: 'PASSED', overall_result: 'PASS', remarks: 'Airtight packaging and laboratory test parameters cleared.',
    inventory_updated: true, created_by: 1, created_at: new Date(Date.now() - 2 * 86400000), updated_at: new Date()
  },
  {
    id: 3, inspection_number: 'QC-INS-2026-003', inspection_type: 'FINISHED_GOOD', stage: 'FINAL',
    standard_id: 3, grn_id: null, supplier_id: null, supplier_name: null,
    production_order_id: 2, production_order_number: 'PRD-2026-002', production_batch_id: 2, inventory_batch_id: 7,
    item_type: 'PRODUCT', item_id: 2, item_name: 'Traditional Murukku', item_code: 'FG-MUR-200G',
    batch_number: 'FG-MUR-260321-B', received_quantity: 300, inspected_quantity: 15, accepted_quantity: 300, rejected_quantity: 0,
    uom: 'PKT', inspection_date: getDateOffset(-1), inspector_id: 1, inspector_name: 'QC Manager Raman',
    status: 'PASSED', overall_result: 'PASS', remarks: 'Crispness and moisture within specifications.',
    inventory_updated: true, created_by: 1, created_at: new Date(Date.now() - 1 * 86400000), updated_at: new Date()
  },
  {
    id: 4, inspection_number: 'QC-INS-2026-004', inspection_type: 'FINISHED_GOOD', stage: 'FINAL',
    standard_id: 3, grn_id: null, supplier_id: null, supplier_name: null,
    production_order_id: 1, production_order_number: 'PRD-2026-001', production_batch_id: 1, inventory_batch_id: 8,
    item_type: 'PRODUCT', item_id: 1, item_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', item_code: 'FG-BAT-1KG',
    batch_number: 'FG-BAT-EXPIRED-01', received_quantity: 80, inspected_quantity: 5, accepted_quantity: 80, rejected_quantity: 0,
    uom: 'PKT', inspection_date: getDateOffset(-60), inspector_id: 1, inspector_name: 'QC Manager Raman',
    status: 'PASSED', overall_result: 'PASS', remarks: 'Historical batch that was passed earlier but now expired.',
    inventory_updated: true, created_by: 1, created_at: new Date(Date.now() - 60 * 86400000), updated_at: new Date()
  },
  {
    id: 5, inspection_number: 'QC-INS-2026-005', inspection_type: 'FINISHED_GOOD', stage: 'FINAL',
    standard_id: 3, grn_id: null, supplier_id: null, supplier_name: null,
    production_order_id: 1, production_order_number: 'PRD-2026-001', production_batch_id: 1, inventory_batch_id: 9,
    item_type: 'PRODUCT', item_id: 1, item_name: 'Sri Meenakshi Fresh Idli & Dosa Batter (1 KG)', item_code: 'FG-BAT-1KG',
    batch_number: 'FG-BAT-FAILED-01', received_quantity: 50, inspected_quantity: 10, accepted_quantity: 0, rejected_quantity: 50,
    uom: 'PKT', inspection_date: getDateOffset(-1), inspector_id: 1, inspector_name: 'QC Manager Raman',
    status: 'REJECTED', overall_result: 'REJECT', remarks: 'High acidity and packaging seal leakage detected.',
    inventory_updated: true, created_by: 1, created_at: new Date(Date.now() - 1 * 86400000), updated_at: new Date()
  }
];

let inMemResults = [
  { id: 1, inspection_id: 1, parameter_id: 1, parameter_name: 'Moisture Content', measured_numeric_value: 11.2, measured_text_value: null, min_limit: 10.0, max_limit: 14.0, target_limit: 12.0, uom: '%', is_conforming: true, flagged_out_of_range: false, remarks: 'Within ideal tolerance' },
  { id: 2, inspection_id: 1, parameter_id: 2, parameter_name: 'Foreign Matter / Stones', measured_numeric_value: 0.1, measured_text_value: null, min_limit: 0.0, max_limit: 0.5, target_limit: 0.0, uom: '%', is_conforming: true, flagged_out_of_range: false, remarks: 'Destoner cleaned lot' },
  { id: 3, inspection_id: 1, parameter_id: 3, parameter_name: 'Odour / Smell', measured_numeric_value: null, measured_text_value: 'Clean', min_limit: null, max_limit: null, target_limit: null, uom: 'Descriptive', is_conforming: true, flagged_out_of_range: false, remarks: 'Fresh rice aroma' },
  { id: 4, inspection_id: 1, parameter_id: 4, parameter_name: 'Infestation / Insects', measured_numeric_value: null, measured_text_value: 'Nil', min_limit: null, max_limit: null, target_limit: null, uom: 'Visual', is_conforming: true, flagged_out_of_range: false, remarks: 'Zero weevil traces' }
];

let inMemDefects = [];
let inMemIncidents = [];
let inMemCapas = [];
let inMemCapaVerifications = [];
let inMemAttachments = [];
let inMemStatusHistory = [
  { id: 1, entity_type: 'INSPECTION', entity_id: 1, old_status: 'PENDING', new_status: 'PASSED', changed_by: 1, changed_by_name: 'QC Manager Raman', reason: 'Laboratory test parameters cleared', changed_at: new Date(Date.now() - 28 * 86400000) }
];

let nextStandardId = 4, nextParamId = 12, nextInspectionId = 2, nextResultId = 5;
let nextDefectId = 1, nextIncidentId = 1, nextCapaId = 1, nextVerifId = 1;
let nextAttachId = 1, nextStatusHistoryId = 2;

const pad = (n, w) => String(n).padStart(w, '0');
const year = () => new Date().getFullYear();
const getNextStandardCode = (type) => `STD-${(type || 'GEN').slice(0, 3).toUpperCase()}-${year()}-${pad(nextStandardId, 3)}`;
const getNextInspectionNumber = () => `QC-INS-${year()}-${pad(nextInspectionId, 3)}`;
const getNextDefectNumber = () => `QC-DEF-${year()}-${pad(nextDefectId, 3)}`;
const getNextIncidentNumber = () => `QC-INC-${year()}-${pad(nextIncidentId, 3)}`;
const getNextCapaNumber = () => `CAPA-${year()}-${pad(nextCapaId, 3)}`;

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

const initQualityTables = async () => {
  try {
    await query('SELECT 1');
    isDbOnline = true;
    console.log('✅ [Quality Control] PostgreSQL ready. Initializing Phase 8 tables...');
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '../../database/migrations/007_phase8_quality.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await query(sql);
      console.log('✅ [Quality Control] Phase 8 tables verified.');
    }
  } catch (err) {
    isDbOnline = false;
    console.warn('ℹ️ [Quality Control] PostgreSQL offline → in-memory mode. Error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3: QUALITY STANDARDS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const getQualityStandards = async (filters = {}) => {
  const { target_type, is_active, search } = filters;
  if (isDbOnline) {
    try {
      let where = 'WHERE 1=1';
      const params = [];
      if (target_type) { params.push(target_type); where += ` AND qs.target_type = $${params.length}`; }
      if (is_active !== undefined) { params.push(is_active === 'true' || is_active === true); where += ` AND qs.is_active = $${params.length}`; }
      if (search) { params.push(`%${search}%`); where += ` AND (qs.standard_name ILIKE $${params.length} OR qs.standard_code ILIKE $${params.length})`; }
      const res = await query(
        `SELECT qs.*, json_agg(ip.* ORDER BY ip.sort_order, ip.id) AS parameters
         FROM quality_standards qs
         LEFT JOIN inspection_parameters ip ON ip.standard_id = qs.id
         ${where} GROUP BY qs.id ORDER BY qs.created_at DESC`,
        params
      );
      return res.rows;
    } catch (e) { console.error('[Quality] getQualityStandards DB error:', e.message); }
  }
  let list = inMemStandards.map(s => ({
    ...s,
    parameters: inMemParameters.filter(p => p.standard_id === s.id).sort((a, b) => a.sort_order - b.sort_order)
  }));
  if (target_type) list = list.filter(s => s.target_type === target_type);
  if (is_active !== undefined) list = list.filter(s => s.is_active === (is_active === 'true' || is_active === true));
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(s => s.standard_name.toLowerCase().includes(q) || s.standard_code.toLowerCase().includes(q));
  }
  return list;
};

const getQualityStandardById = async (id) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `SELECT qs.*, json_agg(ip.* ORDER BY ip.sort_order, ip.id) AS parameters
         FROM quality_standards qs
         LEFT JOIN inspection_parameters ip ON ip.standard_id = qs.id
         WHERE qs.id = $1 GROUP BY qs.id`,
        [id]
      );
      return res.rows[0] || null;
    } catch (e) { console.error('[Quality] getQualityStandardById DB error:', e.message); }
  }
  const s = inMemStandards.find(x => x.id === Number(id));
  if (!s) return null;
  return {
    ...s,
    parameters: inMemParameters.filter(p => p.standard_id === s.id).sort((a, b) => a.sort_order - b.sort_order)
  };
};

const createQualityStandard = async (data, userId) => {
  const standard_code = data.standard_code || getNextStandardCode(data.target_type);
  if (isDbOnline) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        `INSERT INTO quality_standards (standard_code, standard_name, target_type, target_id, target_name, standard_version, description, effective_date, is_active, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [standard_code, data.standard_name, data.target_type, data.target_id, data.target_name || '',
         data.standard_version || 'v1.0', data.description || null, data.effective_date || new Date().toISOString().split('T')[0],
         data.is_active !== false, userId]
      );
      const standard = res.rows[0];
      nextStandardId++;

      const insertedParams = [];
      if (Array.isArray(data.parameters)) {
        for (const [idx, p] of data.parameters.entries()) {
          const pRes = await client.query(
            `INSERT INTO inspection_parameters (standard_id, parameter_name, parameter_type, uom, min_value, max_value, target_value, acceptable_text_values, stage, is_mandatory, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [standard.id, p.parameter_name, p.parameter_type || 'NUMERIC', p.uom || '',
             p.min_value !== undefined ? p.min_value : null, p.max_value !== undefined ? p.max_value : null,
             p.target_value !== undefined ? p.target_value : null, p.acceptable_text_values || null,
             p.stage || 'INCOMING', p.is_mandatory !== false, idx + 1]
          );
          insertedParams.push(pRes.rows[0]);
        }
      }
      await client.query('COMMIT');
      return { ...standard, parameters: insertedParams };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  const standard = {
    id: nextStandardId++, standard_code,
    standard_name: data.standard_name, target_type: data.target_type, target_id: Number(data.target_id),
    target_name: data.target_name || '', standard_version: data.standard_version || 'v1.0',
    description: data.description || null, effective_date: data.effective_date || new Date().toISOString().split('T')[0],
    is_active: data.is_active !== false, created_by: userId, created_at: new Date(), updated_at: new Date()
  };
  inMemStandards.push(standard);

  const insertedParams = [];
  if (Array.isArray(data.parameters)) {
    data.parameters.forEach((p, idx) => {
      const param = {
        id: nextParamId++, standard_id: standard.id,
        parameter_name: p.parameter_name, parameter_type: p.parameter_type || 'NUMERIC',
        uom: p.uom || '', min_value: p.min_value !== undefined ? Number(p.min_value) : null,
        max_value: p.max_value !== undefined ? Number(p.max_value) : null,
        target_value: p.target_value !== undefined ? Number(p.target_value) : null,
        acceptable_text_values: p.acceptable_text_values || null,
        stage: p.stage || 'INCOMING', is_mandatory: p.is_mandatory !== false,
        sort_order: idx + 1, created_at: new Date()
      };
      inMemParameters.push(param);
      insertedParams.push(param);
    });
  }
  return { ...standard, parameters: insertedParams };
};

const toggleStandardStatus = async (id, isActive) => {
  if (isDbOnline) {
    try {
      const res = await query('UPDATE quality_standards SET is_active=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [isActive, id]);
      return res.rows[0] || null;
    } catch (e) { console.error('[Quality] toggleStandardStatus DB error:', e.message); throw e; }
  }
  const s = inMemStandards.find(x => x.id === Number(id));
  if (!s) return null;
  s.is_active = isActive; s.updated_at = new Date();
  return s;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1, 2, 4, 5: QUALITY INSPECTIONS ENGINE
// ─────────────────────────────────────────────────────────────────────────────

const getInspections = async (filters = {}) => {
  const { inspection_type, stage, status, batch_number, page = 1, limit = 50 } = filters;
  if (isDbOnline) {
    try {
      let where = 'WHERE 1=1';
      const params = [];
      if (inspection_type) { params.push(inspection_type); where += ` AND qi.inspection_type = $${params.length}`; }
      if (stage) { params.push(stage); where += ` AND qi.stage = $${params.length}`; }
      if (status) { params.push(status); where += ` AND qi.status = $${params.length}`; }
      if (batch_number) { params.push(`%${batch_number}%`); where += ` AND qi.batch_number ILIKE $${params.length}`; }
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      const res = await query(
        `SELECT qi.*, json_agg(ir.* ORDER BY ir.id) AS results
         FROM quality_inspections qi
         LEFT JOIN inspection_results ir ON ir.inspection_id = qi.id
         ${where} GROUP BY qi.id ORDER BY qi.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      return res.rows;
    } catch (e) { console.error('[Quality] getInspections DB error:', e.message); }
  }
  let list = inMemInspections.map(i => ({
    ...i,
    results: inMemResults.filter(r => r.inspection_id === i.id)
  }));
  if (inspection_type) list = list.filter(i => i.inspection_type === inspection_type);
  if (stage) list = list.filter(i => i.stage === stage);
  if (status) list = list.filter(i => i.status === status);
  if (batch_number) list = list.filter(i => i.batch_number.toLowerCase().includes(batch_number.toLowerCase()));
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice((page - 1) * limit, page * limit);
};

const getInspectionById = async (id) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `SELECT qi.*, json_agg(ir.* ORDER BY ir.id) AS results
         FROM quality_inspections qi
         LEFT JOIN inspection_results ir ON ir.inspection_id = qi.id
         WHERE qi.id = $1 GROUP BY qi.id`,
        [id]
      );
      return res.rows[0] || null;
    } catch (e) { console.error('[Quality] getInspectionById DB error:', e.message); }
  }
  const i = inMemInspections.find(x => x.id === Number(id));
  if (!i) return null;
  return { ...i, results: inMemResults.filter(r => r.inspection_id === i.id) };
};

/**
 * Creates an inspection record and records evaluated parameters.
 * Automatically synchronizes decision with Phase 6 & Phase 7 batches.
 */
const createInspection = async (data, userId, userName) => {
  const inspectionNumber = getNextInspectionNumber();

  // Validate non-negative quantities
  const recQty = parseFloat(data.received_quantity || 0);
  const inspQty = parseFloat(data.inspected_quantity || recQty);
  const accQty = parseFloat(data.accepted_quantity || 0);
  const rejQty = parseFloat(data.rejected_quantity || 0);

  if (accQty < 0 || rejQty < 0) throw new Error('Accepted and rejected quantities cannot be negative');

  // Compute status & overall_result if not explicitly provided
  let status = data.status || 'PENDING';
  let overallResult = data.overall_result || (rejQty > 0 ? (accQty > 0 ? 'FAIL' : 'FAIL') : 'PASS');
  if (!data.status) {
    if (rejQty > 0 && accQty > 0) status = 'PARTIALLY_ACCEPTED';
    else if (rejQty > 0 && accQty === 0) status = 'FAILED';
    else if (rejQty === 0 && accQty > 0) status = 'PASSED';
  }

  // Evaluate parameter conformity & out-of-range flags
  const evaluatedResults = (data.results || []).map(r => {
    let isConforming = true;
    let outOfRange = false;
    if (r.measured_numeric_value !== undefined && r.measured_numeric_value !== null) {
      const val = parseFloat(r.measured_numeric_value);
      if (r.min_limit !== null && r.min_limit !== undefined && val < parseFloat(r.min_limit)) {
        isConforming = false; outOfRange = true;
      }
      if (r.max_limit !== null && r.max_limit !== undefined && val > parseFloat(r.max_limit)) {
        isConforming = false; outOfRange = true;
      }
    }
    if (r.measured_text_value && r.acceptable_text_values) {
      const allowed = r.acceptable_text_values.split(',').map(s => s.trim().toLowerCase());
      if (!allowed.includes(r.measured_text_value.trim().toLowerCase())) {
        isConforming = false; outOfRange = true;
      }
    }
    return {
      parameter_id: r.parameter_id || null,
      parameter_name: r.parameter_name,
      measured_numeric_value: r.measured_numeric_value !== undefined ? r.measured_numeric_value : null,
      measured_text_value: r.measured_text_value || null,
      min_limit: r.min_limit !== undefined ? r.min_limit : null,
      max_limit: r.max_limit !== undefined ? r.max_limit : null,
      target_limit: r.target_limit !== undefined ? r.target_limit : null,
      uom: r.uom || '',
      is_conforming: r.is_conforming !== undefined ? r.is_conforming : isConforming,
      flagged_out_of_range: outOfRange,
      remarks: r.remarks || (outOfRange ? 'Value exceeds quality tolerance' : 'Conforms to specification')
    };
  });

  if (isDbOnline) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const insRes = await client.query(
        `INSERT INTO quality_inspections (
          inspection_number, inspection_type, stage, standard_id, grn_id, supplier_id, supplier_name,
          production_order_id, production_order_number, production_batch_id, inventory_batch_id,
          item_type, item_id, item_name, item_code, batch_number, received_quantity, inspected_quantity,
          accepted_quantity, rejected_quantity, uom, inspection_date, inspector_id, inspector_name,
          status, overall_result, remarks, inventory_updated, created_by
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,TRUE,$28
        ) RETURNING *`,
        [
          inspectionNumber, data.inspection_type, data.stage || 'INCOMING', data.standard_id || null,
          data.grn_id || null, data.supplier_id || null, data.supplier_name || null,
          data.production_order_id || null, data.production_order_number || null,
          data.production_batch_id || null, data.inventory_batch_id || null,
          data.item_type, data.item_id, data.item_name, data.item_code || null,
          data.batch_number, recQty, inspQty, accQty, rejQty, data.uom || 'KG',
          data.inspection_date || new Date().toISOString().split('T')[0],
          userId, userName, status, overallResult, data.remarks || null, userId
        ]
      );
      const inspection = insRes.rows[0];
      nextInspectionId++;

      // Insert results
      for (const r of evaluatedResults) {
        await client.query(
          `INSERT INTO inspection_results (
            inspection_id, parameter_id, parameter_name, measured_numeric_value, measured_text_value,
            min_limit, max_limit, target_limit, uom, is_conforming, flagged_out_of_range, remarks
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            inspection.id, r.parameter_id, r.parameter_name, r.measured_numeric_value, r.measured_text_value,
            r.min_limit, r.max_limit, r.target_limit, r.uom, r.is_conforming, r.flagged_out_of_range, r.remarks
          ]
        );
      }

      // Sync with Phase 6 inventory_batches
      if (data.batch_number) {
        const targetQcStatus = (status === 'PASSED') ? 'PASS' : (status === 'FAILED' ? 'REJECTED' : 'QUARANTINE');
        await client.query(
          `UPDATE inventory_batches SET qc_status = $1, updated_at = NOW() WHERE batch_number = $2`,
          [targetQcStatus, data.batch_number]
        );
      }

      // Sync with Phase 7 production_batches
      if (data.production_batch_id || data.batch_number) {
        const targetBatchStatus = (status === 'PASSED') ? 'QC_PASSED' : 'QC_FAILED';
        await client.query(
          `UPDATE production_batches SET batch_status = $1, qc_remarks = $2, updated_at = NOW()
           WHERE id = $3 OR batch_number = $4`,
          [targetBatchStatus, data.remarks || `QC Result: ${status}`, data.production_batch_id || 0, data.batch_number]
        );
      }

      // Automatically create a defect record if materials/finished goods were rejected
      if (rejQty > 0) {
        const defectNumber = getNextDefectNumber();
        await client.query(
          `INSERT INTO quality_defects (
            defect_number, inspection_id, defect_source, defect_category, defect_description,
            material_or_product_type, material_or_product_id, material_or_product_name,
            supplier_id, supplier_name, production_order_id, production_order_number, batch_number,
            defective_quantity, uom, rejection_reason, severity, disposition_action, reported_by, reported_by_name
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
          [
            defectNumber, inspection.id,
            data.inspection_type === 'FINISHED_GOOD' || data.inspection_type === 'IN_PROCESS' ? 'PRODUCTION' : 'SUPPLIER',
            data.defect_category || 'CONTAMINATION', data.defect_description || `QC Rejected: ${data.remarks || 'Out of tolerance'}`,
            data.item_type, data.item_id, data.item_name,
            data.supplier_id || null, data.supplier_name || null,
            data.production_order_id || null, data.production_order_number || null,
            data.batch_number, rejQty, data.uom || 'KG',
            data.remarks || 'Quality inspection failed specification limits',
            data.severity || 'MAJOR',
            data.inspection_type === 'RAW_MATERIAL' || data.inspection_type === 'PACKAGING' ? 'REJECT_RETURN_TO_VENDOR' : 'SCRAP',
            userId, userName
          ]
        );
        nextDefectId++;
      }

      await client.query('COMMIT');
      await _addStatusHistory('INSPECTION', inspection.id, 'PENDING', status, userId, userName, data.remarks);
      return inspection;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // In-memory fallback
  const inspection = {
    id: nextInspectionId++, inspection_number: inspectionNumber,
    inspection_type: data.inspection_type, stage: data.stage || 'INCOMING',
    standard_id: data.standard_id || null, grn_id: data.grn_id || null,
    supplier_id: data.supplier_id || null, supplier_name: data.supplier_name || null,
    production_order_id: data.production_order_id || null, production_order_number: data.production_order_number || null,
    production_batch_id: data.production_batch_id || null, inventory_batch_id: data.inventory_batch_id || null,
    item_type: data.item_type, item_id: Number(data.item_id), item_name: data.item_name, item_code: data.item_code || null,
    batch_number: data.batch_number, received_quantity: recQty, inspected_quantity: inspQty,
    accepted_quantity: accQty, rejected_quantity: rejQty, uom: data.uom || 'KG',
    inspection_date: data.inspection_date || new Date().toISOString().split('T')[0],
    inspector_id: userId, inspector_name: userName, status, overall_result: overallResult,
    remarks: data.remarks || null, inventory_updated: true, created_by: userId,
    created_at: new Date(), updated_at: new Date()
  };
  inMemInspections.push(inspection);

  // Store evaluated test results
  evaluatedResults.forEach(r => {
    inMemResults.push({ id: nextResultId++, inspection_id: inspection.id, ...r, created_at: new Date() });
  });

  // Synchronize Phase 6 in-memory batches
  if (data.batch_number && inventoryModel.inMemoryBatches) {
    const b = inventoryModel.inMemoryBatches.find(x => x.batch_number === data.batch_number);
    if (b) {
      b.qc_status = (status === 'PASSED') ? 'PASS' : (status === 'FAILED' ? 'REJECTED' : 'QUARANTINE');
    }
  }

  // Synchronize Phase 7 in-memory production batches
  if (data.batch_number) {
    const pbList = productionModel._inMemProductionOrders; // or find batch
    // Update batch in memory if exists
  }

  // Auto create defect record if rejected
  if (rejQty > 0) {
    const defect = {
      id: nextDefectId++, defect_number: getNextDefectNumber(),
      inspection_id: inspection.id,
      defect_source: data.inspection_type === 'FINISHED_GOOD' || data.inspection_type === 'IN_PROCESS' ? 'PRODUCTION' : 'SUPPLIER',
      defect_category: data.defect_category || 'CONTAMINATION',
      defect_description: data.defect_description || `QC Rejected: ${data.remarks || 'Out of tolerance'}`,
      material_or_product_type: data.item_type, material_or_product_id: data.item_id, material_or_product_name: data.item_name,
      supplier_id: data.supplier_id || null, supplier_name: data.supplier_name || null,
      production_order_id: data.production_order_id || null, production_order_number: data.production_order_number || null,
      batch_number: data.batch_number, defective_quantity: rejQty, uom: data.uom || 'KG',
      rejection_reason: data.remarks || 'Quality inspection failed specification limits',
      severity: data.severity || 'MAJOR',
      disposition_action: data.inspection_type === 'RAW_MATERIAL' || data.inspection_type === 'PACKAGING' ? 'REJECT_RETURN_TO_VENDOR' : 'SCRAP',
      attachment_metadata: null, reported_by: userId, reported_by_name: userName,
      reported_date: new Date().toISOString().split('T')[0], created_at: new Date()
    };
    inMemDefects.push(defect);
  }

  await _addStatusHistory('INSPECTION', inspection.id, 'PENDING', status, userId, userName, data.remarks);
  return { ...inspection, results: inMemResults.filter(r => r.inspection_id === inspection.id) };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5: FINISHED GOODS RELEASE STATUS GUARD
// ─────────────────────────────────────────────────────────────────────────────

const checkFGReleaseStatus = async (batchNumber) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `SELECT id, batch_number, batch_status FROM production_batches WHERE batch_number = $1`,
        [batchNumber]
      );
      if (res.rows.length === 0) return { is_released: false, reason: 'Batch not found' };
      const status = res.rows[0].batch_status;
      return {
        batch_number: batchNumber,
        batch_status: status,
        is_released: status === 'QC_PASSED',
        can_dispatch: status === 'QC_PASSED'
      };
    } catch (e) { console.error('[Quality] checkFGReleaseStatus DB error:', e.message); }
  }
  // In-memory inspection check
  const insp = inMemInspections.find(i => i.batch_number === batchNumber && i.inspection_type === 'FINISHED_GOOD');
  if (!insp) {
    // If no inspection record exists, default to unreleased
    return { batch_number: batchNumber, is_released: false, can_dispatch: false, reason: 'Pending inspection' };
  }
  const isReleased = insp.status === 'PASSED';
  return {
    batch_number: batchNumber,
    inspection_id: insp.id,
    status: insp.status,
    is_released: isReleased,
    can_dispatch: isReleased
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6: DEFECT AND REJECTION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

const getDefects = async (filters = {}) => {
  const { defect_source, defect_category, severity, page = 1, limit = 50 } = filters;
  if (isDbOnline) {
    try {
      let where = 'WHERE 1=1';
      const params = [];
      if (defect_source) { params.push(defect_source); where += ` AND qd.defect_source = $${params.length}`; }
      if (defect_category) { params.push(defect_category); where += ` AND qd.defect_category = $${params.length}`; }
      if (severity) { params.push(severity); where += ` AND qd.severity = $${params.length}`; }
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      const res = await query(
        `SELECT qd.* FROM quality_defects qd ${where} ORDER BY qd.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      return res.rows;
    } catch (e) { console.error('[Quality] getDefects DB error:', e.message); }
  }
  let list = [...inMemDefects];
  if (defect_source) list = list.filter(d => d.defect_source === defect_source);
  if (defect_category) list = list.filter(d => d.defect_category === defect_category);
  if (severity) list = list.filter(d => d.severity === severity);
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice((page - 1) * limit, page * limit);
};

const createDefect = async (data, userId, userName) => {
  const defectNumber = getNextDefectNumber();
  if (isDbOnline) {
    try {
      const res = await query(
        `INSERT INTO quality_defects (
          defect_number, inspection_id, defect_source, defect_category, defect_description,
          material_or_product_type, material_or_product_id, material_or_product_name,
          supplier_id, supplier_name, production_order_id, production_order_number, batch_number,
          defective_quantity, uom, rejection_reason, severity, disposition_action, attachment_metadata,
          reported_by, reported_by_name, reported_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
        [
          defectNumber, data.inspection_id || null, data.defect_source || 'SUPPLIER',
          data.defect_category, data.defect_description,
          data.material_or_product_type, data.material_or_product_id, data.material_or_product_name,
          data.supplier_id || null, data.supplier_name || null,
          data.production_order_id || null, data.production_order_number || null,
          data.batch_number, data.defective_quantity, data.uom || 'KG',
          data.rejection_reason, data.severity || 'MAJOR', data.disposition_action || 'REJECT_RETURN_TO_VENDOR',
          data.attachment_metadata ? JSON.stringify(data.attachment_metadata) : null,
          userId, userName, data.reported_date || new Date().toISOString().split('T')[0]
        ]
      );
      nextDefectId++;
      return res.rows[0];
    } catch (e) { console.error('[Quality] createDefect DB error:', e.message); throw e; }
  }
  const defect = {
    id: nextDefectId++, defect_number: defectNumber,
    inspection_id: data.inspection_id || null, defect_source: data.defect_source || 'SUPPLIER',
    defect_category: data.defect_category, defect_description: data.defect_description,
    material_or_product_type: data.material_or_product_type, material_or_product_id: data.material_or_product_id,
    material_or_product_name: data.material_or_product_name,
    supplier_id: data.supplier_id || null, supplier_name: data.supplier_name || null,
    production_order_id: data.production_order_id || null, production_order_number: data.production_order_number || null,
    batch_number: data.batch_number, defective_quantity: Number(data.defective_quantity), uom: data.uom || 'KG',
    rejection_reason: data.rejection_reason, severity: data.severity || 'MAJOR',
    disposition_action: data.disposition_action || 'REJECT_RETURN_TO_VENDOR',
    attachment_metadata: data.attachment_metadata || null, reported_by: userId, reported_by_name: userName,
    reported_date: data.reported_date || new Date().toISOString().split('T')[0], created_at: new Date()
  };
  inMemDefects.push(defect);
  return defect;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7: CORRECTIVE AND PREVENTIVE ACTION (CAPA)
// ─────────────────────────────────────────────────────────────────────────────

const getIncidents = async () => {
  if (isDbOnline) {
    try {
      const res = await query('SELECT * FROM quality_incidents ORDER BY created_at DESC');
      return res.rows;
    } catch (e) { console.error('[Quality] getIncidents DB error:', e.message); }
  }
  return [...inMemIncidents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const createIncident = async (data, userId, userName) => {
  const incidentNumber = getNextIncidentNumber();
  if (isDbOnline) {
    try {
      const res = await query(
        `INSERT INTO quality_incidents (incident_number, title, description, incident_type, severity, status, related_inspection_id, related_defect_id, reported_by, reported_by_name, reported_date)
         VALUES ($1,$2,$3,$4,$5,'OPEN',$6,$7,$8,$9,$10) RETURNING *`,
        [incidentNumber, data.title, data.description, data.incident_type || 'INTERNAL_INSPECTION_FAIL',
         data.severity || 'MEDIUM', data.related_inspection_id || null, data.related_defect_id || null,
         userId, userName, data.reported_date || new Date().toISOString().split('T')[0]]
      );
      nextIncidentId++;
      return res.rows[0];
    } catch (e) { console.error('[Quality] createIncident DB error:', e.message); throw e; }
  }
  const inc = {
    id: nextIncidentId++, incident_number: incidentNumber,
    title: data.title, description: data.description,
    incident_type: data.incident_type || 'INTERNAL_INSPECTION_FAIL',
    severity: data.severity || 'MEDIUM', status: 'OPEN',
    related_inspection_id: data.related_inspection_id || null, related_defect_id: data.related_defect_id || null,
    reported_by: userId, reported_by_name: userName,
    reported_date: data.reported_date || new Date().toISOString().split('T')[0],
    created_at: new Date(), updated_at: new Date()
  };
  inMemIncidents.push(inc);
  return inc;
};

const getCapas = async (filters = {}) => {
  const { status, priority } = filters;
  if (isDbOnline) {
    try {
      let where = 'WHERE 1=1';
      const params = [];
      if (status) { params.push(status); where += ` AND c.status = $${params.length}`; }
      if (priority) { params.push(priority); where += ` AND c.priority = $${params.length}`; }
      const res = await query(
        `SELECT c.*, json_agg(cv.* ORDER BY cv.created_at DESC) AS verifications
         FROM capa_records c
         LEFT JOIN capa_verifications cv ON cv.capa_id = c.id
         ${where} GROUP BY c.id ORDER BY c.created_at DESC`,
        params
      );
      return res.rows;
    } catch (e) { console.error('[Quality] getCapas DB error:', e.message); }
  }
  let list = inMemCapas.map(c => ({
    ...c,
    verifications: inMemCapaVerifications.filter(v => v.capa_id === c.id)
  }));
  if (status) list = list.filter(c => c.status === status);
  if (priority) list = list.filter(c => c.priority === priority);
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const createCapa = async (data, userId) => {
  const capaNumber = getNextCapaNumber();
  if (isDbOnline) {
    try {
      const res = await query(
        `INSERT INTO capa_records (
          capa_number, incident_id, defect_id, problem_description, root_cause_analysis,
          corrective_action, preventive_action, assigned_to, assigned_to_name, priority,
          target_completion_date, status, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ASSIGNED',$12) RETURNING *`,
        [
          capaNumber, data.incident_id || null, data.defect_id || null,
          data.problem_description, data.root_cause_analysis || null,
          data.corrective_action, data.preventive_action,
          data.assigned_to || null, data.assigned_to_name || 'QA Engineer',
          data.priority || 'MEDIUM', data.target_completion_date, userId
        ]
      );
      nextCapaId++;
      return res.rows[0];
    } catch (e) { console.error('[Quality] createCapa DB error:', e.message); throw e; }
  }
  const capa = {
    id: nextCapaId++, capa_number: capaNumber,
    incident_id: data.incident_id || null, defect_id: data.defect_id || null,
    problem_description: data.problem_description, root_cause_analysis: data.root_cause_analysis || null,
    corrective_action: data.corrective_action, preventive_action: data.preventive_action,
    assigned_to: data.assigned_to || null, assigned_to_name: data.assigned_to_name || 'QA Engineer',
    priority: data.priority || 'MEDIUM', target_completion_date: data.target_completion_date,
    actual_completion_date: null, status: 'ASSIGNED', created_by: userId,
    created_at: new Date(), updated_at: new Date()
  };
  inMemCapas.push(capa);
  return capa;
};

const updateCapaStatus = async (id, status, reason, userId, userName) => {
  const allowed = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'REOPENED'];
  if (!allowed.includes(status)) throw new Error(`Invalid CAPA status: ${status}`);

  if (isDbOnline) {
    try {
      const res = await query(
        `UPDATE capa_records SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
        [status, id]
      );
      await _addStatusHistory('CAPA', id, '', status, userId, userName, reason);
      return res.rows[0] || null;
    } catch (e) { console.error('[Quality] updateCapaStatus DB error:', e.message); throw e; }
  }
  const c = inMemCapas.find(x => x.id === Number(id));
  if (!c) return null;
  const old = c.status;
  c.status = status;
  c.updated_at = new Date();
  if (status === 'CLOSED') c.actual_completion_date = new Date().toISOString().split('T')[0];
  await _addStatusHistory('CAPA', id, old, status, userId, userName, reason);
  return c;
};

const verifyCapa = async (id, data, userId, userName) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `INSERT INTO capa_verifications (capa_id, verification_date, verified_by, verified_by_name, is_effective, verification_notes, evidence_metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [id, data.verification_date || new Date().toISOString().split('T')[0],
         userId, userName, data.is_effective !== false, data.verification_notes,
         data.evidence_metadata ? JSON.stringify(data.evidence_metadata) : null]
      );
      if (data.is_effective !== false) {
        await query(`UPDATE capa_records SET status='CLOSED', actual_completion_date=CURRENT_DATE, updated_at=NOW() WHERE id=$1`, [id]);
      }
      return res.rows[0];
    } catch (e) { console.error('[Quality] verifyCapa DB error:', e.message); throw e; }
  }
  const verif = {
    id: nextVerifId++, capa_id: Number(id),
    verification_date: data.verification_date || new Date().toISOString().split('T')[0],
    verified_by: userId, verified_by_name: userName, is_effective: data.is_effective !== false,
    verification_notes: data.verification_notes, evidence_metadata: data.evidence_metadata || null,
    created_at: new Date()
  };
  inMemCapaVerifications.push(verif);

  const c = inMemCapas.find(x => x.id === Number(id));
  if (c && data.is_effective !== false) {
    c.status = 'CLOSED';
    c.actual_completion_date = new Date().toISOString().split('T')[0];
  }
  return verif;
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 8: QUALITY DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const getQualityDashboardStats = async () => {
  if (isDbOnline) {
    try {
      const [counts, rejects, capaCount, incCount, recent] = await Promise.all([
        query(`SELECT status, COUNT(*) AS count FROM quality_inspections GROUP BY status`),
        query(`SELECT inspection_type, SUM(rejected_quantity) AS total_rejected FROM quality_inspections GROUP BY inspection_type`),
        query(`SELECT status, COUNT(*) AS count FROM capa_records GROUP BY status`),
        query(`SELECT COUNT(*) AS open_incidents FROM quality_incidents WHERE status != 'CLOSED'`),
        query(`SELECT qi.inspection_number, qi.inspection_type, qi.item_name, qi.batch_number, qi.status, qi.overall_result, qi.created_at FROM quality_inspections qi ORDER BY qi.created_at DESC LIMIT 10`)
      ]);

      const statusMap = {};
      counts.rows.forEach(r => { statusMap[r.status] = parseInt(r.count); });

      const rejMap = {};
      rejects.rows.forEach(r => { rejMap[r.inspection_type] = parseFloat(r.total_rejected || 0); });

      const capaMap = {};
      capaCount.rows.forEach(r => { capaMap[r.status] = parseInt(r.count); });

      return {
        total_inspections: Object.values(statusMap).reduce((a, b) => a + b, 0),
        passed_inspections: statusMap['PASSED'] || 0,
        failed_inspections: statusMap['FAILED'] || 0,
        pending_inspections: statusMap['PENDING'] || 0,
        partially_accepted: statusMap['PARTIALLY_ACCEPTED'] || 0,
        rejected_raw_materials: rejMap['RAW_MATERIAL'] || 0,
        rejected_packaging: rejMap['PACKAGING'] || 0,
        rejected_finished_goods: rejMap['FINISHED_GOOD'] || 0,
        open_incidents: parseInt(incCount.rows[0]?.open_incidents || 0),
        pending_capa_actions: (capaMap['OPEN'] || 0) + (capaMap['ASSIGNED'] || 0) + (capaMap['IN_PROGRESS'] || 0),
        closed_capas: capaMap['CLOSED'] || 0,
        recent_inspections: recent.rows || []
      };
    } catch (e) { console.error('[Quality] getQualityDashboardStats DB error:', e.message); }
  }

  // In-memory fallback
  const all = inMemInspections;
  const statusMap = {};
  all.forEach(i => { statusMap[i.status] = (statusMap[i.status] || 0) + 1; });

  const rejRM = all.filter(i => i.inspection_type === 'RAW_MATERIAL').reduce((s, i) => s + (i.rejected_quantity || 0), 0);
  const rejPKG = all.filter(i => i.inspection_type === 'PACKAGING').reduce((s, i) => s + (i.rejected_quantity || 0), 0);
  const rejFG = all.filter(i => i.inspection_type === 'FINISHED_GOOD').reduce((s, i) => s + (i.rejected_quantity || 0), 0);

  const openIncidents = inMemIncidents.filter(i => i.status !== 'CLOSED').length;
  const pendingCapas = inMemCapas.filter(c => ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION'].includes(c.status)).length;
  const closedCapas = inMemCapas.filter(c => c.status === 'CLOSED').length;

  return {
    total_inspections: all.length,
    passed_inspections: statusMap['PASSED'] || 0,
    failed_inspections: statusMap['FAILED'] || 0,
    pending_inspections: statusMap['PENDING'] || 0,
    partially_accepted: statusMap['PARTIALLY_ACCEPTED'] || 0,
    rejected_raw_materials: rejRM,
    rejected_packaging: rejPKG,
    rejected_finished_goods: rejFG,
    open_incidents: openIncidents,
    pending_capa_actions: pendingCapas,
    closed_capas: closedCapas,
    recent_inspections: [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
      .map(i => ({ inspection_number: i.inspection_number, inspection_type: i.inspection_type, item_name: i.item_name, batch_number: i.batch_number, status: i.status, overall_result: i.overall_result, created_at: i.created_at }))
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 9: QUALITY REPORTS
// ─────────────────────────────────────────────────────────────────────────────

const getQualityReports = async (type, filters = {}) => {
  const { from_date, to_date, supplier_id, search } = filters;

  if (isDbOnline) {
    try {
      let sql, params = [];
      const dateFilter = (col = 'created_at') => {
        let w = '';
        if (from_date) { params.push(from_date); w += ` AND ${col}::date >= $${params.length}`; }
        if (to_date) { params.push(to_date); w += ` AND ${col}::date <= $${params.length}`; }
        return w;
      };

      switch (type) {
        case 'raw_material':
          sql = `SELECT inspection_number, inspection_date, supplier_name, item_name, batch_number, received_quantity, inspected_quantity, accepted_quantity, rejected_quantity, uom, status, remarks FROM quality_inspections WHERE inspection_type = 'RAW_MATERIAL' ${dateFilter('inspection_date')} ORDER BY inspection_date DESC`;
          break;
        case 'packaging':
          sql = `SELECT inspection_number, inspection_date, supplier_name, item_name, batch_number, received_quantity, inspected_quantity, accepted_quantity, rejected_quantity, uom, status, remarks FROM quality_inspections WHERE inspection_type = 'PACKAGING' ${dateFilter('inspection_date')} ORDER BY inspection_date DESC`;
          break;
        case 'in_process':
          sql = `SELECT inspection_number, inspection_date, production_order_number, item_name, batch_number, stage, status, remarks FROM quality_inspections WHERE inspection_type = 'IN_PROCESS' ${dateFilter('inspection_date')} ORDER BY inspection_date DESC`;
          break;
        case 'finished_goods':
          sql = `SELECT inspection_number, inspection_date, production_order_number, item_name, batch_number, inspected_quantity, accepted_quantity, rejected_quantity, status, remarks FROM quality_inspections WHERE inspection_type = 'FINISHED_GOOD' ${dateFilter('inspection_date')} ORDER BY inspection_date DESC`;
          break;
        case 'supplier_quality':
          sql = `SELECT supplier_name, COUNT(*) AS total_lots, SUM(accepted_quantity) AS accepted_qty, SUM(rejected_quantity) AS rejected_qty, ROUND((SUM(rejected_quantity) / NULLIF(SUM(received_quantity), 0)) * 100, 2) AS rejection_rate_pct FROM quality_inspections WHERE supplier_name IS NOT NULL ${dateFilter('inspection_date')} GROUP BY supplier_name ORDER BY rejection_rate_pct DESC NULLS LAST`;
          break;
        case 'batch_quality_history':
          sql = `SELECT qi.batch_number, qi.inspection_number, qi.item_name, qi.inspection_type, qi.inspection_date, qi.status, qi.overall_result, qi.inspector_name FROM quality_inspections qi WHERE 1=1 ${dateFilter('qi.inspection_date')} ORDER BY qi.batch_number, qi.inspection_date DESC`;
          break;
        case 'rejections':
          sql = `SELECT defect_number, defect_source, defect_category, material_or_product_name, batch_number, defective_quantity, uom, rejection_reason, severity, disposition_action, reported_date FROM quality_defects WHERE 1=1 ${dateFilter('reported_date')} ORDER BY reported_date DESC`;
          break;
        case 'defect_analysis':
          sql = `SELECT defect_category, COUNT(*) AS defect_count, SUM(defective_quantity) AS total_defective_qty, defect_source FROM quality_defects WHERE 1=1 ${dateFilter('reported_date')} GROUP BY defect_category, defect_source ORDER BY defect_count DESC`;
          break;
        case 'capa':
          sql = `SELECT capa_number, problem_description, corrective_action, preventive_action, assigned_to_name, priority, target_completion_date, actual_completion_date, status FROM capa_records WHERE 1=1 ${dateFilter('created_at')} ORDER BY created_at DESC`;
          break;
        case 'quality_performance':
          sql = `SELECT TO_CHAR(inspection_date, 'YYYY-MM') AS month, COUNT(*) AS total_inspections, SUM(CASE WHEN status='PASSED' THEN 1 ELSE 0 END) AS passed_lots, SUM(CASE WHEN status='FAILED' THEN 1 ELSE 0 END) AS failed_lots, ROUND((SUM(CASE WHEN status='PASSED' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS first_pass_yield_pct FROM quality_inspections WHERE 1=1 ${dateFilter('inspection_date')} GROUP BY TO_CHAR(inspection_date, 'YYYY-MM') ORDER BY month DESC`;
          break;
        default:
          sql = `SELECT * FROM quality_inspections WHERE 1=1 ${dateFilter('inspection_date')} ORDER BY created_at DESC LIMIT 100`;
      }
      const res = await query(sql, params);
      return { type, count: res.rows.length, data: res.rows };
    } catch (e) { console.error('[Quality] getQualityReports DB error:', e.message); }
  }

  // In-memory fallback
  let data = [];
  switch (type) {
    case 'raw_material':
      data = inMemInspections.filter(i => i.inspection_type === 'RAW_MATERIAL');
      break;
    case 'packaging':
      data = inMemInspections.filter(i => i.inspection_type === 'PACKAGING');
      break;
    case 'in_process':
      data = inMemInspections.filter(i => i.inspection_type === 'IN_PROCESS');
      break;
    case 'finished_goods':
      data = inMemInspections.filter(i => i.inspection_type === 'FINISHED_GOOD');
      break;
    case 'supplier_quality': {
      const bySup = {};
      inMemInspections.filter(i => i.supplier_name).forEach(i => {
        bySup[i.supplier_name] = bySup[i.supplier_name] || { supplier_name: i.supplier_name, total_lots: 0, accepted_qty: 0, rejected_qty: 0, total_received: 0 };
        bySup[i.supplier_name].total_lots++;
        bySup[i.supplier_name].accepted_qty += (i.accepted_quantity || 0);
        bySup[i.supplier_name].rejected_qty += (i.rejected_quantity || 0);
        bySup[i.supplier_name].total_received += (i.received_quantity || 0);
      });
      data = Object.values(bySup).map(s => ({
        ...s,
        rejection_rate_pct: s.total_received > 0 ? Math.round((s.rejected_qty / s.total_received) * 10000) / 100 : 0
      }));
      break;
    }
    case 'batch_quality_history':
      data = inMemInspections.map(i => ({ batch_number: i.batch_number, inspection_number: i.inspection_number, item_name: i.item_name, inspection_type: i.inspection_type, inspection_date: i.inspection_date, status: i.status }));
      break;
    case 'rejections':
      data = inMemDefects;
      break;
    case 'defect_analysis': {
      const byCat = {};
      inMemDefects.forEach(d => {
        byCat[d.defect_category] = byCat[d.defect_category] || { defect_category: d.defect_category, defect_count: 0, total_defective_qty: 0, defect_source: d.defect_source };
        byCat[d.defect_category].defect_count++;
        byCat[d.defect_category].total_defective_qty += (d.defective_quantity || 0);
      });
      data = Object.values(byCat);
      break;
    }
    case 'capa':
      data = inMemCapas;
      break;
    case 'quality_performance': {
      const pass = inMemInspections.filter(i => i.status === 'PASSED').length;
      data = [{ month: 'Current', total_inspections: inMemInspections.length, passed_lots: pass, failed_lots: inMemInspections.length - pass, first_pass_yield_pct: inMemInspections.length > 0 ? Math.round((pass / inMemInspections.length) * 10000) / 100 : 100 }];
      break;
    }
    default:
      data = inMemInspections;
  }
  return { type, count: data.length, data };
};

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT & STATUS LOGS
// ─────────────────────────────────────────────────────────────────────────────

const _addStatusHistory = async (entityType, entityId, oldStatus, newStatus, userId, userName, reason) => {
  if (isDbOnline) {
    try {
      await query(
        `INSERT INTO quality_status_history (entity_type, entity_id, old_status, new_status, changed_by, changed_by_name, reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [entityType, entityId, oldStatus || null, newStatus, userId, userName, reason || null]
      );
    } catch (_) {}
    return;
  }
  inMemStatusHistory.push({
    id: nextStatusHistoryId++, entity_type: entityType, entity_id: Number(entityId),
    old_status: oldStatus || null, new_status: newStatus,
    changed_by: userId, changed_by_name: userName, reason: reason || null, changed_at: new Date()
  });
};

const getQualityStatusHistory = async (entityType, entityId) => {
  if (isDbOnline) {
    try {
      const res = await query(
        `SELECT * FROM quality_status_history WHERE entity_type = $1 AND entity_id = $2 ORDER BY changed_at DESC`,
        [entityType, entityId]
      );
      return res.rows;
    } catch (e) { console.error('[Quality] getStatusHistory DB error:', e.message); }
  }
  return inMemStatusHistory.filter(h => h.entity_type === entityType && h.entity_id === Number(entityId));
};

module.exports = {
  initQualityTables,
  // Standards
  getQualityStandards,
  getQualityStandardById,
  createQualityStandard,
  toggleStandardStatus,
  // Inspections
  getInspections,
  getInspectionById,
  createInspection,
  checkFGReleaseStatus,
  // Defects
  getDefects,
  createDefect,
  // CAPA
  getIncidents,
  createIncident,
  getCapas,
  createCapa,
  updateCapaStatus,
  verifyCapa,
  // Dashboard & Reports
  getQualityDashboardStats,
  getQualityReports,
  getQualityStatusHistory,
  // Testing exports
  _inMemStandards: inMemStandards,
  _inMemInspections: inMemInspections,
  _inMemDefects: inMemDefects,
  _inMemCapas: inMemCapas
};
