export interface BusinessAIContext {
  totalRevenue: number;
  grossProfit: number;
  profitMargin: string;
  totalProducts: number;
  totalOrders: number;
  lowStockCount: number;
  lowStockSample?: string;
  topProduct?: string;
  currency: string;
  recentSalesSample?: string[];
}

export interface AIInsightItem {
  type: 'positive' | 'warning' | 'opportunity' | 'neutral';
  title: string;
  text: string;
  icon?: string;
}

export async function askStockFlowAI(message: string, context: BusinessAIContext): Promise<{ reply: string; source: string }> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn('AI API call failed, generating localized data-grounded response:', error);
    const query = message.toLowerCase();

    if (context.totalProducts === 0) {
      return {
        reply: "Your store is currently fresh and ready for input. Once you add your catalog products and record sales in the POS, I will analyze stock velocity and profit margins for you.",
        source: 'local-analytics',
      };
    }

    if (query.includes('low') || query.includes('reorder') || query.includes('stock')) {
      return {
        reply: context.lowStockCount > 0
          ? `You currently have ${context.lowStockCount} items at or below critical inventory thresholds (${context.lowStockSample || 'attention required'}).`
          : "All active products currently have sufficient stock above minimum buffer levels.",
        source: 'local-analytics',
      };
    } else if (query.includes('profit') || query.includes('margin')) {
      return {
        reply: `Your gross profit is ${context.currency}${context.grossProfit.toLocaleString()} across recorded sales, representing an average gross margin of ${context.profitMargin}%.`,
        source: 'local-analytics',
      };
    } else if (query.includes('best') || query.includes('top') || query.includes('sell')) {
      return {
        reply: context.topProduct
          ? `Your top performing product is ${context.topProduct}, contributing to total volume.`
          : 'No product sales recorded yet to rank best-selling items.',
        source: 'local-analytics',
      };
    } else if (query.includes('revenue') || query.includes('sales')) {
      return {
        reply: `Total recorded sales revenue stands at ${context.currency}${context.totalRevenue.toLocaleString()} across ${context.totalOrders} customer orders.`,
        source: 'local-analytics',
      };
    }

    return {
      reply: `Your store currently holds ${context.totalProducts} catalog products and ${context.currency}${context.totalRevenue.toLocaleString()} in sales.`,
      source: 'local-analytics',
    };
  }
}

export async function fetchAIExecutiveInsights(context: BusinessAIContext): Promise<AIInsightItem[]> {
  try {
    const res = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.insights) && data.insights.length > 0) {
        return data.insights;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch server insights, using real calculations:', e);
  }

  // Live calculated insights based strictly on actual numbers
  if (context.totalProducts === 0) {
    return [
      {
        type: 'neutral',
        title: 'Clean Store Slate',
        text: 'Your catalog is clean and ready. Add products in the Inventory module to begin.',
      },
      {
        type: 'opportunity',
        title: 'POS Ready',
        text: 'The POS counter is ready for fast barcode scanning and counter transactions.',
      },
    ];
  }

  const items: AIInsightItem[] = [
    {
      type: 'neutral',
      title: 'Catalog Health',
      text: `${context.totalProducts} active SKUs in catalog ready for counter sales.`,
    },
  ];

  if (context.lowStockCount > 0) {
    items.unshift({
      type: 'warning',
      title: 'Restock Required',
      text: `${context.lowStockCount} products are below safety thresholds. Consider restocking soon.`,
    });
  }

  if (context.totalRevenue > 0) {
    items.unshift({
      type: 'positive',
      title: 'Sales Momentum',
      text: `Recorded ${context.currency}${context.totalRevenue.toLocaleString()} in revenue with a ${context.profitMargin}% gross margin.`,
    });
  }

  return items;
}
