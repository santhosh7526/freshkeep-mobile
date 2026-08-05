import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@freshkeep/shared';
import { Leaf, Mail, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, ScanLine, Bell, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { loginWithEmail, registerWithEmail, loginWithFirebaseGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in your email and password');
      return;
    }
    if (authMode === 'register' && !name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'register') {
        await registerWithEmail(email.trim(), password.trim(), name.trim());
        toast.success(`Welcome, ${name.trim() || 'there'}! Account created.`);
      } else {
        await loginWithEmail(email.trim(), password.trim());
        toast.success(`Welcome back!`);
      }
      navigate('/', { replace: true });
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password') {
        toast.error('Incorrect password', { description: 'Please check your password and try again.' });
      } else if (code === 'auth/email-already-in-use') {
        toast.error('Email already registered', {
          description: 'Click "Sign in" below to log in with this email.',
        });
      } else if (code === 'auth/invalid-email') {
        toast.error('Invalid email address', { description: 'Please enter a valid email.' });
      } else if (code === 'auth/invalid-credential') {
        toast.error('Invalid credentials', { 
          description: 'Incorrect email or password. If you signed up with Google, please use Google Sign-In.' 
        });
      } else {
        toast.error('Authentication failed', {
          description: err.message || 'Something went wrong. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await loginWithFirebaseGoogle();
      navigate('/', { replace: true });
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed the popup — no error needed
      } else if (code === 'auth/unauthorized-domain') {
        toast.error('Google Sign-In needs setup', {
          description: 'Add "localhost" to Firebase Console → Authentication → Settings → Authorized domains.',
          duration: 8000,
        });
      } else {
        toast.error('Google Sign-In failed', {
          description: err.message || 'Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address first', {
        description: 'We need your email to send the password reset link.'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await resetPassword(email.trim());
      toast.success('Password reset email sent!', {
        description: 'Please check your inbox to reset your password.'
      });
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else if (code === 'auth/user-not-found') {
        toast.error('Account not found', { description: 'No account exists with this email.' });
      } else {
        toast.error('Failed to send reset email', { description: err.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative overflow-hidden">
      
      {/* Left Column: Branding / Graphic (Hidden on mobile) */}
      <div className="hidden md:flex flex-col flex-1 bg-gradient-to-br from-emerald-900/10 via-emerald-50/50 to-teal-50/80 p-12 relative overflow-hidden justify-between">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#86A789] to-emerald-600 flex items-center justify-center text-white shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-gray-900 text-2xl tracking-tight">FreshKeep</span>
        </div>

        <div className="relative z-10 mt-20 max-w-lg">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
            Stop guessing. Start tracking your freshness.
          </h2>
          <p className="text-lg text-gray-600 font-medium mb-10 leading-relaxed">
            FreshKeep uses smart alerts and simple inventory tracking to help you save money and reduce food waste.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Scan Expiry Dates Instantly</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Smart Expiry Notifications</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Reduce Household Waste</p>
            </div>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/40 to-teal-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-300/30 to-blue-200/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      {/* Right Column: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10 bg-white">

        {/* Mobile Header (Hidden on Desktop) */}
        <div className="w-full max-w-md flex md:hidden items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#86A789] to-emerald-600 flex items-center justify-center text-white shadow-md">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-gray-900 text-xl tracking-tight">FreshKeep</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-100/80 px-3 py-1.5 rounded-full border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure</span>
          </div>
        </div>

        {/* Brand hero */}
        <div className="w-full max-w-md mb-5 px-1">
          <p className="text-[13px] text-emerald-600 font-semibold tracking-wide mb-1">
            • Your food freshness intelligence
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {authMode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {authMode === 'login'
              ? 'Sign in to continue your flow'
              : 'Register to start tracking your pantry'}
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name field - register only */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Santhosh Kumar"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            {authMode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <span className="text-xs text-gray-500 font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-emerald-600 cursor-pointer hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-[#86A789] to-emerald-600 hover:from-[#729275] hover:to-emerald-700 text-white font-bold rounded-2xl text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* OR divider */}
          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 flex items-center justify-center gap-3 transition-all hover:shadow-md active:scale-[0.99] disabled:opacity-70 shadow-sm"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          {/* Terms */}
          <p className="text-center text-[11px] text-gray-400 mt-4">
            Secure session • By continuing you agree to our{' '}
            <span className="text-emerald-600 font-semibold cursor-pointer">Terms</span>
            {' '}&{' '}
            <span className="text-emerald-600 font-semibold cursor-pointer">Privacy</span>
          </p>

          {/* Toggle mode */}
          <p className="text-center text-sm text-gray-500 mt-3">
            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setName(''); setEmail(''); setPassword('');
              }}
              className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="mt-8 text-xs text-gray-400 font-medium">FreshKeep • v1.0 • Powered by Firebase 🔥</p>
      </div>
    </div>
  );
}
