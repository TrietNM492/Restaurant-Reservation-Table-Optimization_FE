import { Children, cloneElement, isValidElement, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export default function AppMenu({ label = 'More options', children, className = '' }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const closeMenu = () => setAnchorEl(null);

  return (
    <span className={`ui-menu ${className}`.trim()}>
      <IconButton
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchorEl)}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        size="small"
        sx={{ width: 34, height: 34, borderRadius: '10px', color: '#6D28D9', fontSize: 16, bgcolor: '#F5F3FF', '&:hover': { bgcolor: '#EDE9FE' } }}
      >
        •••
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        slotProps={{
          paper: {
            sx: {
              minWidth: 170,
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 16px 40px rgba(109, 40, 217, 0.12)',
              mt: 1,
            },
          },
        }}
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          return (
            <MenuItem
              key={child.key}
              onClick={(event) => {
                child.props.onClick?.(event);
                closeMenu();
              }}
              sx={{ minHeight: 36, borderRadius: '8px', color: '#334155', fontSize: 12, '&:hover': { bgcolor: '#F5F3FF' } }}
            >
              {cloneElement(child, { onClick: undefined, className: '' }).props.children}
            </MenuItem>
          );
        })}
      </Menu>
    </span>
  );
}