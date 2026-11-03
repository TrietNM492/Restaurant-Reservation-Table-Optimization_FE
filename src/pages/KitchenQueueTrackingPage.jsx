import { useCallback, useEffect, useRef, useState } from 'react';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import FastfoodRoundedIcon from '@mui/icons-material/FastfoodRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { kitchenApi } from '../services/kitchenService';

// ─── Status Configurations ──────────────────────────────────────────────────

const STATUS_CONFIG = {
  QUEUED: {
    label: 'Queued',
    color: '#6D28D9',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    tone: 'neutral',
    icon: TimerRoundedIcon,
    nextAction: 'Start Preparing',
    nextStatus: 'PREPARING',
  },
  PENDING: {
    label: 'Pending',
    color: '#6D28D9',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    tone: 'neutral',
    icon: TimerRoundedIcon,
    nextAction: 'Start Preparing',
    nextStatus: 'PREPARING',
  },
  PREPARING: {
    label: 'Cooking',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    tone: 'warning',
    icon: LocalFireDepartmentRoundedIcon,
    nextAction: 'Mark Ready',
    nextStatus: 'READY',
  },
  COOKING: {
    label: 'Cooking',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    tone: 'warning',
    icon: LocalFireDepartmentRoundedIcon,
    nextAction: 'Mark Ready',
    nextStatus: 'READY',
  },
  READY: {
    label: 'Ready to Serve',
    color: '#16A34A',
    bg: '#DCFCE7',
    border: '#BBF7D0',
    tone: 'success',
    icon: CheckCircleRoundedIcon,
    nextAction: 'Mark Served',
    nextStatus: 'SERVED',
  },
  DONE: {
    label: 'Ready to Serve',
    color: '#16A34A',
    bg: '#DCFCE7',
    border: '#BBF7D0',
    tone: 'success',
    icon: CheckCircleRoundedIcon,
    nextAction: 'Mark Served',
    nextStatus: 'SERVED',
  },
  ON_HOLD: {
    label: 'On Hold',
    color: '#475569',
    bg: '#F1F5F9',
    border: '#CBD5E1',
    tone: 'neutral',
    icon: PauseCircleOutlineRoundedIcon,
    nextAction: 'Resume',
    nextStatus: 'PREPARING',
  },
  SERVED: {
    label: 'Served',
    color: '#2563EB',
    bg: '#DBEAFE',
    border: '#BFDBFE',
    tone: 'info',
    icon: DoneAllRoundedIcon,
    nextAction: null,
    nextStatus: null,
  },
  SERVCED: {
    label: 'Served',
    color: '#2563EB',
    bg: '#DBEAFE',
    border: '#BFDBFE',
    tone: 'info',
    icon: DoneAllRoundedIcon,
    nextAction: null,
    nextStatus: null,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#DC2626',
    bg: '#FEE2E2',
    border: '#FECACA',
    tone: 'danger',
    icon: PriorityHighRoundedIcon,
    nextAction: null,
    nextStatus: null,
  },
  CANCELED: {
    label: 'Cancelled',
    color: '#DC2626',
    bg: '#FEE2E2',
    border: '#FECACA',
    tone: 'danger',
    icon: PriorityHighRoundedIcon,
    nextAction: null,
    nextStatus: null,
  },
  REJECTED: {
    label: 'Rejected',
    color: '#DC2626',
    bg: '#FEE2E2',
    border: '#FECACA',
    tone: 'danger',
    icon: PriorityHighRoundedIcon,
    nextAction: null,
    nextStatus: null,
  },
};

const KANBAN_LANES = [
  { key: 'QUEUED', label: 'Queued (Pending)', statuses: ['QUEUED', 'PENDING'], color: '#6D28D9', bg: '#F8F6FF' },
  { key: 'PREPARING', label: 'Cooking (In Kitchen)', statuses: ['PREPARING', 'COOKING'], color: '#D97706', bg: '#FFFDF5' },
  { key: 'READY', label: 'Ready to Serve', statuses: ['READY', 'DONE'], color: '#16A34A', bg: '#F6FEF9' },
  { key: 'ON_HOLD', label: 'On Hold', statuses: ['ON_HOLD'], color: '#475569', bg: '#F8FAFC' },
];

