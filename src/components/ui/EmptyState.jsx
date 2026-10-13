import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function EmptyState({ title = 'Nothing here yet', description, action, icon = '✦', className = '' }) {
  return (
    <Box
      className={`ui-state ${className}`.trim()}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: 3,
        borderRadius: 3,
        border: '1px dashed #C4B5FD',
        bgcolor: '#F5F3FF',
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
          background: '#EDE9FE',
          color: '#6D28D9',
          fontWeight: 800,
          fontSize: 18,
        }}
      >
        {icon}
      </span>
      <Typography component="h3" sx={{ m: 0, color: '#1E1B2E', fontSize: 15, fontWeight: 700 }}>{title}</Typography>
      {description && (
        <Typography component="p" sx={{ maxWidth: 300, m: 0, color: '#475569', fontSize: 12, lineHeight: 1.6 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}