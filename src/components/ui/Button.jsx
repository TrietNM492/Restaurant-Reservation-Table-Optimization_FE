import MuiButton from '@mui/material/Button';

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  type = 'button',
  ...props
}) {
  const muiVariant = variant === 'danger' ? 'contained' : variant === 'secondary' ? 'outlined' : variant === 'ghost' ? 'text' : 'contained';

  return (
    <MuiButton
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`.trim()}
      type={type}
      variant={muiVariant}
      color={variant === 'danger' ? 'error' : 'primary'}
      disableElevation
      sx={{
        minHeight: size === 'small' ? 32 : size === 'large' ? 48 : 40,
        px: size === 'small' ? 1.5 : size === 'large' ? 2.5 : 2,
        borderRadius: size === 'small' ? '10px' : '12px',
        textTransform: 'none',
        fontSize: size === 'small' ? 12 : 13,
        fontWeight: 700,
        letterSpacing: 0,
        boxShadow: variant === 'primary' || variant === 'danger' ? '0 8px 20px rgba(109, 40, 217, 0.18)' : 'none',
        transition: 'all 0.2s ease',
        ...(variant === 'primary' && {
          background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
          color: '#fff',
          '&:hover': { background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)' },
        }),
        ...(variant === 'danger' && {
          background: '#DC2626',
          '&:hover': { background: '#B91C1C' },
        }),
        ...(variant === 'secondary' && {
          borderColor: '#C4B5FD',
          color: '#6D28D9',
          backgroundColor: '#FFFFFF',
          '&:hover': { borderColor: '#8B5CF6', backgroundColor: '#F5F3FF' },
        }),
        ...(variant === 'ghost' && {
          color: '#6D28D9',
          '&:hover': { backgroundColor: '#F5F3FF', color: '#5B21B6' },
        }),
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
}