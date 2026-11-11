import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import AppPagination from '../components/ui/AppPagination';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Snackbar from '../components/ui/Snackbar';
import { reservationApi } from '../services/reservationService';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Approval' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress (Seated)' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'TABLE', label: 'Dining Table' },
  { value: 'VIP_ROOM', label: 'VIP Room' },
];

const STATUS_TONES = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'neutral',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
};

const PARTY_SIZE_LABELS = {
  SINGLE: 'Single (1)',
  SMALL: 'Small (2-4)',
  MEDIUM: 'Medium (5-8)',
  LARGE: 'Large (9-12)',
  XLARGE: 'Extra Large (13+)',
};

const formatTimeRange = (startIso, endIso) => {
  if (!startIso) return 'N/A';
  const startDate = new Date(startIso);
  if (Number.isNaN(startDate.getTime())) return startIso;
  const dateStr = startDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const startTimeStr = startDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (!endIso) return `${dateStr} · ${startTimeStr}`;
  const endDate = new Date(endIso);
  const endTimeStr = !Number.isNaN(endDate.getTime())
    ? endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '';
  return `${dateStr} · ${startTimeStr} – ${endTimeStr}`;
};

const formatAssignedResources = (row) => {
  if (row.reservationType === 'VIP_ROOM' || (row.rooms && row.rooms.length > 0)) {
    if (!row.rooms || row.rooms.length === 0) return 'VIP Room (Unassigned)';
    return row.rooms.map((r) => r.roomName || `Room #${r.id}`).join(', ');
  }
  if (!row.tables || row.tables.length === 0) return 'Table (Unassigned)';
  return row.tables.map((t) => `Table ${t.tableNumber}`).join(', ');
};

