import api from './axios';

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await api.put('/users/me', userData);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/users/me/password', {
    current_password: currentPassword,
    new_password: newPassword
  });
  return response.data;
};
export const verifyEmail = async (token) => {
  const response = await api.post(`/auth/verify-email?token=${token}`);
  return response.data;
};

export const firebaseLogin = async (idToken, profileData) => {
  const response = await api.post('/auth/firebase-login', { idToken, profileData });
  return response.data;
};

export const finalizeLogin = async (idToken) => {
  const response = await api.post('/auth/finalize-login', { idToken });
  return response.data;
};


