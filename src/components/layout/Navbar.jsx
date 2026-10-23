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
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLanguage } from '../../contexts/LanguageContext';

const navItems = [
  { key: 'nav.home', defaultLabel: 'Home', href: '/' },
  { key: 'nav.restaurants', defaultLabel: 'Explore Restaurants', href: '/restaurants' },
  { key: 'nav.vip', defaultLabel: 'Book VIP Suite', href: '/reservations/vip' },
  { key: 'nav.how_it_works', defaultLabel: 'How It Works', href: '/#how-it-works' },
  { key: 'nav.about', defaultLabel: 'About Us', href: '/#about' },
];

function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { t } = useLanguage();

  const allNavItems = useMemo(() => {
    if (isAuthenticated) {
      if (navItems.some((item) => item.href === '/reservations/me')) {
        return navItems;
      }
      return [
        ...navItems,
        { key: 'nav.my_reservations', defaultLabel: 'My Reservations', href: '/reservations/me' },
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
        <Toolbar
          sx={{
            minHeight: { xs: 72, md: 84 },
            px: { xs: 0, sm: 0 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 1, md: 1.5, lg: 2 },
          }}
        >
          {/* Brand Logo - Fixed size, never wrap, never shrink */}
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
              flexShrink: 0,
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
                flexShrink: 0,
              }}
            >
              <RestaurantIcon fontSize="small" />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.04em',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              Intelligent Restaurant
            </Typography>
          </Box>

          {/* Center Nav Items - Auto-balanced, compact responsive spacing */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: { md: 0.5, lg: 1.25, xl: 2 },
              flexShrink: 1,
            }}
          >
            {allNavItems.map((item) => (
              <Button
                key={item.key}
                color="inherit"
                onClick={() => handleNav(item.href)}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  px: { md: 0.75, lg: 1.25, xl: 1.5 },
                  whiteSpace: 'nowrap',
                  fontSize: { md: '0.8125rem', lg: '0.875rem' },
                  '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
                }}
              >
                {t(item.key, item.defaultLabel)}
              </Button>
            ))}
          </Box>

          {/* Action Buttons & Language Switcher - Fixed size, never shrink */}
          <Stack
            direction="row"
            spacing={{ md: 0.75, lg: 1.25 }}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <LanguageSwitcher sx={{ mr: { md: 0.25, lg: 0.5 } }} />
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              sx={{
                whiteSpace: 'nowrap',
                px: { md: 1, lg: 1.5 },
                fontSize: { md: '0.8125rem', lg: '0.875rem' },
              }}
            >
              {t('nav.signin', 'Sign In')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/register')}
              sx={{
                whiteSpace: 'nowrap',
                px: { md: 1, lg: 1.5 },
                fontSize: { md: '0.8125rem', lg: '0.875rem' },
              }}
            >
              {t('nav.register', 'Register')}
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/reservations/new')}
              sx={{
                whiteSpace: 'nowrap',
                px: { md: 1.5, lg: 2 },
                fontSize: { md: '0.8125rem', lg: '0.875rem' },
              }}
            >
              {t('nav.reserve', 'Reserve a Table')}
            </Button>
          </Stack>

          {/* Mobile Menu Icon */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
            <LanguageSwitcher />
            <IconButton
              edge="end"
              aria-label="Open menu"
              onClick={() => setMobileOpen((open) => !open)}
              sx={{ ml: 0.5 }}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280, p: 2 }} role="presentation">
          <List>
            {allNavItems.map((item) => (
              <ListItem key={item.key} disablePadding>
                <ListItemButton onClick={() => handleNav(item.href)}>
                  <ListItemText primary={t(item.key, item.defaultLabel)} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Stack spacing={1.25} sx={{ mt: 2 }}>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              {t('nav.signin', 'Sign In')}
            </Button>
            <Button variant="primary" onClick={() => navigate('/register')}>
              {t('nav.reserve', 'Register')}
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default Navbar;
