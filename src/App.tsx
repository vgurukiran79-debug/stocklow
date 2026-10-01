/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { User, UserRole, Product, Sale, Customer, Supplier, StockAlert } from './types';
import {
  subscribeToFirebaseAuthState,
  logoutFirebase,
  syncUserProfile,
} from './services/firebase';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';

// Modals
import { InvoiceModal } from './components/invoice/InvoiceModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { StockInModal } from './components/modals/StockInModal';
import { StockOutModal } from './components/modals/StockOutModal';
import { ProductDetailModal } from './components/modals/ProductDetailModal';
import { ReturnModal } from './components/modals/ReturnModal';
import { AddCustomerModal } from './components/modals/AddCustomerModal';
import { AddSupplierModal } from './components/modals/AddSupplierModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { SalesPOS } from './pages/SalesPOS';
import { SalesHistory } from './pages/SalesHistory';
import { Customers } from './pages/Customers';
import { Suppliers } from './pages/Suppliers';
import { Reports } from './pages/Reports';
import { Alerts } from './pages/Alerts';
import { AIInsights } from './pages/AIInsights';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(storage.getCurrentUser());
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [stockInProductId, setStockInProductId] = useState<string | undefined>(undefined);

  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [stockOutProductId, setStockOutProductId] = useState<string | undefined>(undefined);

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const refreshAlerts = () => {
    setAlerts(storage.getAlerts());
  };

  useEffect(() => {
    refreshAlerts();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseAuthState((firebaseProfile) => {
      if (firebaseProfile) {
        setCurrentUser(firebaseProfile);
        storage.updateCurrentUser(firebaseProfile);
      }
    });
    return () => unsubscribe();
  }, []);

  // Global keyboard shortcut for ⌘K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch {}
    setCurrentUser(null);
  };

  const handleChangeRole = (newRole: UserRole) => {
    if (!currentUser) return;
    const updated: User = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    storage.updateCurrentUser(updated);
    syncUserProfile(updated).catch(() => {});
  };

  const handleResetDemoData = () => {
    storage.init(true);
    setCurrentUser(storage.getCurrentUser());
    refreshAlerts();
    setCurrentPage('dashboard');
  };

  // If user is logged out, render Auth
  if (!currentUser) {
    return (
      <Auth
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentPage('dashboard');
        }}
      />
    );
  }

  const business = storage.getBusiness();
  const categories = storage.getCategories();
  const suppliers = storage.getSuppliers();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col antialiased">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          alerts={alerts}
          user={currentUser}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Navbar */}
          <Navbar
            user={currentUser}
            onOpenSearch={() => setIsSearchOpen(true)}
            onNavigate={(page) => setCurrentPage(page)}
            onOpenStockIn={() => {
              setStockInProductId(undefined);
              setIsStockInOpen(true);
            }}
            onLogout={handleLogout}
            onChangeRole={handleChangeRole}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isDark={isDark}
            toggleDark={() => setIsDark(!isDark)}
          />

          {/* Page Routing */}
          <main className="flex-1 pb-16 lg:pb-8">
            {currentPage === 'dashboard' && (
              <Dashboard
                onNavigate={(page) => setCurrentPage(page)}
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setIsAddProductOpen(true);
                }}
                onOpenStockIn={(prodId) => {
                  setStockInProductId(prodId);
                  setIsStockInOpen(true);
                }}
                onOpenAddCustomer={() => {
                  setEditingCustomer(null);
                  setIsAddCustomerOpen(true);
                }}
                onSelectSale={(sale) => setActiveInvoice(sale)}
              />
            )}

            {currentPage === 'inventory' && (
              <Inventory
                user={currentUser}
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setIsAddProductOpen(true);
                }}
                onOpenStockIn={(prodId) => {
                  setStockInProductId(prodId);
                  setIsStockInOpen(true);
                }}
                onOpenStockOut={(prodId) => {
                  setStockOutProductId(prodId);
                  setIsStockOutOpen(true);
                }}
                onViewProduct={(product) => setViewingProduct(product)}
                onEditProduct={(product) => {
                  setEditingProduct(product);
                  setIsAddProductOpen(true);
                }}
              />
            )}

            {currentPage === 'pos' && (
              <SalesPOS
                onSaleCompleted={(sale) => {
                  setActiveInvoice(sale);
                  refreshAlerts();
                }}
                onOpenAddCustomer={() => {
                  setEditingCustomer(null);
                  setIsAddCustomerOpen(true);
                }}
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setIsAddProductOpen(true);
                }}
              />
            )}

            {currentPage === 'sales-history' && (
              <SalesHistory
                onSelectSale={(sale) => setActiveInvoice(sale)}
                onOpenReturn={(sale) => {
                  setReturnSale(sale);
                  setIsReturnOpen(true);
                }}
                onNavigateToPOS={() => setCurrentPage('pos')}
              />
            )}

            {currentPage === 'customers' && (
              <Customers
                onOpenAddCustomer={() => {
                  setEditingCustomer(null);
                  setIsAddCustomerOpen(true);
                }}
                onEditCustomer={(customer) => {
                  setEditingCustomer(customer);
                  setIsAddCustomerOpen(true);
                }}
                onSelectSale={(sale) => setActiveInvoice(sale)}
              />
            )}

            {currentPage === 'suppliers' && (
              <Suppliers
                onOpenAddSupplier={() => {
                  setEditingSupplier(null);
                  setIsAddSupplierOpen(true);
                }}
                onEditSupplier={(supplier) => {
                  setEditingSupplier(supplier);
                  setIsAddSupplierOpen(true);
                }}
                onOpenStockIn={() => {
                  setStockInProductId(undefined);
                  setIsStockInOpen(true);
                }}
              />
            )}

            {currentPage === 'reports' && (
              <Reports
                user={currentUser}
                onNavigateToPOS={() => setCurrentPage('pos')}
              />
            )}

            {currentPage === 'alerts' && (
              <Alerts
                onOpenStockIn={(prodId) => {
                  setStockInProductId(prodId);
                  setIsStockInOpen(true);
                }}
              />
            )}

            {currentPage === 'ai-insights' && <AIInsights />}

            {currentPage === 'settings' && (
              <Settings
                onResetDemoData={handleResetDemoData}
                currentUser={currentUser}
                onUpdateUser={(u) => setCurrentUser(u)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global Modals */}

      {/* Global ⌘K Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(p) => setViewingProduct(p)}
        onSelectSale={(s) => setActiveInvoice(s)}
        onNavigate={(p) => setCurrentPage(p)}
      />

      {/* Tax Invoice Modal */}
      <InvoiceModal
        sale={activeInvoice}
        business={business}
        onClose={() => setActiveInvoice(null)}
      />

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          refreshAlerts();
        }}
        categories={categories}
        suppliers={suppliers}
        editProduct={editingProduct}
      />

      {/* Stock In Modal */}
      <StockInModal
        isOpen={isStockInOpen}
        onClose={() => {
          setIsStockInOpen(false);
          setStockInProductId(undefined);
        }}
        onSuccess={() => {
          refreshAlerts();
        }}
        preSelectedProductId={stockInProductId}
      />

      {/* Stock Out Modal */}
      <StockOutModal
        isOpen={isStockOutOpen}
        onClose={() => {
          setIsStockOutOpen(false);
          setStockOutProductId(undefined);
        }}
        onSuccess={() => {
          refreshAlerts();
        }}
        preSelectedProductId={stockOutProductId}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onOpenStockIn={(id) => {
          setViewingProduct(null);
          setStockInProductId(id);
          setIsStockInOpen(true);
        }}
        onOpenStockOut={(id) => {
          setViewingProduct(null);
          setStockOutProductId(id);
          setIsStockOutOpen(true);
        }}
        onEdit={(p) => {
          setViewingProduct(null);
          setEditingProduct(p);
          setIsAddProductOpen(true);
        }}
        onOpenInvoice={(s) => {
          setViewingProduct(null);
          setActiveInvoice(s);
        }}
      />

      {/* Return Modal */}
      <ReturnModal
        isOpen={isReturnOpen}
        onClose={() => {
          setIsReturnOpen(false);
          setReturnSale(null);
        }}
        onSuccess={() => {
          refreshAlerts();
        }}
        preSelectedSale={returnSale}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => {
          setIsAddCustomerOpen(false);
          setEditingCustomer(null);
        }}
        onSuccess={() => {}}
        editCustomer={editingCustomer}
      />

      {/* Add Supplier Modal */}
      <AddSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => {
          setIsAddSupplierOpen(false);
          setEditingSupplier(null);
        }}
        onSuccess={() => {}}
        editSupplier={editingSupplier}
      />
    </div>
  );
}
