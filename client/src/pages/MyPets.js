import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent, Button, Box } from '@mui/material';
import { pets } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const MyPets = () => {
  const { user } = useAuth();
  const [myPets, setMyPets] = useState([]);

  useEffect(() => {
    fetchMyPets();
  }, []);

  const fetchMyPets = async () => {
    try {
      if (!user) return setMyPets([]);
      const { data } = await pets.getMine();
      setMyPets(data);
    } catch (err) {
      toast.error('Failed to fetch your pets');
    }
  };

  const handleDelete = async (id) => {
    try {
      await pets.delete(id);
      toast.success('Pet deleted');
      fetchMyPets();
    } catch (err) {
      toast.error('Failed to delete pet');
    }
  };

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4">My Pets</Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {myPets.map(pet => (
            <Grid item xs={12} sm={6} md={4} key={pet._id}>
              <Card>
                <CardMedia component="img" height="180" image={pet.imageUrl} alt={pet.name} onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'; }} />
                <CardContent>
                  <Typography variant="h6">{pet.name}</Typography>
                  <Typography variant="body2">{pet.breed} • {pet.age} years</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" color="error" onClick={() => handleDelete(pet._id)}>Delete</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default MyPets;
