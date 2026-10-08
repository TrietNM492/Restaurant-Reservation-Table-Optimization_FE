import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from './Button';

export default function ErrorState({ title = 'Something went wrong', description = 'Please try again in a moment.', onRetry }) {
  return (
    <Box className="ui-state ui-state--error" role="alert">
      <span className="ui-state__icon" aria-hidden="true">!</span>
      <Typography component="h3" sx={{ m: '3px 0 0', color: '#34433a', fontSize: 15, fontWeight: 700 }}>{title}</Typography>
      <Typography component="p" sx={{ maxWidth: 300, m: 0, color: '#89948d', fontSize: 12, lineHeight: 1.6 }}>{description}</Typography>
      {onRetry && <Button variant="secondary" size="small" type="button" onClick={onRetry}>Try again</Button>}
    </Box>
  );
}