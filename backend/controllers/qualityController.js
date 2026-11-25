/**
 * ============================================================================
 * Quality Control Management System Controller (Phase 8)
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const qualityModel = require('../models/qualityModel');

// ─────────────────────────────────────────────────────────────────────────────
// 1. QUALITY STANDARDS
// ─────────────────────────────────────────────────────────────────────────────

exports.getQualityStandards = async (req, res, next) => {
  try {
    const { target_type, is_active, search } = req.query;
    const standards = await qualityModel.getQualityStandards({ target_type, is_active, search });
    res.json({ success: true, count: standards.length, data: standards });
  } catch (error) {
    next(error);
  }
};

exports.getQualityStandardById = async (req, res, next) => {
  try {
    const standard = await qualityModel.getQualityStandardById(req.params.id);
    if (!standard) {
      return res.status(404).json({ success: false, error: { message: 'Quality standard not found' } });
    }
    res.json({ success: true, data: standard });
  } catch (error) {
    next(error);
  }
};

exports.createQualityStandard = async (req, res, next) => {
  try {
    const { standard_name, target_type, target_id, parameters } = req.body;
    if (!standard_name || !target_type || !target_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'standard_name, target_type, and target_id are required' }
      });
    }

    const standard = await qualityModel.createQualityStandard(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Quality standard created with parameters', data: standard });
  } catch (error) {
    next(error);
  }
};

exports.toggleStandardStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    const updated = await qualityModel.toggleStandardStatus(req.params.id, is_active !== false);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'Quality standard not found' } });
    }
    res.json({ success: true, message: `Quality standard active status set to ${is_active}`, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. QUALITY INSPECTIONS
// ─────────────────────────────────────────────────────────────────────────────

exports.getInspections = async (req, res, next) => {
  try {
    const { inspection_type, stage, status, batch_number, page, limit } = req.query;
    const inspections = await qualityModel.getInspections({ inspection_type, stage, status, batch_number, page, limit });
    res.json({ success: true, count: inspections.length, data: inspections });
  } catch (error) {
    next(error);
  }
};

exports.getInspectionById = async (req, res, next) => {
  try {
    const inspection = await qualityModel.getInspectionById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, error: { message: 'Quality inspection not found' } });
    }
    res.json({ success: true, data: inspection });
  } catch (error) {
    next(error);
  }
};

exports.createInspection = async (req, res, next) => {
  try {
    const { inspection_type, item_id, item_name, batch_number, received_quantity, accepted_quantity, rejected_quantity } = req.body;
    if (!inspection_type || !item_id || !item_name || !batch_number) {
      return res.status(400).json({
        success: false,
        error: { message: 'inspection_type, item_id, item_name, and batch_number are required' }
      });
    }

    const inspection = await qualityModel.createInspection(
      req.body,
      req.user.id,
      req.user.name || req.user.username || 'QC Inspector'
    );
    res.status(201).json({ success: true, message: 'Quality inspection recorded and inventory synchronized', data: inspection });
  } catch (error) {
    if (error.message.includes('cannot be negative')) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    next(error);
  }
};

exports.checkFGReleaseStatus = async (req, res, next) => {
  try {
    const status = await qualityModel.checkFGReleaseStatus(req.params.batchNumber);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. DEFECTS & REJECTIONS
// ─────────────────────────────────────────────────────────────────────────────

exports.getDefects = async (req, res, next) => {
  try {
    const { defect_source, defect_category, severity, page, limit } = req.query;
    const defects = await qualityModel.getDefects({ defect_source, defect_category, severity, page, limit });
    res.json({ success: true, count: defects.length, data: defects });
  } catch (error) {
    next(error);
  }
};

exports.createDefect = async (req, res, next) => {
  try {
    const { defect_category, defect_description, material_or_product_type, material_or_product_id, material_or_product_name, batch_number, defective_quantity, rejection_reason } = req.body;
    if (!defect_category || !defect_description || !material_or_product_name || !batch_number || !defective_quantity || !rejection_reason) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required defect logging fields' }
      });
    }

    const defect = await qualityModel.createDefect(
      req.body,
      req.user.id,
      req.user.name || req.user.username || 'QC Inspector'
    );
    res.status(201).json({ success: true, message: 'Defect logged and rejection disposition assigned', data: defect });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. CAPA & QUALITY INCIDENTS
// ─────────────────────────────────────────────────────────────────────────────

exports.getIncidents = async (req, res, next) => {
  try {
    const incidents = await qualityModel.getIncidents();
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (error) {
    next(error);
  }
};

exports.createIncident = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, error: { message: 'Incident title and description are required' } });
    }
    const incident = await qualityModel.createIncident(req.body, req.user.id, req.user.name || req.user.username || 'User');
    res.status(201).json({ success: true, message: 'Quality incident logged', data: incident });
  } catch (error) {
    next(error);
  }
};

exports.getCapas = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const capas = await qualityModel.getCapas({ status, priority });
    res.json({ success: true, count: capas.length, data: capas });
  } catch (error) {
    next(error);
  }
};

exports.createCapa = async (req, res, next) => {
  try {
    const { problem_description, corrective_action, preventive_action, target_completion_date } = req.body;
    if (!problem_description || !corrective_action || !preventive_action || !target_completion_date) {
      return res.status(400).json({
        success: false,
        error: { message: 'problem_description, corrective_action, preventive_action, and target_completion_date are required' }
      });
    }

    const capa = await qualityModel.createCapa(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'CAPA action created and assigned', data: capa });
  } catch (error) {
    next(error);
  }
};

exports.updateCapaStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: { message: 'Status is required' } });
    }
    const updated = await qualityModel.updateCapaStatus(
      req.params.id,
      status,
      reason,
      req.user.id,
      req.user.name || req.user.username || 'QA Lead'
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'CAPA record not found' } });
    }
    res.json({ success: true, message: `CAPA status updated to ${status}`, data: updated });
  } catch (error) {
    if (error.message.includes('Invalid CAPA status')) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
    next(error);
  }
};

exports.verifyCapa = async (req, res, next) => {
  try {
    const { verification_notes, is_effective } = req.body;
    if (!verification_notes) {
      return res.status(400).json({ success: false, error: { message: 'verification_notes are required' } });
    }
    const verif = await qualityModel.verifyCapa(
      req.params.id,
      req.body,
      req.user.id,
      req.user.name || req.user.username || 'QA Auditor'
    );
    res.status(201).json({ success: true, message: 'CAPA verification recorded and action closed', data: verif });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. DASHBOARD & REPORTS
// ─────────────────────────────────────────────────────────────────────────────

exports.getQualityDashboardStats = async (req, res, next) => {
  try {
    const stats = await qualityModel.getQualityDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

exports.getQualityReports = async (req, res, next) => {
  try {
    const { type = 'raw_material', from_date, to_date, search } = req.query;
    const report = await qualityModel.getQualityReports(type, { from_date, to_date, search });
    res.json({ success: true, ...report });
  } catch (error) {
    next(error);
  }
};

exports.getQualityStatusHistory = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const history = await qualityModel.getQualityStatusHistory(entityType, entityId);
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};
