import { Alert, Container, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { reservationApi, tableApi } from '../api/contracts';

const formatDateTimeLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultDateTimes = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const start = new Date(tomorrow);
  start.setHours(19, 0, 0, 0);

  const end = new Date(tomorrow);
  end.setHours(21, 0, 0, 0);

  return {
    startTime: formatDateTimeLocal(start),
    endTime: formatDateTimeLocal(end),
  };
};

const partySizeOptions = [
  { label: 'Single (1 guest)', value: 'SINGLE' },
  { label: 'Small (2-4 guests)', value: 'SMALL' },
  { label: 'Medium (5-8 guests)', value: 'MEDIUM' },
  { label: 'Large (9-12 guests)', value: 'LARGE' },
  { label: 'Extra Large (13+ guests)', value: 'XLARGE' },
];

const reservationTypeOptions = [
  { label: 'Standard Table', value: 'TABLE' },
];

function ReservationPage() {
  const [values, setValues] = useState(() => ({
    partySize: 'SMALL',
    reservationType: 'TABLE',
    ...getDefaultDateTimes(),
    note: '',
  }));
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchTables = async () => {
    setTablesLoading(true);
    setTablesError('');
    setSelectedTableId('');
    try {
      const data = await tableApi.getAll();
      setTables(data);
    } catch (err) {
      setTables([]);
      setSelectedTableId('');
      setTablesError(err.message || 'Không thể tải danh sách bàn từ máy chủ.');
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const availableTables = useMemo(
    () => tables.filter((t) => t.statusCode !== 'LOCKED'),
    [tables],
  );

  const lockedCount = useMemo(
    () => tables.filter((t) => t.statusCode === 'LOCKED').length,
    [tables],
  );

  const tableOptions = useMemo(() => {
    const placeholderLabel = tablesLoading
      ? 'Đang tải danh sách bàn...'
      : tablesError
        ? 'Lỗi tải danh sách bàn'
        : availableTables.length === 0
          ? 'Không có bàn khả dụng'
          : '-- Chọn bàn --';

    return [
      { label: placeholderLabel, value: '' },
      ...availableTables.map((t) => ({
        label: `Bàn ${t.tableNumber} — ${t.capacity} chỗ (${t.area?.name || 'Chung'})`,
        value: String(t.id),
      })),
    ];
  }, [availableTables, tablesLoading, tablesError]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (submitError) setSubmitError('');
    if (submitSuccess) setSubmitSuccess('');
  };

  const handleTableChange = (event) => {
    setSelectedTableId(event.target.value);
    if (submitError) setSubmitError('');
    if (submitSuccess) setSubmitSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitError('');
    setSubmitSuccess('');

    if (!selectedTableId) {
      setSubmitError('Please select a table.');
      return;
    }

    if (!values.partySize) {
      setSubmitError('Party size is required.');
      return;
    }

    if (!values.reservationType) {
      setSubmitError('Reservation type is required.');
      return;
    }

    if (!values.startTime) {
      setSubmitError('Start time is required.');
      return;
    }

    const startDate = new Date(values.startTime);
    if (Number.isNaN(startDate.getTime())) {
      setSubmitError('Start time is invalid.');
      return;
    }

    if (startDate <= new Date()) {
      setSubmitError('Start time must be in the future.');
      return;
    }

    if (!values.endTime) {
      setSubmitError('End time is required.');
      return;
    }

    const endDate = new Date(values.endTime);
    if (Number.isNaN(endDate.getTime())) {
      setSubmitError('End time is invalid.');
      return;
    }

    if (endDate <= startDate) {
      setSubmitError('End time must be after start time.');
      return;
    }

    if (values.note && values.note.trim().length > 500) {
      setSubmitError('Note cannot exceed 500 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        partySize: values.partySize,
        reservationType: values.reservationType,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        tableIds: [Number(selectedTableId)],
        note: values.note ? values.note.trim() : '',
      };

      const response = await reservationApi.create(payload);
      const reference = response?.reservationNo || response?.id || 'Confirmed';
      setSubmitSuccess(`Reservation created successfully! Reference: ${reference}`);
      setSelectedTableId('');
      setValues((current) => ({
        ...current,
        note: '',
      }));
    } catch (err) {
      setSubmitError(err.message || 'Unable to create reservation. Please try again.');
    } finally {
      setSubmitting(false);
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
            {tablesError ? (
              <Alert
                severity="error"
                action={
                  <Button variant="ghost" size="small" onClick={fetchTables}>
                    Thử lại
                  </Button>
                }
              >
                {tablesError}
              </Alert>
            ) : null}

            <Select
              label="Table"
              name="tableId"
              value={selectedTableId}
              onChange={handleTableChange}
              options={tableOptions}
              disabled={submitting || tablesLoading || Boolean(tablesError) || availableTables.length === 0}
            />

            {lockedCount > 0 ? (
              <Typography variant="caption" color="text.secondary">
                * Có {lockedCount} bàn đang trong trạng thái khóa (LOCKED) và không thể chọn.
              </Typography>
            ) : null}

            <Input
              label="Start time"
              name="startTime"
              type="datetime-local"
              value={values.startTime}
              onChange={handleChange}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
            <Input
              label="End time"
              name="endTime"
              type="datetime-local"
              value={values.endTime}
              onChange={handleChange}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
            <Select
              label="Party size"
              name="partySize"
              value={values.partySize}
              onChange={handleChange}
              options={partySizeOptions}
              disabled={submitting}
            />
            <Select
              label="Reservation type"
              name="reservationType"
              value={values.reservationType}
              onChange={handleChange}
              options={reservationTypeOptions}
              disabled={submitting}
            />
            <Input
              label="Note"
              name="note"
              value={values.note}
              onChange={handleChange}
              multiline
              minRows={3}
              disabled={submitting}
            />

            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            {submitSuccess ? <Alert severity="success">{submitSuccess}</Alert> : null}

            <Button
              type="submit"
              variant="contained"
              disabled={submitting || tablesLoading || Boolean(tablesError) || availableTables.length === 0}
            >
              {tablesLoading
                ? 'Đang tải danh sách bàn...'
                : submitting
                  ? 'Creating reservation...'
                  : 'Confirm reservation'}
            </Button>
          </Stack>
        </Paper>
      </Container>
      <Footer />
    </>
  );
}

export default ReservationPage;
