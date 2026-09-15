import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Bell, User, LogOut, Store, ShieldCheck, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';

const Navbar = () => {
  const { user, isAuthenticated, isVendor, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const { unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="nav-brand">
        <ShoppingBag size={28} color="#6366f1" />
        <span>OmniMarket</span>
      </Link>

      <nav className="nav-links">
        <Link to="/products" className="nav-item">
          <Compass size={18} />
          <span>Explore</span>
        </Link>

        {isVendor && (
          <Link to="/vendor" className="nav-item">
            <Store size={18} color="#10b981" />
            <span style={{ color: '#10b981' }}>Vendor Portal</span>
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" className="nav-item">
            <ShieldCheck size={18} color="#f59e0b" />
            <span style={{ color: '#f59e0b' }}>Admin Portal</span>
          </Link>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAuthenticated && (
          <Link to="/notifications" className="nav-item" style={{ position: 'relative' }}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notif-bubble">{unreadCount}</span>}
          </Link>
        )}

        <Link to="/cart" className="nav-item" style={{ position: 'relative' }}>
          <ShoppingBag size={20} />
          {cart.itemCount > 0 && (
            <span className="notif-bubble" style={{ background: '#6366f1' }}>
              {cart.itemCount}
            </span>
          )}
        </Link>

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/orders" className="nav-item">
              Orders
            </Link>
            <Link to="/profile" className="nav-item">
              <User size={18} />
              <span>{user?.name?.split(' ')[0]}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
