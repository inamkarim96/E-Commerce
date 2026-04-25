import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, ShoppingCart } from 'lucide-react';
import { paymentFailedStyles } from '../shared/style';

/**
 * PaymentFailedPage
 * Shown when the JazzCash portal redirects back with a failed/cancelled payment.
 * Route: /payment/failed
 * Query params: order_id, code (JazzCash response code), reason
 */
const PaymentFailedPage = () => {
  const [searchParams] = useSearchParams();
  const orderId  = searchParams.get('order_id');
  const code     = searchParams.get('code');
  const reason   = searchParams.get('reason');

  const errorLabel = (() => {
    if (reason === 'invalid_signature') return 'Security verification failed';
    if (reason === 'invalid_ref')       return 'Invalid order reference';
    if (code)                           return `JazzCash error code: ${code}`;
    return 'Payment was not completed';
  })();

  return (
    <div className="failed-page">
      <div className="container">
        <motion.div
          className="failed-card"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="fail-icon">
            <XCircle size={80} strokeWidth={1.5} />
          </div>

          <h1>Payment Failed</h1>

          <p className="sub-text">
            We weren't able to process your payment. Your order has been saved and
            no money was deducted from your account.
          </p>

          <span className="error-code">{errorLabel}</span>

          <div className="failed-actions">
            {orderId ? (
              <Link
                to="/checkout"
                className="btn btn-primary"
                style={{ background: 'var(--primary)', color: 'white' }}
              >
                <RefreshCw size={18} />
                Try Again
              </Link>
            ) : null}

            <Link
              to="/shop"
              className="btn btn-outline"
              style={{
                border: '2px solid var(--border)',
                color: 'var(--text-main)',
                background: 'transparent',
              }}
            >
              <ShoppingCart size={18} />
              Back to Shop
            </Link>
          </div>

          {orderId && (
            <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              Order reference: <strong>{orderId}</strong>
            </p>
          )}
        </motion.div>
      </div>

      <style>{paymentFailedStyles}</style>
    </div>
  );
};

export default PaymentFailedPage;
