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
      slotProps={{ paper: { className: `ui-modal ui-modal--${size} ${className}`.trim(), sx: { width: `min(100%, ${size === 'large' ? '720px' : '520px'})`, maxHeight: 'min(90vh, 760px)', border: '1px solid #edf0ed', borderRadius: '20px', boxShadow: '0 24px 80px rgba(11, 27, 18, .25)' } } }}
    >
      <header className="ui-modal__header">
        <DialogTitle id={titleId} sx={{ p: 0, color: '#27372e', fontFamily: 'Manrope, sans-serif', fontSize: 17, fontWeight: 700 }}>{title}</DialogTitle>
        <IconButton type="button" className="ui-icon-button" onClick={onClose} aria-label="Close dialog" size="small" sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: '#f5f7f5', color: '#6c7970', fontSize: 21, '&:hover': { bgcolor: '#eaf0eb' } }}>×</IconButton>
      </header>
      <DialogContent sx={{ p: 0 }}>{children}</DialogContent>
    </Dialog>
  );
}