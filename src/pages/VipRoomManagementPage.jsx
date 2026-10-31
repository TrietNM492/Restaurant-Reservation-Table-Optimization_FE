import { useCallback, useEffect, useRef, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BuildCircleRoundedIcon from '@mui/icons-material/BuildCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import AppPagination from '../components/ui/AppPagination';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import { adminRoomApi, ROOM_STATUSES, ROOM_TYPES } from '../services/roomService';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const ROOM_TYPE_OPTIONS = ROOM_TYPES.map((type) => ({
  value: type,
  label: type.replace('_', ' '),
}));

const ROOM_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Room Types' },
  ...ROOM_TYPE_OPTIONS,
];

const ROOM_STATUS_OPTIONS = ROOM_STATUSES.map((status) => ({
  value: status,
  label: status,
}));

const ROOM_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...ROOM_STATUS_OPTIONS,
];

const STATUS_BADGE_TONE = {
  AVAILABLE: 'success',
  RESERVED: 'info',
  PREPARING: 'warning',
  OCCUPIED: 'danger',
  CLEANING: 'neutral',
  MAINTENANCE: 'warning',
};

const EMPTY_FORM = {
  roomName: '',
  roomType: 'VIP_ROOM',
  capacity: 10,
  price: 0,
  roomStatus: 'AVAILABLE',
  description: '',
};

// ─── Form Modal Component ───────────────────────────────────────────────────

function RoomForm({ values, errors, onChange, checkingName }) {
  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Input
        label="Room Name *"
        name="roomName"
        value={values.roomName}
        onChange={onChange}
        error={errors.roomName}
        hint={
          checkingName
            ? 'Checking room name availability…'
            : '2 to 100 characters (e.g. Royal VIP Room 1)'
        }
        slotProps={{
          input: {
            endAdornment: checkingName ? (
              <InputAdornment position="end">
                <CircularProgress size={18} sx={{ color: '#6D28D9' }} />
              </InputAdornment>
            ) : null,
          },
        }}
      />

      <Select
        label="Room Type *"
        name="roomType"
        value={values.roomType}
        onChange={onChange}
        options={ROOM_TYPE_OPTIONS}
        error={errors.roomType}
      />

      <Input
        label="Capacity (Min 10 guests) *"
        name="capacity"
        type="number"
        value={values.capacity}
        onChange={onChange}
        error={errors.capacity}
        hint="VIP rooms require a minimum capacity of 10"
      />

      <Input
        label="Price (VND) *"
        name="price"
        type="number"
        value={values.price}
        onChange={onChange}
        error={errors.price}
        hint="Base fee or hourly reservation price (non-negative)"
      />

      <Select
        label="Status"
        name="roomStatus"
        value={values.roomStatus}
        onChange={onChange}
        options={ROOM_STATUS_OPTIONS}
      />

      <Input
        label="Description"
        name="description"
        value={values.description}
        onChange={onChange}
        multiline
        rows={3}
        error={errors.description}
        hint={`${values.description?.length || 0}/500 characters`}
      />
    </Stack>
  );
}

// ─── Change Status Quick Dialog ─────────────────────────────────────────────

function ChangeRoomStatusDialog({ open, room, onClose, onConfirm, loading }) {
  const [selectedStatus, setSelectedStatus] = useState(room?.roomStatus || 'AVAILABLE');

  useEffect(() => {
    if (room?.roomStatus) {
      setSelectedStatus(room.roomStatus);
    }
  }, [room]);

  return (
    <Modal open={open} onClose={onClose} title="Change Room Status" size="small">
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Update status for room <strong>{room?.roomName}</strong>:
        </Typography>

        <Select
          label="New Room Status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={ROOM_STATUS_OPTIONS}
        />

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(room.id, selectedStatus)}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update Status'}
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
}

// ─── Main VIP Room Management Page ──────────────────────────────────────────

