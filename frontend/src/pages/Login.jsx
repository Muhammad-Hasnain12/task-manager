/**
 * File: src/pages/Login.jsx
 * Overall Purpose: Sign-in view for returning users.
 * Connections: Integrates with AuthContext for performing API logins. Redirects users
 * to dashboard upon verification or back to their requested page.
 */

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FolderGit2, Mail, Lock } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form input state variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI helper state variables
  const [error, setError] = useState('');
  const [inFlight, setInFlight] = useState(false);

  // Read redirect destination (default to /dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  /**
   * Action: Handles sign-in form submission.
   * Performs client-side sanitation and validation before sending API request.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- SECURITY REQUIREMENT: Client-Side Input Validation ---
    const sanitizedEmail = email.trim();
    if (!sanitizedEmail) {
      setError('Email address is required.');
      return;
    }

    // Standard RFC 5322 email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      // --- SECURITY REQUIREMENT: Rate-limit UX mitigation ---
      // Disable submission button during network latency
      setInFlight(true);
      await login(sanitizedEmail, password);
      
      // Navigate to destination on success
      navigate(from, { replace: true });
    } catch (err) {
      // Handle server error responses gracefully
      const msg = err.response?.data?.message || 'Connection failed. Please try again.';
      setError(msg);
    } finally {
      setInFlight(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-12 mb-32">
        <div className="w-48 h-48 rounded-12 bg-brand flex items-center justify-center text-white">
          <FolderGit2 className="w-28 h-28" />
        </div>
        <h2 className="text-24 font-bold tracking-tight mt-12 text-textPrimary">Sign In to TaskSpace</h2>
        <p className="text-textSecondary text-14">Welcome back. Enter your credentials to access your workspace.</p>
      </div>

      {/* Main Panel */}
      <div className="w-full max-w-400 bg-panel border border-borderLine rounded-12 p-32 shadow-lg">
        {/* Error notification banner */}
        {error && (
          <div className="mb-20 px-16 py-12 bg-red-950/40 border border-red-800/60 rounded-8 text-red-200 text-14 font-medium leading-normal animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-20">
          {/* Email input field */}
          <div className="flex flex-col gap-8 text-left">
            <label htmlFor="email" className="text-textSecondary text-12 font-semibold uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-16 flex items-center text-textMuted">
                <Mail className="w-16 h-16" />
              </span>
              <input
                id="email"
                type="email"
                required
                disabled={inFlight}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-borderLine rounded-8 py-12 pl-48 pr-16 text-textPrimary placeholder:text-textMuted text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="flex flex-col gap-8 text-left">
            <label htmlFor="password" className="text-textSecondary text-12 font-semibold uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-16 flex items-center text-textMuted">
                <Lock className="w-16 h-16" />
              </span>
              <input
                id="password"
                type="password"
                required
                disabled={inFlight}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-borderLine rounded-8 py-12 pl-48 pr-16 text-textPrimary placeholder:text-textMuted text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Form submit button */}
          <button
            type="submit"
            disabled={inFlight}
            className="w-full bg-brand hover:bg-brand-dark disabled:bg-brand/50 text-white rounded-8 py-12 text-14 font-semibold shadow-md transition-colors flex items-center justify-center gap-8 cursor-pointer disabled:cursor-not-allowed"
          >
            {inFlight ? (
              <>
                <div className="w-16 h-16 border-t-2 border-white rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>
        </form>

        {/* Redirect toggle */}
        <div className="mt-24 text-center text-14 text-textSecondary border-t border-borderLine pt-24">
          New to TaskSpace?{' '}
          <Link to="/signup" className="text-brand hover:text-brand-light font-medium transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
