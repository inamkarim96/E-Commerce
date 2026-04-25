import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { loginStyles } from '../shared/style';
import { registerUser } from '../api/auth';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
        const res = await registerUser(formData);
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
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="your name  Doe"
                    required
                  />
                </div>
              </div>
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
