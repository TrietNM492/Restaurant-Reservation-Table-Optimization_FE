import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import { ROUTES } from '../../routes/routeConstants';
import { useAuthStore } from '../../stores/useAuthStore';

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const userName = user?.fullname || user?.name || user?.fullName || user?.username || user?.email || 'Admin';
  const avatarSrc = typeof user?.avatar === 'string' ? user.avatar : undefined;

  const handleAccountAction = (event) => {
    if (event.target.value) navigate(event.target.value);
  };

  return (
    <Box component="header" className="app-header">
      <Box className="app-header__left">
        <IconButton className="app-header__menu" aria-label="Open navigation" onClick={onMenuClick}>
          <MenuRoundedIcon />
        </IconButton>
        <Box className="app-header__venue-mark" aria-hidden="true">G</Box>
        <Box>
          <Typography className="app-header__venue" component="p">The Greenhouse</Typography>
          <Typography className="app-header__caption" component="p">Restaurant workspace</Typography>
        </Box>
      </Box>

      <Box className="app-header__actions">
        <FormControl size="small" className="app-header__account-select">
          <Select
            value=""
            displayEmpty
            onChange={handleAccountAction}
            renderValue={() => (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Avatar name={userName} src={avatarSrc} size="small" className="app-header__avatar" />
                <Box sx={{ minWidth: 0, textAlign: 'left' }}>
                  <Typography className="app-header__account-name">{userName}</Typography>
                  <Typography className="app-header__account-role">{user?.role || 'Admin'}</Typography>
                </Box>
              </Stack>
            )}
            inputProps={{ 'aria-label': 'Account menu' }}
            IconComponent={ExpandMoreRoundedIcon}
            sx={{
              maxWidth: 220,
              '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5, pl: 1, pr: 4 },
              '& .MuiSelect-icon': { right: 7, color: 'text.secondary' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
            }}
          >
            <MenuItem value={ROUTES.PROFILE} disabled>Edit profile</MenuItem>
            <MenuItem value={ROUTES.HOME}>View Home</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

export default Header;