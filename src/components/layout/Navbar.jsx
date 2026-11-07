import { useMemo, useState } from 'react';
import {
  Alert,
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
import Avatar from '../ui/Avatar';
import { authApi } from '../../services/authService.js';
import { useAuthStore } from '../../stores/useAuthStore';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Menu', href: '/menus' },
  { label: 'Explore Restaurants', href: '/restaurants' },
  { label: 'Book VIP Suite', href: '/reservations/vip' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'About Us', href: '/#about' },
];

function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const { isAuthenticated, user } = useAuthStore();
  const userName = user?.name || user?.fullname || user?.fullName || user?.username || user?.email || 'Account';
  const avatarSrc = typeof user?.avatar === 'string' ? user.avatar : undefined;

  const allNavItems = useMemo(() => {
    if (isAuthenticated) {
      if (navItems.some((item) => item.href === '/reservations/me')) {
        return navItems;
      }
      return [
        ...navItems,
        ...(user?.role === 'ROLE_ADMIN' ? [{ label: 'Manage menu', href: '/admin/menu-items' }] : []),
        { label: 'My Reservations', href: '/reservations/me' },
      ];
    }
    return navItems;
  }, [isAuthenticated, user?.role]);

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

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError('');

    try {
      await authApi.logout();
    } catch (error) {
      setLogoutError(
        typeof error?.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Unable to sign out from the server. Your local session has been cleared.',
      );
    } finally {
      setLoggingOut(false);
      setMobileOpen(false);
    }
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
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.04em', whiteSpace: 'nowrap' }}>
              Intelligent Restaurant
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', xl: 'flex' }, alignItems: 'center', gap: 0.5, mx: 'auto' }}>
            {allNavItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                color="inherit"
                onClick={() => handleNav(item.href)}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  px: 1,
                  whiteSpace: 'nowrap',
                  '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Stack direction="row" spacing={1.25} sx={{ display: { xs: 'none', xl: 'flex' }, alignItems: 'center', flexShrink: 0 }}>
            {isAuthenticated ? (
              <>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar name={userName} src={avatarSrc} size="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 140 }} noWrap>
                    {userName}
                  </Typography>
                </Stack>
                <Button variant="secondary" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? 'Signing out...' : 'Logout'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="secondary" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            )}
            <Button variant="primary" onClick={() => navigate('/reservations/new')}>
              Reserve a Table
            </Button>
          </Stack>

          <IconButton
            edge="end"
            aria-label="Open menu"
            onClick={() => setMobileOpen((open) => !open)}
            sx={{ display: { xs: 'flex', xl: 'none' }, ml: 1 }}
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
            {isAuthenticated ? (
              <>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 1, py: 0.5 }}>
                  <Avatar name={userName} src={avatarSrc} size="small" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {userName}
                  </Typography>
                </Stack>
                <Button variant="secondary" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? 'Signing out...' : 'Logout'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>
      {logoutError ? (
        <Alert severity="warning" onClose={() => setLogoutError('')}>
          {logoutError}
        </Alert>
      ) : null}
    </AppBar>
  );
}

export default Navbar;
