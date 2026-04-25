import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, ChevronDown, Grid, List as ListIcon } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { shopStyles } from '../shared/style';
import useProducts from '../hooks/useProducts';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewType, setViewType] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCategory = searchParams.get('category') || 'All';

  const {
    products,
    categories: rawCategories,
    loading,
    error,
    setFilters
  } = useProducts({
    initialFilters: {
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      search: searchQuery || undefined
    }
  });

  const categories = [{ name: 'All', slug: 'All' }, ...rawCategories];

  useEffect(() => {
    setFilters({
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      search: searchQuery || undefined
    });
  }, [selectedCategory, searchQuery, setFilters]);

  const handleCategoryChange = (slug) => {
    if (slug === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const weightRanges = ['All', '100g - 250g', '250g - 500g', '500g+'];

  return (
    <div className="shop-page">
      <header className="shop-header">
        <div className="container">
          <h1>Explore Our Nature's Bounty</h1>
          <p>Find the finest natural dried products for your healthy lifestyle.</p>
        </div>
      </header>

      <div className="container">
        <div className="shop-layout">
          <aside className="shop-sidebar">
            <div className="filter-group">
              <h3 className="filter-title">Search</h3>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={18} className="search-icon" />
              </div>
            </div>

            <div className="filter-group">
              <h3 className="filter-title">Categories</h3>
              <ul className="filter-list">
                {categories.map(cat => (
                  <li key={cat.slug}>
                    <label className="filter-item">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() => handleCategoryChange(cat.slug)}
                      />
                      <span>{cat.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-group">
              <h3 className="filter-title">Weight Variant</h3>
              <ul className="filter-list">
                {weightRanges.map(range => (
                  <li key={range}>
                    <label className="filter-item">
                      <input type="checkbox" />
                      <span>{range}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <main className="shop-content">
            <div className="shop-toolbar">
              <div className="results-info">
                {loading ? 'Loading products...' : `Showing ${products.length} results`}
              </div>
              <div className="toolbar-actions">
                <div className="sort-dropdown">
                  <span>Sort by: <strong>Default Sorting</strong></span>
                  <ChevronDown size={16} />
                </div>
                <div className="view-toggle">
                  <button
                    className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewType('grid')}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
                    onClick={() => setViewType('list')}
                  >
                    <ListIcon size={20} />
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="error-msg">{error}</div>
            ) : (
              <div className={`products-grid ${viewType}`}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <div className="pagination">
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn next">Next</button>
            </div>
          </main>
        </div>
      </div>

      <style>{shopStyles}</style>
    </div>
  );
};

export default ShopPage;
