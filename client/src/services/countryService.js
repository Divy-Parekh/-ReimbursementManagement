import axios from 'axios';

const COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=name,currencies';

const countryService = {
  async fetchCountries() {
    const response = await axios.get(COUNTRIES_API);
    const countries = response.data
      .map((c) => {
        const currencyEntries = c.currencies ? Object.entries(c.currencies) : [];
        if (currencyEntries.length === 0) return null;
        const [code, details] = currencyEntries[0];
        return {
          name: c.name.common,
          currency: {
            code,
            name: details.name,
            symbol: details.symbol || code,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
    return countries;
  },
};

export default countryService;
