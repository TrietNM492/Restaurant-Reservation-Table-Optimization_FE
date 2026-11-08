import { Link as RouterLink, useLocation } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { ROUTES } from '../../routes/routeConstants';

const routeLabels = {
  admin: 'Workspace',
  dashboard: 'Overview',
  reservations: 'Reservations',
  guests: 'Guests',
  analytics: 'Analytics',
  settings: 'Settings',
  'menu-categories': 'Menu categories',
  'menu-items': 'Menu items',
  roles: 'Role Management',
  staff: 'Staff Management',
};

function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    label: routeLabels[segment] || segment.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    path: `/${segments.slice(0, index + 1).join('/')}`,
  }));

  return (
    <Breadcrumbs className="app-breadcrumb" aria-label="Breadcrumb" separator="/">
      <Link component={RouterLink} to={ROUTES.DASHBOARD} underline="hover">Workspace</Link>
      {crumbs.filter((crumb) => crumb.label !== 'Workspace').map((crumb, index, visibleCrumbs) => (
        index === visibleCrumbs.length - 1
          ? <Typography key={crumb.path} aria-current="page">{crumb.label}</Typography>
          : <Link key={crumb.path} component={RouterLink} to={crumb.path} underline="hover">{crumb.label}</Link>
      ))}
    </Breadcrumbs>
  );
}

export default Breadcrumb;
