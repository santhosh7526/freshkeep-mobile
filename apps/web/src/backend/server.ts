import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 6. OCR SCAN Endpoint — Gemini AI Vision (key stays server-side only)
app.post('/api/scan', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ success: false, message: 'imageBase64 and mimeType are required.' });
    }

    // Support both GEMINI_API_KEY and VITE_GEMINI_API_KEY (fallback)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[SCAN] Missing Gemini API key — add GEMINI_API_KEY to .env');
      return res.status(500).json({ success: false, message: 'Gemini API key not configured. Add GEMINI_API_KEY to your .env file.' });
    }
    console.log('[SCAN] Using API key starting with:', apiKey.substring(0, 8) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are an expert Indian food product label scanner with perfect vision.
      Analyze this image and extract the following information. Return ONLY a raw JSON object with no markdown, no backticks, no extra text.

      Required fields:
      - "name": Full product name including brand and weight/volume (e.g., "Dabur Hommade Ginger Paste 200g").
      - "category": Choose the BEST match from exactly these options: ["dairy", "meat", "seafood", "vegetables", "fruits", "bakery", "pantry", "canned", "frozen", "beverages", "snacks", "spices"]. Use "dairy" for milk/curd/cheese/butter. Use "spices" for masalas/pastes/condiments. Use "snacks" for chips/biscuits. Use "beverages" for drinks/juice.
      - "expiryDate": The expiry/use-by/best-before date in YYYY-MM-DD format. Return "" if not clearly visible.
      - "manufacturingDate": The manufacturing/packed/MFD date in YYYY-MM-DD format. Return "" if not clearly visible. NEVER confuse with expiry date.
      - "batchNumber": The batch number or lot code if visible. Otherwise "".
      - "price": The MRP (Maximum Retail Price) in Indian Rupees as a number only. Look for text like "MRP Rs.", "M.R.P", "Price". Return null if not visible.
      - "quantity": Always return 1.
      - "unit": "pcs"
      - "rawText": The exact text snippet where you found the expiry date.
      - "mfgRawText": The exact text snippet where you found the MFD date.
      - "confidence": Integer 0-100. How confident you are in the overall extraction.
    `;

    // Retry loop for transient network/quota glitches (up to 2 attempts)
    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: imageBase64, mimeType } },
        ]);

        const responseText = result.response.text().trim();
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        // Sanitize date formats using Date constructor
        if (parsed.expiryDate) {
          const d = new Date(parsed.expiryDate);
          parsed.expiryDate = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        }
        if (parsed.manufacturingDate) {
          const d = new Date(parsed.manufacturingDate);
          parsed.manufacturingDate = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        }

        console.log(`[SCAN] Product scanned (Attempt ${attempt}): ${parsed.name}, Expiry: ${parsed.expiryDate}`);
        return res.json({ success: true, result: parsed });
      } catch (err: any) {
        lastError = err;
        console.warn(`[SCAN] Attempt ${attempt} failed: ${err?.message || err}`);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error('[SCAN ERROR] Full error:', JSON.stringify(error?.message || error));
    const statusCode = error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota') ? 429 : 500;
    const userMessage = error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')
      ? 'Gemini API quota exceeded. Please get a new API key from https://aistudio.google.com/apikey'
      : error.message || 'OCR scan failed.';
    return res.status(statusCode).json({ success: false, message: userMessage });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================================`);
  console.log(`🚀 FRESHKEEP BACKEND SERVER STARTED`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Endpoints: /api/scan`);
  console.log(`====================================================================`);
});
