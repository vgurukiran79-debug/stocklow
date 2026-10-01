import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Plus,
  ArrowRight,
  Receipt,
  RotateCcw,
  Sparkles,
  Bot,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { storage } from '../services/storage';
import { DashboardKPIs, Product, Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onOpenAddProduct: () => void;
  onOpenStockIn: (productId?: string) => void;
  onOpenAddCustomer: () => void;
  onSelectSale: (sale: Sale) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenAddProduct,
  onOpenStockIn,
  onOpenAddCustomer,
  onSelectSale,
}) => {
  const [kpis, setKpis] = useState<DashboardKPIs>(storage.getDashboardKPIs());
  const [salesTimeframe, setSalesTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [user, setUser] = useState(storage.getCurrentUser());
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);

  useEffect(() => {
    const s = storage.getSales();
    const p = storage.getProducts().filter((prod) => prod.isActive);
    setAllSales(s);
    setAllProducts(p);
    setKpis(storage.getDashboardKPIs());
    setRecentSales(s.slice(0, 5));
    setLowStockProducts(p.filter((prod) => prod.quantity <= prod.minimumStock).slice(0, 5));
    setUser(storage.getCurrentUser());
  }, []);

  // Compute dynamic chart data from real sales records
  const generateDynamicChartData = () => {
    if (salesTimeframe === 'today') {
      const todayStr = new Date().toDateString();
      const todaySales = allSales.filter((s) => new Date(s.createdAt).toDateString() === todayStr);
      const hours = ['9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
      return hours.map((hour) => {
        return { name: hour, sales: 0, profit: 0 };
      });
    } else if (salesTimeframe === 'month') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      return weeks.map((w, idx) => {
        const weekSales = allSales.filter((s) => {
          const diffDays = (Date.now() - new Date(s.createdAt).getTime()) / 86400000;
          return diffDays >= (3 - idx) * 7 && diffDays < (4 - idx) * 7;
        });
        const salesSum = weekSales.reduce((acc, s) => acc + s.total, 0);
        const profitSum = weekSales.reduce((acc, s) => acc + s.profit, 0);
        return { name: w, sales: salesSum, profit: profitSum };
      });
    } else {
      // Past 7 days
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((d, idx) => {
        const targetDate = new Date(Date.now() - (6 - idx) * 86400000).toDateString();
        const daySales = allSales.filter((s) => new Date(s.createdAt).toDateString() === targetDate);
        const salesSum = daySales.reduce((acc, s) => acc + s.total, 0);
        const profitSum = daySales.reduce((acc, s) => acc + s.profit, 0);
        return { name: d, sales: salesSum, profit: profitSum };
      });
    }
  };

  const chartData = generateDynamicChartData();
  const hasChartData = chartData.some((d) => d.sales > 0);

  // Compute category sales breakdown from real sales items
  const categorySalesMap = new Map<string, number>();
  allSales.forEach((s) => {
    s.items.forEach((item) => {
      const prod = allProducts.find((p) => p.id === item.productId);
      const cat = prod?.categoryName || 'General';
      categorySalesMap.set(cat, (categorySalesMap.get(cat) || 0) + item.total);
    });
  });

  const categoryColors = ['#06b6d4', '#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];
  const categoryPieData = Array.from(categorySalesMap.entries()).map(([name, value], idx) => ({
    name,
    value,
    color: categoryColors[idx % categoryColors.length],
  }));

  // Compute top selling products from real sales
  const productVolumeMap = new Map<string, { product: Product; units: number; revenue: number }>();
  allSales.forEach((s) => {
    s.items.forEach((item) => {
      const prod = allProducts.find((p) => p.id === item.productId);
      if (prod) {
        const existing = productVolumeMap.get(prod.id) || { product: prod, units: 0, revenue: 0 };
        existing.units += item.quantity;
        existing.revenue += item.total;
        productVolumeMap.set(prod.id, existing);
      }
    });
  });

  const topSellingProducts = Array.from(productVolumeMap.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Welcome Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {timeGreeting}, {user.name} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clean store ledger ready for fresh inventory entries and counter sales.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>+ New Sale (POS)</span>
          </button>

          {user.role !== 'Cashier' ? (
            <>
              <button
                onClick={onOpenAddProduct}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
              >
                <Plus className="h-4 w-4 text-cyan-600" />
                <span>+ Add Product</span>
              </button>
              <button
                onClick={() => onOpenStockIn()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                <span>Stock In</span>
              </button>
            </>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <span>Counter Terminal Mode</span>
            </span>
          )}

          <button
            onClick={onOpenAddCustomer}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <span>+ Customer</span>
          </button>
        </div>
      </div>

      {/* Onboarding Guide for Clean Fresh Store */}
      {allProducts.length === 0 && (
        <div className="rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/70 via-white to-blue-50/50 p-5 shadow-xs dark:border-cyan-900/50 dark:bg-slate-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
                  Clean Slate Ready
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Store is ready for your fresh data entries
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Start Fresh: 3 Quick Steps to Setup Your Store
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All rough sample data has been completely removed. Enter your own products, customers, and suppliers freshly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenAddProduct}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>1. Add Product</span>
              </button>
              <button
                onClick={onOpenAddCustomer}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <span>2. Add Customer</span>
              </button>
              <button
                onClick={() => onNavigate('pos')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ShoppingCart className="h-4 w-4 text-cyan-600" />
                <span>3. Launch POS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Today's Sales */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Today's Sales
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(kpis.todaySales)}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <span>{kpis.todaySalesGrowth > 0 ? `+${kpis.todaySalesGrowth}%` : 'No prior sales'}</span>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Orders
            </span>
            <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {kpis.todayOrders}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
            <span>Completed today</span>
          </div>
        </div>

        {/* Card 3: Total Products */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Products
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {kpis.totalProducts}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>In active inventory</span>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div
          onClick={() => onNavigate('alerts')}
          className="cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-colors hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Low Stock
            </span>
            <div className={`rounded-lg p-2 ${kpis.lowStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className={`mt-2 text-xl sm:text-2xl font-extrabold ${kpis.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {kpis.lowStockCount}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <span>{kpis.lowStockCount > 0 ? 'Needs attention →' : 'All levels healthy'}</span>
          </div>
        </div>

        {/* Card 5: Gross Profit */}
        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Gross Profit
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          {user.role === 'Cashier' ? (
            <>
              <p className="mt-2 text-base font-extrabold text-slate-400 dark:text-slate-500">
                🔒 Restricted
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-500">
                <span>Manager / Owner Only</span>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(kpis.grossProfit)}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                <span>Selling Revenue - Cost</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sales Overview Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales & Profit Overview</h3>
              <p className="text-[11px] text-slate-500">Live transaction trends across the selected period</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setSalesTimeframe('today')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  salesTimeframe === 'today'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSalesTimeframe('week')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  salesTimeframe === 'week'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setSalesTimeframe('month')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  salesTimeframe === 'month'
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-4 flex items-center justify-center">
            {!hasChartData ? (
              <div className="text-center py-12 text-slate-400">
                <Receipt className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">No sales recorded in this timeframe</p>
                <p className="text-[11px] mt-0.5">As counter sales are made, revenue and profit lines will render here in real time.</p>
                <button
                  onClick={() => onNavigate('pos')}
                  className="mt-3 inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-700"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Launch POS
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), '']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Gross Sales"
                    stroke="#0891b2"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Net Margin"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#profitGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Sales by Category Donut Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales by Category</h3>
                <p className="text-[11px] text-slate-500">Revenue distribution by catalog department</p>
              </div>
            </div>

            <div className="h-56 w-full pt-2 flex items-center justify-center">
              {categoryPieData.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Package className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No category sales yet</p>
                  <p className="text-[11px] mt-0.5">Sales will map to categories here.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Revenue']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {categoryPieData.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {categoryPieData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(cat.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Top Selling Products, Low Stock Alerts, Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Selling Products</h3>
              <p className="text-[11px] text-slate-500">Highest volume performers from sales</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
            >
              All Items →
            </button>
          </div>

          <div className="space-y-3 pt-3">
            {topSellingProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <p className="font-medium text-slate-600 dark:text-slate-400">No sold products yet</p>
                <p className="mt-1">Items sold via POS will rank here by unit velocity.</p>
              </div>
            ) : (
              topSellingProducts.map((p, idx) => (
                <div key={p.product.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.product.name}</p>
                      <p className="text-[10px] text-slate-400">{formatCurrency(p.revenue)} revenue</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-bold text-cyan-700 dark:text-cyan-400">
                    {p.units} sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Warning Box */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Low Stock Attention</h3>
                <p className="text-[11px] text-slate-500">Items below minimum stock threshold</p>
              </div>
            </div>
            {lowStockProducts.length > 0 && (
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
              >
                View ({kpis.lowStockCount})
              </button>
            )}
          </div>

          <div className="space-y-3 pt-3">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="mx-auto mb-1.5 h-6 w-6 text-emerald-500" />
                <p className="font-medium text-slate-600 dark:text-slate-300">All stock levels healthy</p>
                <p className="mt-0.5">No products currently below minimum buffer levels.</p>
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl p-2 bg-slate-50 dark:bg-slate-800/40 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500">
                      Stock: <span className="font-bold text-rose-600">{p.quantity}</span> / Min: {p.minimumStock}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenStockIn(p.id)}
                    className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    Restock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Insight Teaser Card */}
        <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/50 via-white to-blue-50/40 p-5 shadow-xs dark:border-cyan-900/60 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">StockFlow AI Insights</h3>
            </div>
            <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
              Live Intel
            </span>
          </div>

          <div className="space-y-2.5 pt-3 text-xs">
            <div className="rounded-xl bg-white/80 p-2.5 border border-slate-200/60 shadow-xs dark:bg-slate-800/60 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Catalog Readiness</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {allProducts.length === 0
                  ? 'Add products to start tracking inventory balances & sales margins.'
                  : `${allProducts.length} active products in catalog ready for counter sales.`}
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-2.5 border border-slate-200/60 shadow-xs dark:bg-slate-800/60 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Sales Ledger Status</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {allSales.length === 0
                  ? 'Launch the POS module to record your first customer order.'
                  : `${allSales.length} total orders completed with ${formatCurrency(kpis.totalRevenue)} recorded.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai-insights')}
            className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors"
          >
            <span>Ask StockFlow AI</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Sales Invoices</h3>
            <p className="text-[11px] text-slate-500">Live feed of processed counter orders and payments</p>
          </div>
          {allSales.length > 0 && (
            <button
              onClick={() => onNavigate('sales-history')}
              className="text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
            >
              View All ({allSales.length}) →
            </button>
          )}
        </div>

        <div className="overflow-x-auto pt-2">
          {recentSales.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Receipt className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No sales invoices yet</p>
              <p className="mt-1">Invoices generated in the POS will appear in this ledger feed.</p>
              <button
                onClick={() => onNavigate('pos')}
                className="mt-3 inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-700"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Create First Sale
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 dark:border-slate-800">
                  <th className="py-2.5">Invoice</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5">Payment</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                      {sale.customerName}
                    </td>
                    <td className="py-2.5 text-slate-500">{formatDate(sale.createdAt)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">{sale.paymentMethod}</td>
                    <td className="py-2.5 text-center">
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        ● {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onSelectSale(sale)}
                        className="font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
