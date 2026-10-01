import {
  Product,
  Category,
  Supplier,
  Customer,
  Sale,
  PaymentMethod,
  InventoryTransaction,
  ReturnRecord,
  StockAlert,
  Business,
  User,
  UserRole,
  DashboardKPIs,
  ProductForecast,
} from '../types';

const STORAGE_KEYS = {
  VERSION: 'stockflow_clean_slate_fresh_v5',
  USER: 'stockflow_fresh_user',
  BUSINESS: 'stockflow_fresh_business',
  PRODUCTS: 'stockflow_fresh_products',
  CATEGORIES: 'stockflow_fresh_categories',
  SUPPLIERS: 'stockflow_fresh_suppliers',
  CUSTOMERS: 'stockflow_fresh_customers',
  SALES: 'stockflow_fresh_sales',
  TRANSACTIONS: 'stockflow_fresh_transactions',
  RETURNS: 'stockflow_fresh_returns',
  ALERTS: 'stockflow_fresh_alerts',
  INVOICE_COUNTER: 'stockflow_fresh_invoice_counter',
};

// Clean Default Slate (No mock / fake / rough data)
const DEFAULT_USER: User = {
  id: 'usr_admin',
  name: 'Store Owner',
  email: 'owner@store.com',
  role: 'Admin',
};

const DEFAULT_BUSINESS: Business = {
  id: 'biz_01',
  name: 'My Store',
  ownerName: 'Store Owner',
  email: 'owner@store.com',
  phone: '',
  address: '',
  gstNumber: '',
  currency: '₹',
  taxRate: 18,
  invoicePrefix: 'INV',
  invoiceFooter: 'Thank you for your business! Goods once sold can be returned with original invoice.',
  defaultMinStock: 5,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'General', description: 'General merchandise and products' },
  { id: 'cat_2', name: 'Electronics', description: 'Electronics, devices and gadgets' },
  { id: 'cat_3', name: 'Accessories', description: 'Peripherals, cables and accessories' },
  { id: 'cat_4', name: 'Office Supplies', description: 'Office stationery and supplies' },
  { id: 'cat_5', name: 'Apparel', description: 'Clothing, garments and wear' },
  { id: 'cat_6', name: 'Grocery & FMCG', description: 'Packaged goods and consumables' },
];

const DEFAULT_SUPPLIERS: Supplier[] = [];
const DEFAULT_CUSTOMERS: Customer[] = [];
const DEFAULT_PRODUCTS: Product[] = [];
const DEFAULT_SALES: Sale[] = [];
const DEFAULT_TRANSACTIONS: InventoryTransaction[] = [];
const DEFAULT_ALERTS: StockAlert[] = [];

