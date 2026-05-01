import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Badge } from '../components/ui';

import { validateCoupon } from '../api/coupons';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, subtotal } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const shipping = subtotal >= 2000 ? 0 : 150;
  const total = subtotal - discount + shipping;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      setPromoLoading(true);
      setPromoMsg(null);
      const res = await validateCoupon(promoCode.trim(), subtotal);
      if (res.success && res.data) {
        setDiscount(res.data.discount_amount || 0);
        setPromoMsg({ type: 'success', text: `Coupon applied! You saved PKR ${res.data.discount_amount.toLocaleString()}` });
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
          <ShoppingBag size={80} strokeWidth={1} className="text-slate-300 mb-4" />
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Looks like you haven't added anything to your cart yet. Let's find something delicious for you!</p>
          <Button as={Link} to="/shop" variant="primary" size="lg" icon={ArrowRight}>
            Start Shopping
          </Button>
        </motion.div>


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
          <aside className="order-summary h-fit">
            <Card className="bg-slate-50/50 border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-emerald-600 font-bold' : ''}>
                    {shipping === 0 ? 'FREE' : `PKR ${shipping.toLocaleString()}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-[11px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 font-bold">
                    Free shipping on orders over PKR 2,000!
                  </p>
                )}

                {discount > 0 && (
                  <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-dashed border-emerald-200">
                    <span className="text-emerald-700 text-sm font-bold flex items-center gap-1">
                      <Tag size={14} /> Discount
                    </span>
                    <span className="text-emerald-700 font-bold">-PKR {discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="pt-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Promo Code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      containerClassName="mb-0 flex-1"
                      className="h-10"
                    />
                    <Button 
                      variant="admin-primary" 
                      size="sm" 
                      onClick={handleApplyPromo} 
                      loading={promoLoading}
                      className="h-10"
                    >
                      Apply
                    </Button>
                  </div>
                  {promoMsg && (
                    <p className={`text-xs mt-2 font-bold ${promoMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {promoMsg.text}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <span className="text-2xl font-bold text-primary">PKR {total.toLocaleString()}</span>
                </div>

                <Button 
                  as={Link} 
                  to="/checkout" 
                  variant="primary" 
                  size="lg" 
                  className="w-full py-4 mt-2"
                  icon={ArrowRight}
                >
                  Proceed to Checkout
                </Button>

                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium pt-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>Secure Checkout Guaranteed</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <style>{`
        .empty-cart {
          padding: 8rem 0;
          text-align: center;
        }
        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .cart-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--bg-main);
          font-weight: 700;
          color: var(--text-muted);
          font-size: 0.85rem;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .cart-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          align-items: center;
          padding: 2rem 0;
          border-bottom: 1px solid var(--border);
        }
        .item-info {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        .item-img {
          width: 100px;
          height: 100px;
          border-radius: 1rem;
          overflow: hidden;
          background: white;
          border: 1px solid var(--border);
        }
        .item-details h3 {
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 0.25rem;
          color: var(--text-main);
        }
        .item-details span {
          display: block;
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .remove-btn {
          color: #ef4444;
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .item-price, .item-total {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--text-main);
        }
        .item-total {
          color: var(--primary);
        }
        .quantity-control {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--bg-main);
          width: fit-content;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
        }
        .quantity-control button {
          color: var(--primary);
        }
        .quantity-control span {
          font-weight: 800;
          min-width: 20px;
          text-align: center;
        }
        .back-to-shop {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 2rem;
          font-weight: 700;
          color: var(--primary);
        }
        @media (max-width: 1023px) {
          .cart-header { display: none; }
          .cart-item {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            text-align: center;
          }
          .item-info { flex-direction: column; }
          .item-quantity { display: flex; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
