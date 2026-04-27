import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Phone, MapPin, Home, Key } from 'lucide-react';
import { loginStyles } from '../shared/style';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithCustomToken,
  sendEmailVerification,
  updateProfile,
  RecaptchaVerifier
} from 'firebase/auth';
import { auth } from '../config/firebase';
import 'flag-icons/css/flag-icons.min.css';
import { getExampleNumber } from 'libphonenumber-js/max';
import examples from 'libphonenumber-js/examples.mobile.json';

const CustomSelect = ({ options, value, onChange, placeholder, style, hideSelectedLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => {
    const searchTarget = o.searchKey ? o.searchKey.toLowerCase() : o.label.toLowerCase();
    return searchTarget.includes(searchQuery.toLowerCase());
  });

  return (
    <div ref={ref} style={{ position: 'relative', height: '100%', ...style }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          cursor: 'pointer',
          padding: '0 0.5rem',
          gap: '0.25rem',
          color: 'var(--text)'
        }}
      >
        {selectedOption ? (
          <>
            <span className={`fi fi-${selectedOption.cca2.toLowerCase()}`} style={{ fontSize: '20px', borderRadius: '2px' }} />
            {!hideSelectedLabel && <span>{selectedOption.label}</span>}
          </>
        ) : placeholder}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 50,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          maxHeight: '260px',
          minWidth: '200px',
          overflowY: 'auto',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '0.5rem', position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                outline: 'none',
                fontSize: '0.9rem',
                background: 'white',
                color: 'black'
              }}
            />
          </div>
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>No results found</div>
          ) : (
            filteredOptions.map(opt => (
              <div
                key={opt.cca2 + opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#0f172a',
                  fontSize: '0.9rem'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className={`fi fi-${opt.cca2.toLowerCase()}`} style={{ fontSize: '18px', borderRadius: '2px' }} />
                <span style={{ whiteSpace: 'nowrap' }}>{opt.label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    rePassword: '', phoneCode: '+92', phone: '', country: 'Pakistan', city: '', address: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otp, setOtp] = useState('');

  const { user, firebaseLogin, login, finalizeLogin } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const pollInterval = useRef(null);

  useEffect(() => {
    if (user && !loading) {
      const role = user.role || user.user?.role;
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  const startVerificationPolling = (email) => {
    setIsVerifyingEmail(true);
    setVerificationEmail(email);

    pollInterval.current = setInterval(async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          await user.reload();
          // Force refresh token to get latest claims
          const idTokenResult = await user.getIdTokenResult(true);
          
          if (user.emailVerified || idTokenResult.claims.email_verified) {
            clearInterval(pollInterval.current);
            setVerificationEmail('Finalizing your secure session...');
            
            const idToken = await user.getIdToken(true);
            await finalizeLogin(idToken);
            // Redirection is now handled by the useEffect above
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  };

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,idd,flags,cca2')
      .then(res => res.json())
      .then(data => {
        const formatted = data
          .filter(c => c.idd && c.idd.root)
          .map(c => ({
            name: c.name.common,
            code: c.idd.root + (c.idd.suffixes && c.idd.suffixes.length === 1 ? c.idd.suffixes[0] : ''),
            cca2: c.cca2
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(formatted);
      })
      .catch(err => console.error("Failed to fetch countries", err));
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const handleFirebaseSync = async (user, profileData = null) => {
    const idToken = await user.getIdToken();
    const result = await firebaseLogin(idToken, profileData);
    if (result?.status === 'VERIFICATION_REQUIRED') {
      await sendEmailVerification(user);
      startVerificationPolling(result.email);
      return;
    }
    // Redirection is handled by useEffect
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        if (loginMethod === 'email') {
          const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
          if (formData.email.toLowerCase().trim() === adminEmail) {
            const result = await login(formData.email, formData.password);
            if (result?.status === 'VERIFICATION_REQUIRED') {
              const userCredential = await signInWithCustomToken(auth, result.customToken);
              await sendEmailVerification(userCredential.user);
              startVerificationPolling(result.email);
            }
            // Redirection is handled by useEffect
          } else {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            await handleFirebaseSync(userCredential.user);
          }
        } else {
          // Phone Login
          setupRecaptcha();
          const phoneNumber = `${formData.phoneCode}${formData.phone}`;
          const appVerifier = window.recaptchaVerifier;
          const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
          setConfirmationResult(result);
        }
      } else {
        // Registration Logic
        if (formData.password !== formData.rePassword) {
          throw new Error('Passwords do not match');
        }

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

          // Set display name in Firebase
          const fullName = `${formData.firstName} ${formData.lastName}`.trim();
          await updateProfile(userCredential.user, { displayName: fullName });

          // Sync extra data with Backend
          const profileData = {
            name: fullName,
            phone: `${formData.phoneCode}${formData.phone}`,
            country: formData.country,
            city: formData.city,
            address: formData.address
          };

          await handleFirebaseSync(userCredential.user, profileData);
        } catch (firebaseErr) {
          if (firebaseErr.code === 'auth/email-already-in-use') {
            setError('This email is already in use. Please log in instead.');
            setIsLogin(true); // Switch to login for convenience
          } else {
            throw firebaseErr;
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        alert("Verification email resent!");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedPhoneCountry = countries.find(c => c.code === formData.phoneCode);
  const phonePlaceholder = React.useMemo(() => {
    if (selectedPhoneCountry?.cca2) {
      try {
        const example = getExampleNumber(selectedPhoneCountry.cca2, examples);
        if (example) return example.formatNational().replace(/^0/, '');
      } catch (err) { }
    }
    return "300 1234567";
  }, [selectedPhoneCountry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="card-header">
            <h1>{(confirmationResult || isVerifyingEmail) ? 'Verify Your Identity' : isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p>
              {isVerifyingEmail
                ? `We've sent a verification link to ${verificationEmail}. Please click it to continue.`
                : confirmationResult
                  ? `Enter the code sent to your phone`
                  : isLogin
                    ? 'Sign in to continue your healthy journey'
                    : 'Join our community of natural food lovers'}
            </p>
          </div>

          <div id="recaptcha-container"></div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', background: '#fee2e2', color: '#b91c1c', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {confirmationResult ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const result = await confirmationResult.confirm(otp);
                await handleFirebaseSync(result.user);
              } catch (err) {
                setError('Invalid code');
              }
            }} className="login-form">
              <div className="form-group">
                <label>Phone Verification Code</label>
                <div className="input-wrapper">
                  <Key size={18} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    required
                    style={{ letterSpacing: otp ? '0.5rem' : 'normal', fontWeight: 'bold' }}
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Continue'} <ArrowRight size={18} />
              </button>
            </form>
          ) : isVerifyingEmail ? (
            <div className="login-form" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <Mail style={{ color: '#16a34a' }} size={30} />
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Waiting for you to click the link in your email...
                </p>
              </div>

              <button
                type="button"
                className="submit-btn"
                onClick={handleResendEmail}
                style={{ background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' }}
              >
                Resend Email
              </button>

              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.85rem', cursor: 'pointer', marginTop: '1.5rem', display: 'block', width: '100%' }}
                onClick={() => { setIsVerifyingEmail(false); auth.signOut(); }}
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {isLogin && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: loginMethod === 'email' ? 'white' : 'transparent', fontWeight: loginMethod === 'email' ? '600' : '400', boxShadow: loginMethod === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: loginMethod === 'phone' ? 'white' : 'transparent', fontWeight: loginMethod === 'phone' ? '600' : '400', boxShadow: loginMethod === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                  >
                    Phone
                  </button>
                </div>
              )}
              {!isLogin && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>First Name</label>
                    <div className="input-wrapper">
                      <User size={18} />
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <div className="input-wrapper">
                      <User size={18} />
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" required />
                    </div>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper" style={{ paddingLeft: '0.5rem' }}>
                    <CustomSelect
                      options={countries.map(c => ({ value: c.code, label: c.code, cca2: c.cca2, searchKey: `${c.name} ${c.code}` }))}
                      value={formData.phoneCode}
                      onChange={(val) => handleChange({ target: { name: 'phoneCode', value: val } })}
                      hideSelectedLabel={true}
                    />
                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="300 1234567" required />
                  </div>
                </div>
              )}

              {(loginMethod === 'phone' && isLogin) ? (
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper" style={{ paddingLeft: '0.5rem' }}>
                    <CustomSelect
                      options={countries.map(c => ({ value: c.code, label: c.code, cca2: c.cca2, searchKey: `${c.name} ${c.code}` }))}
                      value={formData.phoneCode}
                      onChange={(val) => handleChange({ target: { name: 'phoneCode', value: val } })}
                      hideSelectedLabel={true}
                    />
                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder={phonePlaceholder} required />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <Mail size={18} />
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <Lock size={18} />
                      <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                    </div>
                  </div>
                </>
              )}

              {!isLogin && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Country</label>
                      <div className="input-wrapper">
                        <MapPin size={18} />
                        <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Pakistan" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <div className="input-wrapper">
                        <MapPin size={18} />
                        <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Karachi" required />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Shipping Address</label>
                    <div className="input-wrapper">
                      <MapPin size={18} />
                      <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="123 Street Name" required />
                    </div>
                  </div>
                </>
              )}

              {!isLogin && (
                <div className="form-group">
                  <label>Re-enter Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input type="password" name="rePassword" value={formData.rePassword} onChange={handleChange} placeholder="••••••••" required />
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'} <ArrowRight size={18} />
              </button>
            </form>
          )}

          <div className="card-footer">
            {!confirmationResult && !isVerifyingEmail && (
              <p>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button onClick={() => { setIsLogin(!isLogin); setError(null); setLoginMethod('email'); }}>
                  {isLogin ? ' Sign up' : ' Log in'}
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>

      <style>{loginStyles}</style>
    </div>
  );
};

export default LoginPage;
