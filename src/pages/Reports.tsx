import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Printer,
  Calendar,
  Package,
  Layers,
  Award,
  AlertOctagon,
  Percent,
  Receipt,
  Inbox,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { storage } from '../services/storage';
import { Sale, Product, User } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ReportsProps {
  user?: User | null;
  onNavigateToPOS?: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ user, onNavigateToPOS }) => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'profit' | 'products' | 'categories'>('sales');

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setSales(storage.getSales());
    setProducts(storage.getProducts().filter((p) => p.isActive));
  }, []);

  // Authorization Check
  if (user?.role === 'Cashier') {
    return (
      <div className="p-6 max-w-xl mx-auto my-12 text-center">
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-8 dark:border-amber-900/50 dark:bg-amber-950/20 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Authorization Restricted
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            Detailed financial profit analytics and cost margins are restricted to <strong className="text-slate-900 dark:text-white">Store Managers</strong> and <strong className="text-slate-900 dark:text-white">Admins</strong>. Your current role is <strong className="text-emerald-600 dark:text-emerald-400">Cashier</strong>.
          </p>
          {onNavigateToPOS && (
            <button
              onClick={onNavigateToPOS}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 active:scale-95 transition-all"
            >
              <span>Go to Sales POS Terminal</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Filter sales based on selected dateRange
  const now = Date.now();
  const filteredSales = sales.filter((s) => {
    const saleTime = new Date(s.createdAt).getTime();
    if (dateRange === 'today') {
      return new Date(s.createdAt).toDateString() === new Date().toDateString();
    } else if (dateRange === 'week') {
      return saleTime >= now - 7 * 86400000;
    } else if (dateRange === 'month') {
      return saleTime >= now - 30 * 86400000;
    } else if (dateRange === 'year') {
      return saleTime >= now - 365 * 86400000;
    }
    return true;
  });

  // Calculate Real Metrics
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalCost = filteredSales.reduce((acc, s) => acc + s.cost, 0);
  const grossProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
  const totalOrders = filteredSales.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

  // Total products stats
  const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalStockValue = products.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
  const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock).length;
  const outOfStockCount = products.filter((p) => p.quantity === 0).length;

  // Real Dynamic Chart Data
  const chartMonthlyData = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w, idx) => {
    const weekSales = filteredSales.filter((s) => {
      const diffDays = (Date.now() - new Date(s.createdAt).getTime()) / 86400000;
      return diffDays >= (3 - idx) * 7 && diffDays < (4 - idx) * 7;
    });
    return {
      period: w,
      revenue: weekSales.reduce((acc, s) => acc + s.total, 0),
      cost: weekSales.reduce((acc, s) => acc + s.cost, 0),
      profit: weekSales.reduce((acc, s) => acc + s.profit, 0),
    };
  });

  const hasSalesInPeriod = filteredSales.length > 0;

  // Product performance calculation (Strictly real)
  const productPerformance = products.map((prod) => {
    let unitsSold = 0;
    let revenue = 0;
    let cost = 0;

    filteredSales.forEach((sale) => {
      const item = sale.items.find((i) => i.productId === prod.id);
      if (item) {
        unitsSold += item.quantity;
        revenue += item.total;
        cost += item.purchasePrice * item.quantity;
      }
    });

    const profit = revenue - cost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return {
      product: prod,
      unitsSold,
      revenue,
      profit,
      margin,
    };
  });

  const bestSellers = [...productPerformance]
    .filter((p) => p.unitsSold > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const slowMovers = [...productPerformance]
    .filter((p) => p.unitsSold === 0)
    .slice(0, 5);

  // Category sales breakdown
  const categoryMap = new Map<string, { revenue: number; profit: number }>();
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cat = prod?.categoryName || 'General';
      const existing = categoryMap.get(cat) || { revenue: 0, profit: 0 };
      existing.revenue += item.total;
      existing.profit += item.total - item.purchasePrice * item.quantity;
      categoryMap.set(cat, existing);
    });
  });

  const categoryData = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    revenue: data.revenue,
    profit: data.profit,
  }));

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Period', 'Metric', 'Value'];
    const rows = [
      [dateRange, 'Gross Revenue', totalRevenue],
      [dateRange, 'Total Cost', totalCost],
      [dateRange, 'Gross Profit', grossProfit],
      [dateRange, 'Total Orders', totalOrders],
      [dateRange, 'Average Order Value', avgOrderValue],
      [dateRange, 'Profit Margin', `${profitMargin}%`],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockFlow_Report_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reports & Business Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Financial performance, cost of goods sold (COGS), gross margins, and inventory turns.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range filter */}
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setDateRange('today')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                dateRange === 'today' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                dateRange === 'week' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                dateRange === 'month' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                dateRange === 'year' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              This Year
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Gross Revenue</span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalRevenue)}
          </p>
          <span className="text-[10px] text-slate-400">Total counter billings</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Product Cost (COGS)</span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-300 mt-1">
            {formatCurrency(totalCost)}
          </p>
          <span className="text-[10px] text-slate-400">Inventory cost incurred</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Gross Profit</span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
            {formatCurrency(grossProfit)}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">{profitMargin}% gross margin</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Completed Orders</span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatNumber(totalOrders)}
          </p>
          <span className="text-[10px] text-slate-400">Processed invoices</span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Order Value (AOV)</span>
          <p className="text-xl sm:text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">
            {formatCurrency(avgOrderValue)}
          </p>
          <span className="text-[10px] text-slate-400">Per counter ticket</span>
        </div>
      </div>

      {/* Report Section Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('sales')}
          className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sales'
              ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Sales & Margin Trends
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Inventory Valuation & Stock
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Product Performance (Velocity)
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Category Contribution
        </button>
      </div>

      {/* Tab 1: Sales & Margin Trends */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue vs Cost Breakdown</h3>
            <p className="text-[11px] text-slate-500 mb-4">Weekly gross revenue alongside procurement expenditure</p>
            <div className="h-80 w-full flex items-center justify-center">
              {!hasSalesInPeriod ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Receipt className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No transactions recorded in this period</p>
                  <p className="mt-1">Once sales are created in the POS, revenue and margin charts will populate.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), '']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="revenue" name="Gross Revenue" fill="#0891b2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" name="Product Cost" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory Valuation & Stock */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Inventory Value</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalStockValue)}
              </p>
              <span className="text-[10px] text-slate-500">Asset capital tied in stock</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Stock Units</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalUnits}
              </p>
              <span className="text-[10px] text-slate-500">Units on physical shelves</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-amber-600 uppercase">Low Stock Alerts</span>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">
                {lowStockCount}
              </p>
              <span className="text-[10px] text-slate-500">Items below reorder point</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[11px] font-semibold text-rose-600 uppercase">Stockouts</span>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">
                {outOfStockCount}
              </p>
              <span className="text-[10px] text-rose-500">Zero inventory remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Product Performance */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Selling Products */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Award className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Revenue Drivers</h3>
            </div>
            <div className="space-y-3 pt-3">
              {bestSellers.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No sales recorded yet to rank best-selling items.
                </p>
              ) : (
                bestSellers.map((item, idx) => (
                  <div key={item.product.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 font-bold text-[10px] text-slate-600 dark:bg-slate-800">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-400">{item.unitsSold} units · {item.margin}% margin</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Slow-Moving Products */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <AlertOctagon className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Slow Moving Inventory (0 sold)</h3>
            </div>
            <div className="space-y-3 pt-3">
              {slowMovers.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  All stocked catalog items have recorded sales.
                </p>
              ) : (
                slowMovers.map((item, idx) => (
                  <div key={item.product.id} className="flex items-center justify-between text-xs">
                    <div className="truncate min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400">Current Stock: {item.product.quantity} units</p>
                    </div>
                    <span className="font-semibold text-amber-600 shrink-0">
                      0 sold
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Category Contribution */}
      {activeTab === 'categories' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Revenue & Margins</h3>
          <p className="text-[11px] text-slate-500 mb-4">Breakdown of gross revenue generated across catalog categories</p>
          <div className="overflow-x-auto">
            {categoryData.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No category sales recorded in this period.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-right">Revenue</th>
                    <th className="py-2.5 text-right">Gross Profit</th>
                    <th className="py-2.5 text-right">Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {categoryData.map((cat) => (
                    <tr key={cat.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{cat.name}</td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(cat.revenue)}</td>
                      <td className="py-3 text-right font-bold text-emerald-600">{formatCurrency(cat.profit)}</td>
                      <td className="py-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                        {cat.revenue > 0 ? Math.round((cat.profit / cat.revenue) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
