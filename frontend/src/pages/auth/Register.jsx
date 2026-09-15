import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Store, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [role, setRole] = useState('CUSTOMER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    description: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      const data = await register({ ...formData, role });
      if (data.user.role === 'VENDOR') navigate('/vendor');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }} className="glass-card">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.8rem', background: 'var(--primary-glow)', borderRadius: '50%', marginBottom: '0.75rem' }}>
          <UserPlus size={28} color="#6366f1" />
        </div>
        <h2>Create an Account</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Join OmniMarket as a buyer or independent seller
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setRole('CUSTOMER')}
          style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${role === 'CUSTOMER' ? 'var(--primary)' : 'var(--border-color)'}`, background: role === 'CUSTOMER' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)', color: role === 'CUSTOMER' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
        >
          Customer Account
        </button>
        <button
          type="button"
          onClick={() => setRole('VENDOR')}
          style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${role === 'VENDOR' ? 'var(--success)' : 'var(--border-color)'}`, background: role === 'VENDOR' ? 'var(--success-bg)' : 'var(--bg-input)', color: role === 'VENDOR' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
        >
          <Store size={16} color={role === 'VENDOR' ? '#10b981' : '#64748b'} />
          Sell on Marketplace
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">{role === 'VENDOR' ? 'Owner Full Name' : 'Full Name'}</label>
          <input
            type="text"
            name="name"
            className="form-input"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-input"
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            name="phone"
            className="form-input"
            placeholder="+1 555-0123"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        {/* Extra fields if registering as Vendor */}
        {role === 'VENDOR' && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981', marginBottom: '1rem' }}>
              Vendor Business Details
            </div>
            <div className="form-group">
              <label className="form-label">Business / Brand Name *</label>
              <input
                type="text"
                name="businessName"
                className="form-input"
                placeholder="e.g. Apex Hardware Store"
                value={formData.businessName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Store Description</label>
              <textarea
                name="description"
                className="form-textarea"
                rows={2}
                placeholder="What products do you offer?"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Creating Account...' : role === 'VENDOR' ? 'Register as Merchant' : 'Create Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
      </div>
    </div>
  );
};

export default Register;
