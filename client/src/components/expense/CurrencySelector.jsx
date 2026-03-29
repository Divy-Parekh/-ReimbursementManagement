import Select from '../common/Select';
import { useCountries } from '../../hooks/useCountries';

export default function CurrencySelector({ value, onChange, error, className = '' }) {
  const { currencies, loading } = useCountries();

  const options = currencies.map((c) => ({
    value: c.code,
    label: `${c.code} — ${c.symbol} (${c.name})`,
  }));

  return (
    <Select
      label="Currency"
      value={value}
      onChange={onChange}
      options={options}
      placeholder={loading ? 'Loading currencies...' : 'Select currency'}
      error={error}
      className={className}
      id="currency-selector"
    />
  );
}
