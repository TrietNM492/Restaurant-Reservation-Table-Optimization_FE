import { Alert, Box, Container, Paper, Stack, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import Input from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import Select from '../components/ui/Select';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { reservationApi, tableApi } from '../api/contracts';
import { ROUTES } from '../routes/routeConstants';

const statusTones = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'neutral',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
};

const formatDateTimeLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const isoToDateTimeLocal = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return formatDateTimeLocal(date);
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
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);

  const [values, setValues] = useState(() => ({
    partySize: 'SMALL',
    reservationType: 'TABLE',
    ...getDefaultDateTimes(),
    note: '',
  }));

  const [currentReservation, setCurrentReservation] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(isEditMode);
  const [reservationError, setReservationError] = useState('');

  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const isPending = currentReservation ? currentReservation.reservationStatus === 'PENDING' : true;
  const isNonEditable = isEditMode && currentReservation && !isPending;

  const populateFromReservation = useCallback((res) => {
    setCurrentReservation(res);
    setValues({
      partySize: res.partySize || 'SMALL',
      reservationType: res.reservationType || 'TABLE',
      startTime: isoToDateTimeLocal(res.startTime),
      endTime: isoToDateTimeLocal(res.endTime),
      note: res.note || '',
    });
    if (Array.isArray(res.tables) && res.tables.length > 0) {
      setSelectedTableId(String(res.tables[0].id));
    } else {
      setSelectedTableId('');
    }
  }, []);

  const fetchReservation = useCallback(async () => {
    if (!isEditMode) return;
    setReservationLoading(true);
    setReservationError('');

    const stateRes = location.state?.reservation;
    if (stateRes && String(stateRes.id) === String(id)) {
      populateFromReservation(stateRes);
      setReservationLoading(false);
      return;
    }

    try {
      const list = await reservationApi.listMine();
      const match = Array.isArray(list)
        ? list.find((item) => String(item.id) === String(id))
        : null;

      if (!match) {
        setReservationError(`Reservation #${id} was not found in your bookings.`);
        setCurrentReservation(null);
      } else {
        populateFromReservation(match);
      }
    } catch (err) {
      setReservationError(err.message || 'Unable to load reservation details.');
      setCurrentReservation(null);
    } finally {
      setReservationLoading(false);
    }
  }, [id, isEditMode, location.state?.reservation, populateFromReservation]);

  useEffect(() => {
    if (!isEditMode) return;

    let ignore = false;

    const loadReservation = async () => {
      const stateRes = location.state?.reservation;
      if (stateRes && String(stateRes.id) === String(id)) {
        await Promise.resolve();
        if (!ignore) {
          populateFromReservation(stateRes);
          setReservationLoading(false);
        }
        return;
      }

      try {
        const list = await reservationApi.listMine();
        if (ignore) return;
        const match = Array.isArray(list)
          ? list.find((item) => String(item.id) === String(id))
          : null;

        if (!match) {
          setReservationError(`Reservation #${id} was not found in your bookings.`);
          setCurrentReservation(null);
        } else {
          populateFromReservation(match);
        }
      } catch (err) {
        if (!ignore) {
          setReservationError(err.message || 'Unable to load reservation details.');
          setCurrentReservation(null);
        }
      } finally {
        if (!ignore) {
          setReservationLoading(false);
        }
      }
    };

    loadReservation();
    return () => {
      ignore = true;
    };
  }, [id, isEditMode, location.state?.reservation, populateFromReservation]);

  const fetchTables = useCallback(async () => {
    setTablesLoading(true);
    setTablesError('');
    try {
      const data = await tableApi.getAll();
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      setTables([]);
      setTablesError(err.message || 'Không thể tải danh sách bàn từ máy chủ.');
    } finally {
      setTablesLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadTables = async () => {
      try {
        const data = await tableApi.getAll();
        if (!ignore) {
          setTables(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setTables([]);
          setTablesError(err.message || 'Không thể tải danh sách bàn từ máy chủ.');
        }
      } finally {
        if (!ignore) {
          setTablesLoading(false);
        }
      }
    };

    loadTables();
    return () => {
      ignore = true;
    };
  }, []);

  const assignedTable = useMemo(
    () => (isEditMode && currentReservation?.tables?.[0] ? currentReservation.tables[0] : null),
    [isEditMode, currentReservation],
  );

  const availableTables = useMemo(
    () => tables.filter((t) => t.statusCode !== 'LOCKED'),
    [tables],
  );

  const lockedCount = useMemo(
    () => tables.filter((t) => t.statusCode === 'LOCKED').length,
    [tables],
  );

  const isAssignedTableLocked = useMemo(() => {
    if (!assignedTable || tables.length === 0) return false;
    const match = tables.find((t) => String(t.id) === String(assignedTable.id));
    return match ? match.statusCode === 'LOCKED' : false;
  }, [assignedTable, tables]);

  const isSelectedTableLocked = useMemo(() => {
    if (!selectedTableId || tables.length === 0) return false;
    const match = tables.find((t) => String(t.id) === String(selectedTableId));
    return match ? match.statusCode === 'LOCKED' : false;
  }, [selectedTableId, tables]);

  const selectableTables = useMemo(() => {
    const list = [...availableTables];

    if (assignedTable) {
      const alreadyIncluded = list.some((t) => String(t.id) === String(assignedTable.id));
      if (!alreadyIncluded) {
        const matchInAll = tables.find((t) => String(t.id) === String(assignedTable.id));
        if (matchInAll) {
          list.unshift(matchInAll);
        } else {
          list.unshift({
            id: assignedTable.id,
            tableNumber: assignedTable.tableNumber,
            capacity: assignedTable.capacity,
            area: { name: 'Assigned' },
          });
        }
      }
    }

    return list;
  }, [availableTables, assignedTable, tables]);

  const tableOptions = useMemo(() => {
    const placeholderLabel = tablesLoading
      ? 'Đang tải danh sách bàn...'
      : tablesError
        ? 'Lỗi tải danh sách bàn'
        : selectableTables.length === 0
          ? 'Không có bàn khả dụng'
          : '-- Chọn bàn --';

    return [
      { label: placeholderLabel, value: '' },
      ...selectableTables.map((t) => {
        let label = `Bàn ${t.tableNumber} — ${t.capacity} chỗ (${t.area?.name || 'Chung'})`;
        if (assignedTable && String(t.id) === String(assignedTable.id)) {
          if (t.statusCode === 'LOCKED') {
            label += ' (Hiện tại - Đang khóa)';
          } else {
            label += ' (Hiện tại)';
          }
        }
        return {
          label,
          value: String(t.id),
        };
      }),
    ];
  }, [selectableTables, tablesLoading, tablesError, assignedTable]);

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

    if (isEditMode) {
      if (isNonEditable) {
        setSubmitError(`Only reservations with PENDING status can be edited. Current status: ${currentReservation?.reservationStatus}.`);
        return;
      }
      if (isSelectedTableLocked) {
        setSubmitError(
          availableTables.length === 0
            ? 'Bàn hiện tại đang bị khóa (LOCKED) và không có bàn khả dụng nào khác để thay thế.'
            : 'Bàn hiện tại đang bị khóa (LOCKED). Vui lòng chọn một bàn khả dụng khác từ danh sách.'
        );
        return;
      }
      if (availableTables.length === 0) {
        setSubmitError('Hiện tại không có bàn khả dụng nào để cập nhật đặt bàn.');
        return;
      }
    }

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

      if (isEditMode) {
        const response = await reservationApi.update(id, payload);
        const reference = response?.reservationNo || currentReservation?.reservationNo || `Reservation #${id}`;
        navigate(ROUTES.RESERVATIONS_ME, {
          state: { message: `Reservation ${reference} updated successfully!` },
        });
      } else {
        const response = await reservationApi.create(payload);
        const reference = response?.reservationNo || response?.id || 'Confirmed';
        setSubmitSuccess(`Reservation created successfully! Reference: ${reference}`);
        setSelectedTableId('');
        setValues((current) => ({
          ...current,
          note: '',
        }));
      }
    } catch (err) {
      const fallbackMessage = isEditMode
        ? 'Unable to update reservation. Please try again.'
        : 'Unable to create reservation. Please try again.';
      setSubmitError(err.message || fallbackMessage);
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
            <Typography variant="h3">
              {isEditMode ? 'Update reservation' : 'Reserve your table'}
            </Typography>
            {isEditMode && currentReservation?.reservationStatus ? (
              <Badge tone={statusTones[currentReservation.reservationStatus] || 'neutral'}>
                {currentReservation.reservationStatus}
              </Badge>
            ) : null}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isEditMode
              ? currentReservation?.reservationNo
                ? `Reference: ${currentReservation.reservationNo}`
                : `Reservation #${id}`
              : 'Use the contract-aligned reservation payload and start/end time fields to schedule your dining experience.'}
          </Typography>

          {!isEditMode && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                p: 2.5,
                mb: 3,
                borderRadius: 3,
                bgcolor: '#F5F3FF',
                border: '1px solid #C4B5FD',
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <StarIcon sx={{ color: '#6D28D9', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#6D28D9' }}>
                    Looking for a Private VIP Suite?
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: 13 }}>
                  Experience luxury private dining with dedicated service and exclusive amenities.
                </Typography>
              </Box>
              <Button
                variant="primary"
                size="small"
                onClick={() => navigate(ROUTES.RESERVATION_VIP || '/reservations/vip')}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Book a VIP Room
              </Button>
            </Box>
          )}

          {reservationLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Loading label="Loading reservation details..." />
            </Box>
          ) : reservationError ? (
            <Stack spacing={2} sx={{ py: 3 }}>
              <ErrorState
                title="Unable to load reservation"
                description={reservationError}
                onRetry={fetchReservation}
              />
              <Button
                variant="secondary"
                onClick={() => navigate(ROUTES.RESERVATIONS_ME)}
                sx={{ alignSelf: 'center' }}
              >
                Back to My Reservations
              </Button>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {isNonEditable ? (
                <Alert severity="warning">
                  Only reservations with <strong>PENDING</strong> status can be edited. This reservation is currently{' '}
                  <strong>{currentReservation?.reservationStatus}</strong> and cannot be modified.
                </Alert>
              ) : null}

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

              {isAssignedTableLocked && isSelectedTableLocked ? (
                <Alert severity="warning">
                  {availableTables.length === 0
                    ? `Bàn hiện tại của bạn (Bàn ${assignedTable?.tableNumber}) đang trong trạng thái khóa (LOCKED) và hiện không có bàn khả dụng nào khác để đổi. Không thể lưu thay đổi vào lúc này.`
                    : `Bàn hiện tại của bạn (Bàn ${assignedTable?.tableNumber}) đang trong trạng thái khóa (LOCKED). Bạn phải chọn một bàn khả dụng khác từ danh sách để có thể lưu thay đổi.`}
                </Alert>
              ) : isAssignedTableLocked && !isSelectedTableLocked ? (
                <Alert severity="info">
                  Bàn ban đầu (Bàn {assignedTable?.tableNumber}) đang bị khóa. Bạn đã chọn một bàn khả dụng khác để thay thế.
                </Alert>
              ) : isEditMode && !tablesLoading && !tablesError && availableTables.length === 0 ? (
                <Alert severity="warning">
                  Hiện tại không có bàn khả dụng nào trong hệ thống.
                </Alert>
              ) : null}

              <Select
                label="Table"
                name="tableId"
                value={selectedTableId}
                onChange={handleTableChange}
                options={tableOptions}
                disabled={
                  isNonEditable ||
                  submitting ||
                  tablesLoading ||
                  Boolean(tablesError) ||
                  (isEditMode ? selectableTables.length === 0 : availableTables.length === 0)
                }
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
                disabled={isNonEditable || submitting}
                InputLabelProps={{ shrink: true }}
              />
              <Input
                label="End time"
                name="endTime"
                type="datetime-local"
                value={values.endTime}
                onChange={handleChange}
                disabled={isNonEditable || submitting}
                InputLabelProps={{ shrink: true }}
              />
              <Select
                label="Party size"
                name="partySize"
                value={values.partySize}
                onChange={handleChange}
                options={partySizeOptions}
                disabled={isNonEditable || submitting}
              />
              <Select
                label="Reservation type"
                name="reservationType"
                value={values.reservationType}
                onChange={handleChange}
                options={reservationTypeOptions}
                disabled={isNonEditable || submitting}
              />
              <Input
                label="Note"
                name="note"
                value={values.note}
                onChange={handleChange}
                multiline
                minRows={3}
                disabled={isNonEditable || submitting}
              />

              {submitError ? <Alert severity="error">{submitError}</Alert> : null}
              {submitSuccess ? <Alert severity="success">{submitSuccess}</Alert> : null}

              {isEditMode ? (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      isNonEditable ||
                      submitting ||
                      tablesLoading ||
                      Boolean(tablesError) ||
                      availableTables.length === 0 ||
                      isSelectedTableLocked
                    }
                  >
                    {tablesLoading
                      ? 'Đang tải danh sách bàn...'
                      : submitting
                        ? 'Saving changes...'
                        : 'Save changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(ROUTES.RESERVATIONS_ME)}
                  >
                    Back to My Reservations
                  </Button>
                </Box>
              ) : (
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
              )}
            </Stack>
          )}
        </Paper>
      </Container>
      <Footer />
    </>
  );
}

export default ReservationPage;
