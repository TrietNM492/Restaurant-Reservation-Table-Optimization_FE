import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import { useNavigate } from 'react-router-dom';

const guestOptions = [2, 4, 6, 8, 10];

const defaultValues = {
  location: 'Seattle',
  date: '2026-10-19',
  time: '19:30',
  guests: '4',
};

function ReservationSearch() {
  const navigate = useNavigate();
  const [values, setValues] = useState(defaultValues);
  const [validationError, setValidationError] = useState('');

  const fields = useMemo(
    () => [
      {
        key: 'location',
        label: 'Location or restaurant',
        placeholder: 'Seattle',
        type: 'text',
        icon: <LocationOnOutlinedIcon fontSize="small" />,
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        icon: <CalendarTodayOutlinedIcon fontSize="small" />,
      },
      {
        key: 'time',
        label: 'Time',
        type: 'time',
        icon: <AccessTimeOutlinedIcon fontSize="small" />,
      },
      {
        key: 'guests',
        label: 'Guests',
        type: 'select',
        icon: <GroupOutlinedIcon fontSize="small" />,
      },
    ],
    [],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (validationError) setValidationError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const requiredKeys = ['location', 'date', 'time', 'guests'];
    const missingKey = requiredKeys.find((key) => !values[key] || values[key].trim() === '');

    if (missingKey) {
      setValidationError('Please complete all search fields before finding available tables.');
      return;
    }

    const searchParams = new URLSearchParams({
      location: values.location,
      date: values.date,
      time: values.time,
      guests: values.guests,
    });

    navigate(`/restaurants?${searchParams.toString()}`);
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Find a table
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr)) 220px' },
          gap: 1.5,
          alignItems: 'stretch',
        }}
      >
        {fields.map((field) => (
          <Box key={field.key}>
            {field.type === 'select' ? (
              <TextField
                select
                fullWidth
                size="small"
                name={field.key}
                label={field.label}
                value={values[field.key]}
                onChange={handleChange}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">{field.icon}</InputAdornment>,
                  },
                }}
                sx={{ '& .MuiOutlinedInput-root': { height: 54, borderRadius: 2 } }}
              >
                {guestOptions.map((option) => (
                  <MenuItem key={option} value={String(option)}>
                    {option} guests
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                fullWidth
                size="small"
                name={field.key}
                label={field.label}
                type={field.type}
                value={values[field.key]}
                onChange={handleChange}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">{field.icon}</InputAdornment>,
                  },
                }}
                sx={{ '& .MuiOutlinedInput-root': { height: 54, borderRadius: 2 } }}
              />
            )}
          </Box>
        ))}

        <Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            startIcon={<SearchIcon />}
            sx={{
              height: 54,
              borderRadius: 2,
              px: 2,
              whiteSpace: 'nowrap',
            }}
          >
            Find Available Tables
          </Button>
        </Box>
      </Box>

      {validationError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {validationError}
        </Alert>
      ) : null}
    </Paper>
  );
}

export default ReservationSearch;
