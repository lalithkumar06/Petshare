import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardMedia,
  Button,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { pets } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import EmailIcon from '@mui/icons-material/Email';
import PetsIcon from '@mui/icons-material/Pets';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';

const PetDetails = () => {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPetDetails = useCallback(async () => {
    try {
      const { data } = await pets.getOne(id);
      setPet(data);
    } catch (error) {
      toast.error('Failed to fetch pet details');
      navigate('/pets');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPetDetails();
  }, [fetchPetDetails]);

  const handleAdopt = async () => {
    try {
      await pets.update(id, { status: 'pending' });
      toast.success('Adoption request sent!');
      fetchPetDetails();
    } catch (error) {
      toast.error('Failed to send adoption request');
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!pet) {
    return <Typography>Pet not found</Typography>;
  }

  const statusColor = {
    available: 'success',
    pending: 'warning',
    adopted: 'error',
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={pet.imageUrl}
              alt={pet.name}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {pet.name}
              </Typography>
              <Chip
                label={pet.status.charAt(0).toUpperCase() + pet.status.slice(1)}
                color={statusColor[pet.status]}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PetsIcon sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">
                    {pet.breed} • {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarTodayIcon sx={{ mr: 1 }} color="primary" />
                  <Typography variant="h6">{pet.age} years old</Typography>
                </Box>
              </Grid>
            </Grid>
            <Typography variant="body1" sx={{ mt: 3, mb: 3 }}>
              {pet.description}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ mr: 1 }} color="primary" />
                <Typography>Posted by: {pet.owner.username}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 1 }} color="primary" />
                <Typography>Contact: {pet.owner.email}</Typography>
              </Box>
            </Box>
            {user && pet.status === 'available' && (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
                onClick={handleAdopt}
              >
                Request to Adopt
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PetDetails;