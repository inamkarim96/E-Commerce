import React, { useState, useEffect } from 'react';
import { User, Package, MapPin, Key, LogOut, ExternalLink, Grid, Box, ShoppingBag, Users, X } from 'lucide-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { accountStyles } from '../shared/style';
import { getMyOrders, getOrderById } from '../api/orders';

const AccountPage = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  
  // Set active tab based on URL path
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path.includes('orders')) return 'orders';
    if (path.includes('address')) return 'address';
    return 'profile';
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const splitName = (fullName) => {
    const parts = (fullName || '').trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
  };

  const { firstName: initFirst, lastName: initLast } = splitName(user?.name);
  const [profileForm, setProfileForm] = useState({
    firstName: initFirst,
    lastName: initLast,
    phone: user?.phone || ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Auto-redirect Admin to Admin Dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  // Sync profile form when user data loads
  useEffect(() => {
    if (user) {
      const { firstName, lastName } = splitName(user.name);
      setProfileForm({
        firstName,
        lastName,
        phone: user.phone || ''
      });
    }
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  //   Fetch orders  when tab is opened
  useEffect(() => {
    if (activeTab !== 'orders') return;
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const res = await getMyOrders();
        if (res.success) setOrders(res.data.orders || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [activeTab]);

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      setProfileMsg(null);
      const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
      await updateProfile({ name: fullName, phone: profileForm.phone });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      setDetailsLoading(true);
      const res = await getOrderById(orderId);
      if (res.success) {
        setSelectedOrderDetails(res.data.order);
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-layout">

          {/* Sidebar */}
          <aside className="account-sidebar">
            <div className="user-brief">
              <div className="avatar">{user.name?.charAt(0)}</div>
              <div className="user-info">
                <h3>{user.name}</h3>
                <span>{user.email}</span>
                {isAdmin && (
                  <div className="mt-2 text-xs font-semibold bg-white text-green-700 px-2 py-1 rounded w-fit">
                    Administrator
                  </div>
                )}
              </div>
            </div>

            <nav className="account-nav">
              <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
                <User size={20} /> My Profile
              </button>

              {isAdmin ? (
                <>
                  <button onClick={() => navigate('/admin')}>
                    <Grid size={20} /> Admin Dashboard
                  </button>
                  <button onClick={() => navigate('/admin/products')}>
                    <Box size={20} /> Manage Products
                  </button>
                  <button onClick={() => navigate('/admin/orders')}>
                    <ShoppingBag size={20} /> Manage Orders
                  </button>
                  <button onClick={() => navigate('/admin/users')}>
                    <Users size={20} /> Manage Users
                  </button>
                </>
              ) : (
                <>
                  <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
                    <Package size={20} /> Order History
                  </button>
                  <button className={activeTab === 'address' ? 'active' : ''} onClick={() => setActiveTab('address')}>
                    <MapPin size={20} /> Saved Addresses
                  </button>
                </>
              )}

              <button className={activeTab === 'password' ? 'active' : ''} onClick={() => setActiveTab('password')}>
                <Key size={20} /> Change Password
              </button>

              <button className="logout-btn" onClick={logout}>
                <LogOut size={20} /> Logout
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="account-content">

            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-pane">
                <h2>My Profile</h2>
                {profileMsg && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      background: profileMsg.type === 'success' ? '#ecfdf5' : '#fee2e2',
                      color: profileMsg.type === 'success' ? '#059669' : '#b91c1c',
                    }}
                  >
                    {profileMsg.text}
                  </div>
                )}
                <div className="profile-form">
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" value={user.email} disabled style={{ backgroundColor: '#f8fafc', color: '#64748b' }} />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+92 300 0000000"
                      />
                    </div>
                  </div>

                  {user.addresses && user.addresses.length > 0 && (
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>Default Address</label>
                      <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
                          {user.addresses[0].address_line}, {user.addresses[0].city}, {user.addresses[0].country}
                        </p>
                      </div>
                    </div>
                  )}
                  <button className="save-btn" onClick={handleProfileSave} disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Orders Tab ── */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-pane">
                <h2>Order History</h2>
                {ordersLoading ? (
                  <p style={{ color: 'var(--text-muted)' }}>Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No orders yet. Start shopping!</p>
                ) : (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <div className="order-meta">
                            <span className="order-id">Order #{order.id.substring(0, 8)}</span>
                            <span className="order-date">
                              {new Date(order.created_at || order.date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`status-badge ${(order.status || '').toLowerCase()}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="order-details">
                          <div className="detail-item">
                            <span>Total Amount</span>
                            <strong>PKR {Number(order.total).toLocaleString()}</strong>
                          </div>
                          <div className="detail-item">
                            <span>Items</span>
                            <strong>{order.items_count || 0} Products</strong>
                          </div>
                          <button className="view-order-btn" onClick={() => handleViewOrder(order.id)}>
                            View Details <ExternalLink size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Address Tab ── */}
            {activeTab === 'address' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-pane">
                <div className="tab-header">
                  <h2>Saved Addresses</h2>
                  <button className="add-btn">+ Add New</button>
                </div>
                <div className="address-grid">
                  {user.addresses && user.addresses.length > 0 ? (
                    user.addresses.map((addr) => (
                      <div key={addr.id} className={`address-card ${addr.is_default ? 'active' : ''}`}>
                        {addr.is_default && <div className="addr-tag">Default</div>}
                        <h3>{addr.full_name || 'Home'}</h3>
                        <p>{addr.address_line}</p>
                        <p>{addr.city}, {addr.province || ''} {addr.postal_code || ''}</p>
                        <p>{addr.country}</p>
                        <div className="addr-actions">
                          <button onClick={() => setActiveTab('profile')}>View in Profile</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#64748b' }}>No saved addresses found.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Password Tab ── */}
            {activeTab === 'password' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-pane">
                <h2>Change Password</h2>
                <div className="password-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <button className="save-btn">Update Password</button>
                </div>
              </motion.div>
            )}

          </main>
        </div>
      </div>

      {selectedOrderDetails && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => setSelectedOrderDetails(null)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#666' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ marginBottom: '1.5rem' }}>Order Details</h2>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Order ID:</span>
                <span style={{ fontWeight: 600 }}>#{selectedOrderDetails.id.substring(0, 8)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Date:</span>
                <span>{new Date(selectedOrderDetails.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Status:</span>
                <span className={`status-badge ${selectedOrderDetails.status.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                  {selectedOrderDetails.status}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Items Ordered</h3>
              {selectedOrderDetails.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.variant_label} x {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 500 }}>PKR {Number(item.subtotal).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal:</span>
                <span>PKR {Number(selectedOrderDetails.subtotal).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Shipping Fee:</span>
                <span>PKR {Number(selectedOrderDetails.shipping_fee).toLocaleString()}</span>
              </div>
              {Number(selectedOrderDetails.discount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#16a34a' }}>
                  <span>Discount:</span>
                  <span>- PKR {Number(selectedOrderDetails.discount).toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.5rem', color: 'var(--primary)' }}>
                <span>Total:</span>
                <span>PKR {Number(selectedOrderDetails.total).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Shipping Address</h4>
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                {typeof selectedOrderDetails.shipping_address === 'object'
                  ? `${selectedOrderDetails.shipping_address.address}, ${selectedOrderDetails.shipping_address.city}, ${selectedOrderDetails.shipping_address.zip_code}, ${selectedOrderDetails.shipping_address.country}`
                  : selectedOrderDetails.shipping_address}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{accountStyles}</style>
    </div>
  );
};

export default AccountPage;
