import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { supabase } from '../../lib/supabase';

const LoginAndAuthentication = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If user already has a session, redirect to dashboard
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          navigate('/executive-dashboard');
        }
      } catch (err) {
        console.error('Error checking session', err);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        navigate('/executive-dashboard');
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) {
        setError(authError.message || 'Failed to sign in');
        setLoading(false);
        return;
      }

      if (remember) {
        // persistSession is true in client config; optionally keep flag
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      // On success, redirect
      navigate('/executive-dashboard');
    } catch (err) {
      console.error('Sign in error', err);
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left panel */}
        <div className="hidden lg:block">
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-4">Welcome Back to<br />Upgoal Media</h2>
              <p className="text-lg text-muted-foreground">Your centralized platform for managing creator relationships, campaigns, and payments with enterprise-grade security.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-start gap-3 mb-2">
                  <Icon name="Shield" size={20} color="var(--color-primary)" />
                  <h4 className="font-semibold">Enterprise Security</h4>
                </div>
                <p className="text-sm text-muted-foreground">Bank-level encryption for all data</p>
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-start gap-3 mb-2">
                  <Icon name="Lock" size={20} color="var(--color-primary)" />
                  <h4 className="font-semibold">Secure Access</h4>
                </div>
                <p className="text-sm text-muted-foreground">Team-only authentication system</p>
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-start gap-3 mb-2">
                  <Icon name="Clock" size={20} color="var(--color-primary)" />
                  <h4 className="font-semibold">Session Management</h4>
                </div>
                <p className="text-sm text-muted-foreground">Auto-logout after 8 hours inactivity</p>
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-start gap-3 mb-2">
                  <Icon name="DeviceMobile" size={20} color="var(--color-primary)" />
                  <h4 className="font-semibold">Device Registration</h4>
                </div>
                <p className="text-sm text-muted-foreground">Trusted device verification</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel (form) */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-card border border-border rounded-2xl shadow-lg-custom p-8">
            <div className="flex flex-col items-start mb-6">
              <h1 className="text-2xl font-bold">Upgoal Media</h1>
              <p className="text-sm text-muted-foreground">Enterprise Influencer Relationship Management</p>
              <div className="flex gap-2 mt-3">
                <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100">Secure Login</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">Team Access</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="p-4 bg-card border border-border rounded">
                <div className="flex items-center gap-3">
                  <Icon name="CheckCircle" size={18} color="var(--color-success)" />
                  <div>
                    <div className="text-sm font-medium">System Online</div>
                    <div className="text-xs text-muted-foreground">Connected • 1014ms latency</div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label className="text-sm font-medium">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-2 mb-4 p-3 border border-border rounded bg-muted/10"
                placeholder="you@company.com"
              />

              <label className="text-sm font-medium">Password *</label>
              <div className="relative mt-2 mb-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-border rounded pr-10 bg-muted/10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="form-checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded hover:opacity-95 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : null}
                <span>Sign In</span>
              </button>
            </form>

            <div className="mt-6 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Upgoal Media. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAndAuthentication;