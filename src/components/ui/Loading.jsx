import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

export default function Loading({ label = 'Loading', variant = 'spinner', rows = 4 }) {
  if (variant === 'skeleton') {
    return (
      <Box className="ui-skeleton-list" role="status" aria-label={label}>
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton
            className="ui-skeleton"
            key={index}
            variant="rounded"
            height={13}
            width={index % 2 ? '75%' : '100%'}
            sx={{ borderRadius: '9px', bgcolor: 'rgba(109, 40, 217, 0.08)' }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box className="ui-loading" role="status" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <CircularProgress className="ui-spinner" size={18} thickness={4} sx={{ color: '#6D28D9' }} />
      <Typography component="span" sx={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}