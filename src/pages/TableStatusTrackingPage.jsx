import { useCallback, useEffect, useRef, useState } from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import AppPagination from '../components/ui/AppPagination';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import { tableAreaApi } from '../services/tableAreaService';
import { TABLE_STATUSES, tableTrackingApi } from '../services/tableService';

// ─── Status Configurations ──────────────────────────────────────────────────

const STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    color: '#166534',
    bg: '#DCFCE7',
    border: '#86EFAC',
    tone: 'success',
    icon: CheckCircleRoundedIcon,
    description: 'Ready for seating',
  },
  RESERVED: {
    label: 'Reserved',
    color: '#1E40AF',
    bg: '#DBEAFE',
    border: '#93C5FD',
    tone: 'info',
    icon: EventSeatRoundedIcon,
    description: 'Reserved for guest',
  },
  IN_USE: {
    label: 'In Use',
    color: '#9A3412',
    bg: '#FFEDD5',
    border: '#FDBA74',
    tone: 'warning',
    icon: RestaurantMenuRoundedIcon,
    description: 'Guests currently dining',
  },
  CLEANING: {
    label: 'Cleaning',
    color: '#475569',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    tone: 'neutral',
    icon: CleaningServicesRoundedIcon,
    description: 'Needs or undergoing cleanup',
  },
  LOCKED: {
    label: 'Locked',
    color: '#991B1B',
    bg: '#FEE2E2',
    border: '#FCA5A5',
    tone: 'danger',
    icon: LockRoundedIcon,
    description: 'Temporarily blocked',
  },
};

const PAGE_SIZE = 12;

const STATUS_OPTIONS = TABLE_STATUSES.map((status) => ({
  value: status,
  label: STATUS_CONFIG[status]?.label || status,
}));

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...STATUS_OPTIONS,
];

// ─── Quick Status Change Dialog ─────────────────────────────────────────────

function QuickStatusDialog({ open, table, onClose, onConfirm, loading }) {
  const [targetStatus, setTargetStatus] = useState(table?.statusCode || 'AVAILABLE');

  useEffect(() => {
    if (table?.statusCode) {
      setTargetStatus(table.statusCode);
    }
  }, [table]);

  return (
    <Modal open={open} onClose={onClose} title="Update Table Status" size="small">
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '12px' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: '#6D28D9',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            #{table?.tableNumber}
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Table #{table?.tableNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Capacity: {table?.capacity} guests • Area: {table?.area?.code || '—'}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Select new operating status for this table:
        </Typography>

        <Grid container spacing={1}>
          {TABLE_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const isSelected = targetStatus === status;
            const Icon = config.icon;
            return (
              <Grid item xs={6} key={status}>
                <Paper
                  variant="outlined"
                  onClick={() => setTargetStatus(status)}
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? '#6D28D9' : '#E2E8F0',
                    bgcolor: isSelected ? '#F5F3FF' : '#fff',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#6D28D9',
                      bgcolor: '#FAF5FF',
                    },
                  }}
                >
                  <Icon sx={{ color: config.color, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, fontSize: 12 }}>
                      {config.label}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(table.id, targetStatus)}
            disabled={loading || targetStatus === table?.statusCode}
          >
            {loading ? 'Updating…' : 'Save Status'}
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
}

// ─── Table Card (Floor Plan & Grid View) ────────────────────────────────────

