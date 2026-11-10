import TextField from '@mui/material/TextField';

export default function Input({
  label,
  id,
  error,
  hint,
  className = '',
  slotProps,
  ...props
}) {
  const { inputProps, InputLabelProps, ...textFieldProps } = props;

  const mergedSlotProps = {
    ...slotProps,
    htmlInput: {
      'aria-invalid': Boolean(error),
      ...inputProps,
      ...slotProps?.htmlInput,
    },
    inputLabel: {
      ...(InputLabelProps || {}),
      ...slotProps?.inputLabel,
    },
  };

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
      slotProps={mergedSlotProps}
      {...textFieldProps}
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: 44,
          borderRadius: '12px',
          bgcolor: '#fff',
          fontSize: 13,
          '& fieldset': { borderColor: error ? '#DC2626' : '#E2E8F0' },
          '&:hover fieldset': { borderColor: error ? '#DC2626' : '#C4B5FD' },
          '&.Mui-focused fieldset': { borderColor: '#6D28D9', borderWidth: 1.5, boxShadow: '0 0 0 3px rgba(109, 40, 217, 0.12)' },
        },
        '& .MuiInputBase-input': { px: '13px', py: '11px', boxSizing: 'border-box' },
        '& .MuiInputLabel-root': { color: '#64748B', fontSize: 13 },
        '& .MuiFormHelperText-root': { mx: 0, mt: '6px', color: error ? '#DC2626' : '#64748B', fontSize: 11 },
      }}
    />
  );
}