import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, X } from 'lucide-react';
import { adminManagementStyles } from '../shared/style';
import * as adminApi from '../api/admin';
import { toast } from 'react-hot-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const res = await adminApi.getAllOrders(params);
      if (res.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      let payload = { status: newStatus };
      if (newStatus === 'shipped') {
        const tracking = window.prompt('Enter tracking number:');
        const courier = window.prompt('Enter courier name:');
        if (!tracking || !courier) {
          toast.error('Tracking and courier are required for shipping');
          return;
        }
        payload = { ...payload, tracking_number: tracking, courier };
      }
      
      await adminApi.updateOrderStatus(orderId, payload);
      toast.success('Order status updated');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update status');
    }
  };

  return (
    <div className="admin-orders">
      <div className="page-header">
        <div>
          <h1>Orders Management</h1>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Status:</label>
          <select value={filters.status} onChange={e => setFilters(p => ({...p, status: e.target.value}))} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>From:</label>
          <input type="date" value={filters.date_from} onChange={e => setFilters(p => ({...p, date_from: e.target.value}))} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>To:</label>
          <input type="date" value={filters.date_to} onChange={e => setFilters(p => ({...p, date_to: e.target.value}))} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <button onClick={fetchOrders} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          Apply Filters
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '2rem' }}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>No orders found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Items Count</th>
                <th>Total (PKR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>#{o.id.substring(0, 8)}</td>
                  <td>{o.user_name}</td>
                  <td>{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{o.items?.length || 0}</td>
                  <td>PKR {Number(o.total).toLocaleString()}</td>
                  <td>
                    <span className={`status-pill ${o.status}`} style={{ textTransform: 'capitalize' }}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button onClick={() => setSelectedOrder(o)} title="View" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                        <Eye size={18} />
                      </button>
                      <select 
                        value={o.status} 
                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                        style={{ padding: '0.2rem', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2>Order #{selectedOrder.id.substring(0, 8)}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
              <p><strong>Customer:</strong> {selectedOrder.user_name} ({selectedOrder.user_email})</p>
              <p><strong>Address:</strong> {selectedOrder.shipping_address}</p>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
            </div>
            <h3>Items</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              {selectedOrder.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                  <span>{item.quantity}x {item.product_name} ({item.variant_label})</span>
                  <span>PKR {Number(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>PKR {Number(selectedOrder.subtotal).toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping:</span><span>PKR {Number(selectedOrder.shipping_fee).toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount:</span><span>- PKR {Number(selectedOrder.discount).toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #ccc' }}><span>Total:</span><span>PKR {Number(selectedOrder.total).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}

      <style>{adminManagementStyles}</style>
    </div>
  );
};

export default AdminOrders;
