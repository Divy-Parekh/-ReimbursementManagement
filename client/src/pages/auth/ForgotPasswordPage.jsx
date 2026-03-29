import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import authService from '../../services/authService';
import { validateEmail } from '../../utils/validators';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('New password sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Check your email</h2>
        <p className="text-sm text-text-muted mb-6">
          We've sent a new password to <strong className="text-text-secondary">{email}</strong>. Use it to log in and then change your password.
        </p>
        <Link to="/login">
          <Button variant="outline" icon={ArrowLeft}>Back to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">Forgot password?</h2>
      <p className="text-sm text-text-muted mb-6">Enter your email and we'll send you a new password</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          error={error}
          placeholder="you@company.com"
        />
        <Button type="submit" className="w-full" loading={loading}>
          Send New Password
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-muted text-center">
        <Link to="/login" className="text-primary-light hover:text-primary font-medium transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
      </p>
    </div>
  );
}
