import { useId } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

export default function Modal({ open, onClose, title, children, className = '', size = 'medium' }) {
  const titleId = useId();
  const maxWidth = size === 'large' ? 'md' : 'sm';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      aria-labelledby={titleId}
      slotProps={{
        paper: {
          className: `ui-modal ui-modal--${size} ${className}`.trim(),
          sx: {
            width: `min(100%, ${size === 'large' ? '720px' : '520px'})`,
            maxHeight: 'min(90vh, 760px)',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(109, 40, 217, 0.16)',
          },
        },
      }}
    >
      <header className="ui-modal__header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px 0' }}>
        <DialogTitle id={titleId} sx={{ p: 0, color: '#1E1B2E', fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 700 }}>{title}</DialogTitle>
        <IconButton type="button" className="ui-icon-button" onClick={onClose} aria-label="Close dialog" size="small" sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: '#F5F3FF', color: '#6D28D9', fontSize: 21, '&:hover': { bgcolor: '#EDE9FE' } }}>×</IconButton>
      </header>
      <DialogContent sx={{ p: 2, pt: 1 }}>{children}</DialogContent>
    </Dialog>
  );
}