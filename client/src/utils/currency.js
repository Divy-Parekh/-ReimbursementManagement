const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
  AUD: 'A$', CAD: 'C$', CHF: 'CHF', CNY: '¥', KRW: '₩',
  BRL: 'R$', MXN: 'MX$', SGD: 'S$', HKD: 'HK$', NOK: 'kr',
  SEK: 'kr', DKK: 'kr', NZD: 'NZ$', ZAR: 'R', RUB: '₽',
  TRY: '₺', THB: '฿', PHP: '₱', MYR: 'RM', IDR: 'Rp',
  AED: 'د.إ', SAR: '﷼', PKR: '₨', LKR: 'Rs', BDT: '৳',
};

export function getCurrencySymbol(code) {
  return CURRENCY_SYMBOLS[code] || code;
}

export function formatCurrency(amount, currencyCode = 'INR') {
  if (amount === null || amount === undefined) return '—';
  const num = parseFloat(amount);
  if (isNaN(num)) return '—';

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${num.toLocaleString()}`;
  }
}

export function formatAmount(amount) {
  if (amount === null || amount === undefined) return '0';
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
