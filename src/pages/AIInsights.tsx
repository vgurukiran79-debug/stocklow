import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle2,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { storage } from '../services/storage';
import { askStockFlowAI, fetchAIExecutiveInsights, AIInsightItem } from '../services/ai';
import { ProductForecast } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  source?: string;
  timestamp: string;
}

export const AIInsights: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'assistant' | 'forecast' | 'insights'>('assistant');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [forecasts, setForecasts] = useState<ProductForecast[]>([]);
  const [executiveInsights, setExecutiveInsights] = useState<AIInsightItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const buildContext = () => {
    const kpis = storage.getDashboardKPIs();
    const products = storage.getProducts().filter((p) => p.isActive);
    const sales = storage.getSales();

    const lowStockSample = products
      .filter((p) => p.quantity <= p.minimumStock)
      .slice(0, 3)
      .map((p) => `${p.name} (Stock: ${p.quantity})`)
      .join(', ');

    // Calculate actual top product if any
    const productSalesCount = new Map<string, number>();
    sales.forEach((s) => {
      s.items.forEach((i) => {
        productSalesCount.set(i.productName, (productSalesCount.get(i.productName) || 0) + i.quantity);
      });
    });

    const topProductEntry = Array.from(productSalesCount.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      totalRevenue: kpis.totalRevenue,
      grossProfit: kpis.grossProfit,
      profitMargin: kpis.totalRevenue > 0 ? `${Math.round((kpis.grossProfit / kpis.totalRevenue) * 100)}` : '0',
      totalProducts: kpis.totalProducts,
      totalOrders: kpis.todayOrders,
      lowStockCount: kpis.lowStockCount,
      lowStockSample,
      topProduct: topProductEntry ? topProductEntry[0] : undefined,
      currency: '₹',
    };
  };

  useEffect(() => {
    const calculatedForecasts = storage.getProductForecasts();
    setForecasts(calculatedForecasts);

    const ctx = buildContext();
    fetchAIExecutiveInsights(ctx).then((res) => {
      setExecutiveInsights(res);
    });

    const user = storage.getCurrentUser();
    const kpis = storage.getDashboardKPIs();

    // Initial greeting based strictly on real state
    const greeting =
      kpis.totalProducts === 0
        ? `Hello ${user.name}! 👋 I am StockFlow AI, your dedicated inventory and retail assistant. Your store catalog is clean and ready. Add products to begin tracking stock levels, and make sales in POS to unlock predictive velocity analytics!`
        : `Hello ${user.name}! 👋 I am StockFlow AI. Your store currently holds ${kpis.totalProducts} catalog products and ${formatCurrency(kpis.totalRevenue)} in sales. How can I assist you with your business today?`;

    setMessages([
      {
        id: 'msg_0',
        sender: 'ai',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    const ctx = buildContext();
    const result = await askStockFlowAI(text, ctx);

    const aiMsg: ChatMessage = {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text: result.reply,
      source: result.source,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleRefreshInsights = async () => {
    setIsRefreshing(true);
    const ctx = buildContext();
    const res = await fetchAIExecutiveInsights(ctx);
    setExecutiveInsights(res);
    setIsRefreshing(false);
  };

  const samplePromptChips = [
    'Which products sold the most?',
    'Which products are running low?',
    'What is my estimated profit margin?',
    'Which products should I reorder?',
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              StockFlow AI
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data-grounded business intelligence, stockout predictions, and retail guidance.
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('assistant')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeSubTab === 'assistant'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            AI Assistant
          </button>
          <button
            onClick={() => setActiveSubTab('forecast')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeSubTab === 'forecast'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Stock Forecasting
          </button>
          <button
            onClick={() => setActiveSubTab('insights')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeSubTab === 'insights'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Today's Insights
          </button>
        </div>
      </div>

      {/* Subtab 1: AI Chat Assistant */}
      {activeSubTab === 'assistant' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[640px]">
          {/* Top Assistant Status */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Connected to Active Business Ledger
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Grounded in live inventory, sales & pricing data
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {m.sender === 'ai' ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold dark:bg-slate-700">
                    You
                  </div>
                )}

                <div
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <div
                    className={`mt-1.5 flex items-center justify-between text-[10px] ${
                      m.sender === 'user' ? 'text-cyan-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {m.source && (
                      <span className="ml-2 font-mono">[{m.source}]</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 animate-bounce delay-150" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 animate-bounce delay-300" />
                    <span className="ml-2 text-[11px]">Analyzing catalog metrics & sales ledger...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="border-t border-slate-100 p-2.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/20 overflow-x-auto flex gap-1.5">
            {samplePromptChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-cyan-500 hover:bg-slate-50 whitespace-nowrap transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="border-t border-slate-200 p-3 bg-white dark:border-slate-800 dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask StockFlow AI anything about inventory, sales trends, reorder quantities..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50 active:scale-95 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Subtab 2: AI Inventory Forecasting */}
      {activeSubTab === 'forecast' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/20 text-xs">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Predictive Stockout & Restock Forecast Engine
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  Calculates estimated days remaining until depletion and recommends replenishment quantities to avoid lost retail revenue.
                  <span className="block mt-1 font-semibold text-slate-400">
                    * Estimates based on current stock, historical order velocity, and buffer thresholds.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              {forecasts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Inbox className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No products to forecast</p>
                  <p className="mt-1">Add items in the Inventory section to generate stockout velocity projections.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3 text-center">Current Stock</th>
                      <th className="py-3 px-3 text-center">Avg Daily Sales</th>
                      <th className="py-3 px-3 text-center">Stock Duration</th>
                      <th className="py-3 px-3 text-center">Recommended Restock</th>
                      <th className="py-3 px-4 text-center">AI Urgency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {forecasts.map((f) => (
                      <tr key={f.product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">{f.product.name}</p>
                          <p className="text-[10px] text-slate-400">{f.product.categoryName}</p>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-600 dark:text-slate-300">
                          {f.product.sku}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {f.currentStock} {f.product.unit}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-semibold">
                          {f.dailyAverageSales > 0 ? `~${f.dailyAverageSales} / day` : 'No sales yet'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          <span
                            className={
                              f.daysRemaining <= 5 && f.dailyAverageSales > 0
                                ? 'text-rose-600'
                                : f.daysRemaining <= 10 && f.dailyAverageSales > 0
                                ? 'text-amber-600'
                                : 'text-slate-600 dark:text-slate-300'
                            }
                          >
                            {f.currentStock === 0
                              ? 'Depleted (0 days)'
                              : f.dailyAverageSales === 0
                              ? 'Stable'
                              : `${f.daysRemaining} days`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-extrabold text-cyan-700 dark:text-cyan-400">
                          {f.recommendedRestock > 0 ? `+${f.recommendedRestock} units` : 'Adequate'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              f.urgency === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : f.urgency === 'WARNING'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {f.urgency}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Today's AI Business Insights */}
      {activeSubTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              🤖 Executive Business Intelligence Highlights
            </h3>
            <button
              onClick={handleRefreshInsights}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Insights</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {executiveInsights.map((ins, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-start gap-4"
              >
                <div
                  className={`rounded-xl p-2.5 shrink-0 ${
                    ins.type === 'positive'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : ins.type === 'warning'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                  }`}
                >
                  {ins.type === 'positive' ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : ins.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <DollarSign className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {ins.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {ins.text}
                  </p>
                  <span className="inline-block mt-2 font-mono text-[10px] text-slate-400">
                    Live Verified from Database Records
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
