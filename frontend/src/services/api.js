import axios from 'axios';

const API_BASE_URL = 'https://magbxqdsad.execute-api.us-east-1.amazonaws.com/Prod';

// Test the API connection
const testApiConnection = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    console.log('API Connection Test:', response.status);
    return true;
  } catch (error) {
    console.error('API Connection Test Failed:', {
      status: error.response?.status,
      message: error.message,
      url: API_BASE_URL
    });
    return false;
  }
};

// Run the test immediately
testApiConnection();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
    });
    return Promise.reject(error);
  }
);

export const authService = {
  async register(email, password) {
    try {
      console.log('Attempting registration with:', { email });
      const response = await api.post('/users/register', { email, password });
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      throw error.response?.data || { message: error.message };
    }
  },

  async login(email, password) {
    try {
      console.log('Attempting login with:', { email });
      const response = await api.post('/users/login', { email, password });
      console.log('Login response:', response.data);
      const { token } = response.data;
      localStorage.setItem('token', token);
      return response.data;
    } catch (error) {
      console.error('Login error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      throw error.response?.data || { message: error.message };
    }
  },

  async getUserData() {
    try {
      console.log('Fetching user data');
      const response = await api.get('/users/me');
      console.log('User data response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get user data error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      throw error.response?.data || { message: error.message };
    }
  },

  logout() {
    localStorage.removeItem('token');
  },
};

export default api; 