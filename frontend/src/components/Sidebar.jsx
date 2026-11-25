import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Truck, 
  Wheat, 
  Package, 
  Layers, 
  UserCheck, 
  ChevronRight,
  ShoppingCart,
  FileText,
  PlusCircle,
  Clock,
  History,
  Scale,
  Receipt,
  PackageCheck,
  FileCheck,
  BarChart3,
  Warehouse,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  CalendarClock,
  ClipboardList,
  TrendingUp,
  Factory,
  PlaySquare,
  CalendarDays,
  RotateCcw,
  Tag,
  Activity,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Calculator,
  DollarSign,
  TrendingDown,
  PieChart,
  Gauge,
  Zap,
  BarChart2,
  Building2,
  Percent,
  Navigation,
  Box,
  CreditCard,
  Wallet,
  Landmark,
  CheckSquare,
  FileSearch,
  UploadCloud,
  BookmarkCheck,
  ShieldAlert,
  Briefcase
} from 'lucide-react';

export default function Sidebar() {
  const { user, activePage, setActivePage } = useAuth();

  if (!user) return null;
  const role = (user.role || '').toUpperCase();

  // Navigation items with role permissions
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'],
    },
    // Phase 4: Sales Management Section
    {
      id: 'sales-dashboard',
      label: 'Sales Dashboard',
      icon: ShoppingCart,
      roles: ['ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'],
      badge: 'Phase 4',
    },
    {
      id: 'sales-orders',
      label: 'Sales Orders',
      icon: FileText,
      roles: ['ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'create-sales-order',
      label: 'New Sales Order',
      icon: PlusCircle,
      roles: ['ADMIN', 'OWNER', 'SALESMAN'],
      badge: '+SO',
    },
    {
      id: 'order-approvals',
      label: 'Order Approvals',
      icon: Clock,
      roles: ['ADMIN', 'OWNER'],
      badge: 'Review',
    },
    {
      id: 'customer-history',
      label: 'Customer History',
      icon: History,
      roles: ['ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'],
    },
    // Phase 5: Purchase & Procurement Management
    {
      id: 'purchase-dashboard',
      label: 'Procurement Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'Phase 5',
    },
    {
      id: 'purchase-requisitions',
      label: 'Requisitions (PR)',
      icon: FileText,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'supplier-quotations',
      label: 'Vendor Quotations',
      icon: Truck,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
    },
    {
      id: 'quotation-comparison',
      label: 'Quote Comparison',
      icon: Scale,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Bids',
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders (PO)',
      icon: Package,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'purchase-approvals',
      label: 'Purchase Approvals',
      icon: FileCheck,
      roles: ['ADMIN', 'OWNER'],
      badge: 'Review',
    },
    {
      id: 'goods-receipts',
      label: 'Goods Receipts (GRN)',
      icon: PackageCheck,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'QC',
    },
    {
      id: 'supplier-invoices',
      label: 'Supplier Invoices',
      icon: Receipt,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
    },
    {
      id: 'three-way-matching',
      label: '3-Way Matching',
      icon: Scale,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Audit',
    },
    {
      id: 'purchase-reports',
      label: 'Purchase Reports',
      icon: BarChart3,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Reports',
    },
    // Phase 6: Inventory Management Section
    {
      id: 'inventory-dashboard',
      label: 'Inventory Dashboard',
      icon: Warehouse,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'Phase 6',
    },
    {
      id: 'raw-materials-inventory',
      label: 'RM Stock (Inventory)',
      icon: Boxes,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'packaging-inventory',
      label: 'Packaging Stock',
      icon: Package,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'finished-goods-inventory',
      label: 'Finished Goods Stock',
      icon: Layers,
      roles: ['ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'FG',
    },
    {
      id: 'stock-inward',
      label: 'Stock Inward (GRN)',
      icon: ArrowDownLeft,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
    },
    {
      id: 'stock-outward',
      label: 'Stock Outward (Issue)',
      icon: ArrowUpRight,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
    },
    {
      id: 'stock-adjustment',
      label: 'Stock Adjustments',
      icon: SlidersHorizontal,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'Approve',
    },
    {
      id: 'batch-expiry',
      label: 'Batch & Expiry (FEFO)',
      icon: CalendarClock,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'stock-transfer',
      label: 'Location Transfers',
      icon: ArrowLeftRight,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
    },
    {
      id: 'physical-stock',
      label: 'Physical Stock Audit',
      icon: ClipboardList,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'inventory-reports',
      label: 'Inventory Reports',
      icon: TrendingUp,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Reports',
    },
    // Phase 7: Production Management Section
    {
      id: 'production-dashboard',
      label: 'Production Dashboard',
      icon: Factory,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'Phase 7',
    },
    {
      id: 'production-planning',
      label: 'Production Planning',
      icon: CalendarDays,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
    },
    {
      id: 'production-orders',
      label: 'Production Orders',
      icon: ClipboardList,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'BOM',
    },
    {
      id: 'material-issue',
      label: 'Material Issue',
      icon: ArrowUpRight,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
    },
    {
      id: 'material-return',
      label: 'Material Returns',
      icon: RotateCcw,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
    },
    {
      id: 'production-execution',
      label: 'Shop Floor Run',
      icon: PlaySquare,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
      badge: 'Live',
    },
    {
      id: 'production-batches',
      label: 'Batch Tracking & QC',
      icon: Tag,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'QC',
    },
    {
      id: 'fg-receipt',
      label: 'FG Stock Inward',
      icon: PackageCheck,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
    },
    {
      id: 'production-reports',
      label: 'Production Reports',
      icon: BarChart3,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'],
      badge: 'Reports',
    },
    // Phase 8: Quality Control Management Section
    {
      id: 'qc-dashboard',
      label: 'Quality Dashboard',
      icon: ShieldCheck,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'Phase 8',
    },
    {
      id: 'qc-standards',
      label: 'Quality Standards',
      icon: SlidersHorizontal,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'qc-rm-inspection',
      label: 'Raw Material QC',
      icon: Wheat,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'GRN',
    },
    {
      id: 'qc-pkg-inspection',
      label: 'Packaging QC',
      icon: PackageCheck,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'qc-in-process',
      label: 'In-Process QC',
      icon: Factory,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'Line',
    },
    {
      id: 'qc-fg-inspection',
      label: 'FG Release QC',
      icon: CheckCircle2,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'Dispatch',
    },
    {
      id: 'qc-defects',
      label: 'Defects & Scrap',
      icon: XCircle,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'qc-capa',
      label: 'CAPA & Incidents',
      icon: AlertTriangle,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'Audit',
    },
    {
      id: 'qc-reports',
      label: 'Quality Reports',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'],
      badge: 'Reports',
    },
    // Phase 9: Product Costing Management Section
    {
      id: 'costing-dashboard',
      label: 'Costing Dashboard',
      icon: Calculator,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'Phase 9',
    },
    {
      id: 'costing-labour',
      label: 'Labour Costs',
      icon: Users,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'costing-machines',
      label: 'Machine & Power Costs',
      icon: Zap,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'costing-overhead',
      label: 'Overhead & Allocation',
      icon: Gauge,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
    },
    {
      id: 'costing-batches',
      label: 'Batch Cost Calculation',
      icon: Layers,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'costing-selling-prices',
      label: 'Selling Prices & GST',
      icon: DollarSign,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
    },
    {
      id: 'costing-variance',
      label: 'Planned vs Actual',
      icon: TrendingDown,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'costing-profitability',
      label: 'Product Profitability',
      icon: PieChart,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT'],
    },
    {
      id: 'costing-reports',
      label: 'Costing Reports',
      icon: BarChart2,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'],
      badge: 'Reports',
    },
    // Phase 10: GST Billing & Invoicing Section
    {
      id: 'invoicing-dashboard',
      label: 'Invoicing Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'Phase 10',
    },
    {
      id: 'invoices',
      label: 'Tax Invoices',
      icon: FileText,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN', 'PRODUCTION'],
    },
    {
      id: 'create-invoice',
      label: 'New Tax Invoice',
      icon: PlusCircle,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: '+INV',
    },
    {
      id: 'credit-debit-notes',
      label: 'Credit & Debit Notes',
      icon: Scale,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'CN/DN',
    },
    {
      id: 'tax-rates',
      label: 'GST Tax Rates',
      icon: Percent,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
    },
    {
      id: 'customer-gst',
      label: 'Customer GST Registry',
      icon: Users,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'],
    },
    {
      id: 'company-tax-profile',
      label: 'Company Tax Profile',
      icon: Building2,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
    },
    {
      id: 'gst-reports',
      label: 'GST & Sales Reports',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Reports',
    },
    // Phase 11: Dispatch & Delivery Management Section
    {
      id: 'dispatch-dashboard',
      label: 'Dispatch Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'Phase 11',
    },
    {
      id: 'dispatch-orders',
      label: 'Dispatch Orders',
      icon: Box,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
    },
    {
      id: 'create-dispatch',
      label: 'New Dispatch Order',
      icon: PlusCircle,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
      badge: '+DSP',
    },
    {
      id: 'packing-management',
      label: 'Packing Slips',
      icon: PackageCheck,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
    },
    {
      id: 'delivery-challans',
      label: 'Delivery Challans',
      icon: FileCheck,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'DC',
    },
    {
      id: 'transporters',
      label: 'Transport Partners',
      icon: Truck,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
    },
    {
      id: 'shipment-tracking',
      label: 'Shipment Tracking',
      icon: Navigation,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'Live',
    },
    {
      id: 'proof-of-delivery',
      label: 'Proof of Delivery',
      icon: CheckCircle2,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'POD',
    },
    {
      id: 'delivery-returns',
      label: 'Customer Returns',
      icon: RotateCcw,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Quarantine',
    },
    {
      id: 'dispatch-reports',
      label: 'Dispatch Reports',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'Reports',
    },
    // Phase 12: Payment Management System Section
    {
      id: 'payment-dashboard',
      label: 'Payment Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Phase 12',
    },
    {
      id: 'customer-receipts',
      label: 'Customer Receipts',
      icon: Receipt,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'RCP',
    },
    {
      id: 'record-customer-payment',
      label: 'New Receipt',
      icon: PlusCircle,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: '+RCP',
    },
    {
      id: 'supplier-payments',
      label: 'Supplier Payments',
      icon: CreditCard,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'PV',
    },
    {
      id: 'record-supplier-payment',
      label: 'New Payment',
      icon: PlusCircle,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: '+PV',
    },
    {
      id: 'payment-approvals',
      label: 'Payment Approvals',
      icon: CheckSquare,
      roles: ['ADMIN', 'OWNER'],
      badge: '>50k',
    },
    {
      id: 'bank-accounts',
      label: 'Cash & Bank Accounts',
      icon: Landmark,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
    },
    {
      id: 'bank-reconciliation',
      label: 'Bank Reconciliation',
      icon: SlidersHorizontal,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'CSV',
    },
    {
      id: 'outstanding-reports',
      label: 'Outstanding Reports',
      icon: BarChart3,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'],
    },
    {
      id: 'aging-reports',
      label: 'Aging Analysis',
      icon: CalendarClock,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Aging',
    },
    {
      id: 'customer-statements',
      label: 'Customer Statements',
      icon: FileText,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'],
    },
    {
      id: 'supplier-statements',
      label: 'Supplier Statements',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
    },
    {
      id: 'payment-history',
      label: 'Payment History',
      icon: History,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'],
    },
    // Phase 13: Audit Management System Section
    {
      id: 'audit-dashboard',
      label: 'Audit Dashboard',
      icon: ShieldCheck,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Phase 13',
    },
    {
      id: 'audit-planning',
      label: 'Audit Planning',
      icon: ClipboardList,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Plans',
    },
    {
      id: 'audit-schedule',
      label: 'Audit Schedule',
      icon: CalendarClock,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Cal',
    },
    {
      id: 'checklist-templates',
      label: 'Checklist Templates',
      icon: CheckSquare,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Templates',
    },
    {
      id: 'conduct-audit',
      label: 'Conduct Audit',
      icon: PlaySquare,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'],
      badge: 'Live',
    },
    {
      id: 'transaction-audit',
      label: 'Transaction Audit',
      icon: FileSearch,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Inspect',
    },
    {
      id: 'audit-findings',
      label: 'Audit Findings',
      icon: AlertTriangle,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Findings',
    },
    {
      id: 'risk-assessment',
      label: 'Risk Assessment (5x5)',
      icon: ShieldAlert,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Matrix',
    },
    {
      id: 'audit-capa',
      label: 'Audit CAPA',
      icon: ShieldCheck,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'],
      badge: 'CAPA',
    },
    {
      id: 'evidence-management',
      label: 'Evidence Vault',
      icon: UploadCloud,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
    },
    {
      id: 'audit-reports',
      label: 'Audit Reports',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Reports',
    },
    {
      id: 'audit-history',
      label: 'Audit Trail Log',
      icon: History,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
    },
    // Phase 14: Reports & Analytics System Section
    {
      id: 'executive-dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Phase 14',
    },
    {
      id: 'analytics-sales',
      label: 'Sales Analytics',
      icon: TrendingUp,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'SALESMAN'],
      badge: 'Sales',
    },
    {
      id: 'analytics-purchase',
      label: 'Purchase Analytics',
      icon: Briefcase,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: '3WM',
    },
    {
      id: 'analytics-inventory',
      label: 'Inventory Analytics',
      icon: Package,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'],
      badge: 'Stock',
    },
    {
      id: 'analytics-production',
      label: 'Production Analytics',
      icon: Factory,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
      badge: 'Yield',
    },
    {
      id: 'analytics-quality',
      label: 'Quality Analytics',
      icon: ShieldCheck,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
      badge: 'QC',
    },
    {
      id: 'analytics-costing',
      label: 'Costing Analytics',
      icon: Calculator,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Margins',
    },
    {
      id: 'analytics-gst',
      label: 'GST & Tax Analytics',
      icon: Landmark,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'GSTR-1',
    },
    {
      id: 'analytics-dispatch',
      label: 'Dispatch Analytics',
      icon: Truck,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION', 'SALESMAN'],
      badge: 'Logistics',
    },
    {
      id: 'analytics-payments',
      label: 'Payment Analytics',
      icon: CreditCard,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Cashflow',
    },
    {
      id: 'analytics-audit',
      label: 'Audit Compliance Analytics',
      icon: ShieldAlert,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'],
      badge: 'Risk',
    },
    {
      id: 'saved-reports',
      label: 'Saved Report Views',
      icon: BookmarkCheck,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION', 'SALESMAN'],
      badge: 'Saved',
    },
    {
      id: 'scheduled-reports',
      label: 'Scheduled Reports',
      icon: Clock,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
      badge: 'Automate',
    },
    {
      id: 'report-logs',
      label: 'Execution History',
      icon: History,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT', 'PRODUCTION'],
      badge: 'Logs',
    },
    // Phase 3: Master Data Section
    {
      id: 'products',
      label: 'Products (Catalog)',
      icon: ShoppingBag,
      roles: ['ADMIN', 'OWNER', 'SALESMAN', 'PRODUCTION', 'ACCOUNTANT'],
      badge: 'SKUs',
    },
    {
      id: 'customers',
      label: 'Customers (B2B)',
      icon: Users,
      roles: ['ADMIN', 'OWNER', 'SALESMAN', 'ACCOUNTANT'],
      badge: 'GST',
    },
    {
      id: 'suppliers',
      label: 'Suppliers (Agro)',
      icon: Truck,
      roles: ['ADMIN', 'OWNER', 'ACCOUNTANT'],
    },
    {
      id: 'raw-materials',
      label: 'Raw Materials',
      icon: Wheat,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
    },
    {
      id: 'packaging-materials',
      label: 'Packaging Materials',
      icon: Package,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
    },
    {
      id: 'boms',
      label: 'Bill of Materials (BOM)',
      icon: Layers,
      roles: ['ADMIN', 'OWNER', 'PRODUCTION'],
      badge: 'Recipes',
    },
    // User Management
    {
      id: 'users',
      label: 'User Management',
      icon: UserCheck,
      roles: ['ADMIN', 'OWNER'],
    },
  ];

  const visibleMenu = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-80px)]">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-lg shadow-inner">
            🍛
          </div>
          <div>
            <div className="text-xs font-extrabold text-white tracking-tight">Sri Meenakshi ERP</div>
            <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Phase 14: Reports &amp; Analytics</div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System Modules
          </div>
          {visibleMenu.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                      isActive ? 'bg-slate-900 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Role status footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-[11px] font-bold text-slate-200">{user.full_name}</div>
            <div className="text-[10px] font-semibold text-amber-400 uppercase">{role}</div>
          </div>
          <button
            onClick={() => setActivePage('profile')}
            title="Profile Details"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
