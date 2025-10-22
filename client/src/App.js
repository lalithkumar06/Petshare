
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import AddIcon from '@mui/icons-material/Add';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import React, { useState } from 'react';
import { useEffect } from 'react';
import api from './utils/api';
import Badge from '@mui/material/Badge';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PostPetModal from './components/PostPetModal';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PetList from './pages/PetList';
import PetDetails from './pages/PetDetails';
import MyPets from './pages/MyPets';
import Notifications from './pages/Notifications';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff7043', // Vibrant orange
      contrastText: '#fff',
    },
    secondary: {
      main: '#29b6f6', // Bright blue
      contrastText: '#fff',
    },
    background: {
      default: '#fff8f0',
      paper: '#fff',
    },
  },
  typography: {
    fontFamily: 'Quicksand, Roboto, Arial',
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function MainAppBar({ onOpenPostPet, unread, setUnread }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { logout(); handleClose(); navigate('/'); };
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', fontWeight: 700 }}
        >
          🐾 Pet Share
        </Typography>
        <Button color="inherit" component={Link} to="/pets">Browse Pets</Button>
        {user ? (
          <>
            <IconButton color="inherit" onClick={onOpenPostPet} sx={{ mr: 1 }}>
              <AddIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => { navigate('/notifications'); setUnread(0); }} sx={{ mr: 1 }}>
              <Badge badgeContent={unread} color="error">
                🔔
              </Badge>
            </IconButton>
            <IconButton color="inherit" onClick={handleMenu}>
              <Avatar sx={{ width: 32, height: 32 }}>{user.username[0].toUpperCase()}</Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem disabled>{user.username}</MenuItem>
              <MenuItem onClick={() => { handleClose(); navigate('/mypets'); }}>My Pets</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/auth/login">Login</Button>
            <Button color="inherit" component={Link} to="/auth/register">Register</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

function Footer() {
  return (
    <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: 2, mt: 8, textAlign: 'center' }}>
      <Typography variant="body2">&copy; {new Date().getFullYear()} Pet Share. All rights reserved.</Typography>
    </Box>
  );
}

function App() {
  const [postPetOpen, setPostPetOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        const notes = res.data || [];
        const count = notes.filter(n => !n.read).length;
        setUnread(count);
      } catch (e) {
        // ignore silently
      }
    };
    // Only fetch if a user is logged in (avoid 401 errors when anonymous)
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      // only fetch unread if both user and token are present
      if (storedUser && token) fetchUnread();
    } catch (e) {}
  }, []);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <MainAppBar onOpenPostPet={() => setPostPetOpen(true)} unread={unread} setUnread={setUnread} />
          <PostPetModal open={postPetOpen} onClose={() => setPostPetOpen(false)} />
          <Box sx={{ minHeight: '80vh' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
                <Route path="/pets" element={<PetList />} />
                <Route path="/pets/:id" element={<PetDetails />} />
                <Route path="/mypets" element={<MyPets />} />
        <Route path="/notifications" element={<Notifications />} />
            </Routes>
          </Box>
          <Footer />
        </BrowserRouter>
        <ToastContainer position="bottom-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;