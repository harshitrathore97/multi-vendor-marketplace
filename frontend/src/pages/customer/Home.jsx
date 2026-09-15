import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, ShoppingCart, Zap, TrendingUp, Award } from 'lucide-react';
import api from '../../api/client';
import RatingStars from '../../components/RatingStars';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products?sort=rating&limit=8'),
          api.get('/products/categories'),
        ]);
        if (prodRes.success) setFeatured(prodRes.data.products);
        if (catRes.success) setCategories(catRes.data.categories);
      } catch (err) {
        console.warn(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) return;
    setAddingId(productId);
    await addToCart(productId, 1);
    setTimeout(() => setAddingId(null), 600);
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '4rem 0 3rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem', position: 'relative' }}>
          Discover <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #6366f1, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Premium Products</span>
          <br />from Verified Vendors
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          A curated multi-vendor marketplace with real-time order tracking, secure payments, and instant inventory management.
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: '520px', margin: '0 auto', position: 'relative' }}>
          <Search size={20} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '3rem', height: '52px', fontSize: '1rem', borderRadius: 'var(--radius-xl)' }}
            placeholder="Search products, categories, vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                window.location.href = `/products?search=${encodeURIComponent(search.trim())}`;
              }
            }}
          />
        </div>

        {/* Trust Metrics */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
          {[
            { icon: <Zap size={20} color="#6366f1" />, label: 'Real-Time Tracking', sub: 'WebSocket powered' },
            { icon: <TrendingUp size={20} color="#10b981" />, label: 'Atomic Inventory', sub: 'Race-condition safe' },
            { icon: <Award size={20} color="#f59e0b" />, label: 'Verified Reviews', sub: 'Delivered buyers only' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.65rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>{m.icon}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Browse Categories</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>All Products</Link>
            {categories.map((cat) => (
              <Link key={cat} to={`/products?category=${encodeURIComponent(cat)}`} className="btn btn-secondary btn-sm">
                {cat}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Featured Products</h2>
          <Link to="/products" className="btn btn-secondary btn-sm">View All →</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading products...</div>
        ) : featured.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No products available yet.</div>
        ) : (
          <div className="product-grid">
            {featured.map((product) => (
              <div key={product._id} className="product-card">
                <Link to={`/products/${product._id}`}>
                  <div className="product-image-wrap">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                      alt={product.name}
                      className="product-image"
                    />
                  </div>
                </Link>
                <div className="product-body">
                  <div className="product-category">{product.category}</div>
                  <Link to={`/products/${product._id}`}>
                    <div className="product-title">{product.name}</div>
                  </Link>
                  <RatingStars rating={product.rating} numReviews={product.numReviews} size={14} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <div className="product-price">${product.price.toFixed(2)}</div>
                    {product.stock > 0 ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddToCart(product._id)}
                        disabled={addingId === product._id}
                      >
                        <ShoppingCart size={14} />
                        {addingId === product._id ? '✓' : 'Add'}
                      </button>
                    ) : (
                      <span className="badge badge-danger">Out of Stock</span>
                    )}
                  </div>
                  {product.vendorId && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      by {product.vendorId.businessName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
