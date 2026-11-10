import { useCallback, useEffect, useRef, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
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
import { adminTableApi, TABLE_STATUSES } from '../services/tableService';
import { tableAreaApi } from '../services/tableAreaService';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_OPTIONS = TABLE_STATUSES.map((status) => ({
  value: status,
  label: status,
}));

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...STATUS_OPTIONS,
];

const STATUS_BADGE_TONE = {
  AVAILABLE: 'success',
  RESERVED: 'info',
  IN_USE: 'warning',
  CLEANING: 'neutral',
  LOCKED: 'danger',
};

const EMPTY_FORM = {
  tableNumber: '',
  capacity: 4,
  areaId: '',
  statusCode: 'AVAILABLE',
  description: '',
};

function formatAreaLabel(area) {
  if (!area) return '';
  if (!area.name || area.code === area.name) {
    return area.code || area.name || '';
  }
  return `${area.code} (${area.name})`;
}

// ─── Form modal content ───────────────────────────────────────────────────────

function TableForm({ values, errors, areas, onChange, checkingNumber }) {
  const areaOptions = areas.map((area) => ({
    value: area.id,
    label: formatAreaLabel(area),
  }));

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Input
        label="Table Number *"
        name="tableNumber"
        type="number"
        value={values.tableNumber}
        onChange={onChange}
        error={errors.tableNumber}
        hint={
          checkingNumber
            ? 'Checking table number availability…'
            : 'Unique positive integer (e.g. 101)'
        }
        slotProps={{
          input: {
            endAdornment: checkingNumber ? (
              <InputAdornment position="end">
                <CircularProgress size={18} sx={{ color: '#6D28D9' }} />
              </InputAdornment>
            ) : null,
          },
        }}
      />

      <Input
        label="Capacity *"
        name="capacity"
        type="number"
        value={values.capacity}
        onChange={onChange}
        error={errors.capacity}
        hint="Minimum capacity is 1 guest"
      />

      <Select
        label="Dining Area *"
        name="areaId"
        value={values.areaId}
        onChange={onChange}
        options={areaOptions}
        error={errors.areaId}
      />

      <Select
        label="Initial Status"
        name="statusCode"
        value={values.statusCode}
        onChange={onChange}
        options={STATUS_OPTIONS}
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

// ─── Change Status Dialog ────────────────────────────────────────────────────

function ChangeStatusDialog({ open, table, onClose, onConfirm, loading }) {
  const [selectedStatus, setSelectedStatus] = useState(table?.statusCode || 'AVAILABLE');

  useEffect(() => {
    if (table?.statusCode) {
      setSelectedStatus(table.statusCode);
    }
  }, [table]);

  return (
    <Modal open={open} onClose={onClose} title="Change Table Status" size="small">
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Update current operating status for <strong>Table #{table?.tableNumber}</strong>:
        </Typography>

        <Select
          label="New Status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          options={STATUS_OPTIONS}
        />

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(table.id, selectedStatus)}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update Status'}
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TableManagementPage() {
  // ── List & Areas state ──
  const [rows, setRows] = useState([]);
  const [areas, setAreas] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  // ── Filter / Search state ──
  const [search, setSearch] = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const searchTimeout = useRef(null);

  // ── Form Modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [checkingNumber, setCheckingNumber] = useState(false);
  const checkDuplicateTimeout = useRef(null);

  // ── Change Status state ──
  const [statusDialogTable, setStatusDialogTable] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // ── Delete confirm state ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Toggle Lock state ──
  const [lockLoadingId, setLockLoadingId] = useState(null);

  // ─── Fetch Areas for selection ───────────────────────────────────────────

  const loadAreas = useCallback(async () => {
    try {
      const response = await tableAreaApi.getList({ page: 0, size: 100 });
      const payload = response?.data ?? response;
      const list = payload?.result ?? payload?.content ?? (Array.isArray(payload) ? payload : []);
      setAreas(list);
    } catch {
      // Non-blocking error if areas can't be fetched
    }
  }, []);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  // ─── Fetch Tables list ───────────────────────────────────────────────────

  const fetchList = useCallback(async (currentPage, currentQ, currentAreaId, currentStatus) => {
    setLoading(true);
    setListError('');
    try {
      const response = await adminTableApi.getList({
        page: currentPage - 1, // Spring is 0-indexed
        size: PAGE_SIZE,
        q: currentQ,
        areaId: currentAreaId,
        statusCode: currentStatus,
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
      setListError(err.message || 'Failed to load tables.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(page, search, filterAreaId, filterStatus);
  }, [page, filterAreaId, filterStatus, fetchList]);

  // ─── Debounced Search ────────────────────────────────────────────────────

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchList(1, value, filterAreaId, filterStatus);
    }, 400);
  };

  const handleAreaFilterChange = (e) => {
    setFilterAreaId(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setPage(1);
  };

  // ─── Modal Form Handlers ─────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setFormValues({
      ...EMPTY_FORM,
      areaId: areas.length > 0 ? areas[0].id : '',
    });
    setFormErrors({});
    setFormError('');
    setCheckingNumber(false);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setFormValues({
      tableNumber: row.tableNumber ?? '',
      capacity: row.capacity ?? 4,
      areaId: row.area?.id ?? (areas.length > 0 ? areas[0].id : ''),
      statusCode: row.statusCode ?? 'AVAILABLE',
      description: row.description ?? '',
    });
    setFormErrors({});
    setFormError('');
    setCheckingNumber(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!formLoading) {
      clearTimeout(checkDuplicateTimeout.current);
      setModalOpen(false);
    }
  };

  // ─── Real-time field validation ──────────────────────────────────────────

  const validateField = (name, value, currentValues = formValues) => {
    let errorMsg = '';

    if (name === 'tableNumber') {
      const num = Number(value);
      if (!value || String(value).trim() === '') {
        errorMsg = 'Table number is required.';
      } else if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
        errorMsg = 'Table number must be a positive integer (> 0).';
      }
    } else if (name === 'capacity') {
      const cap = Number(value);
      if (!value || String(value).trim() === '') {
        errorMsg = 'Capacity is required.';
      } else if (isNaN(cap) || cap < 1 || !Number.isInteger(cap)) {
        errorMsg = 'Capacity must be at least 1 guest (integer).';
      }
    } else if (name === 'areaId') {
      if (!value) {
        errorMsg = 'Please select a dining area.';
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

    // Run field-level validation immediately on input
    const fieldError = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: fieldError }));

    // If changing tableNumber, perform debounced duplicate check
    if (name === 'tableNumber') {
      clearTimeout(checkDuplicateTimeout.current);
      const num = Number(value);

      if (value && !isNaN(num) && num > 0) {
        setCheckingNumber(true);
        checkDuplicateTimeout.current = setTimeout(async () => {
          try {
            const isDuplicate = await adminTableApi.checkTableNumberExists(
              num,
              editTarget?.id ?? null
            );
            if (isDuplicate) {
              setFormErrors((prev) => ({
                ...prev,
                tableNumber: `Table number ${num} already exists in the system.`,
              }));
            }
          } finally {
            setCheckingNumber(false);
          }
        }, 500);
      } else {
        setCheckingNumber(false);
      }
    }
  };

  const validateAll = () => {
    const errs = {};
    const tableNumErr = validateField('tableNumber', formValues.tableNumber);
    if (tableNumErr) errs.tableNumber = tableNumErr;

    const capErr = validateField('capacity', formValues.capacity);
    if (capErr) errs.capacity = capErr;

    const areaErr = validateField('areaId', formValues.areaId);
    if (areaErr) errs.areaId = areaErr;

    const descErr = validateField('description', formValues.description);
    if (descErr) errs.description = descErr;

    // Check existing field errors (e.g. duplicate detected)
    if (formErrors.tableNumber) {
      errs.tableNumber = formErrors.tableNumber;
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setFormLoading(true);
    setFormError('');

    // Pre-flight duplicate check right before submitting
    const num = Number(formValues.tableNumber);
    const isDuplicate = await adminTableApi.checkTableNumberExists(num, editTarget?.id ?? null);
    if (isDuplicate) {
      setFormErrors((prev) => ({
        ...prev,
        tableNumber: `Table number ${num} already exists. Please choose a different number.`,
      }));
      setFormLoading(false);
      return;
    }

    const payload = {
      tableNumber: num,
      capacity: Number(formValues.capacity),
      areaId: Number(formValues.areaId),
      statusCode: formValues.statusCode,
      description: formValues.description?.trim() || null,
    };

    try {
      if (editTarget) {
        await adminTableApi.update(editTarget.id, payload);
      } else {
        await adminTableApi.create(payload);
      }
      setModalOpen(false);
      fetchList(editTarget ? page : 1, search, filterAreaId, filterStatus);
      if (!editTarget) setPage(1);
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        (typeof err.response?.data?.error === 'string' ? err.response?.data?.error : '') ||
        err.message ||
        'Unable to save table. Please check your input.';

      // If backend returned table number exists
      if (typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('table number already exists')) {
        setFormErrors((prev) => ({ ...prev, tableNumber: serverMsg }));
      } else if (typeof serverMsg === 'object') {
        // Validation map returned by GlobalException
        setFormErrors((prev) => ({ ...prev, ...serverMsg }));
      } else {
        setFormError(serverMsg);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Status change & lock toggle ──────────────────────────────────────────

  const handleChangeStatusConfirm = async (id, newStatus) => {
    setStatusLoading(true);
    try {
      await adminTableApi.changeStatus(id, newStatus);
      setStatusDialogTable(null);
      fetchList(page, search, filterAreaId, filterStatus);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update table status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleToggleLock = async (row) => {
    setLockLoadingId(row.id);
    try {
      await adminTableApi.toggleLock(row.id);
      fetchList(page, search, filterAreaId, filterStatus);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to toggle lock on table');
    } finally {
      setLockLoadingId(null);
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
      await adminTableApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      fetchList(nextPage, search, filterAreaId, filterStatus);
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
          err.message ||
          'Cannot delete table. It may have associated reservations.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────

  const columns = [
    { key: 'id', label: '#', render: (row) => row.id },
    {
      key: 'tableNumber',
      label: 'Table #',
      render: (row) => (
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: 13,
            bgcolor: '#F5F3FF',
            color: '#6D28D9',
            px: 1.2,
            py: 0.4,
            borderRadius: '8px',
          }}
        >
          #{row.tableNumber}
        </Typography>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (row) => `${row.capacity} guests`,
    },
    {
      key: 'area',
      label: 'Area',
      render: (row) => (
        <Box>
          <Typography component="span" sx={{ fontWeight: 600, fontSize: 12 }}>
            {row.area?.code}
          </Typography>
          {row.area?.name && row.area?.name !== row.area?.code && (
            <Typography component="span" sx={{ color: '#64748B', fontSize: 11, ml: 0.8 }}>
              ({row.area?.name})
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'statusCode',
      label: 'Status',
      render: (row) => {
        const tone = STATUS_BADGE_TONE[row.statusCode] ?? 'neutral';
        return (
          <Tooltip title="Click to quick-change status">
            <Box
              component="span"
              onClick={() => setStatusDialogTable(row)}
              sx={{ cursor: 'pointer' }}
            >
              <Badge tone={tone}>{row.statusCode}</Badge>
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
            maxWidth: 240,
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
        const isLocked = row.statusCode === 'LOCKED';
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
            {/* Quick Toggle Lock button */}
            <Tooltip title={isLocked ? 'Unlock Table' : 'Lock Table'}>
              <IconButton
                size="small"
                onClick={() => handleToggleLock(row)}
                disabled={lockLoadingId === row.id}
                sx={{
                  color: isLocked ? '#DC2626' : '#64748B',
                  '&:hover': { bgcolor: isLocked ? '#FEE2E2' : '#F1F5F9' },
                }}
              >
                {lockLoadingId === row.id ? (
                  <CircularProgress size={16} />
                ) : isLocked ? (
                  <LockRoundedIcon fontSize="small" />
                ) : (
                  <LockOpenRoundedIcon fontSize="small" />
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

  // Area options for filter
  const areaFilterOptions = [
    { value: '', label: 'All areas' },
    ...areas.map((a) => ({ value: a.id, label: formatAreaLabel(a) })),
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E1B2E', mb: 0.5 }}>
            Table Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage restaurant tables, seating capacity, assigned areas, and live operational status.
          </Typography>
        </Box>
        <Button variant="primary" size="medium" onClick={openCreate} startIcon={<AddRoundedIcon />}>
          Add Table
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
          placeholder="Search by table number, area…"
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

        {/* Filter Area */}
        <TextField
          select
          label="Area"
          size="small"
          value={filterAreaId}
          onChange={handleAreaFilterChange}
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
          {areaFilterOptions.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>

        {/* Filter Status */}
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
          {STATUS_FILTER_OPTIONS.map((o) => (
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
          emptyMessage="No restaurant tables found."
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

      {/* ── Create / Edit Table Modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Table' : 'Add New Table'}
        size="medium"
      >
        <Box component="form" onSubmit={handleFormSubmit}>
          <TableForm
            values={formValues}
            errors={formErrors}
            areas={areas}
            onChange={handleFormChange}
            checkingNumber={checkingNumber}
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
              disabled={formLoading || checkingNumber || Boolean(formErrors.tableNumber)}
            >
              {formLoading ? 'Saving…' : editTarget ? 'Update Table' : 'Create Table'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ── Quick Change Status Modal ── */}
      <ChangeStatusDialog
        open={Boolean(statusDialogTable)}
        table={statusDialogTable}
        onClose={() => setStatusDialogTable(null)}
        onConfirm={handleChangeStatusConfirm}
        loading={statusLoading}
      />

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Restaurant Table"
        onCancel={closeDelete}
        onConfirm={handleDelete}
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        tone="danger"
      >
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Are you sure you want to delete <strong>Table #{deleteTarget?.tableNumber}</strong> in{' '}
            <strong>{deleteTarget?.area?.code}</strong>?
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
