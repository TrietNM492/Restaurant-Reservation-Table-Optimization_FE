import { useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

export default function Select({ label, id, options = [], className = '', ...props }) {
  const {
    'aria-label': ariaLabel,
    value,
    defaultValue,
    onChange,
    ...textFieldProps
  } = props;
  const firstOption = options[0];
  const initialValue = firstOption === undefined ? '' : typeof firstOption === 'string' ? firstOption : firstOption.value;
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? initialValue);
  const isControlled = value !== undefined;

  return (
    <TextField
      id={id}
      label={label}
      className={`ui-field ${className}`.trim()}
      select
      variant="outlined"
      size="small"
      fullWidth
      value={isControlled ? value : internalValue}
      onChange={(event, child) => {
        if (!isControlled) setInternalValue(event.target.value);
        onChange?.(event, child);
      }}
      slotProps={{ select: { inputProps: { 'aria-label': ariaLabel } } }}
      {...textFieldProps}
      sx={{
        minWidth: 0,
        '& .MuiOutlinedInput-root': {
          minHeight: 40,
          borderRadius: '12px',
          bgcolor: '#fff',
          fontSize: 12,
          '& fieldset': { borderColor: '#e1e7e2' },
          '&:hover fieldset': { borderColor: '#c4d1c8' },
          '&.Mui-focused fieldset': { borderColor: '#39896c', borderWidth: 1 },
        },
        '& .MuiSelect-select': { py: '9px', pl: '12px', pr: '34px' },
        '& .MuiInputLabel-root': { color: '#536159', fontSize: 12 },
      }}
    >
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;
        return <MenuItem key={value} value={value}>{optionLabel}</MenuItem>;
      })}
    </TextField>
  );
}