export default function VipRoomManagementPage() {
  // ── List state ──
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  // ── Filter / Search state ──
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const searchTimeout = useRef(null);

  // ── Form Modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [checkingName, setCheckingName] = useState(false);
  const checkDuplicateTimeout = useRef(null);

  // ── Status Dialog state ──
  const [statusDialogRoom, setStatusDialogRoom] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // ── Maintenance state ──
  const [maintLoadingId, setMaintLoadingId] = useState(null);

  // ── Delete confirm state ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─── Fetch List ───────────────────────────────────────────────────────────

  const fetchList = useCallback(async (currentPage, currentQ, currentType, currentStatus) => {
    setLoading(true);
    setListError('');
    try {
      const response = await adminRoomApi.getList({
        page: currentPage - 1, // Spring is 0-indexed
        size: PAGE_SIZE,
        q: currentQ,
        roomType: currentType,
        roomStatus: currentStatus,
      });

      const payload = response?.data ?? response;
      if (payload && typeof payload === 'object' && 'result' in payload) {
        setRows(Array.isArray(payload.result) ? payload.result : []);
        const totalElements =
          payload.meta?.total ??
          payload.meta?.totalElements ??
          (payload.meta?.pages ? payload.meta.pages * PAGE_SIZE : 0);
        setTotal(Number(totalElements) || 0);
      } else if (Array.isArray(payload)) {
        setRows(payload);
        setTotal(payload.length);
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (err) {
      setListError(err.message || 'Failed to load VIP rooms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(page, search, filterType, filterStatus);
  }, [page, filterType, filterStatus, fetchList]);

  // ─── Debounced Search ─────────────────────────────────────────────────────

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchList(1, val, filterType, filterStatus);
    }, 400);
  };

  const handleTypeFilterChange = (e) => {
    setFilterType(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setPage(1);
  };

  // ─── Form Handlers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setFormError('');
    setCheckingName(false);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setFormValues({
      roomName: row.roomName ?? '',
      roomType: row.roomType ?? 'VIP_ROOM',
      capacity: row.capacity ?? 10,
      price: row.price ?? 0,
      roomStatus: row.roomStatus ?? 'AVAILABLE',
      description: row.description ?? '',
    });
    setFormErrors({});
    setFormError('');
    setCheckingName(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!formLoading) {
      clearTimeout(checkDuplicateTimeout.current);
      setModalOpen(false);
    }
  };

  // ─── Real-time Field Validation ───────────────────────────────────────────

  const validateField = (name, value) => {
    let errorMsg = '';

    if (name === 'roomName') {
      const trimmed = String(value || '').trim();
      if (!trimmed) {
        errorMsg = 'Room name cannot be blank.';
      } else if (trimmed.length < 2 || trimmed.length > 100) {
        errorMsg = 'Room name must be between 2 and 100 characters.';
      }
    } else if (name === 'capacity') {
      const cap = Number(value);
      if (value === '' || isNaN(cap)) {
        errorMsg = 'Capacity is required.';
      } else if (cap < 10 || !Number.isInteger(cap)) {
        errorMsg = 'VIP room capacity must be at least 10 guests (integer).';
      }
    } else if (name === 'price') {
      const price = Number(value);
      if (value === '' || isNaN(price)) {
        errorMsg = 'Price is required.';
      } else if (price < 0) {
        errorMsg = 'Price must be non-negative (>= 0).';
      }
    } else if (name === 'roomType') {
      if (!value) {
        errorMsg = 'Room type is required.';
      }
    } else if (name === 'description') {
      if (value && value.length > 500) {
        errorMsg = 'Description cannot exceed 500 characters.';
      }
    }

    return errorMsg;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    const fieldError = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: fieldError }));

    // Debounced check room name duplicate
    if (name === 'roomName') {
      clearTimeout(checkDuplicateTimeout.current);
      const trimmed = String(value || '').trim();

      if (trimmed.length >= 2 && trimmed.length <= 100) {
        setCheckingName(true);
        checkDuplicateTimeout.current = setTimeout(async () => {
          try {
            const isDup = await adminRoomApi.checkRoomNameExists(
              trimmed,
              editTarget?.id ?? null
            );
            if (isDup) {
              setFormErrors((prev) => ({
                ...prev,
                roomName: `Room name "${trimmed}" already exists.`,
              }));
            }
          } finally {
            setCheckingName(false);
          }
        }, 500);
      } else {
        setCheckingName(false);
      }
    }
  };

  const validateAll = () => {
    const errs = {};
    const nameErr = validateField('roomName', formValues.roomName);
    if (nameErr) errs.roomName = nameErr;

    const capErr = validateField('capacity', formValues.capacity);
    if (capErr) errs.capacity = capErr;

    const priceErr = validateField('price', formValues.price);
    if (priceErr) errs.price = priceErr;

    const typeErr = validateField('roomType', formValues.roomType);
    if (typeErr) errs.roomType = typeErr;

    const descErr = validateField('description', formValues.description);
    if (descErr) errs.description = descErr;

    if (formErrors.roomName) {
      errs.roomName = formErrors.roomName;
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setFormLoading(true);
    setFormError('');

    const trimmedName = formValues.roomName.trim();
    // Pre-flight duplicate check
    const isDup = await adminRoomApi.checkRoomNameExists(trimmedName, editTarget?.id ?? null);
    if (isDup) {
      setFormErrors((prev) => ({
        ...prev,
        roomName: `Room name "${trimmedName}" already exists. Please choose a different name.`,
      }));
      setFormLoading(false);
      return;
    }

    const payload = {
      roomName: trimmedName,
      roomType: formValues.roomType,
      capacity: Number(formValues.capacity),
      price: Number(formValues.price),
      roomStatus: formValues.roomStatus,
      description: formValues.description?.trim() || null,
    };

    try {
      if (editTarget) {
        await adminRoomApi.update(editTarget.id, payload);
      } else {
        await adminRoomApi.create(payload);
      }
      setModalOpen(false);
      fetchList(editTarget ? page : 1, search, filterType, filterStatus);
      if (!editTarget) setPage(1);
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : '') ||
        err.message ||
        'Unable to save room. Please check your inputs.';

      if (typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('already exists')) {
        setFormErrors((prev) => ({ ...prev, roomName: serverMsg }));
      } else if (typeof serverMsg === 'object') {
        setFormErrors((prev) => ({ ...prev, ...serverMsg }));
      } else {
        setFormError(serverMsg);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Status change & Maintenance Toggle ───────────────────────────────────

  const handleChangeStatusConfirm = async (id, newStatus) => {
    setStatusLoading(true);
    try {
      await adminRoomApi.changeStatus(id, newStatus);
      setStatusDialogRoom(null);
      fetchList(page, search, filterType, filterStatus);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update room status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleToggleMaintenance = async (row) => {
    setMaintLoadingId(row.id);
    try {
      await adminRoomApi.toggleMaintenance(row.id);
      fetchList(page, search, filterType, filterStatus);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to toggle maintenance status');
    } finally {
      setMaintLoadingId(null);
    }
  };

  // ─── Delete Handlers ─────────────────────────────────────────────────────

  const openDelete = (row) => {
    setDeleteTarget(row);
    setDeleteError('');
  };
  const closeDelete = () => {
    if (!deleteLoading) setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await adminRoomApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      fetchList(nextPage, search, filterType, filterStatus);
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
          err.message ||
          'Cannot delete room. It may have associated VIP reservations.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Table Columns ────────────────────────────────────────────────────────

  const columns = [
    { key: 'id', label: '#', render: (row) => row.id },
    {
      key: 'roomName',
      label: 'Room Name',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MeetingRoomRoundedIcon sx={{ fontSize: 18, color: '#6D28D9' }} />
          <Typography component="span" sx={{ fontWeight: 700, fontSize: 13, color: '#1E1B2E' }}>
            {row.roomName}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'roomType',
      label: 'Type',
      render: (row) => (
        <Badge tone="neutral">
          {row.roomType?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (row) => `${row.capacity} guests`,
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => (
        <Typography component="span" sx={{ fontWeight: 600, color: '#166534', fontSize: 12 }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.price || 0)}
        </Typography>
      ),
    },
    {
      key: 'roomStatus',
      label: 'Status',
      render: (row) => {
        const tone = STATUS_BADGE_TONE[row.roomStatus] ?? 'neutral';
        return (
          <Tooltip title="Click to quick-change status">
            <Box
              component="span"
              onClick={() => setStatusDialogRoom(row)}
              sx={{ cursor: 'pointer' }}
            >
              <Badge tone={tone}>{row.roomStatus}</Badge>
            </Box>
          </Tooltip>
        );
      },
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <Typography
          component="span"
          sx={{
            fontSize: 12,
            color: '#64748B',
            maxWidth: 220,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {row.description || '—'}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        const isMaintenance = row.roomStatus === 'MAINTENANCE';
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
            {/* Toggle Maintenance */}
            <Tooltip title={isMaintenance ? 'End Maintenance' : 'Set to Maintenance'}>
              <IconButton
                size="small"
                onClick={() => handleToggleMaintenance(row)}
                disabled={maintLoadingId === row.id}
                sx={{
                  color: isMaintenance ? '#EA580C' : '#64748B',
                  '&:hover': { bgcolor: isMaintenance ? '#FFEDD5' : '#F1F5F9' },
                }}
              >
                {maintLoadingId === row.id ? (
                  <CircularProgress size={16} />
                ) : (
                  <BuildCircleRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            {/* Edit */}
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => openEdit(row)}
                sx={{ color: '#6D28D9', '&:hover': { bgcolor: '#F5F3FF' } }}
              >
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Delete */}
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => openDelete(row)}
                sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEE2E2' } }}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const pageCount = Math.ceil(total / PAGE_SIZE);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E1B2E', mb: 0.5 }}>
            VIP Room Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage VIP suites, private rooms, seating capacity, pricing and operational status.
          </Typography>
        </Box>
        <Button variant="primary" size="medium" onClick={openCreate} startIcon={<AddRoundedIcon />}>
          Add VIP Room
        </Button>
      </Box>

      {/* ── Filter & Search Toolbar ── */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          mb: 2,
          p: 2,
          bgcolor: '#FAFAFA',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        {/* Search */}
        <TextField
          placeholder="Search by room name, description…"
          size="small"
          value={search}
          onChange={handleSearchChange}
          sx={{
            flex: '1 1 200px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#fff',
              fontSize: 13,
              '& fieldset': { borderColor: '#E2E8F0' },
              '&:hover fieldset': { borderColor: '#C4B5FD' },
              '&.Mui-focused fieldset': { borderColor: '#6D28D9' },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Filter Room Type */}
        <TextField
          select
          label="Room Type"
          size="small"
          value={filterType}
          onChange={handleTypeFilterChange}
          sx={{
            flex: '0 0 180px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#fff',
              fontSize: 13,
              '& fieldset': { borderColor: '#E2E8F0' },
              '&:hover fieldset': { borderColor: '#C4B5FD' },
              '&.Mui-focused fieldset': { borderColor: '#6D28D9' },
            },
            '& .MuiInputLabel-root': { color: '#64748B', fontSize: 13 },
          }}
        >
          {ROOM_TYPE_FILTER_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>

        {/* Filter Room Status */}
        <TextField
          select
          label="Status"
          size="small"
          value={filterStatus}
          onChange={handleStatusFilterChange}
          sx={{
            flex: '0 0 160px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#fff',
              fontSize: 13,
              '& fieldset': { borderColor: '#E2E8F0' },
              '&:hover fieldset': { borderColor: '#C4B5FD' },
              '&.Mui-focused fieldset': { borderColor: '#6D28D9' },
            },
            '& .MuiInputLabel-root': { color: '#64748B', fontSize: 13 },
          }}
        >
          {ROOM_STATUS_FILTER_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* ── Error message ── */}
      {listError && (
        <Typography color="error" sx={{ mb: 2, fontSize: 13 }}>
          {listError}
        </Typography>
      )}

      {/* ── Table Data ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={36} sx={{ color: '#6D28D9' }} />
        </Box>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="No VIP rooms found."
        />
      )}

      {/* ── Pagination ── */}
      {!loading && total > 0 && (
        <Box sx={{ mt: 2 }}>
          <AppPagination
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </Box>
      )}

      {/* ── Create / Edit VIP Room Modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit VIP Room' : 'Add New VIP Room'}
        size="medium"
      >
        <Box component="form" onSubmit={handleFormSubmit}>
          <RoomForm
            values={formValues}
            errors={formErrors}
            onChange={handleFormChange}
            checkingName={checkingName}
          />

          {formError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>
              {formError}
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="secondary" onClick={closeModal} disabled={formLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formLoading || checkingName || Boolean(formErrors.roomName)}
            >
              {formLoading ? 'Saving…' : editTarget ? 'Update Room' : 'Create Room'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ── Quick Change Status Modal ── */}
      <ChangeRoomStatusDialog
        open={Boolean(statusDialogRoom)}
        room={statusDialogRoom}
        onClose={() => setStatusDialogRoom(null)}
        onConfirm={handleChangeStatusConfirm}
        loading={statusLoading}
      />

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete VIP Room"
        onCancel={closeDelete}
        onConfirm={handleDelete}
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        tone="danger"
      >
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Are you sure you want to delete room <strong>{deleteTarget?.roomName}</strong>?
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 1, borderRadius: '10px' }}>
              {deleteError}
            </Alert>
          )}
        </Box>
      </ConfirmDialog>
    </Box>
  );
}

