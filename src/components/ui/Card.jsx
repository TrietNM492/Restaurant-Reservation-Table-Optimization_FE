import MuiCard from '@mui/material/Card';

export default function Card({ children, className = '', as: Element = 'section', ...props }) {
  return <MuiCard component={Element} className={`ui-card ${className}`.trim()} elevation={0} {...props}>{children}</MuiCard>;
}