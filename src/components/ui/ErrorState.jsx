import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from './Button';

export default function ErrorState({ title = 'Something went wrong', description = 'Please try again in a moment.', onRetry }) {
  return (
    <Box
      className="ui-state ui-state--error"
      role="alert"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: 3,
        borderRadius: 3,
        border: '1px solid #FECACA',
        bgcolor: '#FEF2F2',
        textAlign: 'center',
      }}
    >
      <span
        className="ui-state__icon"
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          width: 34,
          height: 34,
          borderRadius: '50%',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FEE2E2',
          color: '#B91C1C',
          fontWeight: 800,
          fontSize: 18,
        }}
      >
        !
      </span>
      <Typography component="h3" sx={{ m: 0, color: '#1E1B2E', fontSize: 15, fontWeight: 700 }}>{title}</Typography>
      <Typography component="p" sx={{ maxWidth: 300, m: 0, color: '#475569', fontSize: 12, lineHeight: 1.6 }}>{description}</Typography>
      {onRetry && (
        <Button variant="primary" size="small" type="button" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Box>
  );
}