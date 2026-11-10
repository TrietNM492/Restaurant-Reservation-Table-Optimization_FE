import MuiTooltip from '@mui/material/Tooltip';

export default function Tooltip({ children, content, placement = 'top' }) {
  return (
    <MuiTooltip
      title={content}
      placement={placement}
      arrow
      slotProps={{ tooltip: { sx: { px: 1.1, py: 0.75, borderRadius: '8px', bgcolor: '#26372e', fontSize: 10 } }, arrow: { sx: { color: '#26372e' } } }}
    >
      {children}
    </MuiTooltip>
  );
}