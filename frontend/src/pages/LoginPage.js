import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { login, register, isAuthenticated } from '../services/authService';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCoachProfile } = useApp();
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  
  // Sign In Form State
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Create Account Form State
  const [createAccountData, setCreateAccountData] = useState({
    fullName: '',
    email: '',
    password: '',
    teamName: '',
    division: '',
    offensiveSystem: '',
    defensiveSystem: '',
    avatar: null
  });

  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [fadeIn, setFadeIn] = useState(false);

  // Cleanup and redirect if already authenticated
  useEffect(() => {
    // Fade-in animation on mount (250ms as per spec)
    setTimeout(() => setFadeIn(true), 0);
    
    // Clear any stale data first
    if (!isAuthenticated()) {
      localStorage.removeItem('coachProfile');
      localStorage.removeItem('authToken');
    }
    
    // Only redirect if truly authenticated
    if (isAuthenticated()) {
      const returnTo = location.state?.from?.pathname || '/office';
      navigate(returnTo, { replace: true });
    }
  }, [navigate, location]);

  // Real-time validation for Create Account form
  useEffect(() => {
    if (activeTab === 'create') {
      const errors = {};
      if (createAccountData.fullName && createAccountData.fullName.trim() === '') {
        errors.fullName = 'Full Name is required';
      }
      if (createAccountData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(createAccountData.email)) {
          errors.email = 'Please enter a valid email address';
        }
      }
      if (createAccountData.password) {
        if (createAccountData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        }
      }
      if (createAccountData.teamName && createAccountData.teamName.trim() === '') {
        errors.teamName = 'Team Name is required';
      }
      setValidationErrors(errors);
    }
  }, [createAccountData, activeTab]);

  const validateSignIn = () => {
    const errors = {};
    if (!signInData.email || signInData.email.trim() === '') {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signInData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    if (!signInData.password) errors.password = 'Password is required';
    return errors;
  };

  const validateCreateAccount = () => {
    const errors = {};
    if (!createAccountData.fullName || createAccountData.fullName.trim() === '') {
      errors.fullName = 'Full Name is required';
    }
    if (!createAccountData.email || createAccountData.email.trim() === '') {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createAccountData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    if (!createAccountData.password) {
      errors.password = 'Password is required';
    } else if (createAccountData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!createAccountData.teamName || createAccountData.teamName.trim() === '') {
      errors.teamName = 'Team Name is required';
    }
    return errors;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
        setError('Avatar must be a PNG or JPG image');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar image must be less than 5MB');
        return;
      }
      setCreateAccountData({ ...createAccountData, avatar: file });
      setError('');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);
    
    const errors = validateSignIn();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the errors below');
      setLoading(false);
      return;
    }

    console.log('[LOGIC HOOK: handleSignIn] Signing in with:', {
      email: signInData.email,
      password: '***' // Don't log actual password
    });

    try {
      const result = await login(signInData.email, signInData.password);
      
      if (result.success) {
        // Set user profile in context
        setCoachProfile({
          name: result.user.fullName,
          email: result.user.email,
          team: result.user.teamName,
          division: result.user.division,
          offense: result.user.offensiveSystem,
          defense: result.user.defensiveSystem
        });

        // Redirect to intended page or office
        const returnTo = location.state?.from?.pathname || '/office';
        navigate(returnTo, { replace: true });
      } else {
        setError(result.error || 'Incorrect credentials');
      }
    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setLoading(true);

    const errors = validateCreateAccount();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the errors below');
      setLoading(false);
      return;
    }

    console.log('[LOGIC HOOK: handleCreateAccount] Creating account with:', {
      fullName: createAccountData.fullName,
      email: createAccountData.email,
      teamName: createAccountData.teamName,
      division: createAccountData.division,
      offensiveSystem: createAccountData.offensiveSystem,
      defensiveSystem: createAccountData.defensiveSystem
    });

    try {
      const result = await register({
        fullName: createAccountData.fullName,
        email: createAccountData.email,
        password: createAccountData.password,
        teamName: createAccountData.teamName,
        division: createAccountData.division,
        offensiveSystem: createAccountData.offensiveSystem,
        defensiveSystem: createAccountData.defensiveSystem
      });

      if (result.success) {
        // Set user profile in context
        setCoachProfile({
          name: result.user.fullName,
          email: result.user.email,
          team: result.user.teamName,
          division: result.user.division,
          offense: result.user.offensiveSystem,
          defense: result.user.defensiveSystem
        });

        // Redirect to office
        navigate('/office', { replace: true });
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${fadeIn ? 'fade-in' : ''}`}>
      {/* Logo - Top Center, Outside Card */}
      <div className="login-logo" onClick={() => navigate('/')}>
        <h1>KaNeXT IQ™</h1>
      </div>

      <div className="login-container">
        {/* Card */}
        <div className="login-card">
          {/* Tab Toggle */}
          <div className="tab-header">
            <button
              className={`tab ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => { setActiveTab('signin'); setError(''); }}
            >
              Sign In
            </button>
            <button
              className={`tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => { setActiveTab('create'); setError(''); }}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && <div className="error-banner">{error}</div>}

          {/* Sign In Form */}
          {activeTab === 'signin' && (
            <form className="auth-form" onSubmit={handleSignIn}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={signInData.email}
                  onChange={(e) => {
                    setSignInData({ ...signInData, email: e.target.value });
                    setError('');
                    if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                  }}
                  onBlur={() => {
                    const errors = validateSignIn();
                    if (errors.email) setValidationErrors({ ...validationErrors, email: errors.email });
                  }}
                  placeholder="coach@example.com"
                  className={validationErrors.email ? 'error' : ''}
                />
                {validationErrors.email && <span className="error-message">{validationErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={signInData.password}
                  onChange={(e) => {
                    setSignInData({ ...signInData, password: e.target.value });
                    setError('');
                    if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
                  }}
                  onBlur={() => {
                    const errors = validateSignIn();
                    if (errors.password) setValidationErrors({ ...validationErrors, password: errors.password });
                  }}
                  placeholder="••••••••"
                  className={validationErrors.password ? 'error' : ''}
                />
                {validationErrors.password && <span className="error-message">{validationErrors.password}</span>}
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              <div className="form-footer">
                <a href="#forgot" className="footer-link">Forgot Password</a>
                <span>·</span>
                <a href="#privacy" className="footer-link">Privacy Policy</a>
              </div>
            </form>
          )}

          {/* Create Account Form */}
          {activeTab === 'create' && (
            <form className="auth-form" onSubmit={handleCreateAccount}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={createAccountData.fullName}
                  onChange={(e) => {
                    setCreateAccountData({ ...createAccountData, fullName: e.target.value });
                    if (validationErrors.fullName) setValidationErrors({ ...validationErrors, fullName: '' });
                  }}
                  placeholder="Your Name"
                  className={validationErrors.fullName ? 'error' : ''}
                />
                {validationErrors.fullName && <span className="error-message">{validationErrors.fullName}</span>}
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={createAccountData.email}
                  onChange={(e) => {
                    setCreateAccountData({ ...createAccountData, email: e.target.value });
                    if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                  }}
                  placeholder="coach@example.com"
                  className={validationErrors.email ? 'error' : ''}
                />
                {validationErrors.email && <span className="error-message">{validationErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={createAccountData.password}
                  onChange={(e) => {
                    setCreateAccountData({ ...createAccountData, password: e.target.value });
                    if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
                  }}
                  placeholder="Min 8 characters"
                  minLength="8"
                  className={validationErrors.password ? 'error' : ''}
                />
                {validationErrors.password && <span className="error-message">{validationErrors.password}</span>}
              </div>
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  value={createAccountData.teamName}
                  onChange={(e) => {
                    setCreateAccountData({ ...createAccountData, teamName: e.target.value });
                    if (validationErrors.teamName) setValidationErrors({ ...validationErrors, teamName: '' });
                  }}
                  placeholder="Your Team"
                  className={validationErrors.teamName ? 'error' : ''}
                />
                {validationErrors.teamName && <span className="error-message">{validationErrors.teamName}</span>}
              </div>
              <div className="form-group">
                <label>Division / League</label>
                <select
                  value={createAccountData.division}
                  onChange={(e) => setCreateAccountData({ ...createAccountData, division: e.target.value })}
                >
                  <option value="">Select Division</option>
                  <option value="NCAA D1">NCAA D1</option>
                  <option value="NCAA D2">NCAA D2</option>
                  <option value="NCAA D3">NCAA D3</option>
                  <option value="NAIA">NAIA</option>
                  <option value="JUCO">JUCO</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Offensive System</label>
                <select
                  value={createAccountData.offensiveSystem}
                  onChange={(e) => setCreateAccountData({ ...createAccountData, offensiveSystem: e.target.value })}
                >
                  <option value="">Select System</option>
                  <option value="Five-Out">Five-Out</option>
                  <option value="Motion">Motion</option>
                  <option value="Pace & Space">Pace & Space</option>
                  <option value="Post-Centric">Post-Centric</option>
                  <option value="Moreyball">Moreyball</option>
                </select>
              </div>
              <div className="form-group">
                <label>Defensive System</label>
                <select
                  value={createAccountData.defensiveSystem}
                  onChange={(e) => setCreateAccountData({ ...createAccountData, defensiveSystem: e.target.value })}
                >
                  <option value="">Select System</option>
                  <option value="Pack Line">Pack Line</option>
                  <option value="Havoc">Havoc</option>
                  <option value="Switch">Switch</option>
                  <option value="Zone">Zone</option>
                  <option value="No-Middle">No-Middle</option>
                </select>
              </div>
              <div className="form-group">
                <label>Avatar (optional)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleAvatarChange}
                  className="avatar-input"
                />
                {createAccountData.avatar && (
                  <span className="avatar-name">{createAccountData.avatar.name}</span>
                )}
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              <div className="form-footer">
                <a href="#forgot" className="footer-link">Forgot Password</a>
                <span>·</span>
                <a href="#privacy" className="footer-link">Privacy Policy</a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

