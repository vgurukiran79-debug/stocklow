import React, { useState } from 'react';
import {
  Store,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Shield,
  Briefcase,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';
import {
  signInWithGoogle,
  signInEmail,
  registerEmail,
} from '../services/firebase';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setError(null);
    setInfoMessage(null);
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle(selectedRole);
      // Persist locally as well
      storage.updateCurrentUser(user);
      onLoginSuccess(user);
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed')) {
        setError('Google sign-in popup was closed. Please try again.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Popup was blocked by the browser. Please allow popups for this site.');
      } else {
        setError(err?.message || 'Unable to sign in with Google. You can also sign in with Email.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Email Password Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim() || !businessName.trim()) {
          setError('Please provide your full name and store name.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const registeredUser = await registerEmail(
          email.trim(),
          password,
          fullName.trim(),
          selectedRole,
          businessName.trim()
        );

        // Update local business
        storage.updateBusiness({
          name: businessName.trim(),
          ownerName: fullName.trim(),
          email: email.trim(),
        });
        storage.updateCurrentUser(registeredUser);
        onLoginSuccess(registeredUser);
      } else {
        if (!email.trim() || !password.trim()) {
          setError('Please enter your email and password.');
          setLoading(false);
          return;
        }

        const loggedInUser = await signInEmail(email.trim(), password);
        storage.updateCurrentUser(loggedInUser);
        onLoginSuccess(loggedInUser);
      }
    } catch (err: any) {
      console.warn('Auth operation error:', err);
      let msg = err?.message || 'Authentication failed. Please verify credentials.';
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found') {
        msg = 'Invalid email or password. Please check your credentials or register a new account.';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick Role Evaluation Helper (for testing role-based authorization easily)
  const handleQuickRoleAccess = (role: UserRole) => {
    const roleUsers: Record<UserRole, { name: string; email: string }> = {
      Admin: { name: 'Alex Morgan (Owner)', email: 'owner@store.com' },
      Manager: { name: 'Jordan Lee (Manager)', email: 'manager@store.com' },
      Cashier: { name: 'Sam Taylor (Cashier)', email: 'cashier@store.com' },
    };

    const user: User = {
      id: `usr_${role.toLowerCase()}_demo`,
      name: roleUsers[role].name,
      email: roleUsers[role].email,
      role: role,
      storeName: 'My Store',
    };

    storage.updateCurrentUser(user);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 selection:bg-cyan-500 selection:text-white">
      {/* Background radial accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            STOCK<span className="text-cyan-400">FLOW</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Track Stock. Manage Sales. Grow Smarter.
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/80 px-3 py-1 border border-cyan-800/60 text-[10px] text-cyan-300 font-mono">
            <ShieldCheck className="h-3 w-3 text-cyan-400" />
            <span>Firebase Auth & Role-Based Authorization</span>
          </div>
        </div>

        {/* Welcome prompt */}
        <div className="mb-4 text-center">
          <h2 className="text-base font-bold text-white">
            {isRegister ? 'Register Account & Assign Role' : 'Sign In to Your Store'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRegister
              ? 'Create credentials with granular role authorization'
              : 'Sign in with Google or Email to access your business'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-950/70 border border-rose-800 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 rounded-xl bg-cyan-950/70 border border-cyan-800 p-3 text-xs text-cyan-300">
            {infoMessage}
          </div>
        )}

        {/* 1. Google Authentication Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white py-2.5 px-4 text-xs font-bold text-slate-800 hover:bg-slate-100 active:scale-98 transition-all shadow-sm disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Or with email
          </span>
        </div>

        {/* Email Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Business / Store Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Retail Solutions"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Authorization Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select System Role (Authorization)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Admin', 'Manager', 'Cashier'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                        selectedRole === role
                          ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-sm'
                          : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>{role}</div>
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                        {role === 'Admin' ? 'Full Access' : role === 'Manager' ? 'Operations' : 'POS Sales'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          {!isRegister && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-0"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setInfoMessage('For demo testing, you can use the Quick Role Evaluation buttons below.')}
                className="text-cyan-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-xs font-bold text-white shadow-md hover:from-cyan-700 hover:to-blue-700 active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                <span>{isRegister ? 'Register & Enter Store' : 'Sign In to Store'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle sign in / register */}
        <div className="mt-4 text-center text-xs text-slate-400">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="font-bold text-cyan-400 hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Need a new store account?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="font-bold text-cyan-400 hover:underline"
              >
                Create Account & Set Role
              </button>
            </p>
          )}
        </div>

        {/* Quick Role Evaluation Bar (for testing RBAC authorization) */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
            Quick Role Evaluation (RBAC)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickRoleAccess('Admin')}
              className="flex flex-col items-center justify-center rounded-xl border border-purple-800/60 bg-purple-950/40 p-2 text-center hover:bg-purple-900/50 transition-all"
            >
              <Shield className="h-4 w-4 text-purple-400 mb-1" />
              <span className="text-[11px] font-bold text-purple-200">Admin</span>
              <span className="text-[9px] text-purple-400/80">Full Control</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRoleAccess('Manager')}
              className="flex flex-col items-center justify-center rounded-xl border border-blue-800/60 bg-blue-950/40 p-2 text-center hover:bg-blue-900/50 transition-all"
            >
              <Briefcase className="h-4 w-4 text-blue-400 mb-1" />
              <span className="text-[11px] font-bold text-blue-200">Manager</span>
              <span className="text-[9px] text-blue-400/80">Operations</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRoleAccess('Cashier')}
              className="flex flex-col items-center justify-center rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-2 text-center hover:bg-emerald-900/50 transition-all"
            >
              <Users className="h-4 w-4 text-emerald-400 mb-1" />
              <span className="text-[11px] font-bold text-emerald-200">Cashier</span>
              <span className="text-[9px] text-emerald-400/80">POS & Billing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
