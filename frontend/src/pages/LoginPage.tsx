import React from 'react';
import { Container, Box, Paper, Typography } from '@mui/material';
import LoginForm from '../components/forms/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Logowanie do aplikacji
          </Typography>
          <LoginForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
