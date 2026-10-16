import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import StarIcon from '@mui/icons-material/Star';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import Loading from '../components/ui/Loading';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { roomApi, roomReservationApi } from '../api/contracts';
import { ROUTES } from '../routes/routeConstants';

const partySizeOptions = [
  { label: 'Single (1 guest)', value: 'SINGLE' },
  { label: 'Small (2 guests)', value: 'SMALL' },
  { label: 'Medium (3-4 guests)', value: 'MEDIUM' },
  { label: 'Large (5-6 guests)', value: 'LARGE' },
  { label: 'Extra Large (7+ guests)', value: 'XLARGE' },
];

const getDefaultTimes = () => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(19, 0, 0, 0);

  const end = new Date(start);
  end.setHours(21, 30, 0, 0);

  const formatLocal = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return {
    startTime: formatLocal(start),
    endTime: formatLocal(end),
  };
};

function ReservationVipPage() {
  const navigate = useNavigate();
  const defaultTimes = useMemo(() => getDefaultTimes(), []);

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState('');

  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [values, setValues] = useState({
    partySize: 'MEDIUM',
    startTime: defaultTimes.startTime,
    endTime: defaultTimes.endTime,
    note: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  const fetchVipRooms = useCallback(async () => {
    setRoomsLoading(true);
    setRoomsError('');
    try {
      const data = await roomApi.getVipRooms();
      const list = Array.isArray(data) ? data : [];
      setRooms(list);
      const firstAvailable = list.find((r) => r.roomStatus !== 'MAINTENANCE');
      if (firstAvailable) {
        setSelectedRoomId(String(firstAvailable.id));
      } else if (list.length > 0) {
        setSelectedRoomId(String(list[0].id));
      }
    } catch (err) {
      setRoomsError(err.message || 'Unable to load VIP suites.');
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadInitialRooms = async () => {
      try {
        const data = await roomApi.getVipRooms();
        if (ignore) return;
        const list = Array.isArray(data) ? data : [];
        setRooms(list);
        const firstAvailable = list.find((r) => r.roomStatus !== 'MAINTENANCE');
        if (firstAvailable) {
          setSelectedRoomId(String(firstAvailable.id));
        } else if (list.length > 0) {
          setSelectedRoomId(String(list[0].id));
        }
      } catch (err) {
        if (!ignore) {
          setRoomsError(err.message || 'Unable to load VIP suites.');
        }
      } finally {
        if (!ignore) {
          setRoomsLoading(false);
        }
      }
    };

    loadInitialRooms();
    return () => {
      ignore = true;
    };
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r.id) === String(selectedRoomId)),
    [rooms, selectedRoomId],
  );

  const roomSelectOptions = useMemo(
    () =>
      rooms.map((r) => ({
        label: `${r.roomName} (Max ${r.capacity} guests${r.price ? ` - $${r.price}` : ''})${r.roomStatus === 'MAINTENANCE' ? ' [Under Maintenance]' : ''}`,
        value: String(r.id),
      })),
    [rooms],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError('');
  };

  const handleRoomSelect = (id) => {
    setSelectedRoomId(String(id));
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRoomId) {
      setSubmitError('Please select a VIP room for your reservation.');
      return;
    }

    if (selectedRoom?.roomStatus === 'MAINTENANCE') {
      setSubmitError('The selected VIP room is currently under maintenance. Please select another room.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        partySize: values.partySize,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        roomIds: [Number(selectedRoomId)],
        note: values.note.trim(),
      };

      const response = await roomReservationApi.booking(payload);
      setConfirmedReservation({
        ...response,
        roomDetails: selectedRoom,
        reservedStart: values.startTime,
        reservedEnd: values.endTime,
      });
    } catch (err) {
      setSubmitError(err.message || 'Unable to complete your VIP reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setConfirmedReservation(null);
    setValues({
      partySize: 'MEDIUM',
      startTime: defaultTimes.startTime,
      endTime: defaultTimes.endTime,
      note: '',
    });
    setSubmitError('');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F8FAFC' }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 }, flex: 1 }}>
        {/* Header Banner */}
        <Box sx={{ mb: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <Chip
            icon={<StarIcon sx={{ fontSize: '16px !important', color: '#6D28D9 !important' }} />}
            label="Exclusive VIP Dining"
            sx={{
              bgcolor: '#F5F3FF',
              color: '#6D28D9',
              fontWeight: 700,
              fontSize: '13px',
              border: '1px solid #C4B5FD',
              mb: 2,
              px: 1,
            }}
          />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              color: '#1E1B2E',
              letterSpacing: '-0.03em',
              fontSize: { xs: '28px', md: '38px' },
              mb: 1.5,
            }}
          >
            Reserve Your Private VIP Suite
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#64748B',
              maxWidth: 640,
              mx: 'auto',
              fontSize: { xs: '14px', md: '16px' },
            }}
          >
            Indulge in an elevated dining experience featuring dedicated hospitality staff, bespoke culinary service, and complete privacy for your special occasions.
          </Typography>
        </Box>

        {confirmedReservation ? (
          /* Confirmation Success Card */
          <Paper
            elevation={0}
            sx={{
              maxWidth: 680,
              mx: 'auto',
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 12px 32px rgba(109, 40, 217, 0.08)',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <CheckCircleOutlinedIcon sx={{ fontSize: 38 }} />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E1B2E', mb: 1, fontSize: { xs: '22px', md: '28px' } }}>
              VIP Suite Confirmed!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Your exclusive private room reservation has been created.
            </Typography>

            <Box
              sx={{
                bgcolor: '#F5F3FF',
                borderRadius: 3,
                p: 3,
                mb: 3.5,
                border: '1px solid #EDE9FE',
                textAlign: 'left',
              }}
            >
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Reservation Reference
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#6D28D9' }}>
                    {confirmedReservation.reservationNo || `RES-VIP-${confirmedReservation.id}`}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: '#E2E8F0' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Reserved Suite
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E1B2E' }}>
                    {confirmedReservation.roomDetails?.roomName || 'VIP Room'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Guest Capacity
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E1B2E' }}>
                    Up to {confirmedReservation.roomDetails?.capacity || 'N/A'} guests
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Date & Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E1B2E' }}>
                    {new Date(confirmedReservation.reservedStart).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                    Reservation Status
                  </Typography>
                  <Chip
                    label={confirmedReservation.reservationStatus || 'PENDING'}
                    size="small"
                    sx={{
                      bgcolor: '#FEF3C7',
                      color: '#D97706',
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  />
                </Box>
              </Stack>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button variant="secondary" onClick={handleReset}>
                Reserve Another Suite
              </Button>
              <Button variant="primary" onClick={() => navigate(ROUTES.HOME)}>
                Return to Home
              </Button>
            </Stack>
          </Paper>
        ) : (
          /* Main Reservation Form & Room Selection */
          <Grid container spacing={4}>
            {/* Left Column: Room Cards */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  bgcolor: '#FFFFFF',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <MeetingRoomOutlinedIcon sx={{ color: '#6D28D9' }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E1B2E' }}>
                    Select a VIP Suite
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                  Choose the private room suited to your celebration or dining party size.
                </Typography>

                {roomsLoading ? (
                  <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <Loading label="Loading available VIP suites..." />
                  </Box>
                ) : roomsError ? (
                  <Alert
                    severity="error"
                    action={
                      <Button variant="ghost" size="small" onClick={fetchVipRooms}>
                        Retry
                      </Button>
                    }
                  >
                    {roomsError}
                  </Alert>
                ) : rooms.length === 0 ? (
                  <EmptyState
                    title="No VIP suites available"
                    description="There are currently no VIP suites configured. You can still book standard dining tables."
                    action={
                      <Button variant="primary" size="small" onClick={() => navigate(ROUTES.RESERVATION_NEW)}>
                        Reserve a Table
                      </Button>
                    }
                  />
                ) : (
                  <Stack spacing={2}>
                    {rooms.map((room) => {
                      const isSelected = String(room.id) === String(selectedRoomId);
                      const isMaintenance = room.roomStatus === 'MAINTENANCE';

                      return (
                        <Card
                          key={room.id}
                          variant="outlined"
                          sx={{
                            borderRadius: 3,
                            borderColor: isSelected ? '#6D28D9' : '#E2E8F0',
                            borderWidth: isSelected ? 2 : 1,
                            bgcolor: isSelected ? '#F5F3FF' : '#FFFFFF',
                            opacity: isMaintenance ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: isMaintenance ? '#E2E8F0' : '#8B5CF6',
                              boxShadow: isMaintenance ? 'none' : '0 6px 18px rgba(109, 40, 217, 0.08)',
                            },
                          }}
                        >
                          <CardActionArea
                            onClick={() => !isMaintenance && handleRoomSelect(room.id)}
                            disabled={isMaintenance}
                            sx={{ p: 2 }}
                          >
                            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E1B2E' }}>
                                    {room.roomName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                                    {room.roomType || 'VIP_ROOM'}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {isMaintenance ? (
                                    <Chip label="Maintenance" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: 11 }} />
                                  ) : isSelected ? (
                                    <Chip label="Selected" size="small" sx={{ bgcolor: '#6D28D9', color: '#FFFFFF', fontWeight: 700, fontSize: 11 }} />
                                  ) : (
                                    <Chip label={room.roomStatus || 'AVAILABLE'} size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 600, fontSize: 11 }} />
                                  )}
                                </Stack>
                              </Box>

                              {room.description && (
                                <Typography variant="body2" sx={{ color: '#475569', fontSize: 13, mb: 1.5 }}>
                                  {room.description}
                                </Typography>
                              )}

                              <Divider sx={{ my: 1.25, borderColor: isSelected ? '#EDE9FE' : '#F1F5F9' }} />

                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#64748B' }}>
                                  <PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    Capacity: up to {room.capacity} guests
                                  </Typography>
                                </Box>
                                {room.price ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: '#6D28D9', fontWeight: 700 }}>
                                    <AttachMoneyIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#6D28D9' }}>
                                      {room.price}
                                    </Typography>
                                  </Box>
                                ) : null}
                              </Box>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Paper>
            </Grid>

            {/* Right Column: Reservation Details Form */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                component="form"
                onSubmit={handleSubmit}
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  bgcolor: '#FFFFFF',
                  position: { md: 'sticky' },
                  top: { md: 100 },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E1B2E', mb: 0.5 }}>
                  Booking Details
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                  Select your schedule, party size, and any custom requirements.
                </Typography>

                <Stack spacing={2.5}>
                  {/* Fallback select if rooms are loaded */}
                  {rooms.length > 0 && (
                    <Select
                      label="Selected VIP Suite"
                      name="selectedRoomId"
                      value={selectedRoomId}
                      onChange={(e) => handleRoomSelect(e.target.value)}
                      options={roomSelectOptions}
                    />
                  )}

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                      <CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: '#6D28D9' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E1B2E' }}>
                        Reservation Schedule
                      </Typography>
                    </Box>
                    <Stack spacing={1.5}>
                      <Input
                        label="Start time"
                        name="startTime"
                        type="datetime-local"
                        value={values.startTime}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                      <Input
                        label="End time"
                        name="endTime"
                        type="datetime-local"
                        value={values.endTime}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Stack>
                  </Box>

                  <Select
                    label="Party size"
                    name="partySize"
                    value={values.partySize}
                    onChange={handleChange}
                    options={partySizeOptions}
                  />

                  <Input
                    label="Special requests or dietary notes"
                    name="note"
                    value={values.note}
                    onChange={handleChange}
                    multiline
                    minRows={3}
                    placeholder="E.g., Birthday celebration, wine pairing preferences, floral centerpiece..."
                  />

                  {/* Room Summary Preview */}
                  {selectedRoom && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: '#F5F3FF',
                        border: '1px solid #EDE9FE',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#6D28D9', display: 'block', mb: 0.5 }}>
                        SELECTED SUITE SUMMARY
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#1E1B2E' }}>
                        {selectedRoom.roomName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Capacity: up to {selectedRoom.capacity} guests {selectedRoom.price ? `• $${selectedRoom.price}` : ''}
                      </Typography>
                    </Box>
                  )}

                  {submitError && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {submitError}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    disabled={submitting || roomsLoading || !selectedRoomId}
                  >
                    {submitting ? 'Confirming VIP Reservation...' : 'Confirm VIP Reservation'}
                  </Button>

                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => navigate(ROUTES.RESERVATION_NEW)}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    >
                      Need a regular table instead?
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      <Footer />
    </Box>
  );
}

export default ReservationVipPage;
