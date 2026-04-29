import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard as RxDashboard, 
  Package, 
  Package as FiPackage, 
  ShoppingBag as FiShoppingBag, 
  Users as FiUsers, 
  LogOut, 
  FolderOpen, 
  Settings, 
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../components/ui';

const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`admin-layout-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Header */}
      <header className="admin-mobile-header">
        <Link to="/" className="admin-sidebar-logo">
          <Package size={24} /> NaturaDry
        </Link>
        <button onClick={toggleSidebar} className="mobile-toggle">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Logo Section */}
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-sidebar-logo">
            <Package size={28} /> NaturaDry
          </Link>
          <div className="text-emerald-300 text-xs mt-1">Admin Panel</div>
        </div>

        {/* Navigation */}
        <nav className="admin-nav">
          {[
            { to: '/admin', icon: RxDashboard, label: 'Dashboard', end: true },
            { to: '/admin/products', icon: FiPackage, label: 'Products' },
            { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
            { to: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
            { to: '/admin/users', icon: FiUsers, label: 'Users' }
          ].map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/admin/settings"
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={20} /> Settings
          </NavLink>
        </nav>

        {/* Footer actions */}
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-link text-emerald-200">
            <ArrowLeft size={20} /> Back to Shop
          </Link>
          <button onClick={logout} className="admin-nav-link text-red-300 bg-transparent border-none cursor-pointer w-full text-left">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        <main className="admin-main-content">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
