import api from './axios';

export const getProducts = async (params) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getAdminProducts = async (params) => {
  const response = await api.get('/admin/products', { params });
  return response.data;
};

export const getFeaturedProducts = async () => {
  const response = await api.get('/products/featured');
  return response.data;
};

export const searchProducts = async (query) => {
  const response = await api.get(`/products/search?q=${query}`);
  return response.data;
};

export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getProductBySlug = async (slug) => {
  const response = await api.get(`/products/slug/${slug}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post('/products', data);
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

export const updateStock = async (id, stock) => {
  const response = await api.patch(`/products/${id}/stock`, { stock });
  return response.data;
};

export const updateVariantStock = async (productId, variantId, stock) => {
  const response = await api.patch(`/products/${productId}/variants/${variantId}/stock`, { stock });
  return response.data;
};

export const toggleFeatured = async (id, is_featured) => {
  const response = await api.patch(`/products/${id}/featured`, { is_featured });
  return response.data;
};

export const toggleActive = async (id, is_active) => {
  const response = await api.patch(`/products/${id}/active`, { is_active });
  return response.data;
};

export const uploadProductImage = async (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post(`/products/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteProductImage = async (id, imageUrl) => {
  const response = await api.delete(`/products/${id}/images`, { data: { image_url: imageUrl } });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const initializeCategories = async () => {
  const response = await api.post('/categories/initialize');
  return response.data;
};
