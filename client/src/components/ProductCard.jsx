import React from 'react';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productCardStyles } from '../shared/style';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultWeight = product.weight_variants?.[0]?.label || '250g';
    addToCart(product, 1, defaultWeight);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <motion.div
      className="product-card"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="product-image-container">
        <Link to={`/product/${product.slug}`} className="image-link">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1596003906949-67221c37965c?auto=format&fit=crop&q=80&w=600'}
            alt={product.name}
            className="product-image"
          />
        </Link>
        <div className="product-badges">
          {product.is_featured && <span className="badge badge-new">Featured</span>}
          {product.stock < 10 && <span className="badge badge-discount">Low Stock</span>}
        </div>
        <div className="product-actions">
          <Link to={`/product/${product.slug}`} className="action-btn" title="Quick View">
            <Eye size={20} />
          </Link>
          <button
            className="action-btn primary"
            title="Add to Cart"
            onClick={handleAddToCart}
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
          <button className="add-cart-btn-small" onClick={handleAddToCart}>
            <ShoppingCart size={16} /> Add
          </button>
        </div>
      </div>

      <style>{productCardStyles}</style>
    </motion.div>
  );
};

export default ProductCard;
