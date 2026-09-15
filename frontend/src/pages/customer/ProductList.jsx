import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import RatingStars from '../../components/RatingStars';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.rating) params.set('rating', filters.rating);
      params.set('sort', filters.sort);
      params.set('page', filters.page);
      params.set('limit', '12');

      const res = await api.get(`/products?${params.toString()}`);
      if (res.success) {
        setProducts(res.data.products);
        setPagination({ page: res.data.page, totalPages: res.data.totalPages, totalProducts: res.data.totalProducts });
      }
    } catch (err) {
      console.warn(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/products/categories').then((res) => {
      if (res.success) setCategories(res.data.categories);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params, { replace: true });
  }, [filters]);

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) return;
    setAddingId(productId);
    await addToCart(productId, 1);
    setTimeout(() => setAddingId(null), 600);
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Product Catalog</h1>

      {/* Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input className="form-input" style={{ paddingLeft: '2.25rem' }} placeholder="Search products..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        </div>
        <select className="form-select" style={{ flex: '0 0 160px' }} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="form-input" style={{ flex: '0 0 100px' }} type="number" placeholder="Min $" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value, page: 1 })} />
        <input className="form-input" style={{ flex: '0 0 100px' }} type="number" placeholder="Max $" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, page: 1 })} />
        <select className="form-select" style={{ flex: '0 0 130px' }} value={filters.rating} onChange={(e) => setFilters({ ...filters, rating: e.target.value, page: 1 })}>
          <option value="">Any Rating</option>
          <option value="4">4★ & up</option>
          <option value="3">3★ & up</option>
          <option value="2">2★ & up</option>
        </select>
        <select className="form-select" style={{ flex: '0 0 160px' }} value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Showing {products.length} of {pagination.totalProducts} products
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <SlidersHorizontal size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>No Products Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <Link to={`/products/${product._id}`}>
                <div className="product-image-wrap">
                  <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'} alt={product.name} className="product-image" />
                  {product.stock === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="badge badge-danger" style={{ fontSize: '0.85rem' }}>Out of Stock</span></div>}
                </div>
              </Link>
              <div className="product-body">
                <div className="product-category">{product.category}</div>
                <Link to={`/products/${product._id}`}><div className="product-title">{product.name}</div></Link>
                <RatingStars rating={product.rating} numReviews={product.numReviews} size={14} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <div className="product-price">${product.price.toFixed(2)}</div>
                  {product.stock > 0 && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleAddToCart(product._id)} disabled={addingId === product._id}>
                      <ShoppingCart size={14} />{addingId === product._id ? '✓' : 'Add'}
                    </button>
                  )}
                </div>
                {product.vendorId && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>by {product.vendorId.businessName}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn btn-secondary btn-sm" disabled={pagination.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}><ChevronLeft size={16} /> Prev</button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Page {pagination.page} of {pagination.totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next <ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