const STATUS_TRANSITIONS = {
  QUEUED: ['PREPARING', 'ON_HOLD', 'CANCELLED'],
  PENDING: ['PREPARING', 'ON_HOLD', 'CANCELLED'],
  PREPARING: ['READY', 'ON_HOLD', 'CANCELLED'],
  COOKING: ['READY', 'ON_HOLD', 'CANCELLED'],
  READY: ['SERVED'],
  DONE: ['SERVED'],
  ON_HOLD: ['PREPARING', 'CANCELLED'],
};

const TERMINAL_STATUSES = ['SERVED', 'SERVCED', 'CANCELLED', 'CANCELED', 'REJECTED'];

const formatTimestamp = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleString();
};

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    return message.map((item) => (typeof item === 'string' ? item : item?.message)).filter(Boolean).join('; ');
  }
  if (message && typeof message === 'object') {
    return Object.entries(message)
      .map(([field, detail]) => `${field}: ${detail}`)
      .join('; ');
  }
  return error?.response?.data?.error || error?.message || fallback;
};

// ─── Status Update Modal Component ──────────────────────────────────────────

function OrderStatusModal({ open, order, onClose, onConfirm, loading }) {
  const currentStatus = order?.status || '';
  const currentStatusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.QUEUED;
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus);
  const nextStatuses = isTerminal ? [] : STATUS_TRANSITIONS[currentStatus] || [];
  const [targetStatus, setTargetStatus] = useState(
    () => currentStatusConfig.nextStatus || currentStatus,
  );
  const [note, setNote] = useState(order?.note || '');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const statusLabels = {
    PREPARING: 'Cooking / Preparing',
    READY: 'Ready to Serve',
    SERVED: 'Served to Guest',
    ON_HOLD: 'On Hold',
    CANCELLED: 'Cancel Order',
    [currentStatus]: `Keep current status (${currentStatusConfig.label})`,
  };
  const availableStatuses = [currentStatus, ...nextStatuses].filter(Boolean).map((status) => ({
    value: status,
    label: statusLabels[status] || STATUS_CONFIG[status]?.label || status,
  }));
  const noteChanged = note !== (order?.note || '');
  const statusChanged = targetStatus !== currentStatus;
  const canSubmit = !isTerminal && (statusChanged || noteChanged);
  const submitUpdate = () => {
    if (targetStatus === 'CANCELLED' && statusChanged) {
      setConfirmCancelOpen(true);
      return;
    }
    onConfirm(order.kitchenOrderId, targetStatus, note);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Update Kitchen Order Status" size="small">
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Order #{order?.orderNo || order?.orderId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order?.tableOrRoomInfo || 'Dine-in'} • {order?.customerName || 'Walk-in Guest'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {order?.kitchenStation || 'Kitchen station not assigned'}
                </Typography>
              </Box>
              <Chip
                label={currentStatusConfig.label}
                size="small"
                sx={{
                  bgcolor: currentStatusConfig.bg,
                  color: currentStatusConfig.color,
                  border: `1px solid ${currentStatusConfig.border}`,
                  fontWeight: 700,
                }}
              />
            </Stack>
          </Box>

          <Box sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: '12px' }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: '#475569', mb: 1 }}>
              ORDER TIMELINE
            </Typography>
            <Stack spacing={0.75}>
              <Typography variant="caption" color="text.secondary">
                Received: {formatTimestamp(order?.orderTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Started: {formatTimestamp(order?.actualStartTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ready: {formatTimestamp(order?.actualReadyTime)}
                {order?.estimatedReadyTime ? ` (estimated ${formatTimestamp(order.estimatedReadyTime)})` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Served: {formatTimestamp(order?.actualServedTime)}
              </Typography>
            </Stack>
          </Box>

          <TextField
            select
            label="Kitchen Status"
            size="small"
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value)}
            fullWidth
            disabled={isTerminal || loading}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' },
            }}
          >
            {availableStatuses.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Chef Note (Optional)"
            size="small"
            multiline
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add preparation instructions or an update for the service team"
            helperText={`${note.length}/500 characters`}
            inputProps={{ maxLength: 500 }}
            fullWidth
            disabled={isTerminal || loading}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' },
            }}
          />

          {isTerminal && (
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              This order is in a final status and can no longer be updated.
            </Alert>
          )}

          {targetStatus === 'CANCELLED' && statusChanged && (
            <Alert severity="warning" sx={{ borderRadius: '12px' }}>
              Cancelling this kitchen order is a final action.
            </Alert>
          )}

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitUpdate}
              disabled={loading || !canSubmit}
            >
              {loading ? 'Updating…' : statusChanged ? 'Save Update' : 'Save Note'}
            </Button>
          </Box>
        </Stack>
      </Modal>
      <ConfirmDialog
        open={confirmCancelOpen}
        title="Cancel kitchen order?"
        confirmLabel="Cancel Order"
        onCancel={() => setConfirmCancelOpen(false)}
        onConfirm={() => {
          setConfirmCancelOpen(false);
          onConfirm(order.kitchenOrderId, targetStatus, note);
        }}
      >
        This action is final. The order will be marked as cancelled and cannot be updated again.
      </ConfirmDialog>
    </>
  );
}

