import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiEnabled: !!geminiApiKey,
  });
});

// AI Chat Endpoint with business context
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!aiClient) {
      // Deterministic intelligent fallback when API key is missing or not provided
      const msg = message.toLowerCase();
      let responseText = "I have analyzed your business records. ";
      if ((context?.totalProducts ?? 0) === 0) {
        responseText = "Your store catalog is completely clean and ready for fresh input. Add your products in the Inventory section or process sales in the POS to begin generating live business analytics and restock predictions.";
      } else if (msg.includes('low') || msg.includes('stock')) {
        responseText += `You currently have ${context?.lowStockCount ?? 0} products flagged at or below minimum reorder thresholds. ${context?.lowStockSample ? `Items needing attention: ${context.lowStockSample}.` : 'Stock levels are currently balanced.'}`;
      } else if (msg.includes('profit') || msg.includes('margin')) {
        responseText += (context?.totalRevenue ?? 0) > 0
          ? `Your recorded gross profit stands at ₹${(context?.grossProfit ?? 0).toLocaleString()} with a gross margin of ${context?.profitMargin ?? '0'}%.`
          : `No sales recorded yet. Once you ring up counter sales in the POS, your real-time gross margin and net profit will calculate here.`;
      } else if (msg.includes('best') || msg.includes('top') || msg.includes('sell')) {
        responseText += context?.topProduct
          ? `Your top performing product is ${context.topProduct}, contributing to total volume.`
          : 'No product sales recorded yet to rank best-selling items.';
      } else if (msg.includes('revenue') || msg.includes('sales')) {
        responseText += (context?.totalRevenue ?? 0) > 0
          ? `Total recorded revenue is ₹${(context?.totalRevenue ?? 0).toLocaleString()} across ${context?.totalOrders ?? 0} customer orders.`
          : `No sales recorded yet. Counter sales recorded in POS will automatically reflect in your daily revenue metrics.`;
      } else {
        responseText += `You have ${context?.totalProducts ?? 0} active catalog items and ₹${(context?.totalRevenue ?? 0).toLocaleString()} in recorded sales.`;
      }
      return res.json({ reply: responseText, source: 'system-analytics' });
    }

    const systemPrompt = `You are StockFlow AI, the dedicated business intelligence assistant for "STOCKFLOW: Digital Inventory & Sales Management System".
Your role is to analyze the user's business metrics, stock levels, sales records, customer behaviors, and profit margins.
Ground every answer strictly in the provided business context JSON:
${JSON.stringify(context || {}, null, 2)}

Guidelines:
1. Always use INR currency symbol (₹) and actual business numbers.
2. If totalProducts is 0, advise the user to add their fresh products in Inventory.
3. Be precise, concise, and actionable for a business owner or retail manager.
4. If data is missing or insufficient, state "Not enough data to calculate this metric accurately yet."
5. Suggest concrete operational actions.`;

    const geminiRes = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    const reply = geminiRes.text || 'Unable to analyze business data at this time.';
    res.json({ reply, source: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({
      error: 'Failed to process AI query',
      details: error?.message || 'Server error',
    });
  }
});

// AI Executive Insights Generation
app.post('/api/ai/insights', async (req: Request, res: Response) => {
  try {
    const { context } = req.body;

    if (!aiClient) {
      if ((context?.totalProducts ?? 0) === 0) {
        return res.json({
          insights: [
            {
              type: 'neutral',
              icon: 'Package',
              title: 'Clean Store Slate',
              text: 'Store ledger is clean and ready. Add products to catalog to begin monitoring inventory.',
            },
            {
              type: 'positive',
              icon: 'ShoppingCart',
              title: 'POS Terminal Ready',
              text: 'Point of sale is armed for instant billing, barcode scanning, and invoice printing.',
            },
            {
              type: 'neutral',
              icon: 'AlertTriangle',
              title: 'Safety Stock Alerts',
              text: 'Automated reorder warnings will activate when inventory levels drop below thresholds.',
            },
          ],
        });
      }

      return res.json({
        insights: [
          {
            type: (context?.totalRevenue ?? 0) > 0 ? 'positive' : 'neutral',
            icon: 'TrendingUp',
            title: 'Revenue Tracker',
            text: (context?.totalRevenue ?? 0) > 0
              ? `Total revenue: ₹${(context?.totalRevenue ?? 0).toLocaleString()} across ${context?.totalOrders ?? 0} orders.`
              : 'Ready to record first sales in POS terminal.',
          },
          {
            type: (context?.lowStockCount ?? 0) > 0 ? 'warning' : 'positive',
            icon: 'AlertTriangle',
            title: 'Stock Health',
            text: (context?.lowStockCount ?? 0) > 0
              ? `${context?.lowStockCount} products are at or below minimum threshold.`
              : 'All catalog items are currently within safe stock levels.',
          },
          {
            type: 'opportunity',
            icon: 'DollarSign',
            title: 'Catalog Overview',
            text: `${context?.totalProducts ?? 0} products active in catalog ready for counter sales.`,
          },
        ],
      });
    }

    const prompt = `Based on the following business performance data:
${JSON.stringify(context || {}, null, 2)}

Generate 3-4 short, highly actionable executive business insights in JSON format:
Array of objects with:
- type: 'positive' | 'warning' | 'opportunity' | 'neutral'
- title: string (max 4 words)
- text: string (max 20 words, with specific numbers)
Respond ONLY with the raw JSON array.`;

    const geminiRes = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(geminiRes.text || '[]');
    res.json({ insights: parsed });
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`StockFlow Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
