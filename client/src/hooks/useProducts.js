import { useState, useEffect, useCallback } from 'react';
import * as productsApi from '../api/products';

/**
 * Custom hook to manage product fetching and categories
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAdmin - Whether to fetch for admin dashboard
 * @param {Object} options.initialFilters - Initial filters for fetching
 */
export const useProducts = ({ isAdmin = false, initialFilters = {} } = {}) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await productsApi.getCategories();
      if (res.success) {
        setCategories(res.data?.categories || []);
        setError(null);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(err?.response?.data?.error?.message || 'Failed to load categories');
    }
  }, []);

  const fetchProducts = useCallback(async (currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const apiCall = isAdmin ? productsApi.getAdminProducts : productsApi.getProducts;
      const res = await apiCall(currentFilters);
      
      if (res.success) {
        setProducts(res.data.products || []);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, filters]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  return {
    products,
    categories,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchProducts,
    refreshCategories: fetchCategories,
    setProducts // Sometimes we need to update state manually after small changes
  };
};

export default useProducts;
