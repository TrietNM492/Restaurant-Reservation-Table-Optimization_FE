import { Alert, Container, Paper, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { reservationApi } from '../api/contracts';

const defaultValues = {
  tableIds: '1',
  partySize: 'FOUR',
  reservationType: 'DINNER',
  startTime: '2026-10-20T19:30',
  endTime: '2026-10-20T21:00',
  note: '',
};

const partySizeOptions = [
  { label: '2 guests', value: 'TWO' },
  { label: '4 guests', value: 'FOUR' },
  { label: '6 guests', value: 'SIX' },
  { label: '8 guests', value: 'EIGHT' },
];

const reservationTypeOptions = [
  { label: 'Dinner', value: 'DINNER' },
  { label: 'Lunch', value: 'LUNCH' },
  { label: 'Private event', value: 'PRIVATE_EVENT' },
];

function ReservationPage() {
  const [values, setValues] = useState(defaultValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tableOptions = useMemo(
    () => [
      { label: 'Table 1 - Window seating', value: '1' },
      { label: 'Table 2 - Terrace', value: '2' },
      { label: 'Table 3 - Chef counter', value: '3' },
    ],
    [],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        partySize: values.partySize,
        reservationType: values.reservationType,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        tableIds: values.tableIds.split(',').map((value) => Number(value.trim())).filter(Boolean),
        note: values.note.trim(),
      };

      const response = await reservationApi.create(payload);
      setSuccess(`Reservation created successfully. Reference: ${response?.id ?? 'pending confirmation'}.`);
      setValues((current) => ({ ...current, note: '' }));
    } catch (submitError) {
      setError(submitError.message || 'Unable to create your reservation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: { xs: 3, md: 5 }, border: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="h3" sx={{ mb: 2 }}>
            Reserve your table
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use the contract-aligned reservation payload and start/end time fields to schedule your dining experience.
          </Typography>

          <Stack spacing={2}>
            <Select
              label="Table"
              name="tableIds"
              value={values.tableIds}
              onChange={handleChange}
              options={tableOptions}
            />
            <Input label="Start time" name="startTime" type="datetime-local" value={values.startTime} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            <Input label="End time" name="endTime" type="datetime-local" value={values.endTime} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            <Select label="Party size" name="partySize" value={values.partySize} onChange={handleChange} options={partySizeOptions} />
            <Select label="Reservation type" name="reservationType" value={values.reservationType} onChange={handleChange} options={reservationTypeOptions} />
            <Input label="Note" name="note" value={values.note} onChange={handleChange} multiline minRows={3} />

            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}

            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Creating reservation...' : 'Confirm reservation'}
            </Button>
          </Stack>
        </Paper>
      </Container>
      <Footer />
    </>
  );
}

export default ReservationPage;
