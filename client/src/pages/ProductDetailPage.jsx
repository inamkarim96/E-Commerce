import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart, ShieldCheck, Truck, ArrowLeft, Plus, Minus } from 'lucide-react';
import { Button, Badge, Card } from '../components/ui';
import ProductCard from '../components/ProductCard';

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

  if (loading) return <div className="container py-40 text-center">Loading product...</div>;
  if (error || !product) return <div className="container py-40 text-center">{error || 'Product not found'}</div>;

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

            <div className="stock-status-container mb-6">
              {((selectedWeight ? selectedWeight.stock : product.stock) > 0) ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="success" className="px-3 py-1 text-xs">
                      <ShieldCheck size={14} className="mr-1" /> In Stock
                    </Badge>
                    <span className="text-sm text-slate-500 font-medium">
                      {(selectedWeight ? selectedWeight.stock : product.stock)} items available
                    </span>
                  </div>
                  {(selectedWeight ? selectedWeight.stock : product.stock) < 10 && (
                    <p className="text-xs text-red-600 font-bold animate-pulse">
                      ⚠️ Hurry! Only a few left in stock.
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="error" className="px-3 py-1 text-xs uppercase">
                   Out of Stock
                </Badge>
              )}
            </div>

            {product.weight_variants && product.weight_variants.length > 0 ? (
              <div className="variant-section mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Select Weight:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {product.weight_variants.map(variant => {
                    const cartItem = cart.find(item => item.id === product.id && (item.selectedWeight?.label === variant.label || item.selectedWeight === variant.label));
                    const inCartCount = cartItem?.quantity || 0;
                    const isActive = selectedWeight?.id === variant.id;

                    return (
                      <button
                        key={variant.id}
                        className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${isActive ? 'border-primary bg-emerald-50' : 'border-slate-100 hover:border-slate-300'} ${variant.stock <= 0 ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                        onClick={() => variant.stock > 0 && setSelectedWeight(variant)}
                        disabled={variant.stock <= 0}
                      >
                        {inCartCount > 0 && (
                          <Badge variant="info" className="absolute -top-2 -right-2 scale-75 px-2">
                            {inCartCount} in cart
                          </Badge>
                        )}
                        <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-slate-700'}`}>{variant.label}</span>
                        <span className="text-xs text-slate-500">PKR {Number(variant.price).toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="variant-section no-variants mb-8">
                <p className="text-sm text-slate-500 italic">Standard weight applies. Check stock below.</p>
              </div>
            )}

            <div className="purchase-section flex flex-wrap gap-4 items-center mb-8">
              <div className="quantity-control flex items-center bg-slate-100 rounded-xl p-1">
                <Button 
                  variant="admin-ghost" 
                  size="sm" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  disabled={(selectedWeight ? selectedWeight.stock : product.stock) <= 0}
                  className="bg-white shadow-sm h-10 w-10 p-0"
                  icon={Minus}
                />
                <span className="w-12 text-center font-bold text-slate-800">{quantity}</span>
                <Button 
                  variant="admin-ghost" 
                  size="sm" 
                  onClick={() => setQuantity(prev => {
                    const max = selectedWeight ? selectedWeight.stock : product.stock;
                    return prev < max ? prev + 1 : prev;
                  })}
                  disabled={(selectedWeight ? selectedWeight.stock : product.stock) <= 0}
                  className="bg-white shadow-sm h-10 w-10 p-0"
                  icon={Plus}
                />
              </div>
              <Button
                variant="primary"
                size="lg"
                className="flex-1 min-w-[200px] h-12 text-lg"
                icon={ShoppingCart}
                onClick={() => addToCart(product, quantity, selectedWeight)}
                disabled={(selectedWeight ? selectedWeight.stock : product.stock) <= 0}
              >
                {(selectedWeight ? selectedWeight.stock : product.stock) > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>

            <div className="benefit-grid">
              <div className="benefit-item">
                <Truck size={20} />
                <span>Free Delivery on orders over PKR 2,000</span>
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


      </div>
    </div>
  );
};

export default ProductDetailPage;
