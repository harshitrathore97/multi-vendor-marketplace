import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Store, Package, Star } from 'lucide-react';
import api from '../../api/client';
import RatingStars from '../../components/RatingStars';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMsg, setCartMsg] = useState(null);
  const { addToCart } = useCart();
  const { isAuthenticated, isCustomer } = useAuth();

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/reviews?limit=20`),
        ]);
        if (pRes.success) setProduct(pRes.data.product);
        if (rRes.success) setReviews(rRes.data.reviews);
      } catch (err) {
        console.warn(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    setCartMsg(null);
    const result = await addToCart(product._id, quantity);
    if (result?.success) setCartMsg('Added to cart!');
    else setCartMsg(result?.message || 'Failed to add');
    setAddingToCart(false);
    setTimeout(() => setCartMsg(null), 3000);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      setReviewError(null);
      const res = await api.post(`/products/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      if (res.success) {
        setReviews([res.data.review, ...reviews]);
        setProduct((prev) => ({ ...prev, rating: res.data.productRating, numReviews: res.data.numReviews }));
        setShowReviewForm(false);
        setReviewComment('');
      }
    } catch (err) {
      setReviewError(err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading product...</div>;
  if (!product) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Product not found</div>;

  const vendor = product.vendorId;
  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '3rem' }}>
        {/* Image Gallery */}
        <div>
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1rem', background: '#0f172a', aspectRatio: '1', border: '1px solid var(--border-color)' }}>
            <img src={images[selectedImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {images.map((img, i) => (
                <div key={i} onClick={() => setSelectedImage(i)} style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: i === selectedImage ? '2px solid var(--primary)' : '1px solid var(--border-color)', opacity: i === selectedImage ? 1 : 0.6 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="product-category" style={{ marginBottom: '0.5rem' }}>{product.category}</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{product.name}</h1>

          <RatingStars rating={product.rating} numReviews={product.numReviews} size={18} />

          <div style={{ fontSize: '2.25rem', fontWeight: 800, margin: '1.25rem 0', color: '#fff' }}>
            ${product.price.toFixed(2)}
          </div>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{product.description}</p>

          {/* Stock */}
          <div style={{ marginBottom: '1.5rem' }}>
            {product.stock > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={16} color="#10b981" />
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{product.stock} in stock</span>
              </div>
            ) : (
              <span className="badge badge-danger">Out of Stock</span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          {product.stock > 0 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}><Minus size={16} /></button>
                <span style={{ padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '1.1rem', background: 'var(--bg-card)' }}>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}><Plus size={16} /></button>
              </div>
              <button className="btn btn-primary" onClick={handleAddToCart} disabled={addingToCart} style={{ flex: 1 }}>
                <ShoppingCart size={18} />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
          {cartMsg && <div style={{ padding: '0.5rem', fontSize: '0.85rem', color: cartMsg.includes('Added') ? 'var(--success)' : 'var(--danger)' }}>{cartMsg}</div>}

          {/* Vendor Info */}
          {vendor && (
            <div className="glass-card" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--success-bg)', padding: '0.5rem', borderRadius: '10px' }}><Store size={20} color="#10b981" /></div>
                <div>
                  <div style={{ fontWeight: 700 }}>{vendor.businessName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified vendor</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem' }}>Customer Reviews ({product.numReviews})</h2>
          {isAuthenticated && isCustomer && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowReviewForm(!showReviewForm)}>
              <Star size={14} /> Write a Review
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Your Rating</label>
              <RatingStars rating={reviewRating} interactive onSelect={setReviewRating} size={24} />
            </div>
            <div className="form-group">
              <label className="form-label">Your Review</label>
              <textarea className="form-textarea" rows={3} placeholder="Share your experience with this product..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} required />
            </div>
            {reviewError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{reviewError}</div>}
            <button type="submit" className="btn btn-primary btn-sm">Submit Review</button>
          </form>
        )}

        {reviews.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No reviews yet. Be the first to review!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((r) => (
              <div key={r._id} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700 }}>{r.customerName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <RatingStars rating={r.rating} size={14} />
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.6, fontSize: '0.9rem' }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductDetail;
