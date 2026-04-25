import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard as RxDashboard, Package as FiPackage, ShoppingBag as FiShoppingBag, Users as FiUsers, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { logout } = useAuth();

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#1e3d1a', color: 'white', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>
            🌿 NaturaDry
          </Link>
          <div style={{ color: '#86efac', fontSize: '0.875rem', marginTop: '0.25rem' }}>Admin Panel</div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { to: '/admin', icon: RxDashboard, label: 'Dashboard', end: true },
            { to: '/admin/products', icon: FiPackage, label: 'Products' },
            { to: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
            { to: '/admin/users', icon: FiUsers, label: 'Users' }
          ].map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: isActive ? 'white' : '#bbf7d0',
                backgroundColor: isActive ? '#2d5a27' : 'transparent',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                transition: 'all 0.2s'
              })}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: View Site + Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#bbf7d0', textDecoration: 'none', borderRadius: '0.5rem' }}>
            View Website
          </Link>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: '#fca5a5', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '0.5rem', width: '100%', textAlign: 'left' }}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', padding: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
