import api from './axios';

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get('/orders/my-orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const initiatePayment = async (orderId, gateway) => {
  const response = await api.post('/payments/initiate', { order_id: orderId, gateway });
  return response.data;
};
