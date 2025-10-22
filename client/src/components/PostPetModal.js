import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Box, Typography
} from '@mui/material';
import { pets } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const petTypes = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'other', label: 'Other' },
];

export default function PostPetModal({ open, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    type: '',
    breed: '',
    age: '',
    description: '',
    image: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    console.debug('PostPetModal submit, token:', token);
    if (!user || !token) {
      toast.error('You must be logged in to post a pet.');
      return;
    }
    if (!form.name || !form.type || !form.breed || !form.age || !form.description || !form.image) {
      toast.error('Please fill all fields and select an image.');
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      await pets.create(data);
      toast.success('Pet posted successfully!');
      onClose();
    } catch (err) {
      console.error('Post pet error:', err);
      // Prefer server JSON message when available (our server now returns JSON errors)
      const serverMessage = err && err.response && err.response.data && (typeof err.response.data === 'object' ? err.response.data.message : null);
      if (err.response && err.response.status === 401) {
        toast.error(serverMessage || 'Authentication failed — please login again.');
      } else if (err.response && err.response.status === 400) {
        toast.error(serverMessage || 'Bad request — please check your input.');
      } else if (serverMessage) {
        toast.error(serverMessage);
      } else {
        toast.error('Failed to post pet.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Post a New Pet</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" required />
          <TextField select label="Type" name="type" value={form.type} onChange={handleChange} fullWidth margin="normal" required>
            {petTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
          <TextField label="Breed" name="breed" value={form.breed} onChange={handleChange} fullWidth margin="normal" required />
          <TextField label="Age" name="age" value={form.age} onChange={handleChange} type="number" fullWidth margin="normal" required />
          <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth margin="normal" multiline rows={3} required />
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Upload Image
            <input type="file" name="image" accept="image/*" hidden onChange={handleChange} />
          </Button>
          {form.image && <Typography sx={{ mt: 1 }}>{form.image.name}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} color="primary" variant="contained" disabled={loading}>{loading ? 'Posting...' : 'Post Pet'}</Button>
      </DialogActions>
    </Dialog>
  );
}
