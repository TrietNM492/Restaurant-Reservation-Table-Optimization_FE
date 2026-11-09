import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Container, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';

function CrownIcon(props) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      {...props}
    >
      <path d="M5 19h14v-2H5v2zm0-4h14l1.5-9-4.5 4.5L12 4 8 10.5 3.5 6 5 15z" />
    </svg>
  );
}

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Loading from '../components/ui/Loading';
import Modal from '../components/ui/Modal';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { reservationApi } from '../api/contracts';
import { ROUTES } from '../routes/routeConstants';

const partySizeLabels = {
  SINGLE: 'Single (1 guest)',
  SMALL: 'Small (2-4 guests)',
  MEDIUM: 'Medium (5-8 guests)',
  LARGE: 'Large (9-12 guests)',
  XLARGE: 'Extra Large (13+ guests)',
};

const statusTones = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'neutral',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
};

const formatTimeRange = (startIso, endIso) => {
  if (!startIso) return 'N/A';
  const startDate = new Date(startIso);
  if (Number.isNaN(startDate.getTime())) return startIso;

  const dateStr = startDate.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const startTimeStr = startDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!endIso) return `${dateStr}, ${startTimeStr}`;
  const endDate = new Date(endIso);
  if (Number.isNaN(endDate.getTime())) return `${dateStr}, ${startTimeStr}`;

  const endTimeStr = endDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateStr} · ${startTimeStr} – ${endTimeStr}`;
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatAssignedResource = (res) => {
  if (res.reservationType === 'VIP_ROOM' || (Array.isArray(res.rooms) && res.rooms.length > 0)) {
    if (!Array.isArray(res.rooms) || res.rooms.length === 0) {
      return 'VIP Room (Unassigned)';
    }
    return res.rooms
      .map((r) => `${r.roomName} (${r.capacity} guests${r.price ? ` - $${r.price}` : ''})`)
      .join(', ');
  }

  if (Array.isArray(res.tables) && res.tables.length > 0) {
    return res.tables
      .map((t) => (t.tableNumber ? `Table ${t.tableNumber} (${t.capacity} seats)` : `Table #${t.id}`))
      .join(', ');
  }

  return 'No table/room assigned';
};

const sortReservations = (items) => {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const timeA = new Date(a.startTime).getTime() || 0;
    const timeB = new Date(b.startTime).getTime() || 0;
    return timeB - timeA;
  });
};

function MyReservationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage = location.state?.message;

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cancellingReservation, setCancellingReservation] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reservationApi.listMine();
      setReservations(sortReservations(data));
    } catch (err) {
      setError(err.message || 'Unable to load reservations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadReservations = async () => {
      try {
        const data = await reservationApi.listMine();
        if (!ignore) {
          setReservations(sortReservations(data));
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Unable to load reservations.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadReservations();

    return () => {
      ignore = true;
    };
  }, [location.key]);

  const handleOpenCancelModal = (res) => {
    if (cancelLoading) return;
    setCancelError('');
    setCancellingReservation(res);
  };

  const handleCloseCancelModal = () => {
    if (cancelLoading) return;
    setCancellingReservation(null);
    setCancelError('');
  };

  const handleConfirmCancel = async () => {
    if (!cancellingReservation?.id || cancelLoading) return;

    setCancelLoading(true);
    setCancelError('');

    try {
      const updated = await reservationApi.cancel(cancellingReservation.id);
      setReservations((prev) =>
        prev.map((r) =>
          r.id === cancellingReservation.id
            ? {
                ...r,
                ...(updated || {}),
                reservationStatus: updated?.reservationStatus || 'CANCELLED',
              }
            : r
        )
      );
      const refNo = updated?.reservationNo || cancellingReservation.reservationNo || `#${cancellingReservation.id}`;
      setActionSuccess(`Reservation ${refNo} has been cancelled successfully.`);
      setCancellingReservation(null);
    } catch (err) {
      setCancelError(err.message || 'Unable to cancel reservation. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
              My Reservations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review your upcoming bookings and reservation details.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="secondary" onClick={() => navigate(ROUTES.RESERVATION_VIP || '/reservations/vip')}>
              Book VIP Suite
            </Button>
            <Button variant="primary" onClick={() => navigate(ROUTES.RESERVATION_NEW || '/reservations/new')}>
              Reserve a Table
            </Button>
          </Stack>
        </Box>

        {flashMessage ? (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {flashMessage}
          </Alert>
        ) : null}

        {actionSuccess ? (
          <Alert
            severity="success"
            onClose={() => setActionSuccess('')}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {actionSuccess}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Loading label="Loading your reservations..." />
          </Box>
        ) : error ? (
          <ErrorState
            title="Unable to load reservations"
            description={error}
            onRetry={fetchReservations}
          />
        ) : reservations.length === 0 ? (
          <EmptyState
            title="No reservations found"
            description="You haven't made any dining reservations yet. Reserve your first table or VIP suite to get started."
            action={
              <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                <Button variant="primary" onClick={() => navigate(ROUTES.RESERVATION_NEW || '/reservations/new')}>
                  Reserve a Table
                </Button>
                <Button variant="secondary" onClick={() => navigate(ROUTES.RESERVATION_VIP || '/reservations/vip')}>
                  Book VIP Suite
                </Button>
              </Stack>
            }
          />
        ) : (
          <Stack spacing={2.5}>
            {reservations.map((res) => {
              const isPending = res.reservationStatus === 'PENDING';
              const canCancel = res.reservationStatus === 'PENDING' || res.reservationStatus === 'CONFIRMED';
              const isVip = res.reservationType === 'VIP_ROOM' || (Array.isArray(res.rooms) && res.rooms.length > 0);

              return (
                <Card
                  key={res.id}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderLeft: isVip ? '4px solid #7C3AED' : '4px solid #64748B',
                    border: '1px solid',
                    borderColor: isVip ? '#DDD6FE' : 'divider',
                    bgcolor: isVip ? '#FCFAFF' : '#FFFFFF',
                    transition: 'box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: isVip
                        ? '0 10px 25px -5px rgba(124, 58, 237, 0.1), 0 8px 10px -6px rgba(124, 58, 237, 0.05)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: 16, md: 18 } }}>
                          {res.reservationNo || `Reservation #${res.id}`}
                        </Typography>
                        {isVip ? (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1.25,
                              py: 0.35,
                              borderRadius: '999px',
                              bgcolor: '#F5F3FF',
                              border: '1px solid #C4B5FD',
                              color: '#6D28D9',
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                            }}
                          >
                            <CrownIcon />
                            <span>VIP ROOM</span>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1.25,
                              py: 0.35,
                              borderRadius: '999px',
                              bgcolor: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              color: '#475569',
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                            }}
                          >
                            <TableRestaurantIcon sx={{ fontSize: 13, color: '#64748B' }} />
                            <span>TABLE</span>
                          </Box>
                        )}
                        <Badge tone={statusTones[res.reservationStatus] || 'neutral'}>
                          {res.reservationStatus}
                        </Badge>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isPending ? (
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => {
                              const tableId = res.tables?.[0]?.id;
                              const isVip = res.reservationType === 'VIP'
                                || res.reservationType === 'VIP_ROOM'
                                || Boolean(res.rooms && res.rooms.length > 0);
                              const queryParams = new URLSearchParams();
                              queryParams.set('reservationId', res.id);
                              if (res.reservationNo) queryParams.set('reservationNo', res.reservationNo);
                              if (tableId) queryParams.set('tableId', tableId);
                              if (isVip) {
                                queryParams.set('isVip', 'true');
                                if (res.rooms?.[0]?.id) queryParams.set('roomId', res.rooms[0].id);
                                if (res.rooms?.[0]?.roomName) queryParams.set('roomName', res.rooms[0].roomName);
                                if (res.rooms?.[0]?.price) queryParams.set('roomPrice', res.rooms[0].price);
                              }
                              navigate(`/menus?${queryParams.toString()}`);
                            }}
                          >
                            Pre-order & Pay Deposit
                          </Button>
                        ) : null}

                        {isPending && !isVip ? (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() =>
                              navigate(`/reservations/${res.id}/edit`, {
                                state: { reservation: res },
                              })
                            }
                          >
                            Edit
                          </Button>
                        ) : null}

                        {canCancel ? (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleOpenCancelModal(res)}
                            sx={{
                              color: '#DC2626',
                              borderColor: '#FECACA',
                              '&:hover': { borderColor: '#DC2626', bgcolor: '#FEF2F2' },
                            }}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.2fr 1fr 1fr' },
                        gap: 2,
                        py: 1.5,
                        borderTop: '1px solid',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                          Date & Time
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatTimeRange(res.startTime, res.endTime)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                          {isVip ? 'VIP Suite' : 'Table(s)'}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: isVip ? '#6D28D9' : 'text.primary',
                          }}
                        >
                          {formatAssignedResource(res)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                          Party Size
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {partySizeLabels[res.partySize] || res.partySize}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      {res.note ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', maxWidth: { xs: '100%', sm: '70%' } }}>
                          Note: &ldquo;{res.note}&rdquo;
                        </Typography>
                      ) : (
                        <Box />
                      )}
                      {res.createdDate ? (
                        <Typography variant="caption" color="text.secondary">
                          Booked on {formatDate(res.createdDate)}
                        </Typography>
                      ) : null}
                    </Box>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}

        <Modal
          open={Boolean(cancellingReservation)}
          onClose={cancelLoading ? () => {} : handleCloseCancelModal}
          title="Cancel Reservation"
          size="medium"
        >
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to cancel reservation{' '}
              <strong>
                {cancellingReservation?.reservationNo || `#${cancellingReservation?.id}`}
              </strong>
              ? This action cannot be undone.
            </Typography>

            {cancellingReservation ? (() => {
              const isCancellingVip =
                cancellingReservation.reservationType === 'VIP_ROOM' ||
                (Array.isArray(cancellingReservation.rooms) && cancellingReservation.rooms.length > 0);

              return (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: isCancellingVip ? '#FAF5FF' : '#F8FAFC',
                    border: '1px solid',
                    borderColor: isCancellingVip ? '#E9D5FF' : '#E2E8F0',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                      Date & Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                      {formatTimeRange(cancellingReservation.startTime, cancellingReservation.endTime)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                      {isCancellingVip ? 'VIP Suite' : 'Table(s)'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        mt: 0.25,
                        color: isCancellingVip ? '#6D28D9' : 'text.primary',
                      }}
                    >
                      {formatAssignedResource(cancellingReservation)}
                    </Typography>
                  </Box>
                </Box>
              );
            })() : null}

            {cancelError ? <Alert severity="error">{cancelError}</Alert> : null}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1 }}>
              <Button
                variant="secondary"
                onClick={handleCloseCancelModal}
                disabled={cancelLoading}
              >
                Keep Reservation
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Reservation'}
              </Button>
            </Box>
          </Stack>
        </Modal>
      </Container>
      <Footer />
    </>
  );
}

export default MyReservationPage;

