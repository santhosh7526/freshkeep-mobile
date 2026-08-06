
import { createWorker } from 'tesseract.js';
import { FoodItem } from '../models/types';

export interface ScannedProductResult {
  name: string;
  category: FoodItem['category'];
  expiryDate: string | null;        // YYYY-MM-DD — expiry/best-before/use-by
  manufacturingDate?: string | null;// YYYY-MM-DD — manufacturing/packed date
  batchNumber?: string | null;
  confidence: number;
  price: number;
  quantity: number;
  unit: string;
  rawTextDetected: string;   // raw text where EXP date was found
  mfgRawText?: string;       // raw text where MFD date was found
  dateFoundSnippet?: string;
  hasExpiryDate?: boolean;
  daysUntilExpiry?: number;
  expiryStatus?: 'expired' | 'critical' | 'warning' | 'good' | 'unknown';
  engine?: 'gemini' | 'tesseract';
}

/** Calculate days remaining and set expiry status */
export function calculateExpiryInfo(expiryDate: string | null): {
  daysUntilExpiry: number;
  expiryStatus: 'expired' | 'critical' | 'warning' | 'good' | 'unknown';
} {
  if (!expiryDate) return { daysUntilExpiry: -999, expiryStatus: 'unknown' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const expiryStatus: 'expired' | 'critical' | 'warning' | 'good' =
    daysUntilExpiry < 0 ? 'expired' :
    daysUntilExpiry <= 3 ? 'critical' :
    daysUntilExpiry <= 7 ? 'warning' : 'good';
  return { daysUntilExpiry, expiryStatus };
}

// ─── Tesseract + Regex fallback ────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Try to parse a date string found in OCR text into YYYY-MM-DD.
 * Handles formats like:
 *   DD/MM/YYYY, DD-MM-YYYY, MM/YYYY, DD MMM YYYY, YYYY-MM-DD, etc.
 */
function parseRawDate(raw: string): string | null {
  const s = raw.trim();

  // YYYY-MM-DD
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy4 = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy4) {
    const [, d, m, y] = dmy4;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD/MM/YY or DD-MM-YY
  const dmy2 = s.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/);
  if (dmy2) {
    const [, d, m, y] = dmy2;
    const year = parseInt(y) >= 24 ? `20${y}` : `20${y}`;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD MMM YYYY  e.g. 25 JUL 2026
  const dMonY = s.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (dMonY) {
    const [, d, mon, y] = dMonY;
    const m = MONTH_MAP[mon.toLowerCase()];
    if (m) return `${y}-${m}-${d.padStart(2, '0')}`;
  }

  // MMM YYYY or MMM'YY  e.g. JUL 2026 / JUL'26
  const monY = s.match(/([A-Za-z]{3})[\s'\/\-](\d{4}|\d{2})/);
  if (monY) {
    const [, mon, y] = monY;
    const m = MONTH_MAP[mon.toLowerCase()];
    if (m) {
      const year = y.length === 2 ? `20${y}` : y;
      return `${year}-${m}-01`;
    }
  }

  // MM/YYYY or MM-YYYY
  const my = s.match(/(\d{2})[\/\-](\d{4})/);
  if (my) {
    return `${my[2]}-${my[1]}-01`;
  }

  return null;
}

/**
 * Extract expiry date from OCR raw text using keyword patterns.
 */
function extractExpiryFromText(text: string): { date: string; snippet: string } | null {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);

  // Keywords that signal an EXPIRY date (NOT manufacturing)
  const expiryKeywords = /\b(exp(?:iry|ires?|\.)?|use\s*by|best\s*before|bb\.?|b\.b\.|sell\s*by|consume\s*before)\b/i;
  // Keywords to SKIP (manufacturing)
  const mfgKeywords = /\b(mfg|mfd|manufactured|packed|pkd|production|prod\.?)\b/i;

  for (const line of lines) {
    if (mfgKeywords.test(line)) continue; // skip manufacturing lines
    if (expiryKeywords.test(line)) {
      // Strip the keyword and try to parse a date from rest of line
      const datePart = line.replace(expiryKeywords, '').replace(/[:.\s]+/, '').trim();
      const parsed = parseRawDate(datePart) || parseRawDate(line);
      if (parsed) return { date: parsed, snippet: line };
    }
  }

  // Second pass: try every line for a date pattern with future dates only
  for (const line of lines) {
    if (mfgKeywords.test(line)) continue;
    const parsed = parseRawDate(line);
    if (parsed) {
      const dateObj = new Date(parsed);
      if (dateObj > new Date()) return { date: parsed, snippet: line };
    }
  }

  return null;
}

/**
 * Use Tesseract.js to OCR the image and extract expiry date via regex.
 * Free, runs entirely in the browser, no API key needed.
 */
async function scanWithTesseract(imageSrc: string): Promise<ScannedProductResult> {
  const worker = await createWorker('eng');

  try {
    const { data } = await worker.recognize(imageSrc);
    const rawText = data.text || '';
    console.log('[Tesseract] Raw OCR text:\n', rawText);

    const expiryResult = extractExpiryFromText(rawText);

    const expiryDate = expiryResult?.date || '';
    const { daysUntilExpiry, expiryStatus } = calculateExpiryInfo(expiryDate);

    return {
      name: 'Scanned Product',
      category: 'pantry',
      expiryDate,
      hasExpiryDate: !!expiryDate,
      confidence: expiryDate ? Math.round(data.confidence) : 0,
      price: 65,
      quantity: 1,
      unit: 'pcs',
      rawTextDetected: expiryResult?.snippet || rawText.slice(0, 200) || 'No text detected in image',
      dateFoundSnippet: expiryResult?.snippet,
      daysUntilExpiry,
      expiryStatus,
      engine: 'tesseract',
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Use backend API (http://localhost:5001/api/scan) for Gemini 1.5 Flash Vision API.
 * The API key is securely held by the server.
 */
async function scanWithGemini(imageSrc: string): Promise<ScannedProductResult> {
  const base64Data = imageSrc.split(',')[1];
  const mimeType = imageSrc.split(';')[0].split(':')[1];

  try {
    const response = await fetch('http://localhost:5001/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to scan image with backend API.');
    }

    const { result, success } = await response.json();
    if (!success || !result) {
      throw new Error('Backend OCR failed to return valid JSON.');
    }

    const parsed = result;
    const expiryDate = parsed.expiryDate || null;
    const { daysUntilExpiry, expiryStatus } = calculateExpiryInfo(expiryDate);

    return {
      name: parsed.name || 'Scanned Food Product',
      category: parsed.category || 'pantry',
      expiryDate,
      manufacturingDate: parsed.manufacturingDate || null,
      batchNumber: parsed.batchNumber || null,
      hasExpiryDate: !!expiryDate,
      confidence: parsed.confidence ?? 90,
      price: parsed.price || 0,
      quantity: parsed.quantity || 1,
      unit: parsed.unit || 'pcs',
      rawTextDetected: parsed.rawText || 'Vision Scanner',
      mfgRawText: parsed.mfgRawText || '',
      dateFoundSnippet: expiryDate ? parsed.rawText : undefined,
      daysUntilExpiry,
      expiryStatus,
      engine: 'gemini',
    };
  } catch (error: any) {
    throw new Error(`Gemini Scan Error: ${error.message}`);
  }
}

/**
 * Main OCR entry point.
 * Tries Gemini backend first. Only falls back to Tesseract for network errors (backend down).
 * For API key/quota errors, surfaces the real error immediately so the user knows what to fix.
 */
export async function performRealImageOCR(imageSrc: string): Promise<ScannedProductResult> {
  try {
    console.log('[OCR] Using Backend Gemini Vision API...');
    return await scanWithGemini(imageSrc);
  } catch (err: any) {
    const msg: string = err.message || '';
    
    // If it's a quota/key error, DON'T silently fall back — surface it clearly
    if (
      msg.includes('quota') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('API key') ||
      msg.includes('invalid') ||
      msg.includes('429')
    ) {
      console.error('[OCR] Gemini API key/quota error — not falling back to Tesseract:', msg);
      throw new Error(msg); // Re-throw so Scanner.tsx shows the real error
    }
    
    // Only fall back to Tesseract for network errors (backend server down)
    console.warn('[OCR] Backend unreachable, falling back to Tesseract:', msg);
  }

  console.log('[OCR] Using Tesseract.js (offline OCR fallback)...');
  try {
    return await scanWithTesseract(imageSrc);
  } catch (err: any) {
    console.error('[OCR] Tesseract also failed:', err.message);
    throw new Error(`OCR scan failed: ${err.message}. Please try a clearer photo.`);
  }
}

/** Capture image frame from HTML video element */
export function captureFrameFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  }
  return '';
}


