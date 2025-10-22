import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container>
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Pet Share
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Find your perfect companion
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            component={Link}
            to="/pets"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mr: 2 }}
          >
            Browse Pets
          </Button>
          <Button
            component={Link}
            to="/auth/login"
            variant="outlined"
            color="primary"
            size="large"
          >
            Get Started
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;