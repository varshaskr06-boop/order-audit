import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import SalesmanDashboard from './pages/SalesmanDashboard';
import ProductionDashboard from './pages/ProductionDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';

// Phase 3 Master Data Pages
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import RawMaterialsPage from './pages/RawMaterialsPage';
import PackagingMaterialsPage from './pages/PackagingMaterialsPage';
import BOMPage from './pages/BOMPage';

// Phase 4 Sales Order Pages
import SalesOrderDashboard from './pages/SalesOrderDashboard';
import CreateSalesOrderPage from './pages/CreateSalesOrderPage';
import SalesOrderListPage from './pages/SalesOrderListPage';
import SalesOrderDetailsPage from './pages/SalesOrderDetailsPage';
import OrderApprovalDashboard from './pages/OrderApprovalDashboard';
import CustomerOrderHistoryPage from './pages/CustomerOrderHistoryPage';

// Phase 5 Procurement Pages
import PurchaseDashboard from './pages/PurchaseDashboard';
import PurchaseRequisitionPage from './pages/PurchaseRequisitionPage';
import SupplierQuotationPage from './pages/SupplierQuotationPage';
import QuotationComparisonPage from './pages/QuotationComparisonPage';
import PurchaseOrderPage from './pages/PurchaseOrderPage';
import PurchaseApprovalDashboard from './pages/PurchaseApprovalDashboard';
import GoodsReceivedNotePage from './pages/GoodsReceivedNotePage';
import SupplierInvoicePage from './pages/SupplierInvoicePage';
import ThreeWayMatchingPage from './pages/ThreeWayMatchingPage';
import PurchaseReportsPage from './pages/PurchaseReportsPage';

// Phase 6 Inventory Management Pages
import InventoryDashboard from './pages/InventoryDashboard';
import RawMaterialInventoryPage from './pages/RawMaterialInventoryPage';
import PackagingInventoryPage from './pages/PackagingInventoryPage';
import FinishedGoodsInventoryPage from './pages/FinishedGoodsInventoryPage';
import StockInwardPage from './pages/StockInwardPage';
import StockOutwardPage from './pages/StockOutwardPage';
import StockAdjustmentPage from './pages/StockAdjustmentPage';
import BatchExpiryManagementPage from './pages/BatchExpiryManagementPage';
import StockTransferPage from './pages/StockTransferPage';
import PhysicalStockVerificationPage from './pages/PhysicalStockVerificationPage';
import InventoryReportsPage from './pages/InventoryReportsPage';

// Phase 7 Production Management Pages
import ProductionManagementDashboard from './pages/ProductionManagementDashboard';
import ProductionPlanningPage from './pages/ProductionPlanningPage';
import ProductionOrdersPage from './pages/ProductionOrdersPage';
import MaterialIssuePage from './pages/MaterialIssuePage';
import MaterialReturnPage from './pages/MaterialReturnPage';
import ProductionExecutionPage from './pages/ProductionExecutionPage';
import ProductionBatchPage from './pages/ProductionBatchPage';
import FinishedGoodsReceiptPage from './pages/FinishedGoodsReceiptPage';
import ProductionReportsPage from './pages/ProductionReportsPage';

// Phase 8 Quality Control Pages
import QualityDashboard from './pages/QualityDashboard';

// Phase 9 Product Costing Pages
import CostingDashboard from './pages/CostingDashboard';
import LabourCostPage from './pages/LabourCostPage';
import MachineCostPage from './pages/MachineCostPage';
import OverheadManagementPage from './pages/OverheadManagementPage';
import BatchCostPage from './pages/BatchCostPage';
import SellingPricePage from './pages/SellingPricePage';
import CostVariancePage from './pages/CostVariancePage';
import ProductProfitabilityPage from './pages/ProductProfitabilityPage';
import CostingReportsPage from './pages/CostingReportsPage';

// Phase 10 GST Invoicing Pages
import InvoiceDashboard from './pages/InvoiceDashboard';
import InvoiceListPage from './pages/InvoiceListPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import InvoiceDetailsPage from './pages/InvoiceDetailsPage';
import CreditDebitNotesPage from './pages/CreditDebitNotesPage';
import TaxRatesPage from './pages/TaxRatesPage';
import CompanyTaxProfilePage from './pages/CompanyTaxProfilePage';
import CustomerGstPage from './pages/CustomerGstPage';
import GstReportsPage from './pages/GstReportsPage';
import QualityStandardsPage from './pages/QualityStandardsPage';
import RawMaterialInspectionPage from './pages/RawMaterialInspectionPage';
import PackagingInspectionPage from './pages/PackagingInspectionPage';
import ProductionQualityPage from './pages/ProductionQualityPage';
import FinishedGoodsQualityPage from './pages/FinishedGoodsQualityPage';
import DefectsRejectionsPage from './pages/DefectsRejectionsPage';
import CapaManagementPage from './pages/CapaManagementPage';
import QualityReportsPage from './pages/QualityReportsPage';