// ─── Kitchen Order Card Component ───────────────────────────────────────────

function KitchenOrderCard({ order, onOpenStatusModal, onQuickAdvance, actionLoadingId }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.QUEUED;
  const isVip = order.isVip ?? order.vip;
  const isOverdue = order.waitingMinutes > (order.estimatedPrepTimeMinutes || 30);
  const isActionLoading = actionLoadingId === order.kitchenOrderId;
  const priorityLabel = order.priorityLabel || (order.priority >= 3 ? 'VIP_URGENT' : order.priority === 2 ? 'HIGH' : 'NORMAL');
  const isTerminal = TERMINAL_STATUSES.includes(order.status);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '16px',
        border: '1.5px solid',
        borderColor: isVip ? '#C4B5FD' : isOverdue ? '#FCA5A5' : '#E2E8F0',
        bgcolor: '#FFFFFF',
        boxShadow: isVip ? '0 8px 20px rgba(109, 40, 217, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 24px rgba(109, 40, 217, 0.12)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Header: Order No, Table/Room, VIP Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 15, color: '#1E1B2E' }}>
                #{order.orderNo || `ORD-${order.orderId}`}
              </Typography>
              {isVip && (
                <Chip
                  icon={<StarRoundedIcon sx={{ fontSize: '14px !important', color: '#D97706 !important' }} />}
                  label="VIP"
                  size="small"
                  sx={{
                    bgcolor: '#FEF3C7',
                    color: '#B45309',
                    fontWeight: 800,
                    height: 22,
                    fontSize: 10,
                  }}
                />
              )}
              {priorityLabel === 'HIGH' && (
                <Chip label="HIGH PRIORITY" size="small" color="warning" sx={{ height: 22, fontSize: 10, fontWeight: 800 }} />
              )}
              {priorityLabel === 'VIP_URGENT' && (
                <Chip label="URGENT" size="small" color="error" sx={{ height: 22, fontSize: 10, fontWeight: 800 }} />
              )}
            </Stack>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
              <TableRestaurantRoundedIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
              {order.tableOrRoomInfo || 'Dine-in'}
            </Typography>
          </Box>

          <Chip
            label={config.label}
            size="small"
            sx={{
              bgcolor: config.bg,
              color: config.color,
              border: `1px solid ${config.border}`,
              fontWeight: 700,
              fontSize: 11,
              height: 24,
            }}
          />
        </Box>

        {/* Customer & Waiting Time */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
            {order.customerName || 'Walk-in Guest'}
          </Typography>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <AccessTimeRoundedIcon sx={{ fontSize: 13, color: isOverdue ? '#DC2626' : '#64748B' }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: isOverdue ? '#DC2626' : '#64748B',
              }}
            >
              Wait: {order.waitingMinutes}m {order.estimatedPrepTimeMinutes ? `/ Est: ${order.estimatedPrepTimeMinutes}m` : ''}
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ my: 1, borderColor: '#F1F5F9' }} />

        {/* Dish Items List */}
        <Stack spacing={0.8} sx={{ mb: 2 }}>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <Box
                key={item.orderItemId || idx}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    component="span"
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '6px',
                      bgcolor: '#F5F3FF',
                      color: '#6D28D9',
                      fontWeight: 800,
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.quantity}×
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, color: '#1E1B2E' }}>
                    {item.itemName}
                  </Typography>
                </Box>
                {item.estimatedPrepTimeMinutes && (
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 11 }}>
                    ~{item.estimatedPrepTimeMinutes}m
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">
              No dish items specified.
            </Typography>
          )}
        </Stack>

        {/* Note if available */}
        {order.note && (
          <Box sx={{ p: 1, bgcolor: '#FEF9C3', borderRadius: '8px', mb: 1.5, border: '1px dashed #FDE047' }}>
            <Typography variant="caption" sx={{ color: '#854D0E', fontWeight: 600, display: 'block' }}>
              Note: {order.note}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
          {!isTerminal && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => onOpenStatusModal(order)}
              sx={{ flex: 1 }}
            >
              Update
            </Button>
          )}

          {config.nextAction && (
            <Button
              variant="primary"
              size="small"
              onClick={() => onQuickAdvance(order, config.nextStatus)}
              disabled={isActionLoading}
              sx={{ flex: 1.4 }}
            >
              {isActionLoading ? 'Saving…' : config.nextAction}
            </Button>
          )}
        </Box>
      </Box>
    </Card>
  );
}

