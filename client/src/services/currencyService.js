import api from './api';
import axios from 'axios';

const EXCHANGE_API = 'https://api.exchangerate-api.com/v4/latest';

let rateCache = {};
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const currencyService = {
  async getExchangeRates(baseCurrency) {
    const now = Date.now();
    const cacheKey = baseCurrency;

    if (rateCache[cacheKey] && now - cacheTimestamp < CACHE_TTL) {
      return rateCache[cacheKey];
    }

    try {
      const response = await axios.get(`${EXCHANGE_API}/${baseCurrency}`);
      rateCache[cacheKey] = response.data.rates;
      cacheTimestamp = now;
      return response.data.rates;
    } catch {
      // fallback to backend proxy
      const response = await api.get('/currency/convert', {
        params: { from: baseCurrency, to: baseCurrency, amount: 1 },
      });
      return response.data?.data?.rates || {};
    }
  },

  async convert(from, to, amount) {
    const rates = await this.getExchangeRates(from);
    if (rates[to]) {
      return parseFloat(amount) * rates[to];
    }
    // fallback to backend
    const response = await api.get('/currency/convert', {
      params: { from, to, amount },
    });
    return response.data?.data?.convertedAmount || amount;
  },
};

export default currencyService;
