import Box from '@mui/material/Box';

export default function Form({ children, onSubmit, className = '', ...props }) {
  return <Box component="form" className={`ui-form ${className}`.trim()} onSubmit={onSubmit} {...props}>{children}</Box>;
}