import { useId } from 'react';
import DrawerPanel from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';

export default function Drawer({ open, onClose, title, children, side = 'right' }) {
  const titleId = useId();

  return (
    <DrawerPanel anchor={side} open={open} onClose={onClose} slotProps={{ paper: { className: `ui-drawer ui-drawer--${side}`, 'aria-labelledby': titleId, sx: { width: 'min(420px, 100vw)', bgcolor: '#fff', boxShadow: '0 10px 45px rgba(16, 27, 22, .3)' } } }}>
      <header className="ui-modal__header">
        <h2 id={titleId}>{title}</h2>
        <IconButton type="button" className="ui-icon-button" onClick={onClose} aria-label="Close panel" size="small" sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: '#f5f7f5', color: '#6c7970', fontSize: 21 }}>×</IconButton>
      </header>
      <div className="ui-drawer__body">{children}</div>
    </DrawerPanel>
  );
}