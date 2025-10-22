import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
} from '@mui/material';
import { pets, adoptions } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const PetList = () => {
  const [petList, setPetList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPets = useCallback(async () => {
    try {
      // Exclude the current user's own pets from browse list when logged in
      const url = user ? `/pets?excludeMine=true` : '/pets';
      const { data } = await pets.getAll(url);
      setPetList(data);
    } catch (error) {
      toast.error('Failed to fetch pets');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleAdopt = async (petId) => {
    try {
      await adoptions.create(petId);
      toast.success('Adoption request sent!');
      fetchPets();
    } catch (error) {
      toast.error('Failed to send adoption request');
    }
  };

  const filteredPets = petList.filter((pet) => {
    if (filter === 'all') return true;
    return pet.type === filter;
  });

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Available Pets
        </Typography>
        <TextField
          select
          label="Filter by type"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ mb: 3, minWidth: 200 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="dog">Dogs</MenuItem>
          <MenuItem value="cat">Cats</MenuItem>
          <MenuItem value="bird">Birds</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>
        <Grid container spacing={3}>
          {filteredPets.map((pet) => (
            <Grid item xs={12} sm={6} md={4} key={pet._id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={pet.imageUrl}
                  alt={pet.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {pet.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pet.breed} • {pet.age} years old
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {pet.description.substring(0, 100)}...
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={() => navigate(`/pets/${pet._id}`)}
                    >
                      View Details
                    </Button>
                    {user && pet.status === 'available' && (
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleAdopt(pet._id)}
                      >
                        Adopt
                      </Button>
                    )}
                  </Box>
                  {pet.status !== 'available' && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2, textAlign: 'center' }}
                    >
                      {pet.status === 'pending' ? 'Pending Adoption' : 'Adopted'}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default PetList;