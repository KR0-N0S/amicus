import React from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const features = [
    {
      title: 'Zarządzanie zwierzętami',
      description: 'Efektywnie zarządzaj informacjami o zwierzętach gospodarskich, ich historii i statusie.',
      image: 'https://source.unsplash.com/random/300x200/?farm,animals',
    },
    {
      title: 'Rejestr inseminacji',
      description: 'Kompletny system rejestrowania i śledzenia inseminacji, z dostępem do historycznych danych.',
      image: 'https://source.unsplash.com/random/300x200/?veterinary',
    },
    {
      title: 'Baza byków',
      description: 'Pełna baza danych byków z informacjami o rasie, dostępności i szczegółach genomicznych.',
      image: 'https://source.unsplash.com/random/300x200/?bull',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          borderRadius: 2,
          mb: 6
        }}
      >
        <Container maxWidth="md">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="inherit"
            gutterBottom
          >
            AmicusApp
          </Typography>
          <Typography variant="h5" align="center" color="inherit" paragraph>
            Kompleksowe rozwiązanie do zarządzania inseminacją i hodowlą zwierząt gospodarskich
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            {authenticated ? (
              <Button 
                variant="contained" 
                color="secondary" 
                size="large"
                onClick={() => navigate('/dashboard')}
              >
                Przejdź do dashboardu
              </Button>
            ) : (
              <>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{ mx: 1 }}
                >
                  Zaloguj się
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{ mx: 1 }}
                >
                  Zarejestruj się
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: 8 }} maxWidth="md">
        <Typography component="h2" variant="h3" align="center" color="textPrimary" gutterBottom>
          Nasze funkcje
        </Typography>
        <Grid container spacing={4} sx={{ mt: 3 }}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Card
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={feature.image}
                  alt={feature.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3">
                    {feature.title}
                  </Typography>
                  <Typography>
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" color="primary">
                    Dowiedz się więcej
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box sx={{ bgcolor: 'background.paper', p: 6 }}>
        <Container maxWidth="sm">
          <Typography component="h2" variant="h4" align="center" color="textPrimary" gutterBottom>
            Dołącz do nas już dziś
          </Typography>
          <Typography variant="subtitle1" align="center" color="textSecondary" paragraph>
            Zarejestruj się i odkryj pełen potencjał naszej aplikacji do zarządzania hodowlą.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            {!authenticated && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/register')}
              >
                Rozpocznij za darmo
              </Button>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
