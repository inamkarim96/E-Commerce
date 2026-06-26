import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import PageSkeleton from './components/PageSkeleton';
import { motion, AnimatePresence } from 'framer-motion';


const LandingPage = lazy(() => import('./pages/LandingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
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

// Animated Route Wrapper
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

function App() {
  const location = useLocation();
  
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '14px' },
        }}
      />

      <Suspense fallback={<PageSkeleton />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* ── Public ────────────────────────────────────────────────────── */}
            <Route path="/" element={<MainLayout><PageWrapper><LandingPage /></PageWrapper></MainLayout>} />
            <Route path="/about" element={<MainLayout><PageWrapper><AboutPage /></PageWrapper></MainLayout>} />
            <Route path="/contact" element={<MainLayout><PageWrapper><ContactPage /></PageWrapper></MainLayout>} />
            <Route path="/shop" element={<MainLayout><PageWrapper><ShopPage /></PageWrapper></MainLayout>} />
            <Route path="/product/:slug" element={<MainLayout><PageWrapper><ProductDetailPage /></PageWrapper></MainLayout>} />
            <Route path="/login" element={<MainLayout><PageWrapper><LoginPage /></PageWrapper></MainLayout>} />
            <Route path="/payment/failed" element={<MainLayout><PageWrapper><PaymentFailedPage /></PageWrapper></MainLayout>} />

            {/* ── Authenticated customer ────────────────────────────────────── */}
            <Route path="/checkout" element={
              <PrivateRoute><MainLayout><PageWrapper><CheckoutPage /></PageWrapper></MainLayout></PrivateRoute>
            } />
            <Route path="/order-confirmation" element={
              <PrivateRoute><MainLayout><PageWrapper><OrderConfirmationPage /></PageWrapper></MainLayout></PrivateRoute>
            } />
            <Route path="/account" element={
              <PrivateRoute><MainLayout><PageWrapper><AccountPage /></PageWrapper></MainLayout></PrivateRoute>
            } />
            <Route path="/orders" element={
              <PrivateRoute><MainLayout><PageWrapper><AccountPage /></PageWrapper></MainLayout></PrivateRoute>
            } />

            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<PageWrapper><AdminDashboard /></PageWrapper>} />
              <Route path="products" element={<PageWrapper><AdminProducts /></PageWrapper>} />
              <Route path="categories" element={<PageWrapper><AdminCategories /></PageWrapper>} />
              <Route path="orders" element={<PageWrapper><AdminOrders /></PageWrapper>} />
              <Route path="users" element={<PageWrapper><AdminUsers /></PageWrapper>} />
            </Route>

            <Route path="/AdminDashboard" element={<Navigate to="/admin" replace />} />

            <Route path="*" element={
              <MainLayout>
                <PageWrapper>
                  <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                    <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#2d6a4f' }}>404</h1>
                    <p style={{ color: '#64748b', marginTop: 8 }}>Page not found.</p>
                  </div>
                </PageWrapper>
              </MainLayout>
            } />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}

export default App;


