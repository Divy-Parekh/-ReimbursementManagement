const axios = require('axios');

// In-memory cache for exchange rates to avoid hitting the API too often
// In a real app, use Redis or similar
let ratesCache = {
  base: null,
  timestamp: null,
  rates: {},
};

/**
 * Fetch raw exchange rates from API
 */
const fetchExchangeRates = async (baseCurrency = 'USD') => {
  try {
    const apiUrl = process.env.EXCHANGE_RATE_API_URL.replace('{BASE}', baseCurrency);
    // If the URL in env doesn't have {BASE}, just append it
    const finalUrl = apiUrl.includes('{BASE}') 
      ? apiUrl 
      : `${apiUrl}/${baseCurrency}`;
      
    const response = await axios.get(finalUrl);
    return response.data;
  } catch (error) {
    console.error('ExchangeRate API Error:', error.message);
    throw new Error('Failed to fetch exchange rates');
  }
};

/**
 * Get exchange rate between two currencies
 * Uses cache if available and not expired
 */
const getExchangeRate = async (from, to) => {
  if (from === to) return 1;

  const now = Date.now();
  const ttl = (parseInt(process.env.EXCHANGE_RATE_CACHE_TTL) || 3600) * 1000;

  // Check cache
  if (
    ratesCache.base === from &&
    ratesCache.timestamp &&
    now - ratesCache.timestamp < ttl
  ) {
    if (ratesCache.rates[to]) {
      return ratesCache.rates[to];
    }
  }

  // Cache miss or expired, fetch new rates
  const data = await fetchExchangeRates(from);
  
  // Update cache
  ratesCache = {
    base: from,
    timestamp: now,
    rates: data.rates,
  };

  const rate = data.rates[to];
  if (!rate) {
    throw new Error(`Exchange rate not found for currency: ${to}`);
  }

  return rate;
};

/**
 * Convert an amount from one currency to another
 */
const convertCurrency = async (amount, from, to) => {
  const rate = await getExchangeRate(from, to);
  return amount * rate;
};

module.exports = {
  fetchExchangeRates,
  getExchangeRate,
  convertCurrency,
};
