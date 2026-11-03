import { Link, useLocation } from 'react-router-dom';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TableBarRoundedIcon from '@mui/icons-material/TableBarRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
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
      { label: 'Reservations', to: `${ROUTES.DASHBOARD}#reservations`, icon: CalendarMonthRoundedIcon, count: '12' },
      { label: 'Floor plan', to: ROUTES.TABLE_TRACKING, icon: TableRestaurantRoundedIcon },
      { label: 'Waitlist', to: `${ROUTES.DASHBOARD}#waitlist`, icon: HourglassBottomRoundedIcon },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Table Areas', to: ROUTES.TABLE_AREAS, icon: TableRestaurantRoundedIcon },
      { label: 'Tables', to: ROUTES.TABLES, icon: TableBarRoundedIcon },
      { label: 'Status Tracking', to: ROUTES.TABLE_TRACKING, icon: TableRestaurantRoundedIcon },
      { label: 'VIP Rooms', to: ROUTES.VIP_ROOMS, icon: MeetingRoomRoundedIcon },
      { label: 'Guests', to: `${ROUTES.DASHBOARD}#guests`, icon: PeopleAltRoundedIcon },
      { label: 'Analytics', to: `${ROUTES.DASHBOARD}#analytics`, icon: InsightsRoundedIcon },
      { label: 'Settings', to: `${ROUTES.DASHBOARD}#settings`, icon: SettingsRoundedIcon },
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
          <span className="app-sidebar__account-menu" aria-hidden="true">•••</span>
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
