import MuiAvatar from '@mui/material/Avatar';

export default function Avatar({ name = 'Guest', src, size = 'medium', className = '' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const dimensions = { small: 30, medium: 38, large: 48 };

  return (
    <MuiAvatar
      src={src}
      alt={name}
      aria-label={name}
      className={`ui-avatar ui-avatar--${size} ${className}`.trim()}
      sx={{
        width: dimensions[size] || dimensions.medium,
        height: dimensions[size] || dimensions.medium,
        border: '2px solid #fff',
        bgcolor: '#e2f0e8',
        color: '#286047',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {!src && initials}
    </MuiAvatar>
  );
}