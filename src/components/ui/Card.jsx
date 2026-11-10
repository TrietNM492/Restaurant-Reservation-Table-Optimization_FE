import MuiCard from '@mui/material/Card';

export default function Card({ children, className = '', as: Element = 'section', ...props }) {
  return (
    <MuiCard
      component={Element}
      className={`ui-card ${className}`.trim()}
      elevation={0}
      {...props}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
        backgroundColor: '#FFFFFF',
        ...props.sx,
      }}
    >
      {children}
    </MuiCard>
  );
}