// Phase 11 Dispatch & Delivery Management Pages
import DispatchDashboard from './pages/DispatchDashboard';
import DispatchOrdersPage from './pages/DispatchOrdersPage';
import CreateDispatchPage from './pages/CreateDispatchPage';
import PackingManagementPage from './pages/PackingManagementPage';
import DeliveryChallansPage from './pages/DeliveryChallansPage';
import TransportersPage from './pages/TransportersPage';
import ShipmentTrackingPage from './pages/ShipmentTrackingPage';
import ProofOfDeliveryPage from './pages/ProofOfDeliveryPage';
import DeliveryReturnsPage from './pages/DeliveryReturnsPage';
import DispatchReportsPage from './pages/DispatchReportsPage';

// Phase 12 Payment Management Pages
import PaymentDashboard from './pages/PaymentDashboard';
import CustomerReceiptsPage from './pages/CustomerReceiptsPage';
import RecordCustomerPaymentPage from './pages/RecordCustomerPaymentPage';
import SupplierPaymentsPage from './pages/SupplierPaymentsPage';
import RecordSupplierPaymentPage from './pages/RecordSupplierPaymentPage';
import PaymentApprovalsPage from './pages/PaymentApprovalsPage';
import BankAccountsPage from './pages/BankAccountsPage';
import BankReconciliationPage from './pages/BankReconciliationPage';
import OutstandingReportsPage from './pages/OutstandingReportsPage';
import AgingReportsPage from './pages/AgingReportsPage';
import CustomerStatementsPage from './pages/CustomerStatementsPage';
import SupplierStatementsPage from './pages/SupplierStatementsPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';

// Phase 13 Audit Management Pages
import AuditDashboard from './pages/AuditDashboard';
import AuditPlanningPage from './pages/AuditPlanningPage';
import AuditSchedulePage from './pages/AuditSchedulePage';
import ChecklistTemplatesPage from './pages/ChecklistTemplatesPage';
import ConductAuditPage from './pages/ConductAuditPage';
import TransactionAuditPage from './pages/TransactionAuditPage';
import AuditFindingsPage from './pages/AuditFindingsPage';
import RiskAssessmentPage from './pages/RiskAssessmentPage';
import AuditCapaPage from './pages/AuditCapaPage';
import EvidenceManagementPage from './pages/EvidenceManagementPage';
import AuditReportsPage from './pages/AuditReportsPage';
import AuditHistoryPage from './pages/AuditHistoryPage';

// Phase 14 Reports & Analytics Pages
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import SalesAnalyticsPage from './pages/SalesAnalyticsPage';
import PurchaseAnalyticsPage from './pages/PurchaseAnalyticsPage';
import InventoryAnalyticsPage from './pages/InventoryAnalyticsPage';
import ProductionAnalyticsPage from './pages/ProductionAnalyticsPage';
import QualityAnalyticsPage from './pages/QualityAnalyticsPage';
import CostingAnalyticsPage from './pages/CostingAnalyticsPage';
import GstAnalyticsPage from './pages/GstAnalyticsPage';
import DispatchAnalyticsPage from './pages/DispatchAnalyticsPage';
import PaymentAnalyticsPage from './pages/PaymentAnalyticsPage';
import AuditAnalyticsPage from './pages/AuditAnalyticsPage';
import SavedReportsPage from './pages/SavedReportsPage';
import ScheduledReportsPage from './pages/ScheduledReportsPage';
import ReportExecutionHistoryPage from './pages/ReportExecutionHistoryPage';

