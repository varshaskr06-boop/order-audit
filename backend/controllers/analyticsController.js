// ============================================================================
// Phase 14: Reports & Analytics System Controller
// Sri Meenakshi Agro & Traditional Foods Pvt Ltd
// ============================================================================

const analyticsModel = require('../models/analyticsModel');

// 1. Executive Dashboard (Owner & Admin only, Accountant can view financial summaries)
const getExecutiveDashboard = async (req, res, next) => {
  try {
    const stats = await analyticsModel.getExecutiveDashboardStats(req.query);
    return res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// 2. Subsystem Analytics Controllers
const getSalesAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getSalesAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getPurchaseAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getPurchaseAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getInventoryAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getInventoryAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getProductionAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getProductionAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getQualityAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getQualityAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getCostingAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getCostingAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getGstAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getGstAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getDispatchAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getDispatchAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getPaymentAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getPaymentAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getAuditAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsModel.getAuditAnalytics(req.query);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// 3. Saved Reports Management
const getSavedReports = async (req, res, next) => {
  try {
    const reports = await analyticsModel.getSavedReports(req.user?.id);
    return res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

const createSavedReport = async (req, res, next) => {
  try {
    const { custom_title, report_definition_id, saved_filters } = req.body;
    if (!custom_title || !report_definition_id) {
      return res.status(400).json({ success: false, error: 'custom_title and report_definition_id are required' });
    }
    const report = await analyticsModel.saveReport(req.body, req.user);
    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const deleteSavedReport = async (req, res, next) => {
  try {
    const deleted = await analyticsModel.deleteSavedReport(req.params.id, req.user?.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Saved report not found' });
    }
    return res.json({ success: true, message: 'Saved report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 4. Report Schedules
const getReportSchedules = async (req, res, next) => {
  try {
    const schedules = await analyticsModel.getReportSchedules();
    return res.json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
};

const createReportSchedule = async (req, res, next) => {
  try {
    const { schedule_name, report_definition_id, frequency } = req.body;
    if (!schedule_name || !report_definition_id || !frequency) {
      return res.status(400).json({ success: false, error: 'schedule_name, report_definition_id and frequency are required' });
    }
    const schedule = await analyticsModel.createReportSchedule(req.body, req.user);
    return res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

const runReportSchedule = async (req, res, next) => {
  try {
    const result = await analyticsModel.runReportSchedule(req.params.id, req.user);
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 5. Execution Logs
const getExecutionLogs = async (req, res, next) => {
  try {
    const logs = await analyticsModel.getExecutionLogs();
    return res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// 6. User Dashboard Preferences
const getDashboardPreferences = async (req, res, next) => {
  try {
    const prefs = await analyticsModel.getDashboardPreferences(req.user?.id);
    return res.json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
};

const updateDashboardPreferences = async (req, res, next) => {
  try {
    const prefs = await analyticsModel.updateDashboardPreferences(req.user?.id, req.body);
    return res.json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
};

// 7. Report Definitions Master List
const getReportDefinitions = async (req, res, next) => {
  try {
    const definitions = await analyticsModel.getReportDefinitions(req.query.category);
    return res.json({ success: true, data: definitions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExecutiveDashboard,
  getSalesAnalytics,
  getPurchaseAnalytics,
  getInventoryAnalytics,
  getProductionAnalytics,
  getQualityAnalytics,
  getCostingAnalytics,
  getGstAnalytics,
  getDispatchAnalytics,
  getPaymentAnalytics,
  getAuditAnalytics,
  getReportDefinitions,
  getSavedReports,
  createSavedReport,
  deleteSavedReport,
  getReportSchedules,
  createReportSchedule,
  runReportSchedule,
  getExecutionLogs,
  getDashboardPreferences,
  updateDashboardPreferences
};
