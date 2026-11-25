/**
 * ============================================================================
 * Sales Order Controller
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 */

const salesOrderModel = require('../models/salesOrderModel');

/**
 * 1. GET /api/sales/orders
 * List orders with role-aware filtering and search
 */
const listOrders = async (req, res, next) => {
  try {
    const { customer_id, salesman_id, status, search, date_from, date_to, page, limit } = req.query;
    const userRole = (req.user.role || '').toUpperCase();

    // Strict Role Scoping: Salesman can ONLY view their own orders
    let targetSalesmanId = salesman_id;
    if (userRole === 'SALESMAN') {
      targetSalesmanId = req.user.id;
    }

    const data = await salesOrderModel.getOrders({
      salesman_id: targetSalesmanId,
      customer_id,
      status,
      search,
      date_from,
      date_to,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/sales/orders/:id
 * Retrieve order details, line items, and audit history
 */
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await salesOrderModel.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: `Sales order with ID ${id} not found.` },
      });
    }

    // Role access check: Salesman can only view their own order
    const userRole = (req.user.role || '').toUpperCase();
    if (userRole === 'SALESMAN' && order.salesman_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ORDER_ACCESS',
          message: 'Access denied. You can only view sales orders created by yourself.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/sales/orders/calculate
 * Calculate line item totals and tax without persisting (Preview calculation)
 */
const previewPricing = async (req, res, next) => {
  try {
    const { customer_id, items } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Customer ID is required for tax and pricing calculations.' },
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'At least one product item is required for pricing.' },
      });
    }

    const pricing = await salesOrderModel.calculateOrderPricing(customer_id, items);

    return res.status(200).json({
      success: true,
      pricing,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * 4. POST /api/sales/orders
 * Create new Sales Order (as DRAFT or directly SUBMITTED)
 */
const createOrder = async (req, res, next) => {
  try {
    const {
      customer_id,
      order_number,
      expected_delivery_date,
      delivery_address,
      payment_terms,
      order_notes,
      status,
      items,
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Customer is required.' },
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Sales order must include at least one product.' },
      });
    }

    // Determine salesman ID
    const userRole = (req.user.role || '').toUpperCase();
    let salesmanId = req.user.id;
    if (['ADMIN', 'OWNER'].includes(userRole) && req.body.salesman_id) {
      salesmanId = req.body.salesman_id;
    }

    const order = await salesOrderModel.createOrder({
      customer_id,
      salesman_id: salesmanId,
      order_number,
      expected_delivery_date,
      delivery_address,
      payment_terms,
      order_notes,
      status: status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT',
      items,
    });

    return res.status(201).json({
      success: true,
      message: `Sales Order ${order.order_number} created successfully (${order.status}).`,
      order,
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: { message: error.message },
      });
    }
    return res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * 5. PUT /api/sales/orders/:id
 * Update draft or rejected order
 */
const updateDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await salesOrderModel.getOrderById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${id} not found.` },
      });
    }

    // Role check: Salesman can only update their own orders
    const userRole = (req.user.role || '').toUpperCase();
    if (userRole === 'SALESMAN' && existing.salesman_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only update your own sales orders.' },
      });
    }

    const updated = await salesOrderModel.updateOrderDraft(id, req.body, req.user.id);

    return res.status(200).json({
      success: true,
      message: `Sales Order ${updated.order_number} updated successfully.`,
      order: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * 6. POST /api/sales/orders/:id/submit
 * Submit Draft or Returned Order for Approval
 */
const submitOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await salesOrderModel.getOrderById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${id} not found.` },
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (userRole === 'SALESMAN' && existing.salesman_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only submit your own sales orders.' },
      });
    }

    const submitted = await salesOrderModel.submitOrder(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: `Sales Order ${submitted.order_number} submitted for manager approval.`,
      order: submitted,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * 7. POST /api/sales/orders/:id/approve
 * Admin / Owner approves order
 */
const approveOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const approved = await salesOrderModel.approveOrder(id, req.user.id, notes);

    if (!approved) {
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${id} not found.` },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Sales Order ${approved.order_number} has been approved for production allocation.`,
      order: approved,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * 8. POST /api/sales/orders/:id/reject
 * Admin / Owner rejects order with mandatory rejection reason
 */
const rejectOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'A mandatory rejection reason is required to reject an order.' },
      });
    }

    const rejected = await salesOrderModel.rejectOrder(id, req.user.id, reason);

    if (!rejected) {
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${id} not found.` },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Sales Order ${rejected.order_number} has been rejected.`,
      order: rejected,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * 9. POST /api/sales/orders/:id/return
 * Admin / Owner returns order for salesman correction
 */
const returnOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'A reason must be provided when returning an order for correction.' },
      });
    }

    const returned = await salesOrderModel.returnOrder(id, req.user.id, reason);

    if (!returned) {
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${id} not found.` },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Sales Order ${returned.order_number} returned to salesman for correction.`,
      order: returned,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * 10. PATCH /api/sales/orders/:id/status
 * Update workflow status (IN_PRODUCTION, READY, DISPATCHED, CANCELLED)
 */
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Target status is required.' },
      });
    }

    const updated = await salesOrderModel.updateOrderStatus(id, status, req.user.id, reason);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${id} not found.` },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { message: error.message },
    });
  }
};

/**
 * 11. GET /api/sales/stats
 * Dashboard summary statistics
 */
const getStats = async (req, res, next) => {
  try {
    const userRole = (req.user.role || '').toUpperCase();
    const salesmanId = userRole === 'SALESMAN' ? req.user.id : req.query.salesman_id;

    const stats = await salesOrderModel.getDashboardStats({
      salesman_id: salesmanId,
      customer_id: req.query.customer_id,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 12. GET /api/sales/customers/:id/history
 * Customer-wise order history and spend
 */
const getCustomerHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { search, status, date_from, date_to } = req.query;

    const history = await salesOrderModel.getCustomerOrderHistory(id, {
      search,
      status,
      date_from,
      date_to,
    });

    return res.status(200).json({
      success: true,
      ...history,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: { message: error.message },
      });
    }
    next(error);
  }
};

/**
 * 13. GET /api/sales/orders/:id/print
 * Render or return printable Sales Order document
 */
const generateOrderPdfHtml = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await salesOrderModel.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: `Order ID ${id} not found.` },
      });
    }

    const companyName = process.env.COMPANY_NAME || 'Sri Meenakshi Agro & Traditional Foods Pvt Ltd';
    const companyGstin = process.env.COMPANY_GSTIN || '33AAAAA0000A1Z5';
    const companyStateCode = process.env.COMPANY_STATE_CODE || '33';
    const companyAddress = process.env.COMPANY_ADDRESS || 'Plot No. 42-B, SIDCO Industrial Estate, Kappalur, Madurai, TN - 625008';

    const isIntrastate = (order.customer_state_code || '33') === '33';

    // Build line item rows HTML
    const itemsHtml = (order.items || [])
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 8px 6px; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px 6px; font-weight: 600; color: #1e293b;">
            ${it.product_name}
            <div style="font-size: 9px; color: #64748b; font-weight: normal;">SKU: ${it.product_sku || '—'} | Pack: ${it.pack_size || it.unit || ''}</div>
          </td>
          <td style="padding: 8px 6px; text-align: center;">${it.hsn_code || '2106'}</td>
          <td style="padding: 8px 6px; text-align: right; font-weight: 600;">${parseFloat(it.quantity).toFixed(2)} ${it.unit || ''}</td>
          <td style="padding: 8px 6px; text-align: right;">₹${parseFloat(it.unit_price).toFixed(2)}</td>
          <td style="padding: 8px 6px; text-align: right;">₹${parseFloat(it.discount_amount || 0).toFixed(2)}</td>
          <td style="padding: 8px 6px; text-align: right; font-weight: 600;">₹${parseFloat(it.taxable_amount).toFixed(2)}</td>
          <td style="padding: 8px 6px; text-align: center;">${parseFloat(it.gst_rate).toFixed(1)}%</td>
          ${
            isIntrastate
              ? `<td style="padding: 8px 6px; text-align: right;">₹${parseFloat(it.cgst_amount || 0).toFixed(2)}</td>
                 <td style="padding: 8px 6px; text-align: right;">₹${parseFloat(it.sgst_amount || 0).toFixed(2)}</td>`
              : `<td style="padding: 8px 6px; text-align: right;" colspan="2">₹${parseFloat(it.igst_amount || 0).toFixed(2)}</td>`
          }
          <td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #0f172a;">₹${parseFloat(it.total_amount).toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sales Order - ${order.order_number}</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      background: #f8fafc;
    }
    .page-container {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 42px;
      font-weight: 900;
      color: rgba(226, 232, 240, 0.65);
      white-space: nowrap;
      pointer-events: none;
      letter-spacing: 4px;
      border: 4px dashed rgba(203, 213, 225, 0.8);
      padding: 12px 32px;
      border-radius: 12px;
      text-transform: uppercase;
      z-index: 1;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
      position: relative;
      z-index: 2;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-approved { background: #dcfce7; color: #15803d; }
    .badge-submitted { background: #dbeafe; color: #1d4ed8; }
    .badge-draft { background: #f1f5f9; color: #475569; }
    .badge-rejected { background: #fee2e2; color: #b91c1c; }
    @media print {
      body { background: #fff; padding: 0; }
      .page-container { border: none; box-shadow: none; padding: 20px; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 860px; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center;">
    <a href="javascript:window.history.back()" style="font-size: 12px; color: #475569; text-decoration: none; font-weight: 600;">← Back to ERP</a>
    <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">🖨️ Print Sales Order</button>
  </div>

  <div class="page-container">
    <div class="watermark">SALES ORDER - NOT A TAX INVOICE</div>

    <!-- Company Header -->
    <div class="header">
      <div>
        <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${companyName}</div>
        <div style="font-size: 11px; color: #475569; margin-top: 3px;">${companyAddress}</div>
        <div style="font-size: 11px; color: #0f172a; margin-top: 4px; font-weight: 600;">
          GSTIN: <span style="font-family: monospace;">${companyGstin}</span> | State Code: ${companyStateCode} (Tamil Nadu)
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 20px; font-weight: 900; color: #0284c7; letter-spacing: 1px;">SALES ORDER</div>
        <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px;"># ${order.order_number}</div>
        <div style="margin-top: 6px;">
          <span class="badge ${order.status === 'APPROVED' ? 'badge-approved' : order.status === 'SUBMITTED' ? 'badge-submitted' : order.status === 'REJECTED' ? 'badge-rejected' : 'badge-draft'}">
            Status: ${order.status}
          </span>
        </div>
      </div>
    </div>

    <!-- Order Meta & Customer Info -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; position: relative; z-index: 2;">
      <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px;">
        <div style="font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Customer Details (Bill To)</div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${order.customer_name}</div>
        <div style="color: #475569; margin-top: 2px;">GSTIN: <span style="font-family: monospace; font-weight: 600;">${order.customer_gstin}</span></div>
        <div style="color: #475569; margin-top: 2px;">Phone: ${order.customer_phone}</div>
        <div style="color: #475569; margin-top: 2px;">Delivery Address: ${order.delivery_address || '—'}</div>
        <div style="color: #475569; margin-top: 2px;">State: ${order.customer_state} (State Code: ${order.customer_state_code})</div>
      </div>

      <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px;">
        <div style="font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Order Logistics</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #64748b;">Order Date:</span>
          <span style="font-weight: 600;">${order.order_date}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #64748b;">Expected Delivery:</span>
          <span style="font-weight: 600;">${order.expected_delivery_date || 'Standard (3 Days)'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #64748b;">Payment Terms:</span>
          <span style="font-weight: 600;">${order.payment_terms || 'Net 30'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #64748b;">Sales Representative:</span>
          <span style="font-weight: 600;">${order.salesman_name}</span>
        </div>
        ${order.approved_by ? `
        <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
          <span style="color: #15803d; font-weight: 600;">Approved By:</span>
          <span style="color: #15803d; font-weight: 700;">${order.approver_name || 'Admin'}</span>
        </div>` : ''}
      </div>
    </div>

    <!-- Line Items Table -->
    <div style="position: relative; z-index: 2; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #0f172a; color: #fff; font-size: 10px; text-transform: uppercase;">
            <th style="padding: 8px 6px; text-align: center;">#</th>
            <th style="padding: 8px 6px;">Item Description</th>
            <th style="padding: 8px 6px; text-align: center;">HSN</th>
            <th style="padding: 8px 6px; text-align: right;">Qty</th>
            <th style="padding: 8px 6px; text-align: right;">Rate</th>
            <th style="padding: 8px 6px; text-align: right;">Disc</th>
            <th style="padding: 8px 6px; text-align: right;">Taxable</th>
            <th style="padding: 8px 6px; text-align: center;">GST</th>
            ${
              isIntrastate
                ? `<th style="padding: 8px 6px; text-align: right;">CGST</th>
                   <th style="padding: 8px 6px; text-align: right;">SGST</th>`
                : `<th style="padding: 8px 6px; text-align: right;" colspan="2">IGST</th>`
            }
            <th style="padding: 8px 6px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Totals Summary & Tax Calculation Breakdown -->
    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; position: relative; z-index: 2; margin-bottom: 24px;">
      <div style="font-size: 11px; color: #475569; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Taxation Notes & Dispatch Instructions:</div>
        <ul style="margin: 0; padding-left: 18px; line-height: 1.6;">
          <li>Jurisdiction: <strong>${isIntrastate ? 'Intrastate (Tamil Nadu - CGST + SGST applied)' : 'Interstate (IGST applied)'}</strong>.</li>
          <li>Perishable Traditional Food Products: Store idli/dosa batter at 2°C - 5°C.</li>
          <li>This sales order is an internal authorization order. Tax Invoice will be generated upon final warehouse dispatch.</li>
          ${order.order_notes ? `<li>Customer Note: <em>"${order.order_notes}"</em></li>` : ''}
        </ul>
      </div>

      <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Gross Subtotal:</span>
          <span style="font-weight: 600;">₹${parseFloat(order.subtotal_amount).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Line Discounts:</span>
          <span style="color: #b91c1c;">- ₹${parseFloat(order.discount_amount).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-weight: 600;">
          <span>Taxable Value:</span>
          <span>₹${parseFloat(order.taxable_amount).toFixed(2)}</span>
        </div>
        ${
          isIntrastate
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #64748b;">
                 <span>CGST (Central Tax):</span>
                 <span>₹${parseFloat(order.cgst_amount).toFixed(2)}</span>
               </div>
               <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #64748b;">
                 <span>SGST (State Tax):</span>
                 <span>₹${parseFloat(order.sgst_amount).toFixed(2)}</span>
               </div>`
            : `<div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #64748b;">
                 <span>IGST (Integrated Tax):</span>
                 <span>₹${parseFloat(order.igst_amount).toFixed(2)}</span>
               </div>`
        }
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b;">
          <span>Total GST:</span>
          <span>₹${parseFloat(order.total_tax_amount).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 2px solid #0f172a; font-size: 14px; font-weight: 900; color: #0f172a;">
          <span>Grand Total:</span>
          <span style="color: #0284c7;">₹${parseFloat(order.grand_total).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; position: relative; z-index: 2; font-size: 11px;">
      <div style="text-align: center; width: 200px;">
        <div style="font-weight: 600; color: #0f172a;">${order.salesman_name}</div>
        <div style="height: 1px; background: #94a3b8; margin: 4px 0 2px;"></div>
        <div style="color: #64748b; font-size: 10px;">Sales Executive Signature</div>
      </div>
      <div style="text-align: center; width: 220px;">
        <div style="font-weight: 700; color: #0f172a;">For ${companyName}</div>
        <div style="height: 35px;"></div>
        <div style="height: 1px; background: #0f172a; margin: 4px 0 2px;"></div>
        <div style="color: #0f172a; font-weight: 700; font-size: 10px;">Authorized Signatory / Plant Manager</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.status(200).send(html);
    }

    return res.status(200).json({
      success: true,
      html,
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listOrders,
  getOrder,
  previewPricing,
  createOrder,
  updateDraft,
  submitOrder,
  approveOrder,
  rejectOrder,
  returnOrder,
  updateStatus,
  getStats,
  getCustomerHistory,
  generateOrderPdfHtml,
};
