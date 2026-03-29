import { createContext, useContext, useState, useEffect } from 'react';
import countryService from '../services/countryService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  async function loadCountries() {
    setLoadingCountries(true);
    try {
      const data = await countryService.fetchCountries();
      setCountries(data);
      // Extract unique currencies
      const uniqueCurrencies = [];
      const seen = new Set();
      data.forEach((c) => {
        if (!seen.has(c.currency.code)) {
          seen.add(c.currency.code);
          uniqueCurrencies.push(c.currency);
        }
      });
      uniqueCurrencies.sort((a, b) => a.code.localeCompare(b.code));
      setCurrencies(uniqueCurrencies);
    } catch (err) {
      console.error('Failed to load countries:', err);
    } finally {
      setLoadingCountries(false);
    }
  }

  return (
    <AppContext.Provider value={{ countries, currencies, loadingCountries }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
