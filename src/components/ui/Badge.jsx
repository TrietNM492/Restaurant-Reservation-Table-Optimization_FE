import Chip from '@mui/material/Chip';

export default function Badge({ children, tone = 'neutral', className = '' }) {
  const colors = {
    success: { color: '#217553', background: '#e9f5ed' },
    warning: { color: '#a56b14', background: '#fbf2df' },
    danger: { color: '#b24444', background: '#fbeaea' },
    neutral: { color: '#647168', background: '#eff2ef' },
    info: { color: '#3f7094', background: '#eaf3f9' },
  };

  return (
    <Chip
      label={children}
      size="small"
      className={`ui-badge ui-badge--${tone} ${className}`.trim()}
      sx={{
        height: 24,
        borderRadius: '999px',
        color: (colors[tone] || colors.neutral).color,
        bgcolor: (colors[tone] || colors.neutral).background,
        fontSize: 11,
        fontWeight: 600,
        '&::before': { width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', content: '""', ml: '9px' },
        '& .MuiChip-label': { pl: '6px', pr: '9px' },
      }}
    />
  );
}