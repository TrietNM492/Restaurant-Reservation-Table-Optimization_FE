import TextField from '@mui/material/TextField';

export default function Input({ label, id, error, hint, className = '', ...props }) {
  const { inputProps, ...textFieldProps } = props;

  return (
    <TextField
      id={id}
      label={label}
      error={Boolean(error)}
      helperText={error || hint}
      className={`ui-field ${className}`.trim()}
      variant="outlined"
      size="small"
      fullWidth
      slotProps={{ htmlInput: { 'aria-invalid': Boolean(error), ...inputProps } }}
      {...textFieldProps}
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: 44,
          borderRadius: '12px',
          bgcolor: '#fff',
          fontSize: 13,
          '& fieldset': { borderColor: error ? '#d55050' : '#e1e7e2' },
          '&:hover fieldset': { borderColor: error ? '#d55050' : '#c4d1c8' },
          '&.Mui-focused fieldset': { borderColor: '#39896c', borderWidth: 1, boxShadow: '0 0 0 3px rgba(22, 122, 90, .09)' },
        },
        '& .MuiInputBase-input': { px: '13px', py: '11px', boxSizing: 'border-box' },
        '& .MuiInputLabel-root': { color: '#536159', fontSize: 13 },
        '& .MuiFormHelperText-root': { mx: 0, mt: '6px', color: error ? '#c34242' : '#839087', fontSize: 11 },
      }}
    />
  );
}