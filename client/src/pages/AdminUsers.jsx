import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { adminManagementStyles } from '../shared/style';
import * as adminApi from '../api/admin';
import { toast } from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAllUsers({ search: searchTerm || undefined });
      if (res.success) setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    try {
      await adminApi.updateUserStatus(user.id, !user.is_active);
      toast.success(`User ${!user.is_active ? 'activated' : 'suspended'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="admin-users">
      <div className="page-header">
        <div>
          <h1>Users Management</h1>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers()}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '2rem' }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>No users found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#4b5563' }}>
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                  </td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold', background: u.role === 'admin' ? '#fef3c7' : '#d1fae5', color: u.role === 'admin' ? '#d97706' : '#059669' }}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: u.is_active ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <button 
                      onClick={() => handleToggleStatus(u)}
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white', background: u.is_active ? '#dc2626' : '#059669' }}
                    >
                      {u.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{adminManagementStyles}</style>
    </div>
  );
};

export default AdminUsers;
