import React, { useState, useEffect } from 'react';
import { User, Package, MapPin, Key, LogOut, ExternalLink, Grid, Box, ShoppingBag, Users } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { accountStyles } from '../shared/style';
import { getMyOrders } from '../api/orders';

const AccountPage = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  if (!user) return <Navigate to="/login" />;

  //   Fetch orders  when tab is opened
  useEffect(() => {
    if (activeTab !== 'orders') return;
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const res = await getMyOrders();
        if (res.success) setOrders(res.data);
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
      await updateProfile(profileForm);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
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
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" defaultValue={user.email} disabled />
                    </div>
                  </div>
                  <div className="form-row">
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
                            <span className="order-id">Order #{order.id}</span>
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
                            <strong>${Number(order.total_amount || order.total).toFixed(2)}</strong>
                          </div>
                          <div className="detail-item">
                            <span>Items</span>
                            <strong>{order.items?.length || order.items} Products</strong>
                          </div>
                          <button className="view-order-btn">
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
                  <div className="address-card active">
                    <div className="addr-tag">Default</div>
                    <h3>Home</h3>
                    <p>123 Nature St, Apartment 4B</p>
                    <p>Karachi, Pakistan</p>
                    <div className="addr-actions">
                      <button>Edit</button>
                      <button>Remove</button>
                    </div>
                  </div>
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
      <style>{accountStyles}</style>
    </div>
  );
};

export default AccountPage;
