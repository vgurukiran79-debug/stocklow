export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';

export type PaymentStatus = 'Paid' | 'Pending' | 'Partially Paid' | 'Refunded';

export type TransactionType = 'STOCK_IN' | 'SALE' | 'RETURN' | 'DAMAGE' | 'LOSS' | 'MANUAL_ADJUSTMENT';

export type AlertType = 'CRITICAL' | 'WARNING' | 'INFO';

export type UserRole = 'Admin' | 'Manager' | 'Cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  storeName?: string;
}

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  currency: string;
  taxRate: number; // e.g. 18 for 18%
  logoUrl?: string;
  invoicePrefix: string;
  invoiceFooter: string;
  defaultMinStock: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount?: number;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  notes?: string;
  totalPurchases?: number;
  productsSuppliedCount?: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  categoryName?: string;
  brand: string;
  supplierId: string;
  supplierName?: string;
  description: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  maximumStock: number;
  unit: string; // e.g. pcs, boxes, kg
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  cost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  transactionType: TransactionType;
  quantity: number; // positive or negative
  previousQuantity: number;
  newQuantity: number;
  referenceId?: string; // invoice or PO #
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export interface ReturnRecord {
  id: string;
  saleId: string;
  invoiceNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: 'Damaged' | 'Wrong Product' | 'Customer Changed Mind' | 'Defective' | 'Other';
  refundAmount: number;
  notes?: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  alertType: AlertType;
  currentStock: number;
  minimumStock: number;
  message: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface DashboardKPIs {
  todaySales: number;
  todaySalesGrowth: number;
  todayOrders: number;
  todayOrdersGrowth: number;
  totalProducts: number;
  lowStockCount: number;
  grossProfit: number;
  totalRevenue: number;
  totalCost: number;
  totalInventoryValue: number;
}

export interface ProductForecast {
  product: Product;
  currentStock: number;
  dailyAverageSales: number;
  daysRemaining: number;
  recommendedRestock: number;
  urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'SURPLUS';
}
