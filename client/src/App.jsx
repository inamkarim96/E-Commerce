import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import PageSkeleton from './components/PageSkeleton';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage'));

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '14px' },
        }}
      />

      {/* Suspense catches lazy chunks loading — shows skeleton while downloading */}
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* ── Public ────────────────────────────────────────────────────── */}
          <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
          <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
          <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
          <Route path="/shop" element={<MainLayout><ShopPage /></MainLayout>} />
          <Route path="/product/:slug" element={<MainLayout><ProductDetailPage /></MainLayout>} />
          <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
          <Route path="/login" element={<MainLayout><LoginPage /></MainLayout>} />
          <Route path="/payment/failed" element={<MainLayout><PaymentFailedPage /></MainLayout>} />

          {/* ── Authenticated customer ────────────────────────────────────── */}
          <Route path="/checkout" element={
            <PrivateRoute><MainLayout><CheckoutPage /></MainLayout></PrivateRoute>
          } />
          <Route path="/order-confirmation" element={
            <PrivateRoute><MainLayout><OrderConfirmationPage /></MainLayout></PrivateRoute>
          } />
          <Route path="/account" element={
            <PrivateRoute><MainLayout><AccountPage /></MainLayout></PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute><MainLayout><AccountPage /></MainLayout></PrivateRoute>
          } />

          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          <Route path="/AdminDashboard" element={<Navigate to="/admin" replace />} />

          <Route path="*" element={
            <MainLayout>
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#2d6a4f' }}>404</h1>
                <p style={{ color: '#64748b', marginTop: 8 }}>Page not found.</p>
              </div>
            </MainLayout>
          } />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;


