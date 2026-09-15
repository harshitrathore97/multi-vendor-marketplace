import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, DollarSign, TrendingUp, Plus } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const VendorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, oRes] = await Promise.all([
          api.get('/vendor/analytics'),
          api.get('/vendor/orders?limit=5'),
        ]);
        if (sRes.success) setStats(sRes.data);
        if (oRes.success) setRecentOrders(oRes.data.orders);
      } catch (err) { console.warn(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const cards = stats ? [
    { label: 'Total Products', value: stats.totalProducts, icon: <Package size={22} />, color: '#6366f1' },
    { label: 'Total Orders', value: stats.totalOrders, icon: <ShoppingBag size={22} />, color: '#10b981' },
    { label: 'Total Revenue', value: `$${stats.totalRevenue?.toFixed(2)}`, icon: <DollarSign size={22} />, color: '#f59e0b' },
    { label: 'Avg Order Value', value: `$${stats.avgOrderValue?.toFixed(2)}`, icon: <TrendingUp size={22} />, color: '#c084fc' },
  ] : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Vendor Dashboard</h1>
        <Link to="/vendor/products/new" className="btn btn-primary btn-sm"><Plus size={16} /> Add Product</Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading dashboard...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {cards.map((c, i) => (
              <div key={i} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.label}</span>
                  <div style={{ background: `${c.color}22`, padding: '0.5rem', borderRadius: '10px' }}>
                    <span style={{ color: c.color }}>{c.icon}</span>
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Monthly Revenue Chart (simple bar) */}
          {stats?.monthlyRevenue?.length > 0 && (
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Monthly Revenue</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '120px' }}>
                {stats.monthlyRevenue.map((m, i) => {
                  const max = Math.max(...stats.monthlyRevenue.map(x => x.revenue));
                  const h = max > 0 ? (m.revenue / max) * 100 : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>${m.revenue?.toFixed(0)}</div>
                      <div style={{ width: '100%', height: `${h}%`, background: 'linear-gradient(180deg, #6366f1, #a5b4fc)', borderRadius: '4px 4px 0 0', minHeight: '4px' }} />
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Recent Orders</h3>
              <Link to="/vendor/orders" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No orders yet</p>
            ) : (
              <div className="table-wrap">
                <table className="custom-table">
                  <thead><tr><th>Order #</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {recentOrders.map((o, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{o.orderNumber}</td>
                        <td>{o.productName}</td>
                        <td>{o.quantity}</td>
                        <td>${o.amount?.toFixed(2)}</td>
                        <td><StatusBadge status={o.vendorStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VendorDashboard;
