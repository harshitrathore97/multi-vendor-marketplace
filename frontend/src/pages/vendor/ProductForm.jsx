import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import api from '../../api/client';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Beauty', 'Automotive', 'Food & Grocery', 'Other'];

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: 'Electronics', images: [] });

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`).then(res => {
      if (res.success) {
        const p = res.data.product;
        setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category, images: p.images || [] });
      }
    }).catch(console.warn).finally(() => setFetchLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
      const res = isEdit ? await api.patch(`/products/${id}`, payload) : await api.post('/products', payload);
      if (res.success) navigate('/vendor/products');
      else throw new Error(res.message);
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally { setLoading(false); }
  };

  if (fetchLoading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <Link to="/vendor/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}><ArrowLeft size={16} /> Products</Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input name="name" className="form-input" value={form.name} onChange={handleChange} required placeholder="Premium Wireless Headphones" />
        </div>
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea name="description" className="form-textarea" rows={4} value={form.description} onChange={handleChange} required placeholder="Describe your product in detail..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Price ($) *</label>
            <input name="price" type="number" step="0.01" min="0" className="form-input" value={form.price} onChange={handleChange} required placeholder="29.99" />
          </div>
          <div className="form-group">
            <label className="form-label">Stock Quantity *</label>
            <input name="stock" type="number" min="0" className="form-input" value={form.stock} onChange={handleChange} required placeholder="100" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select name="category" className="form-select" value={form.category} onChange={handleChange}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Image URLs (one per line)</label>
          <textarea className="form-textarea" rows={3} value={form.images.join('\n')} onChange={(e) => setForm({ ...form, images: e.target.value.split('\n').filter(Boolean) })} placeholder="https://example.com/image.jpg" />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Enter image URLs, one per line. First image is the main product image.</div>
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;
