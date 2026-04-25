import React from 'react';
import { useLocation, useSearchParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, ArrowRight, Mail } from 'lucide-react';
import { confirmationStyles } from '../shared/style';

const OrderConfirmationPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Accepts order ID from: router state (COD/direct) OR query param (JazzCash redirect)
  const orderId = location.state?.orderId || searchParams.get('order_id');
  const viaJazzCash = searchParams.get('via') === 'jazzcash';

  if (!orderId) {
    return <Navigate to="/" />;
  }

  return (
    <div className="confirmation-page">
      <div className="container">
        <motion.div 
          className="confirmation-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="success-icon">
            <CheckCircle size={80} />
          </div>
          <h1>Thank You for Your Order!</h1>
          <p className="order-number">Order ID: <strong>{orderId}</strong></p>
          {viaJazzCash && (
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#dcfce7', color: '#16a34a', borderRadius: '999px',
              padding: '0.4rem 1.2rem', fontWeight: 600, fontSize: '0.95rem',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle size={16} /> JazzCash payment verified
            </p>
          )}
          <p className="sub-text">
            We've received your order and we're getting it ready for shipment. 
            A confirmation email has been sent to your inbox.
          </p>

          <div className="status-timeline">
            <div className="status-step active">
              <CheckCircle size={20} />
              <span>Confirmed</span>
            </div>
            <div className="status-line"></div>
            <div className="status-step">
              <Package size={20} />
              <span>Processing</span>
            </div>
            <div className="status-line"></div>
            <div className="status-step">
              <Truck size={20} />
              <span>Shipped</span>
            </div>
          </div>

          <div className="next-steps">
            <div className="next-card">
              <Mail size={24} />
              <h3>Check your email</h3>
              <p>We'll send you tracking updates as your order moves.</p>
            </div>
            <div className="next-card">
              <Package size={24} />
              <h3>Track your order</h3>
              <p>You can see real-time updates in your account dashboard.</p>
            </div>
          </div>

          <div className="actions">
            <Link to="/shop" className="btn btn-primary">
              Continue Shopping <ArrowRight size={18} />
            </Link>
            <Link to="/" className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>

      <style>{confirmationStyles}</style>
    </div>
  );
};

export default OrderConfirmationPage;
