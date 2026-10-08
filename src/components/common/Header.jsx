import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import Avatar from '../ui/Avatar';

function Header({ onMenuClick }) {
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
        <Box className="app-header__search">
          <SearchRoundedIcon aria-hidden="true" />
          <InputBase placeholder="Search anything..." inputProps={{ 'aria-label': 'Search workspace' }} />
          <kbd>⌘ K</kbd>
        </Box>
        <IconButton className="app-header__notification" aria-label="Notifications">
          <NotificationsNoneRoundedIcon />
          <span className="app-header__notification-dot" />
        </IconButton>
        <Avatar name="Alex Morgan" size="small" className="app-header__avatar" />
      </Box>
    </Box>
  );
}

export default Header;