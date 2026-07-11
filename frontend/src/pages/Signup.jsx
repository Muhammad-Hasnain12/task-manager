/**
 * File: src/pages/Signup.jsx
 * Overall Purpose: Account registration view for new users.
 * Connections: Integrates with AuthContext for performing API signups. Redirects users
 * to dashboard upon registration.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Form input state variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI helper state variables
  const [error, setError] = useState('');
  const [inFlight, setInFlight] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Action: Handles user sign-up form submission.
   * Performs client-side sanitation and validation before sending API request.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- SECURITY REQUIREMENT: Client-Side Input Validation ---
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim();

    if (!sanitizedName) {
      setError('Name is required.');
      return;
    }

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

    // Require reasonable password complexity limits
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      // --- SECURITY REQUIREMENT: Rate-limit UX mitigation ---
      // Disable submission button during network latency
      setInFlight(true);
      await signup(sanitizedName, sanitizedEmail, password);
      
      // Redirect to dashboard on success
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Handle server error responses gracefully
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(msg);
    } finally {
      setInFlight(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16">
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-12 mb-32">
        {/* Custom TaskSpace Logo */}
        <div className="w-48 h-48 rounded-12 bg-brand flex items-center justify-center text-white shrink-0 shadow-lg">
          <div className="flex gap-[3.5px]">
            <div className="flex flex-col gap-[3.5px]">
              <div className="w-[10px] h-[10px] bg-white rounded-[2px]" />
              <div className="w-[10px] h-[10px] bg-white rounded-[2px]" />
            </div>
            <div className="w-[10px] h-[23.5px] bg-white rounded-[2px]" />
          </div>
        </div>
        <h2 className="text-24 font-bold tracking-tight mt-12 text-textPrimary">Create your account</h2>
        <p className="text-textSecondary text-14">Get started with a free TaskSpace workspace today.</p>
      </div>

      {/* Main Panel */}
      <div className="w-full max-w-400 bg-panel border border-borderLine rounded-12 p-32 shadow-xl">
        {/* Error notification banner */}
        {error && (
          <div className="mb-20 px-16 py-12 bg-red-950/40 border border-red-800/60 rounded-8 text-red-200 text-14 font-medium leading-normal animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-20">
          {/* Full Name input field */}
          <div className="flex flex-col gap-8 text-left">
            <label htmlFor="name" className="text-textSecondary text-12 font-semibold uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-16 flex items-center text-textMuted">
                <User className="w-16 h-16" />
              </span>
              <input
                id="name"
                type="text"
                required
                disabled={inFlight}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-borderLine rounded-8 py-12 pl-48 pr-16 text-textPrimary placeholder:text-textMuted text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50"
                placeholder="John Doe"
              />
            </div>
          </div>

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
                type={showPassword ? 'text' : 'password'}
                required
                disabled={inFlight}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-borderLine rounded-8 py-12 pl-48 pr-48 text-textPrimary placeholder:text-textMuted text-14 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/40 transition-colors disabled:opacity-50"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={inFlight}
                className="absolute inset-y-0 right-0 pr-16 flex items-center text-textMuted hover:text-textPrimary transition-colors cursor-pointer disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="w-18 h-18" /> : <Eye className="w-18 h-18" />}
              </button>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Divider line and Sign In text */}
        <div className="relative my-24">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-borderLine"></div>
          </div>
          <div className="relative flex justify-center text-12 uppercase">
            <span className="bg-panel px-8 text-textMuted">or</span>
          </div>
        </div>

        <div className="text-center text-14 text-textSecondary">
          Already have an account?{' '}
          <Link to="/login" className="text-brand hover:text-brand-light font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
