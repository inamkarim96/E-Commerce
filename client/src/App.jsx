import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import PaymentFailedPage from './pages/PaymentFailedPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
        <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
        <Route path="/shop" element={<MainLayout><ShopPage /></MainLayout>} />
        <Route path="/product/:slug" element={<MainLayout><ProductDetailPage /></MainLayout>} />
        <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
        <Route path="/login" element={<MainLayout><LoginPage /></MainLayout>} />
        <Route path="/payment/failed" element={<MainLayout><PaymentFailedPage /></MainLayout>} />

        {/* Customer (PrivateRoute) */}
        <Route path="/checkout" element={<PrivateRoute><MainLayout><CheckoutPage /></MainLayout></PrivateRoute>} />
        <Route path="/order-confirmation" element={<PrivateRoute><MainLayout><OrderConfirmationPage /></MainLayout></PrivateRoute>} />
        <Route path="/account" element={<PrivateRoute><MainLayout><AccountPage /></MainLayout></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><MainLayout><AccountPage /></MainLayout></PrivateRoute>} />

        {/* Admin (AdminRoute + AdminLayout) */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Redirects */}
        <Route path="/AdminDashboard" element={<Navigate to="/admin" replace />} />

        {/* 404 */}
        <Route path="*" element={<MainLayout><div>404 Not Found</div></MainLayout>} />
      </Routes>
    </>
  );
}

export default App;
