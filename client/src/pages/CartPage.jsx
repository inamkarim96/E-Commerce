import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cartStyles } from '../shared/style';
import { validateCoupon } from '../api/coupons';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, subtotal } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const shipping = subtotal > 5000 ? 0 : 500;
  const total = subtotal - discount + shipping;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      setPromoLoading(true);
      setPromoMsg(null);
      const res = await validateCoupon(promoCode.trim(), subtotal);
      if (res.success && res.data) {
        setDiscount(res.data.discount_amount || 0);
        setPromoMsg({ type: 'success', text: `Coupon applied! You saved $${res.data.discount_amount.toFixed(2)}` });
      } else {
        setPromoMsg({ type: 'error', text: 'Invalid coupon code.' });
      }
    } catch (err) {
      setPromoMsg({ type: 'error', text: err.response?.data?.error?.message || 'Invalid coupon code.' });
    } finally {
      setPromoLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="empty-content"
        >
          <ShoppingBag size={80} strokeWidth={1} />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/shop" className="btn btn-primary">Start Shopping</Link>
        </motion.div>

        <style>{cartStyles}</style>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">Shopping Cart</h1>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items-container">
            <div className="cart-header">
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>

            <div className="cart-items">
              {cart.map((item, idx) => {
                const weightLabel = typeof item.selectedWeight === 'string' ? item.selectedWeight : (item.selectedWeight?.label || 'Default');
                const itemPrice = Number(item.price || item.base_price || 0);
                
                return (
                  <motion.div
                    key={`${item.id}-${weightLabel}`}
                    className="cart-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="item-info">
                      <div className="item-img">
                        <img src={item.images?.find(img => img && img.trim() !== '') || 'https://via.placeholder.com/150'} alt={item.name} />
                      </div>
                      <div className="item-details">
                        <h3>{item.name}</h3>
                        <span>Weight: {weightLabel}</span>
                        <button className="remove-btn" onClick={() => removeFromCart(item.id, item.selectedWeight)}>
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="item-price">PKR {itemPrice.toLocaleString()}</div>

                    <div className="item-quantity">
                      <div className="quantity-control">
                        <button onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity - 1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity + 1)}><Plus size={14} /></button>
                      </div>
                    </div>

                    <div className="item-total">
                      PKR {(itemPrice * item.quantity).toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Link to="/shop" className="back-to-shop">
              <ArrowLeft size={18} /> Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <aside className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>PKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `PKR ${shipping.toLocaleString()}`}</span>
              </div>
              {shipping > 0 && (
                <p className="shipping-note">Free shipping on orders over PKR 5,000!</p>
              )}

              {discount > 0 && (
                <div className="summary-row discount">
                  <span><Tag size={14} /> Discount</span>
                  <span style={{ color: '#059669' }}>-PKR {discount.toLocaleString()}</span>
                </div>
              )}

              <div className="promo-code">
                <input
                  type="text"
                  placeholder="Promo Code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <button onClick={handleApplyPromo} disabled={promoLoading}>
                  {promoLoading ? '...' : 'Apply'}
                </button>
              </div>
              {promoMsg && (
                <p style={{
                  fontSize: '0.85rem',
                  marginTop: '-0.5rem',
                  color: promoMsg.type === 'success' ? '#059669' : '#dc2626'
                }}>
                  {promoMsg.text}
                </p>
              )}

              <div className="summary-total">
                <span>Total</span>
                <span>PKR {total.toLocaleString()}</span>
              </div>

              <Link to="/checkout" className="checkout-btn">
                Proceed to Checkout
              </Link>

              <div className="secure-checkout">
                <ShieldCheck size={16} />
                <span>Secure Checkout Guaranteed</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{cartStyles}</style>
    </div>
  );
};

export default CartPage;
