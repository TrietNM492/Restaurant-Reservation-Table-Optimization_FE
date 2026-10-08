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
          '& fieldset': { borderColor: '#e1e7e2' },
          '&:hover fieldset': { borderColor: '#c4d1c8' },
          '&.Mui-focused fieldset': { borderColor: '#39896c', borderWidth: 1 },
        },
        '& .MuiInputBase-input': { px: '13px', py: '11px' },
        '& .MuiInputLabel-root': { color: '#536159', fontSize: 13 },
      }}
    />
  );
}