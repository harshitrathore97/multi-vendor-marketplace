import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer pages
import Home from './pages/customer/Home';
import ProductList from './pages/customer/ProductList';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderList from './pages/customer/OrderList';
import OrderDetail from './pages/customer/OrderDetail';
import OrderTrack from './pages/customer/OrderTrack';

// Vendor pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import ProductForm from './pages/vendor/ProductForm';
import VendorOrders from './pages/vendor/VendorOrders';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVendors from './pages/admin/AdminVendors';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCoupons from './pages/admin/AdminCoupons';

// Route guards
const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RequireRole = ({ role, children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === role ? children : <Navigate to="/" replace />;
};

// Sidebar layout for dashboards
const DashboardLayout = ({ links, title }) => {
  const { logout, user } = useAuth();
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <aside style={{ width: '240px', flexShrink: 0, background: 'var(--bg-card)', borderRight: '1px solid var(--border-color)', padding: '1.5rem 1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.name}</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', color: window.location.pathname === l.href ? '#fff' : 'var(--text-secondary)', background: window.location.pathname === l.href ? 'var(--primary)' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', fontWeight: window.location.pathname === l.href ? 600 : 400, transition: 'var(--transition)' }}>
              {l.label}
            </a>
          ))}
          <button onClick={logout} style={{ marginTop: '1rem', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}>Sign Out</button>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}><Outlet /></main>
    </div>
  );
};

const vendorLinks = [
  { href: '/vendor', label: '📊 Dashboard' },
  { href: '/vendor/products', label: '📦 Products' },
  { href: '/vendor/orders', label: '🛍️ Orders' },
];

const adminLinks = [
  { href: '/admin', label: '📊 Overview' },
  { href: '/admin/users', label: '👥 Users' },
  { href: '/admin/vendors', label: '🏪 Vendors' },
  { href: '/admin/products', label: '📦 Products' },
  { href: '/admin/orders', label: '🛍️ Orders' },
  { href: '/admin/coupons', label: '🏷️ Coupons' },
];

// Main layout for public/customer pages
const MainLayout = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Navbar />
    <main className="container" style={{ flex: 1, padding: '2rem 1rem' }}><Outlet /></main>
    <Footer />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Main layout routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer protected routes */}
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><OrderList /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
        <Route path="/orders/:id/track" element={<RequireAuth><OrderTrack /></RequireAuth>} />
      </Route>

      {/* Vendor dashboard */}
      <Route path="/vendor" element={<RequireAuth><RequireRole role="vendor"><DashboardLayout links={vendorLinks} title="Vendor Panel" /></RequireRole></RequireAuth>}>
        <Route index element={<VendorDashboard />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="orders" element={<VendorOrders />} />
      </Route>

      {/* Admin dashboard */}
      <Route path="/admin" element={<RequireAuth><RequireRole role="admin"><DashboardLayout links={adminLinks} title="Admin Panel" /></RequireRole></RequireAuth>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="coupons" element={<AdminCoupons />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
