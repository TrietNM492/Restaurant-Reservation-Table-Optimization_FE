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
        sx={{ width: 34, height: 34, borderRadius: '10px', color: '#78857c', fontSize: 16, '&:hover': { bgcolor: '#f1f5f2' } }}
      >
        •••
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu} slotProps={{ paper: { sx: { minWidth: 150, border: '1px solid #e9eeea', borderRadius: '12px', boxShadow: '0 12px 30px rgba(30, 52, 37, .1)' } } }}>
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          return (
            <MenuItem
              key={child.key}
              onClick={(event) => { child.props.onClick?.(event); closeMenu(); }}
              sx={{ minHeight: 36, borderRadius: '8px', color: '#445249', fontSize: 12, '&:hover': { bgcolor: '#f5f8f6' } }}
            >
              {cloneElement(child, { onClick: undefined, className: '' }).props.children}
            </MenuItem>
          );
        })}
      </Menu>
    </span>
  );
}