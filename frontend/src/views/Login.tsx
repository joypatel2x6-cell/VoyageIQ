import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Compass, Eye, EyeOff, LogIn, Sparkles, User, Upload, Trash2, Check } from 'lucide-react';

type TravelPreference = 'Adventure' | 'Culture' | 'Food' | 'Nature' | 'Shopping' | 'Luxury' | 'Budget Travel';
type TravelStyle = 'Budget' | 'Balanced' | 'Luxury';

export const Login: React.FC = () => {
  const { setIsAuthenticated, setCurrentView, showToast, updateUser } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginEmailError, setLoginEmailError] = useState('');
  const [loginPasswordError, setLoginPasswordError] = useState('');

  // Registration Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Avatar Upload States
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Preference States
  const [selectedPreferences, setSelectedPreferences] = useState<TravelPreference[]>([]);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('Balanced');

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Registration Validation Errors
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const validateEmail = (emailVal: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailVal);
  };

  const validatePhone = (phoneVal: string) => {
    // Basic phone validation (numbers, spaces, dashes, parentheses, plus sign, length between 7-15)
    const re = /^[\d\s()+-]{7,15}$/;
    return re.test(phoneVal.trim());
  };

  // Password Strength Meter calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 33, label: 'Weak', color: 'var(--color-error)' };
    if (score <= 4) return { score: 66, label: 'Medium', color: 'var(--color-warning)' };
    return { score: 100, label: 'Strong', color: 'var(--color-success)' };
  };

  const passwordStrength = getPasswordStrength(regPassword);

  const togglePreference = (pref: TravelPreference) => {
    setSelectedPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  // Mock Upload Handler (loads traveler image as mock upload)
  const handleMockAvatarUpload = () => {
    setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80');
    showToast('Mock profile picture uploaded.', 'success');
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    showToast('Profile picture removed.', 'warning');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginEmailError('');
    setLoginPasswordError('');
    
    let isValid = true;

    if (!loginEmail.trim()) {
      setLoginEmailError('Email address is required');
      isValid = false;
    } else if (!validateEmail(loginEmail)) {
      setLoginEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!loginPassword) {
      setLoginPasswordError('Password is required');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    setTimeout(() => {
      if (loginPassword === 'error123') {
        setIsLoading(false);
        showToast('Authentication failed: Invalid credentials.', 'error');
        setLoginPasswordError('Incorrect password. Type any other password.');
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        updateUser({ email: loginEmail });
        setIsAuthenticated(true);
        setCurrentView('dashboard');
        showToast(`Welcome back! Ready for your next trip?`, 'success');
      }, 500);
    }, 1500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    // Validations
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    
    if (!regEmail.trim()) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(regEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!regPassword) {
      errors.password = 'Password is required';
    } else if (regPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (regPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!city.trim()) errors.city = 'City is required';
    if (!country.trim()) errors.country = 'Country is required';

    setRegErrors(errors);

    if (Object.keys(errors).length > 0) {
      showToast('Please fix required validation fields to sign up.', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        updateUser({
          firstName,
          lastName,
          email: regEmail,
          phone,
          city,
          country,
          avatarUrl,
          preferences: selectedPreferences,
          travelStyle
        });
        setIsAuthenticated(true);
        setCurrentView('dashboard');
        showToast(`Welcome to VoyageIQ, ${firstName}! Your account is ready.`, 'success');
      }, 500);
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
      {/* LEFT SIDE HERO PANEL - Branding */}
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

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2 }}>
          <div style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '6px', display: 'flex' }}>
            <Compass size={24} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            VoyageIQ
          </span>
        </div>

        {/* Tagline */}
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

        <div style={{ zIndex: 2, fontSize: '0.75rem', opacity: 0.5 }}>
          © 2026 VoyageIQ. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE PANEL - Form Card Container */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          overflowY: 'auto',
          height: '100vh',
        }}
      >
        <div
          className="glass-panel animate-fade-in"
          style={{
            maxWidth: mode === 'register' ? '680px' : '440px',
            width: '100%',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-2xl)',
            padding: '2rem 1.75rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            margin: 'auto 0',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }} className="mobile-only-logo">
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

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {mode === 'login' ? 'Welcome back' : 'Create Your VoyageIQ Account'}
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {mode === 'login' 
                ? 'Continue planning your next adventure.' 
                : 'Join the community of travelers planning smarter routes.'}
            </p>
          </div>

          {/* ==================== LOGIN VIEW ==================== */}
          {mode === 'login' && (
            <>
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Input
                  label="Email Address"
                  placeholder="name@example.com"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  error={loginEmailError}
                  required
                />
                
                <div style={{ position: 'relative' }}>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    error={loginPasswordError}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: loginPasswordError ? '34px' : '38px',
                      color: 'var(--text-light)',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ borderRadius: 'var(--radius-xs)', cursor: 'pointer' }}
                    />
                    Remember me
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => { e.preventDefault(); showToast('Reset instructions sent to mock mail.', 'info'); }}
                    style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                  >
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isLoading || isSuccess}
                  leftIcon={!isLoading && !isSuccess && <LogIn size={16} />}
                >
                  {isLoading ? 'Authenticating...' : isSuccess ? 'Signed In!' : 'Sign In'}
                </Button>
              </form>
            </>
          )}

          {/* ==================== REGISTRATION VIEW ==================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Profile Image Upload Area */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-color-light)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '2px solid var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={28} color="var(--text-light)" />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleMockAvatarUpload}
                    leftIcon={<Upload size={12} />}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    Upload Photo
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      leftIcon={<Trash2 size={12} />}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-error)' }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Multi-Column Form Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <style>{`
                  .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                  }
                  @media (max-width: 640px) {
                    .form-row {
                      grid-template-columns: 1fr !important;
                      gap: 1rem !important;
                    }
                  }
                `}</style>
                
                {/* Row 1: Names */}
                <div className="form-row">
                  <Input
                    label="First Name"
                    placeholder="Emma"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    error={regErrors.firstName}
                    required
                  />
                  <Input
                    label="Last Name"
                    placeholder="Watson"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    error={regErrors.lastName}
                    required
                  />
                </div>

                {/* Row 2: Contact */}
                <div className="form-row">
                  <Input
                    label="Email Address"
                    placeholder="emma@example.com"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    error={regErrors.email}
                    required
                  />
                  <Input
                    label="Phone Number"
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={regErrors.phone}
                    required
                  />
                </div>

                {/* Row 3: Passwords */}
                <div className="form-row">
                  <div style={{ position: 'relative' }}>
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      error={regErrors.password}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: regErrors.password ? '34px' : '38px', color: 'var(--text-light)', cursor: 'pointer', display: 'flex' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <Input
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={regErrors.confirmPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '12px', top: regErrors.confirmPassword ? '34px' : '38px', color: 'var(--text-light)', cursor: 'pointer', display: 'flex' }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {regPassword && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '-4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Password Strength:</span>
                      <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${passwordStrength.score}%`,
                          height: '100%',
                          backgroundColor: passwordStrength.color,
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Row 4: Geolocation */}
                <div className="form-row">
                  <Input
                    label="City"
                    placeholder="San Francisco"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    error={regErrors.city}
                    required
                  />
                  <Input
                    label="Country"
                    placeholder="United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    error={regErrors.country}
                    required
                  />
                </div>

                {/* Additional Info textarea */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Additional Information</label>
                  <textarea
                    placeholder="Allergies, frequent flyer memberships, special assistance requests..."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.8rem',
                      fontSize: '0.9rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      minHeight: '60px',
                      resize: 'vertical',
                      backgroundColor: 'var(--bg-secondary)',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                {/* Travel Preferences Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Travel Preferences (Interests)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(['Adventure', 'Culture', 'Food', 'Nature', 'Shopping', 'Luxury', 'Budget Travel'] as TravelPreference[]).map((pref) => {
                      const isActive = selectedPreferences.includes(pref);
                      return (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => togglePreference(pref)}
                          style={{
                            padding: '0.35rem 0.85rem',
                            fontSize: '0.775rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid',
                            borderColor: isActive ? 'var(--color-primary)' : 'var(--border-color-light)',
                            backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                            color: isActive ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isActive && <Check size={12} />}
                          {pref}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Travel Style Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Preferred Travel Budget Style
                  </label>
                  <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', width: 'fit-content' }}>
                    {(['Budget', 'Balanced', 'Luxury'] as TravelStyle[]).map((styleOpt) => {
                      const isActive = travelStyle === styleOpt;
                      return (
                        <button
                          key={styleOpt}
                          type="button"
                          onClick={() => setTravelStyle(styleOpt)}
                          style={{
                            padding: '0.45rem 1.25rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: 'none',
                            backgroundColor: isActive ? 'var(--color-primary)' : 'var(--bg-secondary)',
                            color: isActive ? '#ffffff' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            borderRight: styleOpt !== 'Luxury' ? '1px solid var(--border-color)' : 'none',
                          }}
                        >
                          {styleOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Register Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isLoading || isSuccess}
                style={{ marginTop: '0.5rem' }}
              >
                {isLoading ? 'Creating Account...' : isSuccess ? 'Welcome Aboard!' : 'Create My VoyageIQ Account'}
              </Button>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '0.1rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color-light)' }} />
            <span style={{ padding: '0 10px', fontSize: '0.725rem', color: 'var(--text-light)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color-light)' }} />
          </div>

          {/* Social Sign-In */}
          <button
            onClick={() => { showToast('Redirecting to Google auth...', 'info'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.56 2.69-3.86 2.69-6.6z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3.02-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.1A9 9 0 0 0 .95 4.97l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          {/* Form Switch Footer */}
          <div style={{ textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    // Reset forms
                    setRegEmail('');
                    setRegPassword('');
                    setConfirmPassword('');
                    setFirstName('');
                    setLastName('');
                    setPhone('');
                    setCity('');
                    setCountry('');
                    setRegErrors({});
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
                  type="button"
                  onClick={() => {
                    setMode('login');
                    // Reset forms
                    setLoginEmail('');
                    setLoginPassword('');
                    setLoginEmailError('');
                    setLoginPasswordError('');
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