export default function AdminReservationPage() {
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals & Actions
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');
  const [checkInTarget, setCheckInTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Feedback notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', tone: 'success' });
  const [errorMessage, setErrorMessage] = useState('');

  const fetchReservations = useCallback(async (targetPage, q, status, type) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await reservationApi.adminList({
        page: targetPage - 1,
        size: PAGE_SIZE,
        q: q ? q.trim() : undefined,
        status: status || undefined,
        type: type || undefined,
      });

      const items = response?.result ?? (Array.isArray(response) ? response : []);
      const meta = response?.meta;

      setReservations(items);
      setTotal(meta?.total ?? items.length);
      setPageCount(meta?.pages ?? Math.ceil((meta?.total ?? items.length) / PAGE_SIZE));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load reservations';
      setErrorMessage(msg);
      setReservations([]);
      setTotal(0);
      setPageCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations(page, searchQuery, statusFilter, typeFilter);
  }, [fetchReservations, page, searchQuery, statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
  };

  const handleRefresh = () => {
    fetchReservations(page, searchQuery, statusFilter, typeFilter);
  };

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await reservationApi.confirm(approveTarget.id);
      setSnackbar({
        open: true,
        message: `Reservation #${approveTarget.reservationNo} has been confirmed.`,
        tone: 'success',
      });
      setApproveTarget(null);
      fetchReservations(page, searchQuery, statusFilter, typeFilter);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to confirm reservation',
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (rejectReason.length > 200) {
      setRejectReasonError('Rejection reason must not exceed 200 characters');
      return;
    }
    setActionLoading(true);
    try {
      await reservationApi.reject(rejectTarget.id, rejectReason);
      setSnackbar({
        open: true,
        message: `Reservation #${rejectTarget.reservationNo} has been rejected.`,
        tone: 'success',
      });
      setRejectTarget(null);
      setRejectReason('');
      setRejectReasonError('');
      fetchReservations(page, searchQuery, statusFilter, typeFilter);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to reject reservation',
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckInConfirm = async () => {
    if (!checkInTarget) return;
    setActionLoading(true);
    try {
      await reservationApi.checkIn(checkInTarget.id);
      setSnackbar({
        open: true,
        message: `Reservation #${checkInTarget.reservationNo} checked in successfully.`,
        tone: 'success',
      });
      setCheckInTarget(null);
      fetchReservations(page, searchQuery, statusFilter, typeFilter);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to check in reservation',
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteConfirm = async () => {
    if (!completeTarget) return;
    setActionLoading(true);
    try {
      await reservationApi.complete(completeTarget.id);
      setSnackbar({
        open: true,
        message: `Reservation #${completeTarget.reservationNo} marked as completed.`,
        tone: 'success',
      });
      setCompleteTarget(null);
      fetchReservations(page, searchQuery, statusFilter, typeFilter);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Failed to complete reservation',
        tone: 'danger',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: { xs: 2, md: 3 } }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              fontSize: { xs: 20, sm: 24 },
            }}
          >
            Reservation Management
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#64748B',
              mt: 0.5,
              fontSize: { xs: 12, sm: 14 },
            }}
          >
            Review customer bookings, approve incoming requests, and manage check-ins.
          </Typography>
        </Box>
        <IconButton
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh reservations"
          sx={{
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            alignSelf: { xs: 'flex-end', sm: 'center' },
            flexShrink: 0,
            '&:hover': { bgcolor: '#F1F5F9' },
          }}
        >
          <RefreshRoundedIcon sx={{ color: '#6D28D9' }} />
        </IconButton>
      </Stack>

      {/* Error banner */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: { xs: 2, md: 3 }, borderRadius: '12px' }}>
          {errorMessage}
        </Alert>
      )}

      {/* Filters & Search */}
      <Box
        component="form"
        onSubmit={handleSearchSubmit}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: { xs: 2, md: 3 },
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexWrap="wrap"
          useFlexGap
          sx={{ width: '100%' }}
        >
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 240px' }, minWidth: { xs: '100%', sm: 200 } }}>
            <Input
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by reservation # or customer username..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 180px', md: '0 0 190px' }, minWidth: { xs: '100%', sm: 160 } }}>
            <Select
              label="Status"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 150px', md: '0 0 160px' }, minWidth: { xs: '100%', sm: 140 } }}>
            <Select
              label="Type"
              value={typeFilter}
              options={TYPE_OPTIONS}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="primary"
            size="medium"
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: 90 },
              height: 42,
              alignSelf: { xs: 'stretch', sm: 'flex-end' },
            }}
          >
            Search
          </Button>
        </Stack>
      </Box>

      {/* Data Table with Responsive Horizontal Scroll Container */}
      <Box
        sx={{
          bgcolor: '#fff',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={36} sx={{ color: '#6D28D9' }} />
          </Box>
        ) : (
          <>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                maxHeight: 620,
                width: '100%',
                maxWidth: '100%',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                borderRadius: 0,
                bgcolor: 'transparent',
              }}
            >
              <MuiTable
                stickyHeader
                size="small"
                aria-label="Reservations management table"
                sx={{
                  minWidth: 960,
                  width: '100%',
                  '& .MuiTableCell-root': {
                    px: { xs: 1.5, md: 2 },
                    py: 1.5,
                    borderBottom: '1px solid #F1E8FF',
                    color: '#475569',
                    fontSize: 12,
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    bgcolor: '#F8FAFC',
                    color: '#475569',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.075em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #E2E8F0',
                    whiteSpace: 'nowrap',
                  },
                  '& .MuiTableBody-root .MuiTableRow-root:hover': {
                    bgcolor: '#F8FAFC',
                  },
                  '& .MuiTableBody-root .MuiTableRow-root': {
                    transition: 'background-color 0.15s ease',
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 140 }}>Reservation #</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Customer</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Assigned / Party</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Date & Time</TableCell>
                    <TableCell sx={{ minWidth: 110 }}>Status</TableCell>
                    <TableCell sx={{ minWidth: 140, maxWidth: 220 }}>Note</TableCell>
                    <TableCell sx={{ minWidth: 190, pr: { xs: 2, md: 3 } }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservations.length > 0 ? (
                    reservations.map((row) => (
                      <TableRow key={row.id}>
                        {/* 1. Reservation # */}
                        <TableCell sx={{ minWidth: 140, verticalAlign: 'middle' }}>
                          <Stack spacing={0.5}>
                            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#1E293B', whiteSpace: 'nowrap' }}>
                              {row.reservationNo}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>
                              Created {row.createdDate ? new Date(row.createdDate).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* 2. Customer */}
                        <TableCell sx={{ minWidth: 180, verticalAlign: 'middle' }}>
                          <Stack spacing={0.25}>
                            <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#1E293B' }}>
                              {row.customerName || row.createdBy || 'Unknown Customer'}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>
                              @{row.createdBy || 'anonymous'} {row.customerPhone ? `· ${row.customerPhone}` : ''}
                            </Typography>
                            {row.customerEmail && (
                              <Typography sx={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                                {row.customerEmail}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>

                        {/* 3. Assigned / Party */}
                        <TableCell sx={{ minWidth: 160, verticalAlign: 'middle' }}>
                          <Stack spacing={0.5}>
                            <Typography sx={{ fontWeight: 600, fontSize: 12, color: '#334155' }}>
                              {formatAssignedResources(row)}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>
                              {PARTY_SIZE_LABELS[row.partySize] || row.partySize || 'Standard'}
                              {row.reservationType === 'VIP_ROOM' ? ' · VIP Suite' : ' · Dining Table'}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* 4. Date & Time */}
                        <TableCell sx={{ minWidth: 160, verticalAlign: 'middle' }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#1E293B', whiteSpace: 'nowrap' }}>
                            {formatTimeRange(row.startTime, row.endTime)}
                          </Typography>
                        </TableCell>

                        {/* 5. Status */}
                        <TableCell sx={{ minWidth: 110, verticalAlign: 'middle' }}>
                          <Badge tone={STATUS_TONES[row.reservationStatus] || 'neutral'}>
                            {row.reservationStatus}
                          </Badge>
                        </TableCell>

                        {/* 6. Note */}
                        <TableCell sx={{ minWidth: 140, maxWidth: 220, verticalAlign: 'middle' }}>
                          <Tooltip title={row.note || 'No special requests'} arrow>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: row.note ? '#475569' : '#94A3B8',
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {row.note || 'None'}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        {/* 7. Actions */}
                        <TableCell sx={{ minWidth: 190, pr: { xs: 2, md: 3 }, verticalAlign: 'middle' }}>
                          {row.reservationStatus === 'PENDING' && (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 0.75, alignItems: 'center' }}>
                              <Button
                                variant="primary"
                                size="small"
                                onClick={() => setApproveTarget(row)}
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                                  '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' },
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="small"
                                onClick={() => {
                                  setRejectTarget(row);
                                  setRejectReason('');
                                  setRejectReasonError('');
                                }}
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Reject
                              </Button>
                            </Stack>
                          )}

                          {row.reservationStatus === 'CONFIRMED' && (
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => setCheckInTarget(row)}
                              sx={{ px: 1.75, py: 0.5, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                              Check-In
                            </Button>
                          )}

                          {row.reservationStatus === 'IN_PROGRESS' && (
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => setCompleteTarget(row)}
                              sx={{ px: 1.75, py: 0.5, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                              Complete
                            </Button>
                          )}

                          {!['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(row.reservationStatus) && (
                            <Typography sx={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748B' }}>
                        No reservations match the specified filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </MuiTable>
            </TableContainer>

            {total > 0 && (
              <Box sx={{ borderTop: '1px solid #E2E8F0', bgcolor: '#fff', width: '100%', overflowX: 'auto' }}>
                <AppPagination
                  page={page}
                  pageCount={pageCount}
                  total={total}
                  pageSize={PAGE_SIZE}
                  onChange={(nextPage) => setPage(nextPage)}
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(approveTarget)}
        title="Approve Reservation"
        tone="success"
        confirmLabel={actionLoading ? 'Approving…' : 'Approve Reservation'}
        onCancel={() => setApproveTarget(null)}
        onConfirm={handleApproveConfirm}
      >
        <Typography sx={{ fontSize: 14 }}>
          Are you sure you want to approve reservation <strong>#{approveTarget?.reservationNo}</strong> for{' '}
          <strong>{approveTarget?.customerName || approveTarget?.createdBy}</strong>?
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#64748B', mt: 1 }}>
          The status will be updated to <strong>CONFIRMED</strong> and the reserved tables will remain secured.
        </Typography>
      </ConfirmDialog>

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Reject Reservation"
        tone="danger"
        confirmLabel={actionLoading ? 'Rejecting…' : 'Reject Reservation'}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason('');
          setRejectReasonError('');
        }}
        onConfirm={handleRejectConfirm}
      >
        <Typography sx={{ fontSize: 14 }}>
          Are you sure you want to reject reservation <strong>#{rejectTarget?.reservationNo}</strong>?
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#64748B', mt: 0.5, mb: 2 }}>
          The status will be updated to <strong>CANCELLED</strong> and assigned resources will be released.
        </Typography>
        <Input
          label="Rejection Reason (Optional)"
          value={rejectReason}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (e.target.value.length <= 200) {
              setRejectReasonError('');
            }
          }}
          error={rejectReasonError}
          hint={`${rejectReason.length}/200 characters`}
          multiline
          rows={3}
          placeholder="Specify reason (e.g. Fully booked for special event)..."
        />
      </ConfirmDialog>

      {/* Check-In Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(checkInTarget)}
        title="Customer Check-In"
        tone="primary"
        confirmLabel={actionLoading ? 'Checking in…' : 'Confirm Check-In'}
        onCancel={() => setCheckInTarget(null)}
        onConfirm={handleCheckInConfirm}
      >
        <Typography sx={{ fontSize: 14 }}>
          Confirm physical arrival and check-in for reservation <strong>#{checkInTarget?.reservationNo}</strong>?
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#64748B', mt: 1 }}>
          This will update the reservation status to <strong>IN_PROGRESS</strong>.
        </Typography>
      </ConfirmDialog>

      {/* Complete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(completeTarget)}
        title="Complete Dining Session"
        tone="success"
        confirmLabel={actionLoading ? 'Completing…' : 'Complete Reservation'}
        onCancel={() => setCompleteTarget(null)}
        onConfirm={handleCompleteConfirm}
      >
        <Typography sx={{ fontSize: 14 }}>
          Mark reservation <strong>#{completeTarget?.reservationNo}</strong> as completed?
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#64748B', mt: 1 }}>
          This will finalize the dining session and set status to <strong>COMPLETED</strong>.
        </Typography>
      </ConfirmDialog>

      {/* Feedback Toast */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        tone={snackbar.tone}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
}
