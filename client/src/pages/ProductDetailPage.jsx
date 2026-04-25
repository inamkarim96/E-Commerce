import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, ShieldCheck, Truck, ArrowLeft, Plus, Minus } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productDetailStyles } from '../shared/style';
import * as productsApi from '../api/products';
import { useCart } from '../context/CartContext';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { addToCart, cart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getProductBySlug(slug);
        if (response.success) {
          const prodData = response.data.product; // Corrected data path
          setProduct(prodData);
          if (prodData.weight_variants && prodData.weight_variants.length > 0) {
            setSelectedWeight(prodData.weight_variants[0]);
          }

          // Fetch related products
          const relatedRes = await productsApi.getProducts({
            category: prodData.category?.slug,
            limit: 5
          });
          if (relatedRes.success) {
            setRelatedProducts(relatedRes.data.products?.filter(p => p.id !== prodData.id).slice(0, 4) || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  // Reset quantity when weight variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedWeight]);

  if (loading) return <div className="container" style={{ padding: '10rem 0', textAlign: 'center' }}>Loading product...</div>;
  if (error || !product) return <div className="container" style={{ padding: '10rem 0', textAlign: 'center' }}>{error || 'Product not found'}</div>;

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/shop"><ArrowLeft size={16} /> Back to Shop</Link>
          <span>/</span>
          <span>{product.category?.name}</span>
          <span>/</span>
          <span className="active">{product.name}</span>
        </div>

        <div className="product-main">
          <div className="product-gallery">
            <div className="main-image">
              <img 
                src={product.images?.find(img => img && img.trim() !== '') || 'https://images.unsplash.com/photo-1596003906949-67221c37965c?auto=format&fit=crop&q=80&w=800'} 
                alt={product.name} 
              />
            </div>
            <div className="thumbnails">
              {product.images?.filter(img => img && img.trim() !== '').map((img, index) => (
                <div key={index} className={`thumb ${index === 0 ? 'active' : ''}`}>
                  <img src={img} alt={`Thumbnail ${index}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="product-info-panel">
            <span className="cat-tag">{product.category?.name}</span>
            <h1 className="product-name">{product.name}</h1>

            <div className="rating-row">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill={i < Math.floor(product.avg_rating || 5) ? "var(--accent)" : "none"} color="var(--accent)" />
                ))}
              </div>
              <span className="review-count">{product.avg_rating || 5} ({product.review_count || 0} Customer Reviews)</span>
            </div>

            <div className="price-row">
              <span className="current-price">
                PKR {Number(selectedWeight?.price || product.base_price || 0).toLocaleString()}
              </span>
              {selectedWeight && (
                <span className="unit-price">({selectedWeight.label})</span>
              )}
            </div>

            <p className="short-desc">{product.description}</p>

            <div className="stock-status-container">
              {((selectedWeight ? selectedWeight.stock : product.stock) > 0) ? (
                <span className="stock-pill in-stock">
                  <ShieldCheck size={14} /> In Stock
                </span>
              ) : (
                <span className="stock-pill out-of-stock">
                   Out of Stock
                </span>
              )}
              <span className="stock-count">
                {(selectedWeight ? selectedWeight.stock : product.stock)} items available
              </span>
            </div>

            {product.weight_variants && product.weight_variants.length > 0 ? (
              <div className="variant-section">
                <h3>Select Quantity / Weight:</h3>
                <div className="weight-options">
                  {product.weight_variants.map(variant => {
                    const cartItem = cart.find(item => item.id === product.id && (item.selectedWeight?.label === variant.label || item.selectedWeight === variant.label));
                    const inCartCount = cartItem?.quantity || 0;

                    return (
                      <button
                        key={variant.id}
                        className={`weight-btn ${selectedWeight?.id === variant.id ? 'active' : ''} ${variant.stock <= 0 ? 'disabled' : ''}`}
                        onClick={() => variant.stock > 0 && setSelectedWeight(variant)}
                        disabled={variant.stock <= 0}
                      >
                        {inCartCount > 0 && (
                          <span className="in-cart-badge">{inCartCount} in cart</span>
                        )}
                        <span className="weight-label">{variant.label}</span>
                        <span className="weight-price">PKR {Number(variant.price).toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="variant-section no-variants">
                <p>Standard weight applies. Check stock below.</p>
              </div>
            )}

            <div className="purchase-section">
              <div className="quantity-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={(selectedWeight ? selectedWeight.stock : product.stock) <= 0}>
                  <Minus size={18} />
                </button>
                <span>{quantity}</span>
                <button 
                  onClick={() => setQuantity(prev => {
                    const max = selectedWeight ? selectedWeight.stock : product.stock;
                    return prev < max ? prev + 1 : prev;
                  })}
                  disabled={(selectedWeight ? selectedWeight.stock : product.stock) <= 0}
                >
                  <Plus size={18} />
                </button>
              </div>
              <button
                className={`add-to-cart-btn ${(selectedWeight ? selectedWeight.stock : product.stock) <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => addToCart(product, quantity, selectedWeight)}
                disabled={(selectedWeight ? selectedWeight.stock : product.stock) <= 0}
              >
                <ShoppingCart size={20} /> 
                {(selectedWeight ? selectedWeight.stock : product.stock) > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            <div className="benefit-grid">
              <div className="benefit-item">
                <Truck size={20} />
                <span>Free Delivery on orders over $50</span>
              </div>
              <div className="benefit-item">
                <ShieldCheck size={20} />
                <span>Quality Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tabs-section">
          <div className="tab-headers">
            <button className={activeTab === 'description' ? 'active' : ''} onClick={() => setActiveTab('description')}>Description</button>
            <button className={activeTab === 'nutrition' ? 'active' : ''} onClick={() => setActiveTab('nutrition')}>Nutrition Info</button>
          </div>
          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="tab-pane fade-in">
                <p>{product.description}</p>
              </div>
            )}
            {activeTab === 'nutrition' && product.nutrition && (
              <div className="tab-pane fade-in">
                <table className="nutrition-table">
                  <tbody>
                    {Object.entries(product.nutrition).map(([key, val]) => (
                      <tr key={key}>
                        <td className="nutrient">{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                        <td className="value">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="related-section">
            <h2>You May Also Like</h2>
            <div className="related-grid">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        <style>{productDetailStyles}</style>
      </div>
    </div>
  );
};

export default ProductDetailPage;
