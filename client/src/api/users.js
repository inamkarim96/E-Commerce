import api from './axios';

export const getMyAddresses = async () => {
  const response = await api.get('/users/me/addresses');
  return response.data;
};
