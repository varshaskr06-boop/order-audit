/**
 * ============================================================================
 * Phase 11: Dispatch and Delivery Management System Controller
 * Sri Meenakshi Agro & Traditional Foods Pvt Ltd
 * ============================================================================
 */

const dispatchModel = require('../models/dispatchModel');

// 1. Transporters
const getTransporters = async (req, res) => {
  try {
    const list = await dispatchModel.getTransporters();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createTransporter = async (req, res) => {
  try {
    if (!req.body.name || !req.body.phone) {
      return res.status(400).json({ success: false, message: 'Transporter name and phone are required.' });
    }
    const transporter = await dispatchModel.createTransporter(req.body);
    res.status(201).json({ success: true, message: 'Transporter created successfully', data: transporter });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 2. Dispatch Orders
const getDispatchOrders = async (req, res) => {
  try {
    const list = await dispatchModel.getDispatchOrders(req.query);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDispatchOrderById = async (req, res) => {
  try {
    const order = await dispatchModel.getDispatchOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Dispatch order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDispatchOrder = async (req, res) => {
  try {
    const { sales_order_id, customer_id, items } = req.body;
    if (!sales_order_id || !customer_id || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Sales order reference, customer, and at least one line item are required.'
      });
    }

    const order = await dispatchModel.createDispatchOrder(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: `Dispatch order ${order.dispatch_order_number} created successfully`,
      data: order
    });
  } catch (err) {
    const status = err.status || (err.code === 'QC_RESTRICTED' || err.code === 'OVER_DISPATCH' || err.code === 'BATCH_EXPIRED' || err.code === 'QC_FAILED' ? 400 : 500);
    res.status(status).json({ success: false, code: err.code, message: err.message });
  }
};

// 3. Finished Goods Batch Stock & QC Verification
const verifyBatchStock = async (req, res) => {
  try {
    const { product_id, batch_number, quantity } = req.body;
    if (!batch_number || !quantity) {
      return res.status(400).json({ success: false, message: 'Batch number and quantity are required.' });
    }
    const result = await dispatchModel.verifyFinishedGoodsBatch({ product_id, batch_number, quantity });
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.status || (err.code ? 400 : 500);
    res.status(status).json({ success: false, code: err.code, message: err.message });
  }
};

// 4. Packing Management
const recordPacking = async (req, res) => {
  try {
    if (!req.body.dispatch_order_id) {
      return res.status(400).json({ success: false, message: 'dispatch_order_id is required' });
    }
    const record = await dispatchModel.recordPacking(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: `Packing slip ${record.packing_slip_number} created successfully`,
      data: record
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getPackingRecords = async (req, res) => {
  try {
    const records = await dispatchModel.getPackingRecords();
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Delivery Challan
const generateDeliveryChallan = async (req, res) => {
  try {
    if (!req.body.dispatch_order_id) {
      return res.status(400).json({ success: false, message: 'dispatch_order_id is required' });
    }
    const challan = await dispatchModel.generateDeliveryChallan(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: `Delivery challan ${challan.challan_number} generated successfully`,
      data: challan
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getDeliveryChallans = async (req, res) => {
  try {
    const list = await dispatchModel.getDeliveryChallans();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDeliveryChallanById = async (req, res) => {
  try {
    const challan = await dispatchModel.getDeliveryChallanById(req.params.id);
    if (!challan) {
      return res.status(404).json({ success: false, message: 'Delivery challan not found' });
    }
    res.json({ success: true, data: challan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Shipment Tracking Status
const updateShipmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Tracking status is required' });
    }
    const updated = await dispatchModel.updateShipmentStatus(req.params.id, req.body, req.user?.id);
    res.json({
      success: true,
      message: `Shipment status updated to ${status}`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 7. Proof of Delivery (POD)
const recordProofOfDelivery = async (req, res) => {
  try {
    if (!req.body.dispatch_order_id || !req.body.receiver_name) {
      return res.status(400).json({ success: false, message: 'dispatch_order_id and receiver_name are required' });
    }
    const result = await dispatchModel.recordProofOfDelivery(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'Proof of delivery recorded successfully',
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getProofOfDeliveryList = async (req, res) => {
  try {
    const list = await dispatchModel.getProofOfDeliveryList();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8. Customer Returns
const recordCustomerReturn = async (req, res) => {
  try {
    if (!req.body.dispatch_order_id || !req.body.total_returned_quantity) {
      return res.status(400).json({ success: false, message: 'dispatch_order_id and total_returned_quantity are required' });
    }
    const ret = await dispatchModel.recordCustomerReturn(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: `Return record ${ret.return_number} logged and QUARANTINED for inspection`,
      data: ret
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getDeliveryReturns = async (req, res) => {
  try {
    const list = await dispatchModel.getDeliveryReturns();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDeliveryReturnById = async (req, res) => {
  try {
    const ret = await dispatchModel.getDeliveryReturnById(req.params.id);
    if (!ret) {
      return res.status(404).json({ success: false, message: 'Return record not found' });
    }
    res.json({ success: true, data: ret });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 9. Dashboard Stats
const getDispatchDashboardStats = async (req, res) => {
  try {
    const stats = await dispatchModel.getDispatchDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 10. Reports
const generateDispatchReport = async (req, res) => {
  try {
    const reportType = req.query.type || 'DAILY_DISPATCH';
    const report = await dispatchModel.generateDispatchReport(reportType, req.query);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTransporters,
  createTransporter,
  getDispatchOrders,
  getDispatchOrderById,
  createDispatchOrder,
  verifyBatchStock,
  recordPacking,
  getPackingRecords,
  generateDeliveryChallan,
  getDeliveryChallans,
  getDeliveryChallanById,
  updateShipmentStatus,
  recordProofOfDelivery,
  getProofOfDeliveryList,
  recordCustomerReturn,
  getDeliveryReturns,
  getDeliveryReturnById,
  getDispatchDashboardStats,
  generateDispatchReport
};
