import React from 'react';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import { getProductBySlug } from '../api/products';
import { getOptimizedImageUrl } from '../utils/cloudinary';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1596003906949-67221c37965c?auto=format&fit=crop&q=60&w=600';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handlePrefetch = () => {
    getProductBySlug(product.slug).catch(() => { });
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = product.weight_variants?.[0];
    const defaultWeight = defaultVariant?.label || '250g';
    addToCart(product, 1, defaultWeight);
    toast.success(`${product.name} added to cart!`);
  };

  // Optimized image URL: WebP/AVIF, auto quality, 600px wide, retina-aware
  const imageUrl = getOptimizedImageUrl(product.images?.[0], { width: 600, height: 600, crop: 'fill' })
    || PLACEHOLDER;

  return (
    <motion.div
      className="product-card"
      onMouseEnter={handlePrefetch}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}

      layout
    >
      <div className="product-image-container">
        <Link to={`/product/${product.slug}`} className="image-link">
          <img
            src={imageUrl}
            alt={product.name}
            className="product-image"
            // Lazy load: browser skips off-screen images until scroll
            loading="lazy"
            // Async decode: doesn't block main thread while decoding image
            decoding="async"
            // Explicit dimensions prevent Cumulative Layout Shift (CLS)
            width={300}
            height={300}
            style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
          />
        </Link>
        <div className="product-badges">
          {product.is_featured && <span className="badge badge-new">Featured</span>}
          {product.stock < 10 && product.stock > 0 && <span className="badge badge-discount">Low Stock</span>}
          {product.stock === 0 && <span className="badge badge-out">Out of Stock</span>}
        </div>
        <div className="product-actions">
          <Link to={`/product/${product.slug}`} className="action-btn" title="Quick View">
            <Eye size={20} />
          </Link>
          <button
            className="action-btn primary"
            title="Add to Cart"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>

      <div className="product-info">
        <Link to={`/shop?category=${product.category?.slug}`} className="product-category">
          {product.category?.name || 'Uncategorized'}
        </Link>
        <Link to={`/product/${product.slug}`}>
          <h3 className="product-title">{product.name}</h3>
        </Link>
        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              fill={i < Math.floor(product.avg_rating || 5) ? "var(--accent)" : "none"}
              color="var(--accent)"
            />
          ))}
          <span className="rating-count">({product.review_count || 0})</span>
        </div>
        <div className="product-footer">
          <div className="product-price">
            <span className="current-price">PKR {Number(product.base_price).toLocaleString()}</span>
          </div>
          <button
            className="add-cart-btn-small"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart size={16} /> {product.stock === 0 ? 'Sold Out' : 'Add'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(ProductCard);
