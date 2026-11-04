import { useCallback, useEffect, useRef, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
import { AREA_NAMES, tableAreaApi } from '../services/tableAreaService';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

/**
 * AreaName enum values from the backend.
 * Used for the "Area Name" select filter and the form select.
 */
const AREA_NAME_OPTIONS = AREA_NAMES.map((v) => ({ value: v, label: v }));

/** Filter options include an empty "All" entry. */
const AREA_NAME_FILTER_OPTIONS = [
  { value: '', label: 'All areas' },
  ...AREA_NAME_OPTIONS,
];

const AREA_NAME_BADGE_TONE = {
  INDOOR: 'info',
  OUTDOOR: 'success',
  GARDEN: 'success',
  WINDOW: 'neutral',
};

const EMPTY_FORM = { code: '', name: AREA_NAMES[0], description: '' };

// ─── Form fields ─────────────────────────────────────────────────────────────

function TableAreaForm({ values, errors, onChange }) {
  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {/* Code (unique identifier) */}
      <Input
        label="Area Code *"
        name="code"
        value={values.code}
        onChange={onChange}
        error={errors.code}
        hint="Unique identifier, e.g. IND-01"
      />

      {/* Area Name – enum select */}
      <Select
        label="Area Name *"
        name="name"
        value={values.name}
        onChange={onChange}
        options={AREA_NAME_OPTIONS}
      />

      {/* Description */}
      <Input
        label="Description"
        name="description"
        value={values.description}
        onChange={onChange}
        multiline
        rows={3}
      />
    </Stack>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TableAreaManagementPage() {
  // ── List state ──
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  // ── Filter / search state ──
  const [search, setSearch] = useState('');
  const [filterName, setFilterName] = useState('');
  const searchTimeout = useRef(null);

  // ── Form modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create mode
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Delete confirm state ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Fetch list ──────────────────────────────────────────────────────────

  const fetchList = useCallback(async (currentPage, currentQ, currentName) => {
    setLoading(true);
    setListError('');
    try {
      const response = await tableAreaApi.getList({
        page: currentPage - 1, // Spring is 0-indexed
        size: PAGE_SIZE,
        q: currentQ,
        name: currentName,
      });

      // API response shape: { result: [...], meta: { total, pages, ... } }
      const payload = response?.data ?? response;
      if (payload && typeof payload === 'object' && 'result' in payload) {
        setRows(Array.isArray(payload.result) ? payload.result : []);
        setTotal(payload.meta?.total ?? 0);
      } else if (Array.isArray(payload)) {
        setRows(payload);
        setTotal(payload.length);
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (err) {
      setListError(err.message || 'Failed to load table areas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList(page, search, filterName);
  }, [page, filterName, fetchList]);

  // ─── Search debounce ─────────────────────────────────────────────────────

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchList(1, value, filterName);
    }, 400);
  };

  const handleNameFilterChange = (e) => {
    setFilterName(e.target.value);
    setPage(1);
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setFormValues({
      code: row.code ?? '',
      name: row.name ?? AREA_NAMES[0],
      description: row.description ?? '',
    });
    setFormErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => { if (!formLoading) setModalOpen(false); };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formValues.code.trim()) errs.code = 'Area code is required.';
    if (formValues.code.trim().length > 50) errs.code = 'Area code must not exceed 50 characters.';
    if (!formValues.name) errs.name = 'Area name is required.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    setFormError('');

    const payload = {
      code: formValues.code.trim().toUpperCase(),
      name: formValues.name,
      description: formValues.description.trim(),
    };

    try {
      if (editTarget) {
        await tableAreaApi.update(editTarget.id, payload);
      } else {
        await tableAreaApi.create(payload);
      }
      setModalOpen(false);
      fetchList(editTarget ? page : 1, search, filterName);
      if (!editTarget) setPage(1);
    } catch (err) {
      setFormError(err.message || 'Unable to save. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete helpers ───────────────────────────────────────────────────────

  const openDelete = (row) => setDeleteTarget(row);
  const closeDelete = () => { if (!deleteLoading) setDeleteTarget(null); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await tableAreaApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      fetchList(nextPage, search, filterName);
    } catch (err) {
      // Errors such as "area is in use" – show inline or silently dismiss
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Table columns ────────────────────────────────────────────────────────

  const columns = [
    { key: 'id', label: '#', render: (row) => row.id },
    {
      key: 'code',
      label: 'Code',
      render: (row) => (
        <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', px: '6px', py: '2px' }}>
          {row.code}
        </Typography>
      ),
    },
    {
      key: 'name',
      label: 'Area Name',
      render: (row) => {
        const tone = AREA_NAME_BADGE_TONE[row.name] ?? 'neutral';
        return <Badge tone={tone}>{row.name}</Badge>;
      },
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <Typography component="span" sx={{ fontSize: 12, color: '#64748B', maxWidth: 320, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.description || '—'}
        </Typography>
      ),
    },
    {
      key: 'createdBy',
      label: 'Created By',
      render: (row) => row.createdBy || '—',
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: '#6D28D9', '&:hover': { bgcolor: '#F5F3FF' } }}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => openDelete(row)} sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEE2E2' } }}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const pageCount = Math.ceil(total / PAGE_SIZE);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E1B2E', mb: 0.5 }}>
            Table Area Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage dining zones — Indoor, Outdoor, Garden &amp; Window seating.
          </Typography>
        </Box>
        <Button variant="primary" size="medium" onClick={openCreate} startIcon={<AddRoundedIcon />}>
          Add Area
        </Button>
      </Box>

      {/* ── Filter bar ── */}
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
        {/* Free-text search */}
        <TextField
          placeholder="Search by code or area name…"
          size="small"
          value={search}
          onChange={handleSearchChange}
          sx={{
            flex: '1 1 220px',
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

        {/* Area Name filter */}
        <TextField
          select
          label="Area Name"
          size="small"
          value={filterName}
          onChange={handleNameFilterChange}
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
          {AREA_NAME_FILTER_OPTIONS.map((o) => (
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

      {/* ── Table ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={36} sx={{ color: '#6D28D9' }} />
        </Box>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="No table areas found."
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

      {/* ── Create / Edit modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Table Area' : 'Add Table Area'}
        size="medium"
      >
        <Box component="form" onSubmit={handleFormSubmit}>
          <TableAreaForm values={formValues} errors={formErrors} onChange={handleFormChange} />

          {formError && (
            <Typography color="error" sx={{ mt: 1.5, fontSize: 12 }}>
              {formError}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="secondary" onClick={closeModal} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Saving…' : editTarget ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ── Delete confirm dialog ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Table Area"
        onCancel={closeDelete}
        onConfirm={handleDelete}
        confirmLabel={deleteLoading ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        tone="danger"
      >
        Are you sure you want to delete area{' '}
        <strong>&ldquo;{deleteTarget?.code} – {deleteTarget?.name}&rdquo;</strong>?
        This action cannot be undone.
      </ConfirmDialog>
    </Box>
  );
}
