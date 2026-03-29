import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Use local worker bundled by Vite instead of CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

async function runTesseract(imageSource, onProgress) {
  const result = await Tesseract.recognize(imageSource, 'eng', {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  return result.data.text;
}

async function extractFromPDF(file, onProgress) {
  try {
    if (onProgress) onProgress(10);
    
    const arrayBuffer = await file.arrayBuffer();
    const typedarray = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
    
    if (onProgress) onProgress(30);
    
    const page = await pdf.getPage(1);
    
    // Phase 1: Try Native PDF Text Extraction (For Digital Invoices/Receipts)
    const textContent = await page.getTextContent();
    const strings = textContent.items.map(item => item.str);
    const joinedText = strings.join(' ').trim();
    
    if (onProgress) onProgress(60);
    
    // If we've found a substantial amount of text natively, bypass OCR!
    if (joinedText.replace(/\s/g, '').length > 30) {
      if (onProgress) onProgress(100);
      return joinedText;
    }
    
    // Phase 2: Fallback OCR for Scanned PDFs
    if (onProgress) onProgress(70);
    
    const viewport = page.getViewport({ scale: 2.0 }); // High-res scale for better OCR
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    
    const dataUrl = canvas.toDataURL('image/png');
    
    const ocrText = await runTesseract(dataUrl, (p) => {
      if (onProgress) {
        // Tesseract takes over from 80% to 100%
        onProgress(80 + Math.round(p * 0.2));
      }
    });
    
    return ocrText;
  } catch (err) {
    console.error('PDF Processing Error:', err);
    throw new Error('Failed to parse PDF.');
  }
}

export async function extractTextFromImage(file, onProgress) {
  if (file.type === 'application/pdf') {
    return extractFromPDF(file, onProgress);
  }
  return runTesseract(file, onProgress);
}

export function parseReceiptText(text) {
  const fields = {
    amount: null,
    currency: null,
    date: null,
    vendorName: null,
    category: null,
    description: null,
  };

  console.log('--- RAW OCR TEXT ---');
  console.log(text);
  console.log('--------------------');

  // Extract amount
  // 1. Keyword search (looks ahead up to 30 characters including newlines for a number)
  const amountPatterns = [
    /(?:total|amount|sum|net|due|balance|pay)[\s\S]{0,30}?([\d,]+[\.,]\d{0,2})/i,
    /[\$€£₹¥]\s*([\d,]+[\.,]\d{0,2})/,
    /(?:rs\.?|inr|usd|eur|gbp)\s*([\d,]+[\.,]\d{0,2})/i,
    // Just find the word Total followed directly by an integer without decimals
    /total[\s\S]{0,30}?(\d+)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let clean = match[1];
      // Handle "1,234.56" vs "12,34"
      if (clean.includes('.') && clean.includes(',')) {
        clean = clean.replace(/,/g, '');
      } else if (clean.includes(',')) {
        clean = clean.replace(/,/g, '.'); // treat 12,34 as 12.34
      }
      
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && parsed > 0) {
        fields.amount = parsed;
        break;
      }
    }
  }

  // 2. Bruteforce Fallback: Find the LARGEST plausible number on the receipt
  if (!fields.amount) {
    // Look for decimal numbers explicitly first, or standalone integers
    const exactPrices = text.match(/[\d,]+[\.,]\d{2}\b/g);
    const genericNumbers = text.match(/\b\d+\b/g);
    
    let allPrices = exactPrices || genericNumbers;
    
    if (allPrices && allPrices.length > 0) {
      const values = allPrices.map(p => {
        let clean = p;
        if (clean.includes('.') && clean.includes(',')) clean = clean.replace(/,/g, '');
        else if (clean.includes(',')) clean = clean.replace(/,/g, '.');
        return parseFloat(clean);
      }).filter(v => !isNaN(v) && v > 0 && v < 1000000); // Filter out garbage like 99999999
      
      if (values.length > 0) {
        // Exclude generic years (like 2024, 2025) assuming they might be dates
        const likelyAmounts = values.filter(v => v < 2000 || v > 2050 || values.length === 1);
        fields.amount = likelyAmounts.length > 0 ? Math.max(...likelyAmounts) : Math.max(...values);
      }
    }
  }

  // Extract currency
  if (/\$/.test(text)) fields.currency = 'USD';
  else if (/€/.test(text)) fields.currency = 'EUR';
  else if (/£/.test(text)) fields.currency = 'GBP';
  else if (/₹|rs\.?|inr/i.test(text)) fields.currency = 'INR';
  else if (/¥/.test(text)) fields.currency = 'JPY';

  // Extract date
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    /(\w+ \d{1,2},? \d{4})/,
    /(\d{1,2} \w+ \d{4})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const parsed = new Date(match[1]);
        if (!isNaN(parsed.getTime())) {
          fields.date = parsed.toISOString().split('T')[0];
        }
      } catch {
        fields.date = match[1];
      }
      break;
    }
  }

  // Extract vendor name (typically the first meaningful line)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  if (lines.length > 0) {
    fields.vendorName = lines[0].replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
  }

  // Auto-categorize
  const lowerText = text.toLowerCase();
  if (/restaurant|cafe|food|dine|pizza|burger|coffee|tea|lunch|dinner|breakfast/i.test(lowerText)) {
    fields.category = 'Food';
  } else if (/hotel|inn|resort|stay|accommodation|airbnb|lodge/i.test(lowerText)) {
    fields.category = 'Accommodation';
  } else if (/taxi|uber|lyft|cab|flight|airline|train|bus|travel|fuel|gas|petrol/i.test(lowerText)) {
    fields.category = 'Travel';
  } else if (/office|stationery|printer|desk|supplies|paper/i.test(lowerText)) {
    fields.category = 'Office Supplies';
  } else {
    fields.category = 'Miscellaneous';
  }

  // Description from remaining text
  const descLines = lines.slice(0, 3).join(', ');
  fields.description = descLines || 'Receipt scan';

  return fields;
}
