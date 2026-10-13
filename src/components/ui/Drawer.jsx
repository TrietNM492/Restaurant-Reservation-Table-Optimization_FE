import { useId } from 'react';
import DrawerPanel from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';

export default function Drawer({ open, onClose, title, children, side = 'right' }) {
  const titleId = useId();

  return (
    <DrawerPanel
      anchor={side}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          className: `ui-drawer ui-drawer--${side}`,
          'aria-labelledby': titleId,
          sx: {
            width: 'min(420px, 100vw)',
            bgcolor: '#fff',
            boxShadow: '0 24px 80px rgba(109, 40, 217, 0.18)',
            borderLeft: side === 'right' ? '1px solid #E2E8F0' : 'none',
            borderRight: side === 'left' ? '1px solid #E2E8F0' : 'none',
          },
        },
      }}
    >
      <header className="ui-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px 12px', borderBottom: '1px solid #F1F5F9' }}>
        <h2 id={titleId} style={{ margin: 0, color: '#1E1B2E', fontSize: 18, fontWeight: 700 }}>{title}</h2>
        <IconButton type="button" className="ui-icon-button" onClick={onClose} aria-label="Close panel" size="small" sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: '#F5F3FF', color: '#6D28D9', fontSize: 21, '&:hover': { bgcolor: '#EDE9FE' } }}>×</IconButton>
      </header>
      <div className="ui-drawer__body" style={{ padding: 20 }}>{children}</div>
    </DrawerPanel>
  );
}