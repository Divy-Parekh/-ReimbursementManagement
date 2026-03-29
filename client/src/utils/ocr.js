import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imageFile, onProgress) {
  const result = await Tesseract.recognize(imageFile, 'eng', {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  return result.data.text;
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

  // Extract amount
  const amountPatterns = [
    /(?:total|grand total|amount|sum|net|balance)[:\s]*[\$€£₹¥]?\s*([\d,]+\.?\d*)/i,
    /[\$€£₹¥]\s*([\d,]+\.?\d*)/,
    /(?:rs\.?|inr|usd|eur|gbp)\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.\d{2})\s*$/m,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      fields.amount = parseFloat(match[1].replace(/,/g, ''));
      break;
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
