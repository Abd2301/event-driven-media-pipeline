import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 60,
  fullScreen = false 
}) => {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <Box position="relative">
        <CircularProgress
          size={size}
          sx={{
            color: 'primary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            opacity: 0.2,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          fontWeight: 500,
          animation: 'fadeIn 0.6s ease-out',
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        width: '100%',
      }}
    >
      {content}
    </Box>
  );
};

export default LoadingSpinner; 