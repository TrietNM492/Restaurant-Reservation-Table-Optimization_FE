import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useNavigate } from 'react-router-dom';

import Button from '../ui/Button';
import { useAuthStore } from '../../stores/useAuthStore';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Explore Restaurants', href: '/restaurants' },
  { label: 'Book VIP Suite', href: '/reservations/vip' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'About Us', href: '/#about' },
];

function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const allNavItems = useMemo(() => {
    if (isAuthenticated) {
      if (navItems.some((item) => item.href === '/reservations/me')) {
        return navItems;
      }
      return [
        ...navItems,
        { label: 'My Reservations', href: '/reservations/me' },
      ];
    }
    return navItems;
  }, [isAuthenticated]);

  const handleNav = (path) => {
    if (path.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const section = document.getElementById(path.replace('/#', ''));
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
      return;
    }

    navigate(path);
    setMobileOpen(false);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ minHeight: { xs: 72, md: 84 }, px: { xs: 0, sm: 0 } }}>
          <Box
            component="button"
            type="button"
            onClick={() => handleNav('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              p: 0,
              mr: 'auto',
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RestaurantIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.04em' }}>
              Intelligent Restaurant
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2.5, mx: 'auto' }}>
            {allNavItems.map((item) => (
              <Button
                key={item.label}
                color="inherit"
                onClick={() => handleNav(item.href)}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  px: 1.5,
                  '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Stack direction="row" spacing={1.25} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="secondary" onClick={() => navigate('/register')}>
              Register
            </Button>
            <Button variant="primary" onClick={() => navigate('/reservations/new')}>
              Reserve a Table
            </Button>
          </Stack>

          <IconButton
            edge="end"
            aria-label="Open menu"
            onClick={() => setMobileOpen((open) => !open)}
            sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
      </Container>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280, p: 2 }} role="presentation">
          <List>
            {allNavItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton onClick={() => handleNav(item.href)}>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Stack spacing={1.25} sx={{ mt: 2 }}>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="primary" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default Navbar;