// ─── Main Kitchen Queue Tracking Page ───────────────────────────────────────

export default function KitchenQueueTrackingPage() {
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const ordersRequestId = useRef(0);

  // ── Filters & Search ──
  const [search, setSearch] = useState('');
  const [filterVip, setFilterVip] = useState('ALL'); // 'ALL' | 'VIP' | 'REGULAR'
  const [selectedStatusTab, setSelectedStatusTab] = useState('ACTIVE'); // 'ACTIVE' | 'ALL' | specific status
  const searchTimeout = useRef(null);

  // ── Status Modal ──
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // ── Auto-refresh timer ──
  const filtersRef = useRef({ search, filterVip, selectedStatusTab });

  // ─── Load Dashboard Stats ─────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    try {
      const res = await kitchenApi.getDashboard();
      const payload = res?.data ?? res;
      setDashboard(payload);
    } catch {
      // Non-blocking
    }
  }, []);

  // ─── Load Kitchen Orders ──────────────────────────────────────────────────

  const loadOrders = useCallback(async (currentSearch, currentVip, currentStatus) => {
    const requestId = ++ordersRequestId.current;
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (currentSearch && currentSearch.trim()) params.search = currentSearch.trim();
      if (currentVip === 'VIP') params.isVip = true;
      if (currentVip === 'REGULAR') params.isVip = false;
      if (currentStatus && currentStatus !== 'ALL' && currentStatus !== 'ACTIVE') {
        params.status = currentStatus;
      }

      const res = await kitchenApi.getOrders(params);
      const payload = res?.data ?? res;
      if (requestId === ordersRequestId.current) {
        setOrders(Array.isArray(payload) ? payload : []);
      }
    } catch (err) {
      if (requestId === ordersRequestId.current) {
        setErrorMsg(getErrorMessage(err, 'Failed to load kitchen queue orders.'));
      }
    } finally {
      if (requestId === ordersRequestId.current) {
        setLoading(false);
      }
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadDashboard(),
      loadOrders(search, filterVip, selectedStatusTab),
    ]);
    setRefreshing(false);
  }, [loadDashboard, loadOrders, search, filterVip, selectedStatusTab]);

  useEffect(() => {
    const initialLoad = setTimeout(() => loadDashboard(), 0);
    const timer = setInterval(() => {
      loadDashboard();
      const currentFilters = filtersRef.current;
      loadOrders(currentFilters.search, currentFilters.filterVip, currentFilters.selectedStatusTab);
    }, 20000);

    return () => {
      clearTimeout(initialLoad);
      clearInterval(timer);
      clearTimeout(searchTimeout.current);
    };
  }, [loadDashboard, loadOrders]);

  useEffect(() => {
    filtersRef.current = { search, filterVip, selectedStatusTab };
  }, [search, filterVip, selectedStatusTab]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentFilters = filtersRef.current;
      loadOrders(currentFilters.search, currentFilters.filterVip, currentFilters.selectedStatusTab);
    }, 0);
    return () => clearTimeout(timeout);
  }, [filterVip, selectedStatusTab, loadOrders]);

  // ─── Debounced Search ─────────────────────────────────────────────────────

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const currentFilters = filtersRef.current;
      loadOrders(val, currentFilters.filterVip, currentFilters.selectedStatusTab);
    }, 400);
  };

  // ─── Quick Advance / Modal Update Status ──────────────────────────────────

  const handleQuickAdvance = async (order, nextStatus) => {
    setActionLoadingId(order.kitchenOrderId);
    try {
      await kitchenApi.updateOrderStatus(order.kitchenOrderId, { status: nextStatus });
      await Promise.all([
        loadDashboard(),
        loadOrders(search, filterVip, selectedStatusTab),
      ]);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update order status'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleModalStatusConfirm = async (kitchenOrderId, newStatus, note) => {
    setModalLoading(true);
    try {
      await kitchenApi.updateOrderStatus(kitchenOrderId, {
        status: newStatus,
        note: note.trim(),
      });
      setStatusModalOrder(null);
      await Promise.all([
        loadDashboard(),
        loadOrders(search, filterVip, selectedStatusTab),
      ]);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update order status'));
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Group Orders by Lane for Kanban Board ────────────────────────────────

  const getOrdersForLane = (statuses) => {
    return orders.filter((o) => statuses.includes(o.status));
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FastfoodRoundedIcon sx={{ color: '#6D28D9', fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E1B2E' }}>
              Kitchen Queue Tracking
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time kitchen order dispatch, dish prep progress, wait time alerts, and station load monitoring.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="secondary"
            size="medium"
            onClick={refreshAll}
            disabled={refreshing}
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon />}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </Stack>
      </Box>

      {/* ── KPI Load Monitoring Metrics (FR-030) ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Pending Orders */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Pending In Queue
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#6D28D9', mt: 0.5 }}>
              {dashboard?.pendingOrdersCount ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              Awaiting preparation
            </Typography>
          </Card>
        </Grid>

        {/* Cooking / Preparing */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #FDE68A', bgcolor: '#FFFDF5' }}>
            <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 700 }}>
              Cooking / In Progress
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#D97706', mt: 0.5 }}>
              {dashboard?.preparingOrdersCount ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#B45309' }}>
              Currently on the line
            </Typography>
          </Card>
        </Grid>

        {/* Ready to Serve */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #BBF7D0', bgcolor: '#F0FDF4' }}>
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700 }}>
              Ready for Pickup
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#16A34A', mt: 0.5 }}>
              {dashboard?.readyOrdersCount ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#15803D' }}>
              Dishes plated &amp; hot
            </Typography>
          </Card>
        </Grid>

        {/* Kitchen Utilization % */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Kitchen Load
              </Typography>
              <SpeedRoundedIcon sx={{ fontSize: 18, color: '#6D28D9' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E1B2E', mt: 0.5 }}>
              {Math.round(dashboard?.kitchenUtilizationPercent ?? 0)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, dashboard?.kitchenUtilizationPercent ?? 0)}
              sx={{
                mt: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: '#F1F5F9',
                '& .MuiLinearProgress-bar': {
                  bgcolor: (dashboard?.kitchenUtilizationPercent ?? 0) > 80 ? '#DC2626' : '#6D28D9',
                },
              }}
            />
          </Card>
        </Grid>
      </Grid>

      {/* ── Toolbar: Search & Filter Tabs ── */}
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
          value={selectedStatusTab}
          onChange={(_, val) => setSelectedStatusTab(val)}
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
          <Tab value="ACTIVE" label="Active Queue (Live)" />
          <Tab value="ALL" label="List View" />
          <Tab value="QUEUED" label="Queued Only" />
          <Tab value="PREPARING" label="Cooking Only" />
          <Tab value="READY" label="Ready Only" />
        </Tabs>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          {/* Search */}
          <TextField
            placeholder="Search order # or kitchen note…"
            size="small"
            value={search}
            onChange={handleSearchChange}
            sx={{
              width: 240,
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

          {/* VIP filter */}
          <TextField
            select
            size="small"
            value={filterVip}
            onChange={(e) => setFilterVip(e.target.value)}
            sx={{
              width: 140,
              '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff', fontSize: 13 },
            }}
          >
            <MenuItem value="ALL">All Guests</MenuItem>
            <MenuItem value="VIP">⭐ VIP Only</MenuItem>
            <MenuItem value="REGULAR">Regular Dining</MenuItem>
          </TextField>
        </Stack>
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          {errorMsg}
        </Alert>
      )}

      {/* ── Kanban Columns / Order Cards ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ color: '#6D28D9' }} />
        </Box>
      ) : selectedStatusTab === 'ACTIVE' ? (
        // ── Kanban 4-Lane Board View ──
        <Grid container spacing={2.5}>
          {KANBAN_LANES.map((lane) => {
            const laneOrders = getOrdersForLane(lane.statuses);
            return (
              <Grid item xs={12} sm={6} lg={3} key={lane.key}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: lane.bg,
                    border: '1px solid #E2E8F0',
                    minHeight: 520,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: lane.color }}>
                      {lane.label}
                    </Typography>
                    <Chip
                      label={laneOrders.length}
                      size="small"
                      sx={{
                        bgcolor: '#fff',
                        fontWeight: 800,
                        border: '1px solid #E2E8F0',
                        color: lane.color,
                        height: 22,
                      }}
                    />
                  </Box>

                  <Stack spacing={2}>
                    {laneOrders.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          No orders in this station
                        </Typography>
                      </Box>
                    ) : (
                      laneOrders.map((order) => (
                        <KitchenOrderCard
                          key={order.kitchenOrderId}
                          order={order}
                          onOpenStatusModal={setStatusModalOrder}
                          onQuickAdvance={handleQuickAdvance}
                          actionLoadingId={actionLoadingId}
                        />
                      ))
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // ── Grid Layout View for Specific Status / All ──
        <Grid container spacing={2}>
          {orders.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#FAFAFA' }}>
                <Typography variant="body1" color="text.secondary">
                  No kitchen orders found matching current criteria.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            orders.map((order) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={order.kitchenOrderId}>
                <KitchenOrderCard
                  order={order}
                  onOpenStatusModal={setStatusModalOrder}
                  onQuickAdvance={handleQuickAdvance}
                  actionLoadingId={actionLoadingId}
                />
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* ── Quick Status / Details Modal ── */}
      {statusModalOrder && (
        <OrderStatusModal
          key={statusModalOrder.kitchenOrderId}
          open
          order={statusModalOrder}
          onClose={() => setStatusModalOrder(null)}
          onConfirm={handleModalStatusConfirm}
          loading={modalLoading}
        />
      )}
    </Box>
  );
}
