import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Grid, List as ListIcon, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { Button, Input, Select, Badge, Card } from '../components/ui';

import useProducts from '../hooks/useProducts';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewType, setViewType] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedWeight, setSelectedWeight] = useState(searchParams.get('weight') || 'All');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || ''
  });
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('in_stock') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'default');

  const {
    products,
    categories: rawCategories,
    loading,
    error,
    setFilters
  } = useProducts({
    initialFilters: {
      q: searchQuery || undefined,
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      weight_label: selectedWeight === 'All' ? undefined : selectedWeight,
      min_price: priceRange.min || undefined,
      max_price: priceRange.max || undefined,
      in_stock: inStockOnly || undefined,
      sort: sortBy === 'default' ? undefined : sortBy
    }
  });

  const categories = [{ name: 'All', slug: 'All' }, ...rawCategories];

  // Extract unique weight variant labels from products dynamically
  const weightOptions = React.useMemo(() => {
    const labels = new Set(['All']);
    products.forEach(p => {
      p.weight_variants?.forEach(v => {
        if (v.label) labels.add(v.label);
      });
    });
    return Array.from(labels);
  }, [products]);

  // Update filters when any filter changes
  useEffect(() => {
    const filters = {
      q: searchQuery || undefined,
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      weight_label: selectedWeight === 'All' ? undefined : selectedWeight,
      min_price: priceRange.min || undefined,
      max_price: priceRange.max || undefined,
      in_stock: inStockOnly || undefined,
      sort: sortBy === 'default' ? undefined : sortBy
    };
    setFilters(filters);

    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (selectedWeight !== 'All') params.set('weight', selectedWeight);
    if (priceRange.min) params.set('min_price', priceRange.min);
    if (priceRange.max) params.set('max_price', priceRange.max);
    if (inStockOnly) params.set('in_stock', 'true');
    if (sortBy !== 'default') params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchQuery, selectedCategory, selectedWeight, priceRange, inStockOnly, sortBy, setFilters, setSearchParams]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedWeight('All');
    setPriceRange({ min: '', max: '' });
    setInStockOnly(false);
    setSortBy('default');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'All' || selectedWeight !== 'All' ||
    priceRange.min || priceRange.max || inStockOnly || sortBy !== 'default';

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'popular', label: 'Most Popular' }
  ];

  return (
    <div className="shop-page">
      <header className="shop-header">
        <div className="container">
          <h1>Explore Our Nature's Bounty</h1>
          <p>Find the finest natural dried products for your healthy lifestyle.</p>
        </div>
      </header>

      <div className="container">
        {/* Mobile Filter Toggle */}
        <div className="mobile-filter-toggle">
          <Button variant="admin-outline" className="w-full" onClick={() => setShowMobileFilters(!showMobileFilters)} icon={SlidersHorizontal}>
            Filters {hasActiveFilters && '(Active)'}
          </Button>
        </div>

        <div className="shop-layout">
          <aside className={`shop-sidebar ${showMobileFilters ? 'mobile-open' : ''}`}>
            <div className="filter-group">
              <h3 className="filter-title">Search</h3>
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                containerClassName="mb-0"
              />
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
                        onChange={() => setSelectedCategory(cat.slug)}
                      />
                      <span>{cat.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {weightOptions.length > 1 && (
              <div className="filter-group">
                <h3 className="filter-title">Weight Variant</h3>
                <ul className="filter-list">
                  {weightOptions.map(range => (
                    <li key={range}>
                      <label className="filter-item">
                        <input
                          type="radio"
                          name="weight"
                          checked={selectedWeight === range}
                          onChange={() => setSelectedWeight(range)}
                        />
                        <span>{range === 'All' ? 'All Weights' : range}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="filter-group">
              <h3 className="filter-title">Price Range (PKR)</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  containerClassName="mb-0 flex-1"
                  className="h-10"
                />
                <span className="text-slate-400 text-xs">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  containerClassName="mb-0 flex-1"
                  className="h-10"
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-item checkbox-only">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span>In Stock Only</span>
              </label>
            </div>

            {hasActiveFilters && (
              <Button variant="admin-ghost" className="w-full text-red-600 hover:bg-red-50" onClick={clearAllFilters} icon={X}>
                Clear All Filters
              </Button>
            )}
          </aside>

          <main className="shop-content">
            <div className="shop-toolbar">
              <div className="results-info">
                {loading ? 'Loading products...' : `Showing ${products.length} results`}
              </div>
              <div className="toolbar-actions">
                <Select
                  options={sortOptions}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  containerClassName="mb-0 w-[200px]"
                  className="h-10"
                />
                <div className="view-toggle">
                  <button
                    className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewType('grid')}
                    title="Grid view"
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
                    onClick={() => setViewType('list')}
                    title="List view"
                  >
                    <ListIcon size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {searchQuery && (
                  <Badge variant="info" className="flex items-center gap-1 py-1.5 px-3">
                    Search: {searchQuery}
                    <X size={14} className="cursor-pointer ml-1 hover:text-slate-900" onClick={() => setSearchQuery('')} />
                  </Badge>
                )}
                {selectedCategory !== 'All' && (
                  <Badge variant="info" className="flex items-center gap-1 py-1.5 px-3">
                    Category: {selectedCategory}
                    <X size={14} className="cursor-pointer ml-1 hover:text-slate-900" onClick={() => setSelectedCategory('All')} />
                  </Badge>
                )}
                {selectedWeight !== 'All' && (
                  <Badge variant="info" className="flex items-center gap-1 py-1.5 px-3">
                    Weight: {selectedWeight}
                    <X size={14} className="cursor-pointer ml-1 hover:text-slate-900" onClick={() => setSelectedWeight('All')} />
                  </Badge>
                )}
                {(priceRange.min || priceRange.max) && (
                  <Badge variant="info" className="flex items-center gap-1 py-1.5 px-3">
                    Price: {priceRange.min || '0'} - {priceRange.max || '∞'}
                    <X size={14} className="cursor-pointer ml-1 hover:text-slate-900" onClick={() => setPriceRange({ min: '', max: '' })} />
                  </Badge>
                )}
                {inStockOnly && (
                  <Badge variant="success" className="flex items-center gap-1 py-1.5 px-3">
                    In Stock
                    <X size={14} className="cursor-pointer ml-1 hover:text-slate-900" onClick={() => setInStockOnly(false)} />
                  </Badge>
                )}
              </div>
            )}

            {error ? (
              <div className="error-msg">{error}</div>
            ) : (
              <div className={`products-grid ${viewType}`}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="no-results">
                <p>No products found matching your criteria.</p>
                {hasActiveFilters && (
                  <button className="clear-filters-btn" onClick={clearAllFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>


    </div>
  );
};

export default ShopPage;
