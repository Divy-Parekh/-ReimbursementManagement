const axios = require('axios');

let countriesCache = null;
let lastFetchTimestamp = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const fetchCountries = async () => {
  const now = Date.now();

  if (countriesCache && lastFetchTimestamp && (now - lastFetchTimestamp < CACHE_TTL)) {
    return countriesCache;
  }

  try {
    const url = process.env.COUNTRIES_API_URL || 'https://restcountries.com/v3.1/all?fields=name,currencies';
    const response = await axios.get(url);
    
    // Transform data
    const formattedCountries = response.data
      .filter((c) => c.currencies) // filter out countries without currencies
      .map((c) => {
        const currencyCode = Object.keys(c.currencies)[0];
        const currencyObj = c.currencies[currencyCode];
        
        return {
          name: c.name.common,
          currency: {
            code: currencyCode,
            name: currencyObj.name,
            symbol: currencyObj.symbol || currencyCode
          }
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    countriesCache = formattedCountries;
    lastFetchTimestamp = now;

    return formattedCountries;
  } catch (error) {
    console.error('REST Countries API Error:', error.message);
    throw new Error('Failed to fetch country data');
  }
};

module.exports = {
  fetchCountries,
};
