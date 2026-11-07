import { Link, useLocation } from 'react-router-dom';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import TableBarRoundedIcon from '@mui/icons-material/TableBarRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import { ROUTES } from '../../routes/routeConstants';

const navigationGroups = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', to: ROUTES.DASHBOARD, icon: DashboardRoundedIcon },
      { label: 'Floor plan', to: ROUTES.TABLE_TRACKING, icon: TableRestaurantRoundedIcon },
      { label: 'Kitchen Queue', to: ROUTES.KITCHEN_QUEUE, icon: RestaurantRoundedIcon },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Table Areas', to: ROUTES.TABLE_AREAS, icon: TableRestaurantRoundedIcon },
      { label: 'Tables', to: ROUTES.TABLES, icon: TableBarRoundedIcon },
      { label: 'Status Tracking', to: ROUTES.TABLE_TRACKING, icon: TableRestaurantRoundedIcon },
      { label: 'VIP Rooms', to: ROUTES.VIP_ROOMS, icon: MeetingRoomRoundedIcon },
      { label: 'Menu categories', to: ROUTES.MENU_CATEGORIES, icon: CategoryRoundedIcon },
      { label: 'Menu items', to: ROUTES.MENU_ITEMS, icon: RestaurantMenuRoundedIcon },
      { label: 'Role Management', to: ROUTES.ROLE_MANAGEMENT, icon: AdminPanelSettingsRoundedIcon },
      { label: 'Staff Management', to: ROUTES.STAFF_MANAGEMENT, icon: PeopleAltRoundedIcon },
      { label: 'Table Analytics', to: ROUTES.DASHBOARD_TABLES, icon: InsightsRoundedIcon },
      { label: 'VIP Room Analytics', to: ROUTES.DASHBOARD_VIP_ROOMS, icon: MeetingRoomRoundedIcon },
      { label: 'Kitchen Analytics', to: ROUTES.DASHBOARD_KITCHEN, icon: InsightsRoundedIcon },
    ],
  },
];

function SidebarContent({ onNavigate }) {
  const location = useLocation();

  return (
    <Box className="app-sidebar__content">
      <Box className="app-sidebar__brand">
        <span className="app-sidebar__brand-mark">S</span>
        <span className="app-sidebar__brand-copy">seatwise<small>RESTAURANT OS</small></span>
      </Box>

      {navigationGroups.map((group) => (
        <Box component="nav" aria-label={group.label} className="app-sidebar__group" key={group.label}>
          <Typography component="p" className="app-sidebar__label">{group.label}</Typography>
          {group.items.map(({ label, to, icon: Icon, count }) => {
            const [targetPath, targetHash = ''] = to.split('#');
            const isActive = location.pathname === targetPath
              && location.hash === (targetHash ? `#${targetHash}` : '');

            return (
              <Link
                key={label}
                to={to}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`app-sidebar__link${isActive ? ' is-active' : ''}`}
              >
                <Icon className="app-sidebar__link-icon" aria-hidden="true" />
                <span>{label}</span>
                {count && <span className="app-sidebar__count">{count}</span>}
              </Link>
            );
          })}
        </Box>
      ))}

      <Box className="app-sidebar__bottom">
        <Box className="app-sidebar__help">
          <HelpOutlineRoundedIcon aria-hidden="true" />
          <Typography component="strong">Need a hand?</Typography>
          <Typography component="p">Our team is here to help make service seamless.</Typography>
          <Button variant="outlined" size="small">Visit help center</Button>
        </Box>
        <Box className="app-sidebar__account">
          <span className="app-sidebar__account-mark">G</span>
          <span><strong>The Greenhouse</strong><small>Restaurant admin</small></span>
          <span className="app-sidebar__account-menu" aria-hidden="true">••••</span>
        </Box>
      </Box>
    </Box>
  );
}

function Sidebar({ mobileOpen = false, onMobileClose }) {
  return (
    <>
      <Box component="aside" className="app-sidebar app-sidebar--desktop" aria-label="Main navigation">
        <SidebarContent />
      </Box>
      <Drawer
        className="app-sidebar-drawer"
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { className: 'app-sidebar app-sidebar--mobile' } }}
      >
        <SidebarContent onNavigate={onMobileClose} />
      </Drawer>
    </>
  );
}

export default Sidebar;
