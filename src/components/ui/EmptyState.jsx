import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function EmptyState({ title = 'Nothing here yet', description, action, icon = '✦', className = '' }) {
  return (
    <Box className={`ui-state ${className}`.trim()}>
      <span className="ui-state__icon" aria-hidden="true">{icon}</span>
      <Typography component="h3" sx={{ m: '3px 0 0', color: '#34433a', fontSize: 15, fontWeight: 700 }}>{title}</Typography>
      {description && <Typography component="p" sx={{ maxWidth: 300, m: 0, color: '#89948d', fontSize: 12, lineHeight: 1.6 }}>{description}</Typography>}
      {action}
    </Box>
  );
}