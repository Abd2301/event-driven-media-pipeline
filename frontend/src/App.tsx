import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Alert } from '@mui/material';
import TaskList from './components/TaskList';
import { useHealthCheck } from './hooks/useTasks';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Health check component
const HealthStatus: React.FC = () => {
  const { data: health, isLoading, error } = useHealthCheck();

  if (isLoading) return null;
  
  if (error) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        API connection issue. Some features may not work properly.
      </Alert>
    );
  }

  if (health) {
    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        API Status: {health.status} | Environment: {health.environment}
      </Alert>
    );
  }

  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <HealthStatus />
          <TaskList />
        </Container>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
