import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vendor/products?page=${page}&limit=15`);
      if (res.success) { setProducts(res.data.products); setTotalPages(res.data.totalPages); }
    } catch (err) { console.warn(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      const res = await api.patch(`/products/${id}`, { isActive: !isActive });
      if (res.success) setProducts(products.map(p => p._id === id ? { ...p, isActive: !isActive } : p));
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem' }}>My Products</h1>
        <Link to="/vendor/products/new" className="btn btn-primary btn-sm"><Plus size={16} /> Add Product</Link>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading...</div> : (
        <>
          <div className="table-wrap">
            <table className="custom-table">
              <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Active</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td><img src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&auto=format&fit=crop'} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} /></td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.category}</td>
                    <td>${p.price?.toFixed(2)}</td>
                    <td><span style={{ color: p.stock < 5 ? 'var(--danger)' : 'inherit' }}>{p.stock}</span></td>
                    <td><StatusBadge status={p.approvalStatus} /></td>
                    <td>
                      <button onClick={() => handleToggleActive(p._id, p.isActive)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: p.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                        {p.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/vendor/products/${p._id}/edit`} className="btn btn-secondary btn-sm"><Edit size={14} /></Link>
                        <button onClick={() => handleDelete(p._id)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <span style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendorProducts;
