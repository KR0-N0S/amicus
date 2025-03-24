import React from 'react';
import { Container, Box, Paper, Typography } from '@mui/material';
import RegisterForm from '../components/forms/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <Container maxWidth="md">
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
            Rejestracja w systemie
          </Typography>
          <RegisterForm />
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
