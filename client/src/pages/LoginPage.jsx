import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, LogIn, UserPlus, Phone, MapPin, Globe, Home } from 'lucide-react';
import { loginStyles } from '../shared/style';
import { registerUser } from '../api/auth';
import 'flag-icons/css/flag-icons.min.css';
import { getExampleNumber } from 'libphonenumber-js/max';
import examples from 'libphonenumber-js/examples.mobile.json';

const CustomSelect = ({ options, value, onChange, placeholder, style, hideSelectedLabel }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
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
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', email: '', password: '', 
    rePassword: '', phoneCode: '+92', phone: '', country: 'Pakistan', city: '', address: '' 
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
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

  const selectedPhoneCountry = countries.find(c => c.code === formData.phoneCode);
  const selectedCountry = countries.find(c => c.name === formData.country);

  const phonePlaceholder = React.useMemo(() => {
    if (selectedPhoneCountry?.cca2) {
      try {
        const example = getExampleNumber(selectedPhoneCountry.cca2, examples);
        if (example) {
          // Removes leading zero if any to blend well with the country code
          return example.formatNational().replace(/^0/, '');
        }
      } catch (err) {}
    }
    return "300 1234567";
  }, [selectedPhoneCountry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        const fullUser = await login(formData.email, formData.password);
        if (fullUser?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        if (formData.password !== formData.rePassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const payload = {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
          phone: `${formData.phoneCode}${formData.phone}`,
          country: formData.country,
          city: formData.city,
          address: formData.address
        };
        const res = await registerUser(payload);
        if (res.success) {
          // Auto-login after registration
          const fullUser = await login(formData.email, formData.password);
          if (fullUser?.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p>
              {isLogin
                ? 'Sign in to continue your healthy journey'
                : 'Join our community of natural food lovers'}
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                background: '#fee2e2',
                color: '#b91c1c',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>First Name</label>
                    <div className="input-wrapper">
                      <User size={18} />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <div className="input-wrapper">
                      <User size={18} />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                </div>
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
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={phonePlaceholder}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Country</label>
                    <div className="input-wrapper" style={{ padding: 0 }}>
                      <CustomSelect 
                        options={countries.map(c => ({ value: c.name, label: c.name, cca2: c.cca2, searchKey: c.name }))}
                        value={formData.country}
                        onChange={(val) => handleChange({ target: { name: 'country', value: val } })}
                        placeholder="Select Country"
                        style={{ padding: '0.25rem 0.5rem' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <div className="input-wrapper">
                      <MapPin size={18} />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Karachi"
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <div className="input-wrapper">
                    <Home size={18} />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Street, District"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            {!isLogin && (
              <div className="form-group">
                <label>Re-enter Password</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    type="password"
                    name="rePassword"
                    value={formData.rePassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="forgot-pass">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading
                ? 'Please wait...'
                : isLogin
                  ? 'Sign In'
                  : 'Register'}{' '}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="card-footer">
            <p>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button onClick={() => { setIsLogin(!isLogin); setError(null); }}>
                {isLogin ? ' Sign up' : ' Log in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      <style>{loginStyles}</style>
    </div>
  );
};

export default LoginPage;
