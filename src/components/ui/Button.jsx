import MuiButton from '@mui/material/Button';

export default function Button({
  children, variant = 'primary', size = 'medium', className = '', type = 'button', ...props
}) {
  const muiVariant = variant === 'primary' || variant === 'danger' ? 'contained' : variant === 'secondary' ? 'outlined' : 'text';

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
        fontWeight: 600,
        boxShadow: variant === 'primary' || variant === 'danger' ? '0 3px 8px rgba(22, 122, 90, .15)' : 'none',
        ...(variant === 'primary' && { bgcolor: '#167a5a', '&:hover': { bgcolor: '#105e45' } }),
        ...(variant === 'danger' && { bgcolor: '#c74949', '&:hover': { bgcolor: '#ad3636' } }),
        ...(variant === 'secondary' && { borderColor: '#e2e8e3', color: '#34423a', '&:hover': { borderColor: '#cad5cd', bgcolor: '#f8faf8' } }),
        ...(variant === 'ghost' && { color: '#58675e', '&:hover': { bgcolor: '#f2f6f3', color: '#26372e' } }),
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
}