function TableCard({ table, onSelectStatus }) {
  const config = STATUS_CONFIG[table.statusCode] || STATUS_CONFIG.AVAILABLE;
  const Icon = config.icon;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '16px',
        border: '1.5px solid',
        borderColor: config.border,
        bgcolor: '#FFFFFF',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 24px rgba(109, 40, 217, 0.08)',
        },
      }}
      onClick={() => onSelectStatus(table)}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: config.bg,
                color: config.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              #{table.tableNumber}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 14 }}>
                Table {table.tableNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {table.capacity} Guests
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Click to update status">
            <Chip
              icon={<Icon sx={{ fontSize: '14px !important', color: `${config.color} !important` }} />}
              label={config.label}
              size="small"
              sx={{
                bgcolor: config.bg,
                color: config.color,
                fontWeight: 700,
                fontSize: 11,
                border: '1px solid',
                borderColor: config.border,
              }}
            />
          </Tooltip>
        </Box>

        <Divider sx={{ my: 1, borderColor: '#F1F5F9' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            {table.area?.code || 'Dining Area'} {table.area?.name ? `(${table.area.name})` : ''}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Click to change ➔
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

// ─── Main Table Status Tracking Page ────────────────────────────────────────

export default function TableStatusTrackingPage() {
  const [viewMode, setViewMode] = useState('floor-plan'); // 'floor-plan' | 'grid' | 'list'
  const [summary, setSummary] = useState(null);
  const [floorPlan, setFloorPlan] = useState([]);
  const [tablesList, setTablesList] = useState([]);
  const [areas, setAreas] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Filters & Search ──
  const [search, setSearch] = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const searchTimeout = useRef(null);

  // ── Quick Status Dialog ──
  const [selectedTable, setSelectedTable] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  // ── Auto-refresh timer (every 30s) ──
  const autoRefreshTimer = useRef(null);

  // ─── Load Summary Stats ───────────────────────────────────────────────────

  const loadSummary = useCallback(async () => {
    try {
      const res = await tableTrackingApi.getSummary();
      const payload = res?.data ?? res;
      setSummary(payload);
    } catch {
      // Non-blocking
    }
  }, []);

  // ─── Load Floor Plan ──────────────────────────────────────────────────────

  const loadFloorPlan = useCallback(async () => {
    try {
      const res = await tableTrackingApi.getFloorPlan();
      const payload = res?.data ?? res;
      setFloorPlan(Array.isArray(payload) ? payload : []);
    } catch {
      // Non-blocking
    }
  }, []);

  // ─── Load Areas ───────────────────────────────────────────────────────────

  const loadAreas = useCallback(async () => {
    try {
      const res = await tableAreaApi.getList({ page: 0, size: 100 });
      const payload = res?.data ?? res;
      const list = payload?.result ?? payload?.content ?? (Array.isArray(payload) ? payload : []);
      setAreas(list);
    } catch {
      // Non-blocking
    }
  }, []);

  // ─── Load Paginated List ──────────────────────────────────────────────────

  const loadTablesList = useCallback(async (currentPage, currentQ, currentAreaId, currentStatus) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await tableTrackingApi.getTables({
        page: currentPage - 1,
        size: PAGE_SIZE,
        q: currentQ,
        areaId: currentAreaId,
        statusCode: currentStatus,
      });

      const payload = res?.data ?? res;
      if (payload && typeof payload === 'object' && 'result' in payload) {
        setTablesList(Array.isArray(payload.result) ? payload.result : []);
        const totalElements =
          payload.meta?.total ??
          payload.meta?.totalElements ??
          (payload.meta?.pages ? payload.meta.pages * PAGE_SIZE : 0);
        setTotal(Number(totalElements) || 0);
      } else if (Array.isArray(payload)) {
        setTablesList(payload);
        setTotal(payload.length);
      } else {
        setTablesList([]);
        setTotal(0);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch table tracking data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Comprehensive Refresh ────────────────────────────────────────────────

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadSummary(),
      loadFloorPlan(),
      loadAreas(),
      loadTablesList(page, search, filterAreaId, filterStatus),
    ]);
    setRefreshing(false);
  }, [loadSummary, loadFloorPlan, loadAreas, loadTablesList, page, search, filterAreaId, filterStatus]);

  useEffect(() => {
    refreshAll();

    // Auto-refresh summary & status every 30 seconds
    autoRefreshTimer.current = setInterval(() => {
      loadSummary();
      loadFloorPlan();
    }, 30000);

    return () => {
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
    };
  }, []); // Run once on mount

  // Watch for page / filters change
  useEffect(() => {
    loadTablesList(page, search, filterAreaId, filterStatus);
  }, [page, filterAreaId, filterStatus, loadTablesList]);

  // ─── Debounced Search ─────────────────────────────────────────────────────

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadTablesList(1, val, filterAreaId, filterStatus);
    }, 400);
  };

  // ─── Status Update Handler ────────────────────────────────────────────────

  const handleStatusChangeConfirm = async (tableId, newStatus) => {
    setDialogLoading(true);
    try {
      await tableTrackingApi.changeStatus(tableId, newStatus);
      setSelectedTable(null);
      // Refresh current view
      await Promise.all([
        loadSummary(),
        loadFloorPlan(),
        loadTablesList(page, search, filterAreaId, filterStatus),
      ]);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Unable to update status.');
    } finally {
      setDialogLoading(false);
    }
  };

  // ─── Table Columns for List View ──────────────────────────────────────────

  const columns = [
    { key: 'id', label: '#', render: (row) => row.id },
    {
      key: 'tableNumber',
      label: 'Table #',
      render: (row) => (
        <Typography
          component="span"
          sx={{
            fontWeight: 800,
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
        <Typography component="span" sx={{ fontWeight: 600, fontSize: 12 }}>
          {row.area?.code || '—'} {row.area?.name ? `(${row.area.name})` : ''}
        </Typography>
      ),
    },
    {
      key: 'statusCode',
      label: 'Status',
      render: (row) => {
        const config = STATUS_CONFIG[row.statusCode] || STATUS_CONFIG.AVAILABLE;
        return (
          <Tooltip title="Click to update status">
            <Box
              component="span"
              onClick={() => setSelectedTable(row)}
              sx={{ cursor: 'pointer' }}
            >
              <Badge tone={config.tone}>{config.label}</Badge>
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
      render: (row) => (
        <Button
          variant="secondary"
          size="small"
          onClick={() => setSelectedTable(row)}
        >
          Change Status
        </Button>
      ),
    },
  ];

  const pageCount = Math.ceil(total / PAGE_SIZE);

  const areaFilterOptions = [
    { value: '', label: 'All Areas' },
    ...areas.map((a) => ({ value: a.id, label: `${a.code} (${a.name})` })),
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableRestaurantRoundedIcon sx={{ color: '#6D28D9', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E1B2E' }}>
              Table Status Tracking
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time visual floor plan, live occupancy tracking and instant status transitions.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="secondary"
            size="medium"
            onClick={refreshAll}
            disabled={refreshing}
            startIcon={
              refreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon />
            }
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </Stack>
      </Box>

      {/* ── Summary KPI Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Total Tables
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E1B2E', mt: 0.5 }}>
              {summary?.totalTables ?? '—'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              All dining zones
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #86EFAC', bgcolor: '#F0FDF4' }}>
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
              Available
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#166534', mt: 0.5 }}>
              {summary?.availableTables ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#15803D' }}>
              Ready for guests
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #93C5FD', bgcolor: '#EFF6FF' }}>
            <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 700 }}>
              Reserved
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E40AF', mt: 0.5 }}>
              {summary?.reservedTables ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#2563EB' }}>
              Upcoming bookings
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #FDBA74', bgcolor: '#FFF7ED' }}>
            <Typography variant="caption" sx={{ color: '#9A3412', fontWeight: 700 }}>
              In Use
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#9A3412', mt: 0.5 }}>
              {summary?.inUseTables ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#EA580C' }}>
              Currently dining
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #CBD5E1', bgcolor: '#F8FAFC' }}>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
              Cleaning
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#475569', mt: 0.5 }}>
              {summary?.cleaningTables ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Being turned over
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={6} sm={4} md={2}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #FCA5A5', bgcolor: '#FEF2F2' }}>
            <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 700 }}>
              Locked
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#991B1B', mt: 0.5 }}>
              {summary?.lockedTables ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#DC2626' }}>
              Unavailable
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ── View Mode Selector & Filters ── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          p: 1.5,
          bgcolor: '#FAFAFA',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Tabs
          value={viewMode}
          onChange={(_, val) => setViewMode(val)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 38,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 13,
              px: 2,
            },
            '& .Mui-selected': {
              bgcolor: '#F5F3FF',
              color: '#6D28D9 !important',
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          <Tab value="floor-plan" icon={<GridViewRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Floor Plan" />
          <Tab value="grid" icon={<TableRestaurantRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Table Grid" />
          <Tab value="list" icon={<ViewListRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Data List" />
        </Tabs>

        {/* Filters applicable for Grid & List views */}
        {viewMode !== 'floor-plan' && (
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <TextField
              placeholder="Search table # or area…"
              size="small"
              value={search}
              onChange={handleSearchChange}
              sx={{
                width: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#fff',
                  fontSize: 13,
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

            <TextField
              select
              label="Area"
              size="small"
              value={filterAreaId}
              onChange={(e) => {
                setFilterAreaId(e.target.value);
                setPage(1);
              }}
              sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff', fontSize: 13 } }}
            >
              {areaFilterOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              size="small"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff', fontSize: 13 } }}
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Stack>
        )}
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          {errorMsg}
        </Alert>
      )}

      {/* ── Floor Plan View ── */}
      {viewMode === 'floor-plan' && (
        <Box>
          {floorPlan.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#FAFAFA' }}>
              <Typography variant="body1" color="text.secondary">
                No floor plan data available. Please ensure dining areas and tables are configured.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={4}>
              {floorPlan.map((areaPlan) => (
                <Box key={areaPlan.areaId} sx={{ p: 2.5, bgcolor: '#FAFAFA', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E1B2E', fontSize: 16 }}>
                        {areaPlan.areaCode}
                      </Typography>
                      {areaPlan.areaName && (
                        <Badge tone="neutral">{areaPlan.areaName}</Badge>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        • {areaPlan.tables?.length || 0} Tables
                      </Typography>
                    </Box>
                    {areaPlan.areaDescription && (
                      <Typography variant="caption" color="text.secondary">
                        {areaPlan.areaDescription}
                      </Typography>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    {areaPlan.tables?.map((table) => (
                      <Grid item xs={12} sm={6} md={3} lg={2.4} key={table.id}>
                        <TableCard table={table} onSelectStatus={setSelectedTable} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* ── Table Grid View ── */}
      {viewMode === 'grid' && (
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} sx={{ color: '#6D28D9' }} />
            </Box>
          ) : tablesList.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#FAFAFA' }}>
              <Typography variant="body1" color="text.secondary">
                No tables match your filter criteria.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {tablesList.map((table) => (
                <Grid item xs={12} sm={6} md={3} lg={3} key={table.id}>
                  <TableCard table={table} onSelectStatus={setSelectedTable} />
                </Grid>
              ))}
            </Grid>
          )}

          {!loading && total > 0 && (
            <Box sx={{ mt: 3 }}>
              <AppPagination
                page={page}
                pageCount={pageCount}
                total={total}
                pageSize={PAGE_SIZE}
                onChange={setPage}
              />
            </Box>
          )}
        </Box>
      )}

      {/* ── Data List View ── */}
      {viewMode === 'list' && (
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} sx={{ color: '#6D28D9' }} />
            </Box>
          ) : (
            <Table
              columns={columns}
              rows={tablesList}
              getRowKey={(row) => row.id}
              emptyMessage="No tables found."
            />
          )}

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
        </Box>
      )}

      {/* ── Quick Status Change Dialog ── */}
      <QuickStatusDialog
        open={Boolean(selectedTable)}
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
        onConfirm={handleStatusChangeConfirm}
        loading={dialogLoading}
      />
    </Box>
  );
}

