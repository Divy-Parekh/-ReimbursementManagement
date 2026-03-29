import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCountries } from '../../hooks/useCountries';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateSignupForm } from '../../utils/validators';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { countries, loading: countriesLoading } = useCountries();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', country: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateSignupForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const selectedCountry = countries.find((c) => c.name === form.country);
    const baseCurrency = selectedCountry?.currency?.code || 'USD';

    setLoading(true);
    try {
      await signup({ ...form, baseCurrency });
      toast.success('Company created successfully!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">Create your company</h2>
      <p className="text-sm text-text-muted mb-6">Register as admin to get started</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          icon={User}
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="John Admin"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="john@company.com"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          icon={Lock}
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Min. 8 characters"
        />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          icon={Lock}
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Repeat password"
        />

        {/* Country Dropdown */}
        <div className="space-y-1.5">
          <label htmlFor="country-select" className="block text-sm font-medium text-text-secondary">Country</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="w-4 h-4 text-text-muted" />
            </div>
            <select
              id="country-select"
              name="country"
              value={form.country}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-surface-800 text-text-primary pl-10 pr-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none ${
                errors.country ? 'border-danger' : 'border-border hover:border-border-light'
              }`}
            >
              <option value="">{countriesLoading ? 'Loading countries...' : 'Select your country'}</option>
              {countries.map((c) => (
                <option key={c.name} value={c.name} className="bg-surface-800">
                  {c.name} — {c.currency.code} ({c.currency.symbol})
                </option>
              ))}
            </select>
          </div>
          {errors.country && <p className="text-xs text-danger">{errors.country}</p>}
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Create Company
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-muted text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
