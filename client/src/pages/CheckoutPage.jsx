import React, { useState } from 'react';
import { CreditCard, CheckCircle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { checkoutStyles } from '../shared/style';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import * as ordersApi from '../api/orders';

const CheckoutPage = () => {
  const [step, setStep] = useState(1);
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    address: '',
    city: '',
    country: 'Pakistan',
    zipCode: '',
    paymentMethod: 'cod',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      // Map frontend method name to backend gateway enum
      const gatewayMap = { card: 'stripe', jazzcash: 'jazzcash', cod: 'cod' };
      const gateway = gatewayMap[formData.paymentMethod] || 'cod';

      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          weight: item.selectedWeight,
          price: item.price,
        })),
        shipping_address: {
          address: formData.address,
          city: formData.city,
          zip_code: formData.zipCode,
          country: formData.country,
        },
        payment_method: gateway,
        subtotal,
        shipping_fee: shipping,
        total_amount: total,
      };

      // Step 1: Create the order
      const orderResponse = await ordersApi.createOrder(orderData);
      if (!orderResponse.success) throw new Error('Order creation failed');

      const orderId = orderResponse.data?.order?.id || orderResponse.data?.orderId;

      // Step 2: Initiate payment based on gateway
      if (gateway === 'jazzcash') {
        const payResponse = await ordersApi.initiatePayment(orderId, 'jazzcash');
        const { postUrl, fields } = payResponse.data?.jazzcash_response || {};

        if (!postUrl || !fields) throw new Error('JazzCash response missing. Check credentials.');

        // Build and submit hidden form → redirects browser to JazzCash portal
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = postUrl;
        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return; // Browser is redirecting — stop here
      }

      // COD and Stripe → go to confirmation page
      clearCart();
      navigate('/order-confirmation', {
        state: {
          orderId: orderId || 'ND-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        },
      });
    } catch (err) {
      console.error('Order failed:', err);
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (cart.length === 0 && step === 1) {
      navigate('/shop');
    }
  }, [cart.length, step, navigate]);

  if (cart.length === 0 && step === 1) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-layout">

          {/* ── Main Checkout Flow ── */}
          <div className="checkout-main">

            {/* Step Indicators */}
            <div className="checkout-steps">
              <div className={`step ${step >= 1 ? 'active' : ''}`}>
                <span className="step-num">
                  {step > 1 ? <CheckCircle size={18} /> : '1'}
                </span>
                <span>Shipping</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 2 ? 'active' : ''}`}>
                <span className="step-num">
                  {step > 2 ? <CheckCircle size={18} /> : '2'}
                </span>
                <span>Payment</span>
              </div>
              <div className="step-line"></div>
              <div className={`step ${step >= 3 ? 'active' : ''}`}>
                <span className="step-num">3</span>
                <span>Review</span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                style={{
                  padding: '1rem',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  marginBottom: '2rem',
                }}
              >
                {error}
              </div>
            )}

            {/* Step Content */}
            <div className="step-content">
              <AnimatePresence mode="wait">

                {/* Step 1 — Shipping */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="form-step"
                  >
                    <h2>Shipping Information</h2>
                    <div className="form-grid">
                      <div className="form-group full">
                        <label>Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="you@example.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="your name "
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Doe"
                        />
                      </div>
                      <div className="form-group full">
                        <label>Street Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="123 Nature St"
                        />
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Karachi"
                        />
                      </div>
                      <div className="form-group">
                        <label>ZIP / Postal Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="75500"
                        />
                      </div>
                    </div>
                    <button className="next-btn" onClick={() => setStep(2)}>
                      Continue to Payment <ArrowRight size={18} />
                    </button>
                  </motion.div>
                )}

                {/* Step 2 — Payment */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="form-step"
                  >
                    <h2>Payment Method</h2>
                    <div className="payment-options">
                      <label
                        className={`payment-card ${formData.paymentMethod === 'card' ? 'selected' : ''
                          }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={formData.paymentMethod === 'card'}
                          onChange={handleInputChange}
                        />
                        <CreditCard size={24} />
                        <div className="payment-info">
                          <span>Credit / Debit Card</span>
                          <p>Secure payment via Stripe</p>
                        </div>
                      </label>
                      <label
                        className={`payment-card ${formData.paymentMethod === 'jazzcash' ? 'selected' : ''
                          }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="jazzcash"
                          checked={formData.paymentMethod === 'jazzcash'}
                          onChange={handleInputChange}
                        />
                        <span className="jazz-logo">JC</span>
                        <div className="payment-info">
                          <span>JazzCash / Easypaisa</span>
                          <p>Local mobile wallet payment</p>
                        </div>
                      </label>
                      <label
                        className={`payment-card ${formData.paymentMethod === 'cod' ? 'selected' : ''
                          }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={handleInputChange}
                        />
                        <CheckCircle size={24} />
                        <div className="payment-info">
                          <span>Cash on Delivery</span>
                          <p>Pay when you receive the order</p>
                        </div>
                      </label>
                    </div>

                    <div className="card-fields">
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {formData.paymentMethod === 'card'
                          ? 'You will be redirected to Stripe to securely enter your card details.'
                          : formData.paymentMethod === 'jazzcash'
                            ? 'You will be redirected to the JazzCash portal to complete your payment.'
                            : 'Order now and pay with cash when your package is delivered.'}
                      </p>
                    </div>

                    <div className="btn-row">
                      <button className="back-btn" onClick={() => setStep(1)}>
                        <ArrowLeft size={18} /> Back
                      </button>
                      <button className="next-btn" onClick={() => setStep(3)}>
                        Review Order <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 — Review */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="form-step"
                  >
                    <h2>Review Your Order</h2>
                    <div className="review-summary">
                      <div className="review-section">
                        <h3>Shipping to:</h3>
                        <p>
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p>
                          {formData.address}, {formData.city}, {formData.zipCode}
                        </p>
                      </div>
                      <div className="review-section">
                        <h3>Payment:</h3>
                        <p>
                          {formData.paymentMethod === 'card'
                            ? 'Credit Card (Stripe)'
                            : formData.paymentMethod === 'jazzcash'
                              ? 'JazzCash Wallet'
                              : 'Cash on Delivery'}
                        </p>
                      </div>
                    </div>

                    <div className="btn-row">
                      <button className="back-btn" onClick={() => setStep(2)}>
                        <ArrowLeft size={18} /> Back
                      </button>
                      <button
                        className="place-order-btn"
                        onClick={handlePlaceOrder}
                        disabled={loading}
                      >
                        {loading
                          ? 'Processing...'
                          : `Place Order $${total.toFixed(2)}`}
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* ── Order Summary Sidebar ── */}
          <aside className="checkout-summary">
            <h3>Order Items</h3>
            <div className="summary-items">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.selectedWeight}`}
                  className="summary-item"
                >
                  <div className="sum-img">
                    <img
                      src={item.images?.[0] || item.image}
                      alt={item.name}
                    />
                    <span className="sum-qty">{item.quantity}</span>
                  </div>
                  <div className="sum-info">
                    <h4>{item.name}</h4>
                    <span>
                      {typeof item.selectedWeight === 'object' 
                        ? item.selectedWeight.label 
                        : item.selectedWeight}
                    </span>
                  </div>
                  <span className="sum-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-costs">
              <div className="cost-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cost-row">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="cost-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="checkout-guarantee">
              <ShieldCheck size={18} />
              <span>100% Secure Transaction</span>
            </div>
          </aside>

        </div>
      </div>

      <style>{checkoutStyles}</style>
    </div>
  );
};

export default CheckoutPage;
