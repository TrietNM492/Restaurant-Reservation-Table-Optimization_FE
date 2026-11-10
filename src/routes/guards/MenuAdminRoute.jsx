import { Navigate, useLocation } from 'react-router-dom';
import { Alert, Box, Button, Stack } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { ROUTES } from '../routeConstants';

function hasAdminPermission(token) {
  try {
    const segment = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const payload = JSON.parse(atob(segment.padEnd(Math.ceil(segment.length / 4) * 4, '=')));
    return Array.isArray(payload.permissions) && payload.permissions.includes('ROLE_ADMIN');
  } catch {
    return false;
  }
}

export default function MenuAdminRoute({ children }) {
  const location = useLocation();
  const { accessToken, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || !accessToken) return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  // UI guard only. The backend remains responsible for authorization.
  if (!hasAdminPermission(accessToken)) return <Box sx={{ p: 4 }}><Stack spacing={2}><Alert severity="error">Administrator access is required to manage the menu.</Alert><Button component={Link} to={ROUTES.MENUS}>Browse the menu</Button></Stack></Box>;
  return children;
}
