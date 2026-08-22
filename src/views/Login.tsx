import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Compass, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { setIsAuthenticated, setCurrentView, showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation Error States
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (emailVal: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailVal);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    setNameError('');
    setPasswordError('');

    let isValid = true;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email address is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate registration name
    if (mode === 'register' && !name.trim()) {
      setNameError('Full name is required');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      isValid = false;
    }

    if (!isValid) {
      showToast('Please fix validation errors to continue.', 'error');
      return;
    }

    // Initiate Mock Authentication
    setIsLoading(true);

    setTimeout(() => {
      // Demo authentication failure if password is 'error'
      if (password === 'error123') {
        setIsLoading(false);
        showToast('Authentication failed: Invalid password credential.', 'error');
        setPasswordError('Incorrect password. To pass, enter any other value.');
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);

      // Transition to authenticated state
      setTimeout(() => {
        setIsAuthenticated(true);
        setCurrentView('dashboard');
        showToast(
          mode === 'login' 
            ? `Welcome back, ${email.split('@')[0]}! Ready to plan further?`
            : `Account created successfully! Welcome to VoyageIQ, ${name}!`,
          'success'
        );
      }, 600);
    }, 1500);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-primary)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* LEFT SIDE PANEL - Branding Hero (Hidden on Mobile/Tablet Portrait) */}
      <div
        className="login-hero-side"
        style={{
          flex: '1.2',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem',
          color: 'var(--text-on-dark)',
          overflow: 'hidden',
        }}
      >
        <style>{`
          .login-hero-side {
            background-image: url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop');
            background-size: cover;
            background-position: center;
          }
          @media (max-width: 1024px) {
            .login-hero-side {
              display: none !important;
            }
          }
        `}</style>
        {/* Dark Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(11, 19, 41, 0.85) 0%, rgba(11, 19, 41, 0.6) 50%, rgba(11, 19, 41, 0.9) 100%)',
            zIndex: 1,
          }}
        />

        {/* Top: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2 }}>
          <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '6px', display: 'flex' }}>
            <Compass size={24} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            VoyageIQ
          </span>
        </div>

        {/* Center: Branding Tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 2, maxWidth: '440px', marginTop: 'auto', marginBottom: 'auto' }}>
          <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(2, 132, 199, 0.2)', border: '1px solid rgba(2, 132, 199, 0.4)', fontSize: '0.75rem', fontWeight: 700, gap: '4px', alignItems: 'center' }}>
            <Sparkles size={12} color="var(--color-secondary)" /> Premium Travel-Tech
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: '1.2', letterSpacing: '-0.03em' }}>
            Plan Smarter.<br />Travel Further.
          </h1>
          <p style={{ opacity: 0.85, fontSize: '0.95rem', lineHeight: '1.5' }}>
            Your complete journey planner for smarter, simpler travel. Design itineraries, synchronize calendars, and audit budgets in real time.
          </p>
        </div>

        {/* Bottom: Footer Info */}
        <div style={{ zIndex: 2, fontSize: '0.75rem', opacity: 0.5 }}>
          © 2026 VoyageIQ. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE PANEL - Auth Card */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          className="glass-panel animate-fade-in"
          style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-2xl)',
            padding: '2.5rem 2rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
            {/* Logo on mobile view */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }} className="mobile-only-logo">
              <style>{`
                .mobile-only-logo { display: none !important; }
                @media (max-width: 1024px) {
                  .mobile-only-logo { display: flex !important; }
                }
              `}</style>
              <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '5px', display: 'flex' }}>
                <Compass size={18} color="#ffffff" />
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>VoyageIQ</span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {mode === 'login' ? 'Welcome back' : 'Create an Account'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {mode === 'login' 
                ? 'Continue planning your next adventure.' 
                : 'Join the community of travelers planning smarter routes.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Name Field (Register Mode Only) */}
            {mode === 'register' && (
              <Input
                label="Full Name"
                placeholder="Emma Watson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={nameError}
                required
              />
            )}

            {/* Email Field */}
            <Input
              label="Email Address"
              placeholder="name@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              required
            />

            {/* Password Field */}
            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (min. 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                required
                style={{ width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: passwordError ? '34px' : '38px',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Remember Me / Forgot Password row */}
            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      borderRadius: 'var(--radius-xs)',
                      borderColor: 'var(--border-color)',
                      cursor: 'pointer',
                    }}
                  />
                  Remember me
                </label>

                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast('Forgot password functionality initialized.', 'info');
                  }}
                  style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                >
                  Forgot password?
                </a>
              </div>
            )}

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading || isSuccess}
              leftIcon={!isLoading && !isSuccess && <LogIn size={16} />}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#ffffff',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                  <span>Authenticating...</span>
                </div>
              ) : isSuccess ? (
                <span>Signed In!</span>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '0.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color-light)' }} />
            <span style={{ padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color-light)' }} />
          </div>

          {/* Social Sign-In */}
          <button
            onClick={() => {
              showToast('Redirecting to Google authentication...', 'info');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.56 2.69-3.86 2.69-6.6z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.97 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3.02-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.1A9 9 0 0 0 .95 4.97l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Form Switch Footer */}
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('register');
                    // Reset forms
                    setEmail('');
                    setPassword('');
                    setEmailError('');
                    setPasswordError('');
                  }}
                  style={{ color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    // Reset forms
                    setEmail('');
                    setPassword('');
                    setName('');
                    setEmailError('');
                    setPasswordError('');
                    setNameError('');
                  }}
                  style={{ color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
