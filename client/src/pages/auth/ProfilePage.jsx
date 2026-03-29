import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import authService from '../../services/authService';
import toast from 'react-hot-toast';
import { LogOut, KeyRound, User as UserIcon, Mail, Building } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    // Clear targeted error mapping immediately
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Frontend Validation
    const formErrs = {};
    if (!passwords.currentPassword) formErrs.currentPassword = 'Required';
    if (!passwords.newPassword || passwords.newPassword.length < 8) {
      formErrs.newPassword = 'Password must be at least 8 characters';
    }
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      formErrs.confirmNewPassword = 'Passwords do not match';
    }
    
    if (Object.keys(formErrs).length > 0) {
      setErrors(formErrs);
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmNewPassword: passwords.confirmNewPassword,
      });
      
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password. Ensure your current password is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <UserIcon className="w-8 h-8 text-primary" /> Profile
          </h1>
          <p className="text-sm text-text-muted mt-1">Manage your account settings and credentials</p>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger font-semibold rounded-xl transition-all duration-200 shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Col - Identity Info */}
        <div className="w-full md:w-1/3">
          <Card className="p-6">
            <div className="flex flex-col items-center bg-surface-800/50 p-6 rounded-2xl border border-border/50">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-5 border-4 border-surface shadow-lg text-4xl font-bold text-primary-light uppercase">
                {user?.name?.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-1 text-center">{user?.name}</h2>
              <span className="px-4 py-1.5 bg-primary/10 text-primary-light border border-primary/20 rounded-full text-xs font-bold tracking-widest mt-2 uppercase shadow-sm">
                {user?.role}
              </span>
            </div>
            
            <div className="mt-8 space-y-5 px-2">
              <div className="flex items-center gap-4 text-sm bg-surface-800/30 p-3 rounded-lg border border-border/30">
                <div className="p-2 bg-surface rounded-md">
                  <Mail className="w-5 h-5 text-text-muted" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-text-muted font-medium mb-0.5">Contact Email</p>
                  <p className="text-text-primary font-medium truncate" title={user?.email}>{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm bg-surface-800/30 p-3 rounded-lg border border-border/30">
                <div className="p-2 bg-surface rounded-md">
                  <Building className="w-5 h-5 text-text-muted" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-text-muted font-medium mb-0.5">Organization</p>
                  <p className="text-text-primary font-medium">Verified Corp Account</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col - Change Password */}
        <div className="w-full md:w-2/3">
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-8 pb-5 border-b border-border/30">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <KeyRound className="w-6 h-6 text-primary-light" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">Update Password</h2>
                <p className="text-sm text-text-muted">Ensure your account is using a secure, random password.</p>
              </div>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
              <div className="bg-surface-800/30 p-5 rounded-xl border border-border/30 mb-8">
                <Input
                  label="Current Password"
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handleChange}
                  error={errors.currentPassword}
                  placeholder="Enter your old password"
                />
              </div>
              
              <div className="space-y-5">
                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  error={errors.newPassword}
                  placeholder="At least 8 characters"
                />
                
                <Input
                  label="Confirm New Password"
                  type="password"
                  name="confirmNewPassword"
                  value={passwords.confirmNewPassword}
                  onChange={handleChange}
                  error={errors.confirmNewPassword}
                  placeholder="Type new password again"
                />
              </div>

              <div className="pt-6">
                <Button type="submit" loading={loading} className="w-full shadow-lg hover:shadow-primary/20">
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
