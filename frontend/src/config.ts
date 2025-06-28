// Configuration for the application
export const config = {
  // API configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'https://aj35pun5yg.execute-api.us-east-1.amazonaws.com/dev',
    apiKey: process.env.REACT_APP_API_KEY || '',
  },
  
  // App configuration
  app: {
    name: 'Task Manager',
    version: '1.0.0',
  },
  
  // Feature flags
  features: {
    enableHealthCheck: true,
    enableTaskFiltering: true,
    enableTaskSearch: true,
  },
};

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production'; 