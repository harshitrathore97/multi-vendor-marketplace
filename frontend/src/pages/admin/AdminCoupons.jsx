import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../api/client';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    api.get('/admin/coupons').then(res => { if (res.success) setCoupons(res.data.coupons); }).catch(console.warn).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setFormError(null);
    try {
      const res = await api.post('/admin/coupons', { ...form, discountValue: parseFloat(form.discountValue), minOrderAmount: parseFloat(form.minOrderAmount) || 0, maxUses: parseInt(form.maxUses) || 0 });
      if (res.success) { setCoupons([res.data.coupon, ...coupons]); setShowForm(false); setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' }); }
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try { await api.delete(`/admin/coupons/${id}`); setCoupons(coupons.filter(c => c._id !== id)); }
    catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Coupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm"><Plus size={16} /> New Coupon</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group"><label className="form-label">Code *</label><input className="form-input" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required placeholder="SUMMER20" /></div>
          <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}><option value="PERCENTAGE">Percentage (%)</option><option value="FIXED">Fixed ($)</option></select></div>
          <div className="form-group"><label className="form-label">Value *</label><input type="number" className="form-input" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} required placeholder={form.discountType === 'PERCENTAGE' ? '20' : '10.00'} /></div>
          <div className="form-group"><label className="form-label">Min Order ($)</label><input type="number" className="form-input" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} placeholder="0" /></div>
          <div className="form-group"><label className="form-label">Max Uses (0 = unlimited)</label><input type="number" className="form-input" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} placeholder="100" /></div>
          <div className="form-group"><label className="form-label">Expires At</label><input type="date" className="form-input" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} /></div>
          {formError && <div style={{ gridColumn: '1/-1', color: 'var(--danger)', fontSize: '0.85rem' }}>{formError}</div>}
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Creating...' : 'Create Coupon'}</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading...</div> : (
        <div className="table-wrap">
          <table className="custom-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Expires</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{c.code}</td>
                  <td><span className="badge badge-info">{c.discountType}</span></td>
                  <td style={{ fontWeight: 700 }}>{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                  <td>${c.minOrderAmount}</td>
                  <td>{c.usedCount}/{c.maxUses === 0 ? '∞' : c.maxUses}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td><span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td><button onClick={() => handleDelete(c._id)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