class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving to localStorage key "${key}":`, e);
    }
  }

  constructor() {
    this.init();
  }

  public init(forceReset = false): void {
    // Purge any legacy localStorage mock data from previous sessions
    const legacyKeys = [
      'stockflow_user',
      'stockflow_business',
      'stockflow_products',
      'stockflow_categories',
      'stockflow_suppliers',
      'stockflow_customers',
      'stockflow_sales',
      'stockflow_transactions',
      'stockflow_returns',
      'stockflow_alerts',
      'stockflow_invoice_counter',
      'stockflow_clean_v3',
    ];
    legacyKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });

    const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    // If not migrated to fresh clean slate or forceReset, clean all old mock data completely
    if (forceReset || currentVersion !== 'fresh_v5') {
      localStorage.setItem(STORAGE_KEYS.VERSION, 'fresh_v5');
      this.setItem(STORAGE_KEYS.USER, DEFAULT_USER);
      this.setItem(STORAGE_KEYS.BUSINESS, DEFAULT_BUSINESS);
      this.setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      this.setItem(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
      this.setItem(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
      this.setItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      this.setItem(STORAGE_KEYS.SALES, DEFAULT_SALES);
      this.setItem(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
      this.setItem(STORAGE_KEYS.RETURNS, []);
      this.setItem(STORAGE_KEYS.ALERTS, DEFAULT_ALERTS);
      this.setItem(STORAGE_KEYS.INVOICE_COUNTER, 1001);
    }
  }

  // Clear everything cleanly
  public clearAllData(): void {
    this.setItem(STORAGE_KEYS.PRODUCTS, []);
    this.setItem(STORAGE_KEYS.SALES, []);
    this.setItem(STORAGE_KEYS.CUSTOMERS, []);
    this.setItem(STORAGE_KEYS.SUPPLIERS, []);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
    this.setItem(STORAGE_KEYS.RETURNS, []);
    this.setItem(STORAGE_KEYS.ALERTS, []);
    this.setItem(STORAGE_KEYS.INVOICE_COUNTER, 1001);
  }

  // Auth / User
  public getCurrentUser(): User {
    const raw = this.getItem<User>(STORAGE_KEYS.USER, DEFAULT_USER);
    if (!raw) return DEFAULT_USER;
    const roleStr = String(raw.role || '').toLowerCase();
    const role: UserRole = roleStr.includes('cashier')
      ? 'Cashier'
      : roleStr.includes('manager')
      ? 'Manager'
      : 'Admin';
    return {
      ...raw,
      role,
    };
  }

  public updateCurrentUser(user: Partial<User>): User {
    const current = this.getCurrentUser();
    let role = current.role;
    if (user.role) {
      const r = String(user.role).toLowerCase();
      role = r.includes('cashier') ? 'Cashier' : r.includes('manager') ? 'Manager' : 'Admin';
    }
    const updated: User = { ...current, ...user, role };
    this.setItem(STORAGE_KEYS.USER, updated);
    return updated;
  }

  // Business
  public getBusiness(): Business {
    return this.getItem<Business>(STORAGE_KEYS.BUSINESS, DEFAULT_BUSINESS);
  }

  public updateBusiness(business: Partial<Business>): Business {
    const current = this.getBusiness();
    const updated = { ...current, ...business };
    this.setItem(STORAGE_KEYS.BUSINESS, updated);
    return updated;
  }

  // Categories
  public getCategories(): Category[] {
    return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }

  public addCategory(name: string, description: string): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
    };
    categories.push(newCat);
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
    return newCat;
  }

  // Suppliers
  public getSuppliers(): Supplier[] {
    return this.getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
  }

  public getSupplierById(id: string): Supplier | undefined {
    return this.getSuppliers().find((s) => s.id === id);
  }

  public saveSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt'>, id?: string): Supplier {
    const suppliers = this.getSuppliers();
    if (id) {
      const idx = suppliers.findIndex((s) => s.id === id);
      if (idx !== -1) {
        suppliers[idx] = { ...suppliers[idx], ...supplierData };
        this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
        return suppliers[idx];
      }
    }
    const newSup: Supplier = {
      id: `sup_${Date.now()}`,
      ...supplierData,
      totalPurchases: 0,
      productsSuppliedCount: 0,
      createdAt: new Date().toISOString(),
    };
    suppliers.unshift(newSup);
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    return newSup;
  }

  public deleteSupplier(id: string): void {
    const suppliers = this.getSuppliers().filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  // Customers
  public getCustomers(): Customer[] {
    return this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  }

  public saveCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent'>, id?: string): Customer {
    const customers = this.getCustomers();
    if (id) {
      const idx = customers.findIndex((c) => c.id === id);
      if (idx !== -1) {
        customers[idx] = { ...customers[idx], ...customerData };
        this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
        return customers[idx];
      }
    }
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      ...customerData,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    customers.unshift(newCust);
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
    return newCust;
  }

  public deleteCustomer(id: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  // Products
  public getProducts(): Product[] {
    return this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  public saveProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, id?: string): Product {
    const products = this.getProducts();
    const categories = this.getCategories();
    const suppliers = this.getSuppliers();

    const category = categories.find((c) => c.id === productData.categoryId);
    const supplier = suppliers.find((s) => s.id === productData.supplierId);

    // Validate SKU uniqueness
    const existingSku = products.find((p) => p.sku.toLowerCase() === productData.sku.toLowerCase() && p.id !== id);
    if (existingSku) {
      throw new Error(`SKU "${productData.sku}" is already in use by another product.`);
    }

    if (id) {
      const idx = products.findIndex((p) => p.id === id);
      if (idx !== -1) {
        products[idx] = {
          ...products[idx],
          ...productData,
          categoryName: category?.name || products[idx].categoryName,
          supplierName: supplier?.company || products[idx].supplierName,
          updatedAt: new Date().toISOString(),
        };
        this.setItem(STORAGE_KEYS.PRODUCTS, products);
        this.syncAlertsForProduct(products[idx]);
        return products[idx];
      }
    }

    const newProd: Product = {
      id: `prod_${Date.now()}`,
      ...productData,
      categoryName: category?.name || 'General',
      supplierName: supplier?.company || 'Direct',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.unshift(newProd);
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    this.syncAlertsForProduct(newProd);

    // Initial stock transaction if quantity > 0
    if (newProd.quantity > 0) {
      this.recordTransaction({
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        transactionType: 'STOCK_IN',
        quantity: newProd.quantity,
        previousQuantity: 0,
        newQuantity: newProd.quantity,
        reason: 'Initial stock intake upon product creation',
        referenceId: 'INIT-INVENTORY',
        createdBy: this.getCurrentUser().name,
      });
    }

    return newProd;
  }

  public deleteProduct(id: string): void {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      products[idx].isActive = false;
      this.setItem(STORAGE_KEYS.PRODUCTS, products);
    }
  }

  // Stock In (Purchase / Intake)
  public stockIn(params: {
    productId: string;
    quantity: number;
    supplierId?: string;
    purchasePrice?: number;
    referenceNumber?: string;
    notes?: string;
  }): { product: Product; transaction: InventoryTransaction } {
    if (params.quantity <= 0) {
      throw new Error('Stock In quantity must be greater than zero.');
    }

    const products = this.getProducts();
    const product = products.find((p) => p.id === params.productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    const oldStock = product.quantity;
    const newStock = oldStock + params.quantity;
    product.quantity = newStock;
    if (params.purchasePrice && params.purchasePrice > 0) {
      product.purchasePrice = params.purchasePrice;
    }
    product.updatedAt = new Date().toISOString();

    this.setItem(STORAGE_KEYS.PRODUCTS, products);

    const transaction = this.recordTransaction({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      transactionType: 'STOCK_IN',
      quantity: params.quantity,
      previousQuantity: oldStock,
      newQuantity: newStock,
      referenceId: params.referenceNumber || `PO-${Date.now().toString().slice(-6)}`,
      reason: params.notes || 'Purchase order receipt',
      createdBy: this.getCurrentUser().name,
    });

    if (params.supplierId) {
      const suppliers = this.getSuppliers();
      const sup = suppliers.find((s) => s.id === params.supplierId);
      if (sup) {
        const addedValue = (params.purchasePrice || product.purchasePrice) * params.quantity;
        sup.totalPurchases = (sup.totalPurchases || 0) + addedValue;
        this.setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
      }
    }

    this.syncAlertsForProduct(product);

    return { product, transaction };
  }

  // Stock Out (Damages, Loss, Adjustment)
  public stockOut(params: {
    productId: string;
    quantity: number;
    reasonType: 'DAMAGE' | 'LOSS' | 'MANUAL_ADJUSTMENT';
    notes?: string;
  }): { product: Product; transaction: InventoryTransaction } {
    if (params.quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }

    const products = this.getProducts();
    const product = products.find((p) => p.id === params.productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    if (product.quantity < params.quantity) {
      throw new Error(`Insufficient stock. Current stock is ${product.quantity}, cannot reduce by ${params.quantity}.`);
    }

    const oldStock = product.quantity;
    const newStock = oldStock - params.quantity;
    product.quantity = newStock;
    product.updatedAt = new Date().toISOString();

    this.setItem(STORAGE_KEYS.PRODUCTS, products);

    const transaction = this.recordTransaction({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      transactionType: params.reasonType,
      quantity: -params.quantity,
      previousQuantity: oldStock,
      newQuantity: newStock,
      reason: params.notes || `Stock Out: ${params.reasonType}`,
      createdBy: this.getCurrentUser().name,
    });

    this.syncAlertsForProduct(product);

    return { product, transaction };
  }

  // Complete Sale (Core End-to-End Workflow)
  public createSale(params: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number }>;
    discount?: number;
    taxRate?: number;
    paymentMethod: PaymentMethod;
    paymentStatus?: 'Paid' | 'Pending' | 'Partially Paid';
    notes?: string;
  }): Sale {
    if (!params.items || params.items.length === 0) {
      throw new Error('Cannot create an empty sale.');
    }

    const products = this.getProducts();
    const biz = this.getBusiness();
    const saleItems: Sale['items'] = [];
    let subtotal = 0;
    let totalCost = 0;

    for (const item of params.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product with ID "${item.productId}" not found.`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Invalid quantity for ${prod.name}`);
      }
      if (prod.quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.quantity}, Requested: ${item.quantity}`);
      }

      const unitPrice = item.unitPrice ?? prod.sellingPrice;
      const lineTotal = unitPrice * item.quantity;
      const lineCost = prod.purchasePrice * item.quantity;

      subtotal += lineTotal;
      totalCost += lineCost;

      saleItems.push({
        id: `sitem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        saleId: '',
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: item.quantity,
        unitPrice,
        purchasePrice: prod.purchasePrice,
        total: lineTotal,
      });
    }

    const counter = this.getItem<number>(STORAGE_KEYS.INVOICE_COUNTER, 1001);
    const invoiceNumber = `${biz.invoicePrefix || 'INV'}-${counter}`;
    this.setItem(STORAGE_KEYS.INVOICE_COUNTER, counter + 1);

    const discount = Math.max(0, params.discount || 0);
    const effectiveSubtotal = Math.max(0, subtotal - discount);
    const taxRate = params.taxRate ?? (biz.taxRate || 18);
    const tax = Math.round((effectiveSubtotal * (taxRate / 100)) * 100) / 100;
    const total = effectiveSubtotal + tax;
    const profit = effectiveSubtotal - totalCost;

    const saleId = `sale_${Date.now()}`;
    saleItems.forEach((si) => {
      si.saleId = saleId;
    });

    for (const item of saleItems) {
      const prod = products.find((p) => p.id === item.productId)!;
      const oldStock = prod.quantity;
      const newStock = oldStock - item.quantity;
      prod.quantity = newStock;
      prod.updatedAt = new Date().toISOString();

      this.recordTransaction({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        transactionType: 'SALE',
        quantity: -item.quantity,
        previousQuantity: oldStock,
        newQuantity: newStock,
        referenceId: invoiceNumber,
        reason: `Sold on invoice ${invoiceNumber}`,
        createdBy: this.getCurrentUser().name,
      });

      this.syncAlertsForProduct(prod);
    }
    this.setItem(STORAGE_KEYS.PRODUCTS, products);

    let customerName = params.customerName || 'Walk-in Customer';
    let customerPhone = params.customerPhone;
    if (params.customerId) {
      const customers = this.getCustomers();
      const cust = customers.find((c) => c.id === params.customerId);
      if (cust) {
        cust.totalOrders += 1;
        cust.totalSpent += total;
        cust.lastPurchaseDate = new Date().toISOString();
        customerName = cust.name;
        customerPhone = cust.phone;
        this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    const sale: Sale = {
      id: saleId,
      invoiceNumber,
      customerId: params.customerId || 'walk_in',
      customerName,
      customerPhone,
      items: saleItems,
      subtotal,
      discount,
      tax,
      total,
      cost: totalCost,
      profit,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus || 'Paid',
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    const sales = this.getSales();
    sales.unshift(sale);
    this.setItem(STORAGE_KEYS.SALES, sales);

    return sale;
  }

  // Returns
  public processReturn(params: {
    saleId: string;
    productId: string;
    quantity: number;
    reason: ReturnRecord['reason'];
    notes?: string;
  }): ReturnRecord {
    const sales = this.getSales();
    const sale = sales.find((s) => s.id === params.saleId);
    if (!sale) {
      throw new Error('Sale invoice not found.');
    }

    const item = sale.items.find((i) => i.productId === params.productId);
    if (!item) {
      throw new Error('Product not part of this sale invoice.');
    }

    if (params.quantity <= 0 || params.quantity > item.quantity) {
      throw new Error(`Return quantity must be between 1 and ${item.quantity}.`);
    }

    const refundAmount = item.unitPrice * params.quantity;

    const products = this.getProducts();
    const prod = products.find((p) => p.id === params.productId);
    if (prod) {
      const oldStock = prod.quantity;
      const newStock = oldStock + params.quantity;
      prod.quantity = newStock;
      prod.updatedAt = new Date().toISOString();
      this.setItem(STORAGE_KEYS.PRODUCTS, products);

      this.recordTransaction({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        transactionType: 'RETURN',
        quantity: params.quantity,
        previousQuantity: oldStock,
        newQuantity: newStock,
        referenceId: sale.invoiceNumber,
        reason: `Sales return: ${params.reason} (${params.notes || ''})`,
        createdBy: this.getCurrentUser().name,
      });

      this.syncAlertsForProduct(prod);
    }

    const returnRecord: ReturnRecord = {
      id: `ret_${Date.now()}`,
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      productId: item.productId,
      productName: item.productName,
      quantity: params.quantity,
      reason: params.reason,
      refundAmount,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    const returns = this.getReturns();
    returns.unshift(returnRecord);
    this.setItem(STORAGE_KEYS.RETURNS, returns);

    return returnRecord;
  }

  // Transactions
  public getTransactions(): InventoryTransaction[] {
    return this.getItem<InventoryTransaction[]>(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
  }

  private recordTransaction(tx: Omit<InventoryTransaction, 'id' | 'createdAt'>): InventoryTransaction {
    const transactions = this.getTransactions();
    const newTx: InventoryTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ...tx,
      createdAt: new Date().toISOString(),
    };
    transactions.unshift(newTx);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    return newTx;
  }

  // Sales
  public getSales(): Sale[] {
    return this.getItem<Sale[]>(STORAGE_KEYS.SALES, DEFAULT_SALES);
  }

  public getReturns(): ReturnRecord[] {
    return this.getItem<ReturnRecord[]>(STORAGE_KEYS.RETURNS, []);
  }

  // Alerts
  public getAlerts(): StockAlert[] {
    return this.getItem<StockAlert[]>(STORAGE_KEYS.ALERTS, DEFAULT_ALERTS);
  }

  public dismissAlert(id: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'DISMISSED';
      this.setItem(STORAGE_KEYS.ALERTS, alerts);
    }
  }

  public resolveAlert(id: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'RESOLVED';
      this.setItem(STORAGE_KEYS.ALERTS, alerts);
    }
  }

  private syncAlertsForProduct(product: Product): void {
    const alerts = this.getAlerts();
    const existingIdx = alerts.findIndex((a) => a.productId === product.id && a.status === 'ACTIVE');

    if (product.quantity <= 0) {
      const msg = `OUT OF STOCK: 0 units remaining for "${product.name}". Minimum is ${product.minimumStock}.`;
      if (existingIdx !== -1) {
        alerts[existingIdx].alertType = 'CRITICAL';
        alerts[existingIdx].currentStock = 0;
        alerts[existingIdx].message = msg;
      } else {
        alerts.unshift({
          id: `alt_${Date.now()}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          alertType: 'CRITICAL',
          currentStock: 0,
          minimumStock: product.minimumStock,
          message: msg,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        });
      }
    } else if (product.quantity <= product.minimumStock) {
      const isCritical = product.quantity <= Math.max(2, Math.floor(product.minimumStock * 0.3));
      const msg = `${isCritical ? 'CRITICAL LOW STOCK' : 'LOW STOCK WARNING'}: ${product.quantity} units left for "${product.name}" (Threshold: ${product.minimumStock}).`;
      if (existingIdx !== -1) {
        alerts[existingIdx].alertType = isCritical ? 'CRITICAL' : 'WARNING';
        alerts[existingIdx].currentStock = product.quantity;
        alerts[existingIdx].message = msg;
      } else {
        alerts.unshift({
          id: `alt_${Date.now()}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          alertType: isCritical ? 'CRITICAL' : 'WARNING',
          currentStock: product.quantity,
          minimumStock: product.minimumStock,
          message: msg,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      if (existingIdx !== -1) {
        alerts[existingIdx].status = 'RESOLVED';
      }
    }

    this.setItem(STORAGE_KEYS.ALERTS, alerts);
  }

  // Dashboard Metrics & KPIs (Clean calculation, 0 when empty)
  public getDashboardKPIs(): DashboardKPIs {
    const products = this.getProducts().filter((p) => p.isActive);
    const sales = this.getSales();

    const todayStr = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const todaySalesList = sales.filter((s) => new Date(s.createdAt).toDateString() === todayStr);
    const yesterdaySalesList = sales.filter((s) => new Date(s.createdAt).toDateString() === yesterday);

    const todaySales = todaySalesList.reduce((acc, s) => acc + s.total, 0);
    const yesterdaySales = yesterdaySalesList.reduce((acc, s) => acc + s.total, 0);
    const todayOrders = todaySalesList.length;
    const yesterdayOrders = yesterdaySalesList.length;

    const todaySalesGrowth = yesterdaySales > 0 ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : 0;
    const todayOrdersGrowth = yesterdayOrders > 0 ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100) : 0;

    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.quantity <= p.minimumStock).length;

    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const totalCost = sales.reduce((acc, s) => acc + s.cost, 0);
    const grossProfit = sales.reduce((acc, s) => acc + s.profit, 0);

    const totalInventoryValue = products.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);

    return {
      todaySales,
      todaySalesGrowth,
      todayOrders,
      todayOrdersGrowth,
      totalProducts,
      lowStockCount,
      grossProfit,
      totalRevenue,
      totalCost,
      totalInventoryValue,
    };
  }

  // AI Forecasting Calculations
  public getProductForecasts(): ProductForecast[] {
    const products = this.getProducts().filter((p) => p.isActive);
    const sales = this.getSales();

    return products.map((prod) => {
      const unitsSold = sales.reduce((acc, sale) => {
        const item = sale.items.find((i) => i.productId === prod.id);
        return acc + (item ? item.quantity : 0);
      }, 0);

      const dailyAverageSales = unitsSold > 0 ? Math.round((unitsSold / 14) * 10) / 10 : 0;
      const daysRemaining = prod.quantity === 0 ? 0 : dailyAverageSales > 0 ? Math.round(prod.quantity / dailyAverageSales) : 999;

      let urgency: ProductForecast['urgency'] = 'HEALTHY';
      if (prod.quantity === 0) urgency = 'CRITICAL';
      else if (prod.quantity <= prod.minimumStock) urgency = 'WARNING';

      const recommendedRestock = Math.max(
        0,
        prod.minimumStock > prod.quantity ? prod.minimumStock - prod.quantity : 0
      );

      return {
        product: prod,
        currentStock: prod.quantity,
        dailyAverageSales,
        daysRemaining: daysRemaining === 999 ? 0 : daysRemaining,
        recommendedRestock,
        urgency,
      };
    });
  }

  // Export PostgreSQL / Supabase Schema
  public getPostgresSchema(): string {
    return `-- ============================================================
-- STOCKFLOW: Digital Inventory & Sales Management System
-- PostgreSQL / Supabase Database Architecture Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Store Owner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  gst_number TEXT,
  currency TEXT DEFAULT '₹',
  tax_rate NUMERIC DEFAULT 18.0,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_footer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  brand TEXT,
  description TEXT,
  purchase_price NUMERIC NOT NULL CHECK (purchase_price >= 0),
  selling_price NUMERIC NOT NULL CHECK (selling_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  minimum_stock INTEGER NOT NULL DEFAULT 5,
  maximum_stock INTEGER DEFAULT 100,
  unit TEXT DEFAULT 'pcs',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_sku_per_business UNIQUE (business_id, sku)
);

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  invoice_number TEXT NOT NULL UNIQUE,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'Paid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL,
  purchase_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('STOCK_IN', 'SALE', 'RETURN', 'DAMAGE', 'LOSS', 'MANUAL_ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
  reference_id TEXT,
  reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id),
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  refund_amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('CRITICAL', 'WARNING', 'INFO')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'DISMISSED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
`;
  }
}

export const storage = new StorageService();
