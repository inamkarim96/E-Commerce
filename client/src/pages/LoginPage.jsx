import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Phone, MapPin, Home, Key } from 'lucide-react';
import { Button, Input, Card, Badge } from '../components/ui';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
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
    <div ref={ref} className="custom-select-container" style={style}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="custom-select-trigger"
      >
        {selectedOption ? (
          <>
            <span className={`fi fi-${selectedOption.cca2.toLowerCase()} flag-icon-sm`} />
            {!hideSelectedLabel && <span>{selectedOption.label}</span>}
          </>
        ) : placeholder}
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          <div className="custom-select-search">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ color: 'black' }}
            />
          </div>
          {filteredOptions.length === 0 ? (
            <div className="no-results-msg">No results found</div>
          ) : (
            filteredOptions.map(opt => (
              <div
                key={opt.cca2 + opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="custom-select-option"
              >
                <span className={`fi fi-${opt.cca2.toLowerCase()} flag-icon-sm`} style={{ fontSize: '18px' }} />
                <span>{opt.label}</span>
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
    rePassword: '', phoneCode: '+92', phone: '', country: '', city: '', address: ''
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
            await login(formData.email, formData.password);
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
        const requiredFields = ['firstName', 'lastName', 'email', 'password', 'rePassword', 'phone', 'country', 'city', 'address'];
        const missingFields = requiredFields.filter(field => !formData[field].trim());

        if (missingFields.length > 0) {
          throw new Error('Please fill in all required fields to create your account.');
        }

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
            address: formData.address,
            password: formData.password
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
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl mb-6 text-sm font-medium">
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
            }} className="login-form space-y-6">
              <Input
                label="Phone Verification Code"
                icon={Key}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center tracking-widest text-xl font-bold"
              />
              <Button type="submit" variant="primary" loading={loading} className="w-full" icon={ArrowRight}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </form>
          ) : isVerifyingEmail ? (
            <div className="login-form verification-view">
              <div className="verification-header">
                <div className="verification-icon">
                  <Mail className="text-green-600" size={30} />
                </div>
                <p className="verification-text">
                  Waiting for you to click the link in your email...
                </p>
              </div>

              <button
                type="button"
                className="submit-btn secondary"
                onClick={handleResendEmail}
              >
                Resend Email
              </button>

              <button
                type="button"
                className="back-to-login-btn"
                onClick={() => { setIsVerifyingEmail(false); auth.signOut(); }}
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {isLogin && (
                <div className="auth-method-tabs flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMethod === 'email' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMethod === 'phone' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Phone
                  </button>
                </div>
              )}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jane"
                    icon={User}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    icon={User}
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="input-wrapper pl-2">
                    <CustomSelect
                      options={countries.map(c => ({ value: c.code, label: c.code, cca2: c.cca2, searchKey: `${c.name} ${c.code}` }))}
                      value={formData.phoneCode}
                      onChange={(val) => handleChange({ target: { name: 'phoneCode', value: val } })}
                      hideSelectedLabel={true}
                    />
                    <div className="v-divider"></div>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="300 1234567" required className="pl-4" />
                  </div>
                </div>
              )}

              {(loginMethod === 'phone' && isLogin) ? (
                <div className="admin-form-group">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <div className="flex gap-0 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-primary transition-all">
                    <CustomSelect
                      options={countries.map(c => ({ value: c.code, label: c.code, cca2: c.cca2, searchKey: `${c.name} ${c.code}` }))}
                      value={formData.phoneCode}
                      onChange={(val) => handleChange({ target: { name: 'phoneCode', value: val } })}
                      hideSelectedLabel={true}
                      style={{ border: 'none', background: 'transparent' }}
                    />
                    <div className="w-[1px] bg-slate-200 my-2"></div>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder={phonePlaceholder} required className="flex-1 px-4 py-3 border-none focus:ring-0 text-sm" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    icon={Mail}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    icon={Lock}
                    required
                  />
                </div>
              )}

              {!isLogin && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Pakistan"
                      icon={MapPin}
                      required
                    />
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Karachi"
                      icon={MapPin}
                      required
                    />
                  </div>
                  <Input
                    label="Home Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Street Name"
                    icon={MapPin}
                    required
                  />
                  <Input
                    label="Re-enter Password"
                    type="password"
                    name="rePassword"
                    value={formData.rePassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    icon={Lock}
                    required
                  />
                </div>
              )}

              <div className="pt-4">
                <Button type="submit" variant="primary" loading={loading} className="w-full py-4 text-lg" icon={ArrowRight}>
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
                </Button>
              </div>
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


    </div>
  );
};

export default LoginPage;
