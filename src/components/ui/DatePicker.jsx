import TextField from '@mui/material/TextField';

export default function DatePicker({ label = 'Date', id = 'date-picker', className = '', ...props }) {
  return (
    <TextField
      id={id}
      label={label}
      type="date"
      className={`ui-field ${className}`.trim()}
      variant="outlined"
      size="small"
      fullWidth
      slotProps={{ inputLabel: { shrink: true } }}
      {...props}
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: 44,
          borderRadius: '12px',
          bgcolor: '#fff',
          fontSize: 13,
          '& fieldset': { borderColor: '#E2E8F0' },
          '&:hover fieldset': { borderColor: '#C4B5FD' },
          '&.Mui-focused fieldset': { borderColor: '#6D28D9', borderWidth: 1.5 },
        },
        '& .MuiInputBase-input': { px: '13px', py: '11px' },
        '& .MuiInputLabel-root': { color: '#475569', fontSize: 13 },
      }}
    />
  );
}