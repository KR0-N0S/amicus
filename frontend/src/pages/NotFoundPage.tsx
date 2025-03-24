import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '70vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Strona nie została znaleziona
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Przepraszamy, ale strona której szukasz nie istnieje lub została przeniesiona.
        </Typography>
        <Box mt={3}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Wróć do strony głównej
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
          >
            Wróć do poprzedniej strony
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
