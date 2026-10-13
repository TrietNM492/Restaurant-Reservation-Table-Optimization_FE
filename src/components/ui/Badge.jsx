import Chip from '@mui/material/Chip';

export default function Badge({ children, tone = 'neutral', className = '' }) {
  const colors = {
    success: { color: '#166534', background: '#DCFCE7' },
    warning: { color: '#B45309', background: '#FEF3C7' },
    danger: { color: '#B91C1C', background: '#FEE2E2' },
    neutral: { color: '#6D28D9', background: '#F5F3FF' },
    info: { color: '#1D4ED8', background: '#DBEAFE' },
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
        fontWeight: 700,
        '&::before': { width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', content: '""', ml: '9px' },
        '& .MuiChip-label': { pl: '6px', pr: '9px' },
      }}
    />
  );
}