import { ShieldAlert, ArrowLeft } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, activePage, setActivePage } = useAuth();

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  const role = (user.role || '').toUpperCase();

  const renderForbidden = (moduleTitle) => (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-rose-200 text-center shadow-md space-y-4">
      <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">Access Denied (HTTP 403 Forbidden)</h3>
      <p className="text-xs text-slate-600 leading-relaxed">
        Your assigned role <span className="font-bold text-rose-700">{role}</span> does not have authorization to access the <span className="font-semibold text-slate-900">{moduleTitle}</span> module.
      </p>
      <button
        onClick={() => setActivePage('dashboard')}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Return to My Dashboard
      </button>
    </div>
  );

  // Route selector with strict role-based access control
  const renderPage = () => {
    // 1. Universal Pages
    if (activePage === 'profile') return <ProfilePage />;

    // 2. Phase 4: Sales Management
    if (activePage === 'sales-dashboard') {
      if (['ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'].includes(role)) {
        return <SalesOrderDashboard />;
      }
      return renderForbidden('Sales Dashboard');
    }

    if (activePage === 'sales-orders') {
      return <SalesOrderListPage />;
    }

    if (activePage === 'create-sales-order') {
      if (['ADMIN', 'OWNER', 'SALESMAN'].includes(role)) {
        return <CreateSalesOrderPage />;
      }
      return renderForbidden('Create Sales Order');
    }

    if (activePage === 'sales-order-details') {
      return <SalesOrderDetailsPage />;
    }

    if (activePage === 'order-approvals') {
      if (['ADMIN', 'OWNER'].includes(role)) {
        return <OrderApprovalDashboard />;
      }
      return renderForbidden('Order Approvals');
    }

    if (activePage === 'customer-history') {
      if (['ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'].includes(role)) {
        return <CustomerOrderHistoryPage />;
      }
      return renderForbidden('Customer Order History');
    }

    // 3. Phase 5: Purchase & Procurement Management
    if (activePage === 'purchase-dashboard') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) {
        return <PurchaseDashboard />;
      }
      return renderForbidden('Purchase Dashboard');
    }

    if (activePage === 'purchase-requisitions') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) {
        return <PurchaseRequisitionPage />;
      }
      return renderForbidden('Purchase Requisitions');
    }

    if (activePage === 'supplier-quotations') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) {
        return <SupplierQuotationPage />;
      }
      return renderForbidden('Supplier Quotations');
    }

    if (activePage === 'quotation-comparison') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) {
        return <QuotationComparisonPage />;
      }
      return renderForbidden('Quotation Comparison');
    }

    if (activePage === 'purchase-orders') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) {
        return <PurchaseOrderPage />;
      }
      return renderForbidden('Purchase Orders');
    }

    if (activePage === 'purchase-approvals') {
      if (['ADMIN', 'OWNER'].includes(role)) {
        return <PurchaseApprovalDashboard />;
      }
      return renderForbidden('Purchase Approvals');
    }

    if (activePage === 'goods-receipts') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) {
        return <GoodsReceivedNotePage />;
      }
      return renderForbidden('Goods Received Notes');
    }

    if (activePage === 'supplier-invoices') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) {
        return <SupplierInvoicePage />;
      }
      return renderForbidden('Supplier Invoices');
    }

    if (activePage === 'three-way-matching') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) {
        return <ThreeWayMatchingPage />;
      }
      return renderForbidden('Three-Way Matching');
    }

    if (activePage === 'purchase-reports') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) {
        return <PurchaseReportsPage />;
      }
      return renderForbidden('Purchase Reports');
    }

    // Phase 6: Inventory Management
    if (activePage === 'inventory-dashboard') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <InventoryDashboard />;
      return renderForbidden('Inventory Dashboard');
    }
    if (activePage === 'raw-materials-inventory') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <RawMaterialInventoryPage />;
      return renderForbidden('Raw Material Inventory');
    }
    if (activePage === 'packaging-inventory') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <PackagingInventoryPage />;
      return renderForbidden('Packaging Inventory');
    }
    if (activePage === 'finished-goods-inventory') {
      return <FinishedGoodsInventoryPage />;
    }
    if (activePage === 'stock-inward') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <StockInwardPage />;
      return renderForbidden('Stock Inward');
    }
    if (activePage === 'stock-outward') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <StockOutwardPage />;
      return renderForbidden('Stock Outward');
    }
    if (activePage === 'stock-adjustment') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <StockAdjustmentPage />;
      return renderForbidden('Stock Adjustments');
    }
    if (activePage === 'batch-expiry') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <BatchExpiryManagementPage />;
      return renderForbidden('Batch & Expiry Management');
    }
    if (activePage === 'stock-transfer') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <StockTransferPage />;
      return renderForbidden('Stock Transfer');
    }
    if (activePage === 'physical-stock') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <PhysicalStockVerificationPage />;
      return renderForbidden('Physical Stock Verification');
    }
    if (activePage === 'inventory-reports') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <InventoryReportsPage />;
      return renderForbidden('Inventory Reports');
    }

    // Phase 7: Production Management
    if (activePage === 'production-dashboard') {
      return <ProductionManagementDashboard />;
    }
    if (activePage === 'production-planning') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <ProductionPlanningPage />;
      return renderForbidden('Production Planning');
    }
    if (activePage === 'production-orders') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <ProductionOrdersPage />;
      return renderForbidden('Production Orders');
    }
    if (activePage === 'material-issue') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <MaterialIssuePage />;
      return renderForbidden('Material Issue');
    }
    if (activePage === 'material-return') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <MaterialReturnPage />;
      return renderForbidden('Material Return');
    }
    if (activePage === 'production-execution') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <ProductionExecutionPage />;
      return renderForbidden('Production Execution');
    }
    if (activePage === 'production-batches') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <ProductionBatchPage />;
      return renderForbidden('Production Batches');
    }
    if (activePage === 'fg-receipt') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <FinishedGoodsReceiptPage />;
      return renderForbidden('Finished Goods Inward');
    }
    if (activePage === 'production-reports') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role)) return <ProductionReportsPage />;
      return renderForbidden('Production Reports');
    }

    // Phase 8: Quality Control Management
    if (activePage === 'qc-dashboard') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <QualityDashboard />;
      return renderForbidden('Quality Control Dashboard');
    }
    if (activePage === 'qc-standards') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <QualityStandardsPage />;
      return renderForbidden('Quality Standards');
    }
    if (activePage === 'qc-rm-inspection') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <RawMaterialInspectionPage />;
      return renderForbidden('Raw Material QC Inspection');
    }
    if (activePage === 'qc-pkg-inspection') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <PackagingInspectionPage />;
      return renderForbidden('Packaging QC Inspection');
    }
    if (activePage === 'qc-in-process') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <ProductionQualityPage />;
      return renderForbidden('In-Process Quality Inspection');
    }
    if (activePage === 'qc-fg-inspection') {
      return <FinishedGoodsQualityPage />;
    }
    if (activePage === 'qc-defects') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <DefectsRejectionsPage />;
      return renderForbidden('Defects & Rejections Log');
    }
    if (activePage === 'qc-capa') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <CapaManagementPage />;
      return renderForbidden('CAPA & Quality Incidents');
    }
    if (activePage === 'qc-reports') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role)) return <QualityReportsPage />;
      return renderForbidden('Quality Reports');
    }

    // Phase 9: Product Costing Management
    if (activePage === 'costing-dashboard') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <CostingDashboard />;
      return renderForbidden('Costing Dashboard');
    }
    if (activePage === 'costing-labour') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <LabourCostPage />;
      return renderForbidden('Labour Cost Management');
    }
    if (activePage === 'costing-machines') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <MachineCostPage />;
      return renderForbidden('Machine & Electricity Costs');
    }
    if (activePage === 'costing-overhead') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <OverheadManagementPage />;
      return renderForbidden('Overhead & Allocation');
    }
    if (activePage === 'costing-batches') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <BatchCostPage />;
      return renderForbidden('Batch Cost Calculation');
    }
    if (activePage === 'costing-selling-prices') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <SellingPricePage />;
      return renderForbidden('Selling Prices & GST');
    }
    if (activePage === 'costing-variance') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <CostVariancePage />;
      return renderForbidden('Planned vs Actual Variance');
    }
    if (activePage === 'costing-profitability') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'].includes(role)) return <ProductProfitabilityPage />;
      return renderForbidden('Product Profitability');
    }
    if (activePage === 'costing-reports') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role)) return <CostingReportsPage />;
      return renderForbidden('Costing Reports');
    }

    // Phase 10: GST Billing and Invoicing
    if (activePage === 'invoicing-dashboard') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <InvoiceDashboard />;
      return renderForbidden('Invoice Dashboard');
    }
    if (activePage === 'invoices') {
      return <InvoiceListPage />;
    }
    if (activePage === 'create-invoice') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <CreateInvoicePage />;
      return renderForbidden('Generate Tax Invoice');
    }
    if (activePage === 'invoice-details') {
      return <InvoiceDetailsPage />;
    }
    if (activePage === 'credit-debit-notes') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <CreditDebitNotesPage />;
      return renderForbidden('Credit & Debit Notes');
    }
    if (activePage === 'tax-rates') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <TaxRatesPage />;
      return renderForbidden('Tax Rates Configuration');
    }
    if (activePage === 'company-tax-profile') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <CompanyTaxProfilePage />;
      return renderForbidden('Company Tax Profile');
    }
    if (activePage === 'customer-gst') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <CustomerGstPage />;
      return renderForbidden('Customer GST Registry');
    }
    if (activePage === 'gst-reports') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <GstReportsPage />;
      return renderForbidden('GST Reports');
    }

    // Phase 11: Dispatch and Delivery Management Routes
    if (activePage === 'dispatch-dashboard') {
      return <DispatchDashboard />;
    }
    if (activePage === 'dispatch-orders') {
      return <DispatchOrdersPage />;
    }
    if (activePage === 'create-dispatch') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <CreateDispatchPage />;
      return renderForbidden('Create Dispatch Order');
    }
    if (activePage === 'packing-management') {
      return <PackingManagementPage />;
    }
    if (activePage === 'delivery-challans') {
      return <DeliveryChallansPage />;
    }
    if (activePage === 'transporters') {
      return <TransportersPage />;
    }
    if (activePage === 'shipment-tracking') {
      return <ShipmentTrackingPage />;
    }
    if (activePage === 'proof-of-delivery') {
      return <ProofOfDeliveryPage />;
    }
    if (activePage === 'delivery-returns') {
      return <DeliveryReturnsPage />;
    }
    if (activePage === 'dispatch-reports') {
      return <DispatchReportsPage />;
    }

    // Phase 12: Payment Management System Routes
    if (activePage === 'payment-dashboard') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <PaymentDashboard />;
      return renderForbidden('Payment Dashboard');
    }
    if (activePage === 'customer-receipts') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <CustomerReceiptsPage />;
      return renderForbidden('Customer Receipts');
    }
    if (activePage === 'record-customer-payment') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <RecordCustomerPaymentPage />;
      return renderForbidden('Record Customer Payment');
    }
    if (activePage === 'supplier-payments') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <SupplierPaymentsPage />;
      return renderForbidden('Supplier Payments');
    }
    if (activePage === 'record-supplier-payment') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <RecordSupplierPaymentPage />;
      return renderForbidden('Record Supplier Payment');
    }
    if (activePage === 'payment-approvals') {
      if (['ADMIN', 'OWNER'].includes(role)) return <PaymentApprovalsPage />;
      return renderForbidden('Payment Approvals (> ₹50,000)');
    }
    if (activePage === 'bank-accounts') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <BankAccountsPage />;
      return renderForbidden('Cash & Bank Accounts');
    }
    if (activePage === 'bank-reconciliation') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <BankReconciliationPage />;
      return renderForbidden('Bank Reconciliation');
    }
    if (activePage === 'outstanding-reports') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <OutstandingReportsPage />;
      return renderForbidden('Outstanding Reports');
    }
    if (activePage === 'aging-reports') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <AgingReportsPage />;
      return renderForbidden('Aging Analysis Reports');
    }
    if (activePage === 'customer-statements') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <CustomerStatementsPage />;
      return renderForbidden('Customer Statements');
    }
    if (activePage === 'supplier-statements') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <SupplierStatementsPage />;
      return renderForbidden('Supplier Statements');
    }
    if (activePage === 'payment-history') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <PaymentHistoryPage />;
      return renderForbidden('Payment Transaction History');
    }

    // Phase 13: Audit Management System Routes
    if (activePage === 'audit-dashboard') {
      return <AuditDashboard />;
    }
    if (activePage === 'audit-planning') {
      return <AuditPlanningPage />;
    }
    if (activePage === 'audit-schedule') {
      return <AuditSchedulePage />;
    }
    if (activePage === 'checklist-templates') {
      return <ChecklistTemplatesPage />;
    }
    if (activePage === 'conduct-audit') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role)) return <ConductAuditPage />;
      return renderForbidden('Conduct Audit');
    }
    if (activePage === 'transaction-audit') {
      return <TransactionAuditPage />;
    }
    if (activePage === 'audit-findings') {
      return <AuditFindingsPage />;
    }
    if (activePage === 'risk-assessment') {
      return <RiskAssessmentPage />;
    }
    if (activePage === 'audit-capa') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role)) return <AuditCapaPage />;
      return renderForbidden('Audit CAPA Management');
    }
    if (activePage === 'evidence-management') {
      return <EvidenceManagementPage />;
    }
    if (activePage === 'audit-reports') {
      return <AuditReportsPage />;
    }
    if (activePage === 'audit-history') {
      return <AuditHistoryPage />;
    }

    // Phase 14: Reports & Analytics System Routes
    if (activePage === 'executive-dashboard') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <ExecutiveDashboard />;
      return renderForbidden('Executive Dashboard');
    }
    if (activePage === 'analytics-sales') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'].includes(role)) return <SalesAnalyticsPage />;
      return renderForbidden('Sales Analytics');
    }
    if (activePage === 'analytics-purchase') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <PurchaseAnalyticsPage />;
      return renderForbidden('Purchase Analytics');
    }
    if (activePage === 'analytics-inventory') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role)) return <InventoryAnalyticsPage />;
      return renderForbidden('Inventory Analytics');
    }
    if (activePage === 'analytics-production') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <ProductionAnalyticsPage />;
      return renderForbidden('Production Analytics');
    }
    if (activePage === 'analytics-quality') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) return <QualityAnalyticsPage />;
      return renderForbidden('Quality Analytics');
    }
    if (activePage === 'analytics-costing') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <CostingAnalyticsPage />;
      return renderForbidden('Costing Analytics');
    }
    if (activePage === 'analytics-gst') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <GstAnalyticsPage />;
      return renderForbidden('GST Analytics');
    }
    if (activePage === 'analytics-dispatch') {
      if (['ADMIN', 'OWNER', 'PRODUCTION', 'SALESMAN'].includes(role)) return <DispatchAnalyticsPage />;
      return renderForbidden('Dispatch Analytics');
    }
    if (activePage === 'analytics-payments') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <PaymentAnalyticsPage />;
      return renderForbidden('Payment Analytics');
    }
    if (activePage === 'analytics-audit') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role)) return <AuditAnalyticsPage />;
      return renderForbidden('Audit Compliance Analytics');
    }
    if (activePage === 'saved-reports') {
      return <SavedReportsPage />;
    }
    if (activePage === 'scheduled-reports') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) return <ScheduledReportsPage />;
      return renderForbidden('Scheduled Report Automations');
    }
    if (activePage === 'report-logs') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'].includes(role)) return <ReportExecutionHistoryPage />;
      return renderForbidden('Report Execution Logs');
    }

    // 4. Master Data: Products (All roles can view, only Admin/Owner edit)
    if (activePage === 'products') return <ProductsPage />;

    // 4. Master Data: Customers (Admin, Owner, Salesman, Accountant)
    if (activePage === 'customers') {
      if (['ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'].includes(role)) {
        return <CustomersPage />;
      }
      return renderForbidden('Customer Management');
    }

    // 5. Master Data: Suppliers (Admin, Owner, Accountant)
    if (activePage === 'suppliers') {
      if (['ADMIN', 'OWNER', 'ACCOUNTANT'].includes(role)) {
        return <SuppliersPage />;
      }
      return renderForbidden('Supplier Management');
    }

    // 6. Master Data: Raw Materials (Admin, Owner, Production)
    if (activePage === 'raw-materials') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) {
        return <RawMaterialsPage />;
      }
      return renderForbidden('Raw Material Management');
    }

    // 7. Master Data: Packaging Materials (Admin, Owner, Production)
    if (activePage === 'packaging-materials') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) {
        return <PackagingMaterialsPage />;
      }
      return renderForbidden('Packaging Material Management');
    }

    // 8. Master Data: BOM (Admin, Owner, Production)
    if (activePage === 'boms') {
      if (['ADMIN', 'OWNER', 'PRODUCTION'].includes(role)) {
        return <BOMPage />;
      }
      return renderForbidden('Bill of Materials (BOM)');
    }

    // 9. User Management (Admin, Owner)
    if (activePage === 'users') {
      if (['ADMIN', 'OWNER'].includes(role)) {
        return <UserManagementPage />;
      }
      return renderForbidden('User Management');
    }

    // 10. Role-Specific Dashboards
    switch (role) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'SALESMAN':
        return <SalesmanDashboard />;
      case 'PRODUCTION':
        return <ProductionDashboard />;
      case 'ACCOUNTANT':
        return <AccountantDashboard />;
      case 'OWNER':
        return <OwnerDashboard />;
      default:
        return <SalesmanDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Persistent Status Bar */}
      <footer className="bg-white border-t border-slate-200 py-3 text-slate-500 text-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700">Phase 14: Reports &amp; Analytics System Active</span>
            <span className="text-slate-400">•</span>
            <span>Sri Meenakshi Agro &amp; Traditional Foods Pvt Ltd (TN 33)</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            GSTIN: 33AAAAA0000A1Z5 • 10 Subsystem Analytics • Automated Report Schedules • Executive Business Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
