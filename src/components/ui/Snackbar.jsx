import Alert from '@mui/material/Alert';
import SnackbarPanel from '@mui/material/Snackbar';

export default function Snackbar({ open, message, onClose, tone = 'success' }) {
  const requestedSeverity = tone === 'danger' ? 'error' : tone;
  const severity = ['success', 'info', 'warning', 'error'].includes(requestedSeverity) ? requestedSeverity : 'success';

  return (
    <SnackbarPanel
      className="ui-snackbar"
      open={open}
      autoHideDuration={5000}
      onClose={(_, reason) => { if (reason !== 'clickaway') onClose?.(); }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          alignItems: 'center',
          borderRadius: '13px',
          boxShadow: '0 12px 32px rgba(20, 38, 28, .2)',
          fontSize: 12,
          ...(severity === 'success' && { bgcolor: '#20372b' }),
        }}
      >
        {message}
      </Alert>
    </SnackbarPanel>
  );
}