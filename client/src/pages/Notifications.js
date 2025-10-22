import React, { useEffect, useState } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Button, Box } from '@mui/material';
import api, { adoptions } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notes, setNotes] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotes(data);
    } catch (err) {
      console.error('Notifications fetch error:', err);
      const serverMessage = err.response && err.response.data && err.response.data.message;
      if (err.response && err.response.status === 401) {
        toast.info(serverMessage || 'Please login to view notifications');
      } else if (serverMessage) {
        toast.error(serverMessage);
      } else {
        toast.error('Failed to fetch notifications');
      }
    }
  };

  const handleAction = async (adoptionId, action, noteId) => {
    try {
      await adoptions.updateStatus(adoptionId, action);
      // mark notification as read
      await api.patch(`/notifications/${noteId}/read`);
      toast.success(`Request ${action}`);
      fetchNotes();
      // optionally refresh other lists in the app
    } catch (err) {
      toast.error('Failed to perform action');
    }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ my: 2 }}>Notifications</Typography>
      <List>
        {notes.map(n => {
          // If there's an adoption object, populate details
          const adoption = n.adoption;
          const isOwner = adoption && adoption.pet && adoption.pet.owner && adoption.pet.owner._id === (user && user.id);
          const pending = adoption && adoption.status === 'pending';
          return (
            <ListItem key={n._id} divider>
              <ListItemText
                primary={n.message}
                secondary={
                  <>
                    <div>{new Date(n.createdAt).toLocaleString()}</div>
                    {adoption && adoption.pet && <div>Pet: {adoption.pet.name}</div>}
                    {adoption && adoption.adopter && <div>Requester: {adoption.adopter.username}</div>}
                    {adoption && adoption.status && <div>Status: {adoption.status}</div>}
                  </>
                }
              />

              {/* Show accept/reject only to the pet owner while pending */}
              {adoption && isOwner && pending && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button color="success" variant="contained" onClick={() => handleAction(adoption._id, 'approved', n._id)}>Accept</Button>
                  <Button color="error" variant="outlined" onClick={() => handleAction(adoption._id, 'rejected', n._id)}>Reject</Button>
                </Box>
              )}
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
};

export default Notifications;
