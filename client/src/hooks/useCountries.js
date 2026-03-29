import { useApp } from '../context/AppContext';

export function useCountries() {
  const { countries, currencies, loadingCountries } = useApp();
  return { countries, currencies, loading: loadingCountries };
}
