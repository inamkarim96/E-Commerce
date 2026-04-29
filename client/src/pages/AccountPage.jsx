import React, { useState, useEffect } from 'react';
import { User, Package, MapPin, Key, LogOut, ExternalLink, Grid, Box, ShoppingBag, Users, X, Info } from 'lucide-react';
import { Button, Badge, Input, Modal, Card } from '../components/ui';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

import { getMyOrders, getOrderById } from '../api/orders';
import { getMyAddresses, addAddress, updateAddress, deleteAddress } from '../api/users';
import { changePassword } from '../api/auth';

const AccountPage = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  // Helper to split a full name into first and last
  const splitName = (fullName) => {
    const parts = (fullName || '').trim().split(/\s+/);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  // Get the user's default address for display
  const defaultAddress = user?.addresses?.find(a => a.is_default) || user?.addresses?.[0] || null;

  // Set active tab based on URL path
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path.includes('orders')) return 'orders';
    if (path.includes('address')) return 'address';
    return 'profile';
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    full_name: '', phone: '', address_line: '', city: '', country: 'Pakistan', is_default: false
  });

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

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Auto-redirect Admin to Admin Dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  // Sync profile form when user data loads/changes from backend
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

  useEffect(() => {
    if (activeTab !== 'address') return;
    const fetchAddresses = async () => {
      try {
        setAddressesLoading(true);
        const res = await getMyAddresses();
        if (res.success) setAddresses(res.data);
      } catch (err) {
        console.error('Failed to load addresses:', err);
      } finally {
        setAddressesLoading(false);
      }
    };
    fetchAddresses();
  }, [activeTab]);

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      setProfileMsg(null);
      const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
      await updateProfile({ name: fullName, phone: profileForm.phone });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: typeof err === 'string' ? err : 'Failed to update profile.' });
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

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        const res = await updateAddress(editingAddress.id, addressForm);
        if (res.success) {
          setAddresses(addresses.map(a => a.id === editingAddress.id ? res.data : a));
        }
      } else {
        const res = await addAddress(addressForm);
        if (res.success) {
          setAddresses([...addresses, res.data]);
        }
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (err) {
      console.error('Failed to save address:', err);
      alert('Failed to save address');
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordMsg(null);
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    try {
      setPasswordSaving(true);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to update password.';
      setPasswordMsg({ type: 'error', text: typeof msg === 'string' ? msg : 'Failed to update password.' });
    } finally {
      setPasswordSaving(false);
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

            <nav className="account-nav space-y-2">
              <Button 
                variant={activeTab === 'profile' ? 'admin-primary' : 'admin-ghost'} 
                onClick={() => setActiveTab('profile')}
                className="w-full justify-start py-3"
                icon={User}
              >
                My Profile
              </Button>

              {isAdmin ? (
                <>
                  <Button variant="admin-ghost" onClick={() => navigate('/admin')} className="w-full justify-start py-3" icon={Grid}>Admin Dashboard</Button>
                  <Button variant="admin-ghost" onClick={() => navigate('/admin/products')} className="w-full justify-start py-3" icon={Box}>Manage Products</Button>
                  <Button variant="admin-ghost" onClick={() => navigate('/admin/orders')} className="w-full justify-start py-3" icon={ShoppingBag}>Manage Orders</Button>
                  <Button variant="admin-ghost" onClick={() => navigate('/admin/users')} className="w-full justify-start py-3" icon={Users}>Manage Users</Button>
                </>
              ) : (
                <>
                  <Button 
                    variant={activeTab === 'orders' ? 'admin-primary' : 'admin-ghost'} 
                    onClick={() => setActiveTab('orders')}
                    className="w-full justify-start py-3"
                    icon={Package}
                  >
                    Order History
                  </Button>
                  <Button 
                    variant={activeTab === 'address' ? 'admin-primary' : 'admin-ghost'} 
                    onClick={() => setActiveTab('address')}
                    className="w-full justify-start py-3"
                    icon={MapPin}
                  >
                    Saved Addresses
                  </Button>
                </>
              )}

              <Button 
                variant={activeTab === 'password' ? 'admin-primary' : 'admin-ghost'} 
                onClick={() => setActiveTab('password')}
                className="w-full justify-start py-3"
                icon={Key}
              >
                Change Password
              </Button>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <Button 
                  variant="admin-danger" 
                  onClick={logout}
                  className="w-full justify-start py-3"
                  icon={LogOut}
                >
                  Logout
                </Button>
              </div>
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
                    className={`p-3 rounded-lg mb-6 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                  >
                    {profileMsg.text}
                  </div>
                )}
                <div className="profile-form space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                      containerClassName="mb-0"
                    />
                    <Input
                      label="Last Name"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                      containerClassName="mb-0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      value={user.email}
                      disabled
                      containerClassName="mb-0"
                      className="bg-slate-50 text-slate-500"
                    />
                    <Input
                      label="Phone Number"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+92 300 0000000"
                      containerClassName="mb-0"
                    />
                  </div>

                  {defaultAddress && (
                    <Card className="bg-slate-50 border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Home Address</p>
                      <p className="m-0 text-slate-600 font-medium">
                        {[defaultAddress.address_line, defaultAddress.city, defaultAddress.country].filter(Boolean).join(', ')}
                      </p>
                    </Card>
                  )}
                  <Button variant="primary" onClick={handleProfileSave} loading={profileSaving}>
                    Update Profile
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Orders Tab ── */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-pane">
                <h2>Order History</h2>
                {ordersLoading ? (
                  <p className="state-msg">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="state-msg">No orders yet. Start shopping!</p>
                ) : (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <Card key={order.id} className="p-0 overflow-hidden mb-4">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <div>
                            <span className="font-bold text-slate-900 block">Order #{order.id.substring(0, 8)}</span>
                            <span className="text-xs text-slate-500">
                              {new Date(order.created_at || order.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </span>
                          </div>
                          <Badge variant={
                            order.status.toLowerCase() === 'delivered' ? 'success' : 
                            order.status.toLowerCase() === 'cancelled' ? 'error' : 'info'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="p-4 flex flex-wrap gap-6 items-center justify-between">
                          <div className="flex gap-8">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Amount</p>
                              <p className="font-bold text-primary">PKR {Number(order.total).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Items</p>
                              <p className="font-bold text-slate-700">{order.items_count || 0} Products</p>
                            </div>
                          </div>
                          <Button 
                            variant="admin-outline" 
                            size="sm" 
                            icon={ExternalLink} 
                            onClick={() => handleViewOrder(order.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Address Tab ── */}
            {activeTab === 'address' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-pane">
                <div className="flex justify-between items-center mb-6">
                  <h2>Saved Addresses</h2>
                  {!showAddressForm && (
                    <Button variant="primary" size="sm" onClick={() => {
                      setEditingAddress(null);
                      setAddressForm({ full_name: user?.name || '', phone: user?.phone || '', address_line: '', city: '', country: 'Pakistan', is_default: false });
                      setShowAddressForm(true);
                    }}>
                      Add New Address
                    </Button>
                  )}
                </div>

                {showAddressForm ? (
                  <Card className="bg-slate-50 border-slate-200 p-6">
                    <h3 className="text-xl font-bold mb-6">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Full Name" required value={addressForm.full_name} onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })} containerClassName="mb-0" />
                        <Input label="Phone Number" required value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} containerClassName="mb-0" />
                      </div>
                      <Input label="Home Address (House #, Street, Area)" required value={addressForm.address_line} onChange={e => setAddressForm({ ...addressForm, address_line: e.target.value })} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="City" required value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} containerClassName="mb-0" />
                        <Input label="Country" required value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} containerClassName="mb-0" />
                      </div>
                      <div className="flex items-center gap-3 py-2">
                        <input type="checkbox" id="is_default" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                        <label htmlFor="is_default" className="text-sm font-semibold text-slate-700 m-0 cursor-pointer">Set as Default Address</label>
                      </div>
                      <div className="flex gap-4 justify-end pt-4 border-t border-slate-200">
                        <Button variant="admin-outline" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Save Address</Button>
                      </div>
                    </form>
                  </Card>
                ) : (
                  <div className="address-grid">
                    {addressesLoading ? (
                      <p className="text-slate-500">Loading addresses...</p>
                    ) : addresses.length > 0 ? (
                      addresses.map((addr) => (
                        <Card key={addr.id} className={`relative p-5 transition-all ${addr.is_default ? 'border-primary bg-emerald-50/30' : 'hover:border-slate-300'}`}>
                          {addr.is_default && <Badge variant="success" className="absolute top-4 right-4">Default</Badge>}
                          <h3 className="text-lg font-bold text-slate-800 mb-1">{addr.full_name}</h3>
                          <p className="text-sm text-slate-600 mb-3">{addr.phone}</p>
                          <div className="space-y-1 text-sm text-slate-500 italic">
                            <p className="m-0">{addr.address_line}</p>
                            <p className="m-0">{addr.city}, {addr.country}</p>
                          </div>
                          <div className="flex gap-2 mt-6">
                            <Button 
                              variant="admin-ghost" 
                              size="sm" 
                              className="flex-1 bg-white border border-slate-200"
                              onClick={() => {
                                setEditingAddress(addr);
                                setAddressForm({ full_name: addr.full_name || '', phone: addr.phone || '', address_line: addr.address_line || '', city: addr.city || '', country: addr.country || 'Pakistan', is_default: addr.is_default || false });
                                setShowAddressForm(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="admin-ghost" 
                              size="sm" 
                              className="flex-1 text-red-600 hover:bg-red-50 border border-transparent"
                              onClick={() => {
                                if (window.confirm('Delete this address?')) {
                                  deleteAddress(addr.id).then(() => setAddresses(addresses.filter(a => a.id !== addr.id)));
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-slate-500">No saved addresses found.</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Password Tab ── */}
            {activeTab === 'password' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-pane">
                <h2>Change Password</h2>
                {passwordMsg && (
                  <div
                    className={`p-3 rounded-lg mb-6 ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
                  >
                    {passwordMsg.text}
                  </div>
                )}
                <div className="password-form space-y-6 max-w-md">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  />
                  <Button variant="primary" loading={passwordSaving} onClick={handlePasswordSubmit}>
                    Update Password
                  </Button>
                </div>
              </motion.div>
            )}

          </main>
        </div>
      </div>

      {selectedOrderDetails && (
      <Modal
        isOpen={!!selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
        title={`Order #${selectedOrderDetails?.id.substring(0, 8)}`}
        size="2xl"
      >
        <div className="space-y-6">
          <Card className="bg-slate-50 border-none">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Date</p>
                <p className="font-bold">{new Date(selectedOrderDetails?.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Status</p>
                <Badge variant={
                  selectedOrderDetails?.status.toLowerCase() === 'delivered' ? 'success' : 
                  selectedOrderDetails?.status.toLowerCase() === 'cancelled' ? 'error' : 'info'
                }>
                  {selectedOrderDetails?.status}
                </Badge>
              </div>
            </div>
          </Card>

          <div>
            <h3 className="text-lg font-bold mb-3">Order Items</h3>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {selectedOrderDetails?.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between p-3 bg-white">
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-xs text-slate-500">{item.variant_label} x {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-700">PKR {Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>PKR {Number(selectedOrderDetails?.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping</span><span>PKR {Number(selectedOrderDetails?.shipping_fee).toLocaleString()}</span></div>
            {Number(selectedOrderDetails?.discount) > 0 && (
              <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>- PKR {Number(selectedOrderDetails?.discount).toLocaleString()}</span></div>
            )}
            <div className="flex justify-between font-bold text-xl mt-4 pt-4 border-t border-slate-200 text-primary">
              <span>Total</span>
              <span>PKR {Number(selectedOrderDetails?.total).toLocaleString()}</span>
            </div>
          </div>

          <Card className="border-slate-200">
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Shipping Address</h4>
            <p className="text-sm text-slate-600 m-0 leading-relaxed font-medium">
              {typeof selectedOrderDetails?.shipping_address === 'object'
                ? `${selectedOrderDetails.shipping_address.address}, ${selectedOrderDetails.shipping_address.city}, ${selectedOrderDetails.shipping_address.zip_code}, ${selectedOrderDetails.shipping_address.country}`
                : selectedOrderDetails?.shipping_address}
            </p>
          </Card>
        </div>
      </Modal>
      )}


    </div>
  );
};

export default AccountPage;
