import React, { useState, useEffect } from 'react';
import { Users, Store, Package, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import api from '../../api/client';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(res => { if (res.success) setStats(res.data); }).catch(console.warn).finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={22} />, color: '#6366f1' },
    { label: 'Total Vendors', value: stats.totalVendors, icon: <Store size={22} />, color: '#10b981' },
    { label: 'Total Products', value: stats.totalProducts, icon: <Package size={22} />, color: '#f59e0b' },
    { label: 'Total Orders', value: stats.totalOrders, icon: <ShoppingBag size={22} />, color: '#c084fc' },
    { label: 'Total Revenue', value: `$${(stats.totalRevenue || 0).toFixed(2)}`, icon: <DollarSign size={22} />, color: '#ec4899' },
    { label: 'Active Products', value: stats.activeProducts, icon: <TrendingUp size={22} />, color: '#06b6d4' },
  ] : [];

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Admin Overview</h1>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading stats...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {cards.map((c, i) => (
              <div key={i} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.label}</span>
                  <div style={{ background: `${c.color}22`, padding: '0.5rem', borderRadius: '10px' }}>
                    <span style={{ color: c.color }}>{c.icon}</span>
                  </div>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{c.value}</div>
              </div>
            ))}
          </div>

          {stats?.recentOrders?.length > 0 && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem' }}>Recent Orders (Platform-wide)</h3>
              <div className="table-wrap">
                <table className="custom-table">
                  <thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {stats.recentOrders.map(o => (
                      <tr key={o._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{o.orderNumber}</td>
                        <td>{o.customer?.name || 'N/A'}</td>
                        <td>${o.totalAmount?.toFixed(2)}</td>
                        <td><span className={`badge badge-${o.orderStatus === 'DELIVERED' ? 'success' : o.orderStatus === 'CANCELLED' ? 'danger' : 'warning'}`}>{o.orderStatus}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
