import { useState, useEffect, useCallback, useRef } from 'react';
import * as productsApi from '../api/products';

/**
 * @param {Object} options
 * @param {boolean} options.isAdmin - Whether to fetch for admin dashboard
 * @param {Object} options.initialFilters - Initial filters for fetching
 */
export const useProducts = ({ isAdmin = false, initialFilters = {} } = {}) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

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

  const fetchProducts = useCallback(async (currentFilters) => {
    const resolvedFilters = currentFilters ?? filtersRef.current;
    try {
      setLoading(true);
      setError(null);

      const apiCall = isAdmin ? productsApi.getAdminProducts : productsApi.getProducts;
      const res = await apiCall(resolvedFilters);

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
  }, [isAdmin]);

  useEffect(() => {
    fetchCategories();
    fetchProducts(initialFilters);
  }, []);

  useEffect(() => {
    fetchProducts(filters);
  }, [filters]);

  return {
    products,
    categories,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchProducts,
    refreshCategories: fetchCategories,
    setProducts,
  };
};

export default useProducts;

