import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DiamondRoundedIcon from '@mui/icons-material/DiamondRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import RoomServiceRoundedIcon from '@mui/icons-material/RoomServiceRounded';
import SoupKitchenRoundedIcon from '@mui/icons-material/SoupKitchenRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';

import PrepTimeMiniWidget from '../prediction/PrepTimeMiniWidget';
import { orderApi } from '../../services/orderService';
import { paymentApi } from '../../services/paymentService';
import { formatMenuPrice } from '../../utils/menuUtils';
import { useOrderStore } from '../../stores/useOrderStore';

// ─── 4-Step Visual Kitchen Progression ─────────────────────────────────────
const KITCHEN_STEPS = [
  {
    key: 'PENDING',
    title: 'Queued',
    icon: ReceiptLongRoundedIcon,
    activeColor: '#6366F1',
    activeBg: '#EEF2FF',
    label: 'Order placed in kitchen queue',
  },
  {
    key: 'COOKING',
    title: 'Cooking',
    icon: SoupKitchenRoundedIcon,
    activeColor: '#EA580C',
    activeBg: '#FFF7ED',
    label: 'Kitchen is preparing your dishes',
  },
  {
    key: 'READY',
    title: 'Ready',
    icon: RoomServiceRoundedIcon,
    activeColor: '#10B981',
    activeBg: '#ECFDF5',
    label: 'Dishes ready, being served to table',
  },
  {
    key: 'SERVED',
    title: 'Served',
    icon: DoneAllRoundedIcon,
    activeColor: '#059669',
    activeBg: '#F0FDF4',
    label: 'All dishes served at table',
  },
];

const getActiveStepIndex = (status) => {
  if (!status) return 0;
  const s = String(status).toUpperCase();
  if (s === 'PENDING' || s === 'QUEUED') return 0;
  if (s === 'COOKING' || s === 'PREPARING') return 1;
  if (s === 'READY' || s === 'READY_TO_SERVE' || s === 'DONE' || s === 'COMPLETED') return 2;
  if (s === 'SERVED' || s === 'SERVCED') return 3;
  return 0;
};

export default function DiningOrderDrawer({ onInitiatePayment }) {
  const {
    items,
    selectedTableId,
    selectedReservationId,
    selectedReservationNo,
    isVipRoom,
    selectedRoomId,
    selectedRoomName,
    selectedRoomPrice,
    activeOrder,
    isDrawerOpen,
    setDrawerOpen,
    setSelectedTableId,
    setActiveOrder,
    updateQuantity,
    removeItem,
    clearDraft,
  } = useOrderStore();

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [alertNotice, setAlertNotice] = useState({ open: false, message: '', severity: 'info' });
  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());

  // Load table list when drawer is opened
  useEffect(() => {
    if (!isDrawerOpen) return;

    let isCancelled = false;
    const fetchTables = async () => {
      try {
        setLoadingTables(true);
        const data = await orderApi.getAvailableTables();
        if (!isCancelled) {
          setTables(Array.isArray(data) ? data : []);
        }
      } catch {
        // Non-blocking fallback
      } finally {
        if (!isCancelled) setLoadingTables(false);
      }
    };

    fetchTables();
    return () => {
      isCancelled = true;
    };
  }, [isDrawerOpen]);

  // Auto-sync active order status from backend with polling while drawer is open
  useEffect(() => {
    if (!isDrawerOpen || !activeOrder?.id) return;

    let isCancelled = false;
    const syncStatus = async () => {
      try {
        const latest = await orderApi.getOrderStatus(activeOrder.id);
        if (!isCancelled && latest) {
          if (latest.orderStatus === 'COMPLETED') {
            useOrderStore.getState().resetOrder();
            setAlertNotice({
              open: true,
              message: `Dining at Table #${latest.tableNumber || currentTable?.tableNumber || ''} has been completed. Thank you for dining with us!`,
              severity: 'info',
            });
            return;
          }
          setActiveOrder(latest);
          setLastUpdatedTime(new Date());
        }
      } catch (err) {
        if (!isCancelled && (err?.response?.status === 404 || err?.status === 404)) {
          useOrderStore.getState().resetOrder();
        }
      }
    };

    // Initial immediate sync
    syncStatus();

    // Live polling every 4 seconds so kitchen and payment status changes reflect in real-time
    const timer = setInterval(syncStatus, 4000);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [isDrawerOpen, activeOrder?.id, setActiveOrder]);

  // Determine if active order is already paid
  const isOrderPaid = Boolean(
    activeOrder && (
      activeOrder.orderStatus === 'OK' ||
      activeOrder.orderStatus === 'COMPLETED' ||
      activeOrder.orderStatus === 'PAID'
    ) && (activeOrder.remainingAmount === undefined || Number(activeOrder.remainingAmount) <= 0)
  );

  // Remaining unpaid balance on table
  const unpaidAmount = useMemo(() => {
    if (!activeOrder) return 0;
    if (activeOrder.remainingAmount !== undefined && activeOrder.remainingAmount !== null) {
      return Number(activeOrder.remainingAmount);
    }
    if (isOrderPaid) return 0;
    return Number(activeOrder.totalAmount) || 0;
  }, [activeOrder, isOrderPaid]);

  // Target total amount of order (after discount if any, or raw total)
  const orderTargetTotal = useMemo(() => {
    if (!activeOrder) return 0;
    if (activeOrder.targetTotalAmount !== undefined && activeOrder.targetTotalAmount !== null) {
      return Number(activeOrder.targetTotalAmount) || 0;
    }
    return Number(activeOrder.totalAmount) || 0;
  }, [activeOrder]);

  // Already paid deposit / partial amount
  const alreadyPaidAmount = useMemo(() => {
    if (!activeOrder) return 0;
    return Number(activeOrder.alreadyPaidAmount) || 0;
  }, [activeOrder]);

  // 50% deposit calculations (eligible ONLY for advance reservations prior to guest arrival)
  const isEligibleForAdvanceDeposit = useMemo(() => {
    if (!activeOrder) {
      // Draft mode before creating order
      return Boolean(selectedReservationId && !isVipRoom);
    }

    // 1. Explicit flag from backend OrderResponseDTO
    if (activeOrder.isAdvanceReservation === false || activeOrder.advanceReservation === false) {
      return false;
    }

    // 2. Walk-in dining at tables is NEVER eligible for deposit
    if (
      activeOrder.reservationType === 'WALK_IN' ||
      activeOrder.reservationNo?.startsWith('WALK-') ||
      activeOrder.reservationNo?.startsWith('WALKIN-')
    ) {
      return false;
    }

    // 3. If dining arrival time has already arrived or passed, guest is at the restaurant
    if (activeOrder.reservationStartTime) {
      const startMs = new Date(activeOrder.reservationStartTime).getTime();
      if (!isNaN(startMs) && Date.now() >= startMs) {
        return false;
      }
    }

    // 4. Must be associated with a reservation
    return Boolean(activeOrder.reservationId || selectedReservationId);
  }, [activeOrder, selectedReservationId, isVipRoom]);

  const isReservationOrder = isEligibleForAdvanceDeposit;

  const fiftyPercentDeposit = useMemo(() => {
    return Math.round(orderTargetTotal * 0.5);
  }, [orderTargetTotal]);

  const requiredDeposit = useMemo(() => {
    if (!isEligibleForAdvanceDeposit) return 0;
    const needed = fiftyPercentDeposit - alreadyPaidAmount;
    return Math.max(0, Math.min(needed, unpaidAmount));
  }, [isEligibleForAdvanceDeposit, fiftyPercentDeposit, alreadyPaidAmount, unpaidAmount]);

  const hasPaidDeposit = useMemo(() => {
    return alreadyPaidAmount > 0 && alreadyPaidAmount >= fiftyPercentDeposit;
  }, [alreadyPaidAmount, fiftyPercentDeposit]);

  // Calculate remaining minutes from estimatedReadyTime
  const remainingMinutes = useMemo(() => {
    if (!activeOrder?.estimatedReadyTime) return null;
    const target = new Date(activeOrder.estimatedReadyTime).getTime();
    if (isNaN(target)) return null;
    const diff = Math.round((target - Date.now()) / 60000);
    return diff > 0 ? diff : 0;
  }, [activeOrder?.estimatedReadyTime]);

  // Dynamic membership tier discount label
  const tierDiscountLabel = useMemo(() => {
    const rate = Number(activeOrder?.discountRate) || 0;
    const rank = activeOrder?.customerRank || activeOrder?.rank;
    if (rank) {
      const rStr = String(rank).toUpperCase();
      if (rStr.includes('CAO') || rStr.includes('MASTER')) return `Master Member Discount (−${rate}%)`;
      if (rStr.includes('DIAMOND')) return `Diamond Member Discount (−${rate}%)`;
      if (rStr.includes('GOLD')) return `Gold Member Discount (−${rate}%)`;
    }
    if (rate >= 15) return `Master Member Discount (−${rate}%)`;
    if (rate >= 10) return `Diamond Member Discount (−${rate}%)`;
    if (rate >= 5) return `Gold Member Discount (−${rate}%)`;
    return `Membership Tier Discount (${rate}%)`;
  }, [activeOrder?.discountRate, activeOrder?.customerRank, activeOrder?.rank]);

  // Current selected table object
  const currentTable = useMemo(() => {
    const id = activeOrder?.tableId || selectedTableId;
    return tables.find((t) => t.id === Number(id)) || null;
  }, [tables, selectedTableId, activeOrder]);

  // Calculate Draft Subtotal
  const draftSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  }, [items]);

  // Grand Total: active order amount + draft items + room fee (if vip room without active order)
  const grandTotal = useMemo(() => {
    const activeAmount = Number(activeOrder?.totalAmount) || 0;
    const roomFee = (!activeOrder && isVipRoom) ? Number(selectedRoomPrice || 0) : 0;
    return activeAmount + draftSubtotal + roomFee;
  }, [activeOrder, draftSubtotal, isVipRoom, selectedRoomPrice]);

  // Refresh active order status manually
  const handleRefreshStatus = async () => {
    if (!activeOrder?.id) return;
    try {
      setRefreshing(true);
      const updated = await orderApi.getOrderStatus(activeOrder.id);
      if (updated) {
        setActiveOrder(updated);
        setLastUpdatedTime(new Date());
        setAlertNotice({
          open: true,
          message: 'Kitchen status refreshed.',
          severity: 'success',
        });
      }
    } catch (err) {
      setAlertNotice({
        open: true,
        message: err.message || 'Failed to refresh order status.',
        severity: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Submit new order (Create Order)
  const handleConfirmSubmitOrder = async () => {
    setConfirmDialogOpen(false);
    const hasLocation = Boolean(selectedTableId || activeOrder?.tableId || isVipRoom || selectedReservationId);
    if (!hasLocation) {
      setAlertNotice({
        open: true,
        message: 'Please select your dining table before submitting order!',
        severity: 'warning',
      });
      return;
    }

    if (items.length === 0 && (!isVipRoom || Number(selectedRoomPrice) <= 0)) {
      setAlertNotice({
        open: true,
        message: 'No dishes selected in your order cart.',
        severity: 'warning',
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        tableId: selectedTableId || activeOrder?.tableId || undefined,
        reservationId: selectedReservationId || undefined,
        isVipRoom: Boolean(isVipRoom || activeOrder?.isVipRoom),
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
        customerNote: customerNote.trim() || undefined,
      };

      const result = await orderApi.createOrder(payload);
      setActiveOrder(result);
      clearDraft();
      setCustomerNote('');
      setAlertNotice({
        open: true,
        message: `Order submitted successfully! Order #${result.orderNo || ''}`,
        severity: 'success',
      });
    } catch (err) {
      setAlertNotice({
        open: true,
        message: err.message || 'Failed to submit order. Please try again!',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add extra items to existing active order
  const handleAddMoreItems = async () => {
    if (!activeOrder?.id || items.length === 0) return;

    try {
      setSubmitting(true);
      for (const item of items) {
        await orderApi.addOrderItem({
          orderId: activeOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          customerNote: customerNote.trim() || undefined,
        });
      }

      clearDraft();
      setCustomerNote('');
      const updated = await orderApi.getOrderStatus(activeOrder.id);
      setActiveOrder(updated);
      setAlertNotice({
        open: true,
        message: 'Additional dishes sent to kitchen successfully!',
        severity: 'success',
      });
    } catch (err) {
      setAlertNotice({
        open: true,
        message: err.message || 'Failed to add extra dishes.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete an item from active order
  const handleDeleteActiveItem = async (itemId) => {
    try {
      await orderApi.deleteOrderItem(itemId);
      const updated = await orderApi.getOrderStatus(activeOrder.id);
      setActiveOrder(updated);
      setAlertNotice({
        open: true,
        message: 'Item removed from kitchen order.',
        severity: 'info',
      });
    } catch (err) {
      setAlertNotice({
        open: true,
        message: err.message || 'Cannot cancel dish once kitchen has started cooking.',
        severity: 'error',
      });
    }
  };

  // Trigger VNPay Payment for active table order
  const handlePayWithVnPay = async (customAmount = null) => {
    if (!activeOrder?.id) return;

    const paymentAmount = (customAmount !== null && customAmount !== undefined)
      ? Number(customAmount)
      : (unpaidAmount > 0 ? unpaidAmount : (activeOrder.remainingAmount || null));

    if (paymentAmount <= 0) {
      setAlertNotice({
        open: true,
        message: 'Dining bill is already fully settled.',
        severity: 'info',
      });
      return;
    }

    try {
      setPaying(true);
      setAlertNotice({
        open: true,
        message: 'Connecting to VNPay Sandbox gateway...',
        severity: 'info',
      });

      const response = await paymentApi.createPayment({
        orderId: activeOrder.id,
        amount: paymentAmount,
      });

      if (response?.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        throw new Error('Did not receive payment gateway URL from VNPay.');
      }
    } catch (err) {
      setAlertNotice({
        open: true,
        message: err.message || 'Failed to initiate VNPay payment session.',
        severity: 'error',
      });
    } finally {
      setPaying(false);
    }
  };

  // Format ready time display
  const formatTime = (isoString) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  const activeKitchenStatus = activeOrder?.kitchenStatus || 'PENDING';
  const readyTimeStr = formatTime(activeOrder?.estimatedReadyTime);
  const activeStepIndex = getActiveStepIndex(activeKitchenStatus);

  const activeStepLabel = useMemo(() => {
    if (!activeOrder?.kitchenStatus) {
      if (isReservationOrder) {
        if (!hasPaidDeposit && requiredDeposit > 0) {
          return 'Pre-order saved. Awaiting 50% deposit before kitchen dispatch';
        }
        return 'Deposit confirmed. Scheduled for fresh prep prior to arrival';
      }
      return 'Order placed, awaiting kitchen dispatch';
    }
    return KITCHEN_STEPS[activeStepIndex]?.label;
  }, [activeOrder?.kitchenStatus, isReservationOrder, hasPaidDeposit, requiredDeposit, activeStepIndex]);

  return (
    <>
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 460 },
            display: 'flex',
            flexDirection: 'column',
            p: 0,
            bgcolor: '#F8FAFC',
          },
        }}
      >
        {/* ─── Drawer Header ────────────────────────────────────────── */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: '#7C3AED', width: 40, height: 40 }}>
              <RestaurantMenuRoundedIcon sx={{ color: '#fff' }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0F172A' }}>
                {(activeOrder?.isVipRoom || isVipRoom) ? 'VIP Room Order' : 'Dine-in Table Order'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeOrder ? `Order #${activeOrder.orderNo}` : 'Select dishes & send directly to kitchen'}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setDrawerOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        {/* ─── Drawer Body ──────────────────────────────────────────── */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          <Stack spacing={2.5}>
            {/* 1. Active Order Banner with 4-Step Visual Kitchen Progression */}
            {activeOrder ? (
              <Card
                variant="outlined"
                sx={{
                  p: 2.25,
                  bgcolor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.05)',
                }}
              >
                <Stack spacing={2}>
                  {/* Table & Order Code Header (Optimized: No duplicate chips) */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ bgcolor: (activeOrder.isVipRoom || isVipRoom) ? '#F59E0B' : '#7C3AED', width: 32, height: 32 }}>
                        {(activeOrder.isVipRoom || isVipRoom) ? (
                          <DiamondRoundedIcon sx={{ fontSize: 18, color: '#fff' }} />
                        ) : (
                          <TableRestaurantRoundedIcon sx={{ fontSize: 18, color: '#fff' }} />
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#0F172A', lineHeight: 1.2 }}>
                          {(activeOrder.isVipRoom || isVipRoom)
                            ? `👑 VIP Suite: ${activeOrder.roomName || selectedRoomName || 'Diamond VIP Suite'}`
                            : `Table #${activeOrder.tableNumber || currentTable?.tableNumber || activeOrder.tableId}`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {(activeOrder.isVipRoom || isVipRoom)
                            ? `${activeOrder.reservationNo || selectedReservationNo ? `Reservation #${activeOrder.reservationNo || selectedReservationNo} • ` : ''}Live kitchen tracking`
                            : 'Live order status & kitchen tracking'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Tooltip title={`Refresh kitchen status (Updated ${lastUpdatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}>
                      <IconButton
                        size="small"
                        onClick={handleRefreshStatus}
                        disabled={refreshing}
                        sx={{ color: '#7C3AED', bgcolor: '#F5F3FF', '&:hover': { bgcolor: '#EDE9FE' } }}
                      >
                        {refreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Divider sx={{ my: 0.5 }} />

                  {/* 4-Step Visual Kitchen Progress Route */}
                  <Box sx={{ pt: 1, pb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', px: 0.5 }}>
                      {KITCHEN_STEPS.map((step, idx) => {
                        const isCompleted = idx < activeStepIndex;
                        const isCurrent = idx === activeStepIndex;
                        const StepIcon = step.icon;

                        let nodeBg = '#FFFFFF';
                        let nodeBorder = '2px solid #CBD5E1';
                        let iconColor = '#94A3B8';

                        if (isCompleted) {
                          nodeBg = '#10B981';
                          nodeBorder = '2px solid #10B981';
                          iconColor = '#FFFFFF';
                        } else if (isCurrent) {
                          nodeBg = '#7C3AED';
                          nodeBorder = '2px solid #7C3AED';
                          iconColor = '#FFFFFF';
                        }

                        return (
                          <React.Fragment key={step.key}>
                            {/* Step Node */}
                            <Stack
                              alignItems="center"
                              spacing={0.5}
                              sx={{ flex: '0 0 auto', width: 62, textAlign: 'center' }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  bgcolor: nodeBg,
                                  border: nodeBorder,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: isCurrent ? '0 0 0 4px rgba(124, 58, 237, 0.2)' : 'none',
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                {isCompleted ? (
                                  <CheckRoundedIcon sx={{ fontSize: 18, color: '#fff' }} />
                                ) : (
                                  <StepIcon sx={{ fontSize: 16, color: iconColor }} />
                                )}
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.68rem',
                                  fontWeight: isCurrent ? 800 : isCompleted ? 600 : 500,
                                  color: isCurrent ? '#7C3AED' : isCompleted ? '#059669' : '#64748B',
                                  lineHeight: 1.2,
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {step.title}
                              </Typography>
                            </Stack>

                            {/* Connecting Line Between Steps (Only between steps, never after the last step!) */}
                            {idx < KITCHEN_STEPS.length - 1 && (
                              <Box
                                sx={{
                                  flex: 1,
                                  height: 3,
                                  mt: '15px',
                                  bgcolor: idx < activeStepIndex ? '#7C3AED' : '#E2E8F0',
                                  transition: 'background-color 0.4s ease',
                                }}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </Box>

                    {/* Active Step Status Banner with Single Delivery Time Display */}
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: KITCHEN_STEPS[activeStepIndex]?.activeBg || '#F5F3FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: KITCHEN_STEPS[activeStepIndex]?.activeColor || '#7C3AED',
                          }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{ color: KITCHEN_STEPS[activeStepIndex]?.activeColor || '#5B21B6' }}
                        >
                          {activeStepLabel}
                        </Typography>
                      </Stack>
                      {activeStepIndex < 3 && readyTimeStr && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography variant="caption" fontWeight={700} sx={{ color: '#6D28D9', whiteSpace: 'nowrap' }}>
                            {remainingMinutes !== null && remainingMinutes > 0
                              ? `~${remainingMinutes}m left (${readyTimeStr})`
                              : `Est. Ready: ${readyTimeStr}`}
                          </Typography>
                          {activeOrder?.firstDishReadyMinutes != null && activeOrder.firstDishReadyMinutes > 0 && (
                            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, fontSize: '0.7rem' }}>
                              First dish ~{activeOrder.firstDishReadyMinutes}m
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Stack>
              </Card>
            ) : isVipRoom ? (
              /* 2. VIP Suite Location Card (Auto-detected from reservation) */
              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: '#FFFBEB',
                  borderColor: '#FCD34D',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: '#F59E0B', width: 36, height: 36 }}>
                    <DiamondRoundedIcon sx={{ fontSize: 20, color: '#fff' }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#92400E' }}>
                      👑 VIP Suite: {selectedRoomName || 'Diamond VIP Suite'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#B45309', display: 'block' }}>
                      {selectedReservationNo ? `Reservation #${selectedReservationNo} • ` : ''}
                      Room Reservation Fee: {formatMenuPrice(selectedRoomPrice)}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="caption" sx={{ color: '#78350F', display: 'block', mt: 1 }}>
                  Private room reserved for your party. 50% deposit applies to the room and any pre-ordered dishes.
                </Typography>
              </Card>
            ) : (
              /* 2. Table Selector (When customer is starting a new table order) */
              <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#334155' }}>
                  Your Dining Table Location
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel id="table-select-label">Select Dining Table</InputLabel>
                  <Select
                    labelId="table-select-label"
                    value={selectedTableId ?? ''}
                    label="Select Dining Table"
                    disabled={loadingTables}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Please select your table --</em>
                    </MenuItem>
                    {tables.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        Table #{t.tableNumber} - {t.area?.name || t.areaName || 'Main Dining'} ({t.capacity} seats)
                        {t.statusCode ? ` [${t.statusCode}]` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {currentTable && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Selected: <strong>Table #{currentTable.tableNumber}</strong> - Area:{' '}
                      {currentTable.area?.name || currentTable.areaName || 'Main Dining'}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setSelectedTableId(null)}
                      sx={{ textTransform: 'none', fontSize: 11, color: '#94A3B8', p: 0 }}
                    >
                      Change Table
                    </Button>
                  </Box>
                )}
              </Card>
            )}

            {/* 3. Ordered Items List (Already Sent to Kitchen) */}
            {activeOrder?.items && activeOrder.items.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#334155' }}>
                  Dishes Sent to Kitchen ({activeOrder.items.length})
                </Typography>
                <Stack spacing={1}>
                  {activeOrder.items.map((it) => (
                    <Card
                      key={it.id || it.menuItemId}
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#FFFFFF' }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={it.menuItemPicture || it.itemPicture || it.picture}
                          variant="rounded"
                          sx={{ width: 44, height: 44, bgcolor: '#F1F5F9' }}
                        >
                          <RestaurantMenuRoundedIcon sx={{ color: '#94A3B8' }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {it.menuItemName || it.itemName || 'Dish Item'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatMenuPrice(it.unitPrice)} x {it.quantity}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            color: '#7C3AED',
                            alignSelf: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            lineHeight: 1,
                            my: 'auto',
                          }}
                        >
                          {formatMenuPrice(it.subtotal || it.unitPrice * it.quantity)}
                        </Typography>
                        {activeKitchenStatus === 'PENDING' && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteActiveItem(it.id)}
                            title="Cancel dish"
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            {/* 4. Newly Selected Draft Items / Add More Dishes */}
            <Box>
              {items.length > 0 ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#334155' }}>
                      {activeOrder ? 'Additional Selected Dishes' : 'Selected Dishes'} ({items.length})
                    </Typography>
                    <Button size="small" color="inherit" onClick={clearDraft} sx={{ fontSize: 12, textTransform: 'none' }}>
                      Clear all
                    </Button>
                  </Box>

                  <Stack spacing={1}>
                    {items.map((it) => (
                      <Card
                        key={it.menuItemId}
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#FFFFFF' }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={it.itemPicture}
                            variant="rounded"
                            sx={{ width: 44, height: 44, bgcolor: '#F1F5F9' }}
                          >
                            <RestaurantMenuRoundedIcon sx={{ color: '#94A3B8' }} />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {it.itemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatMenuPrice(it.price)}
                            </Typography>
                          </Box>
                          {/* Quantity Controls */}
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                            sx={{ alignSelf: 'center', flexShrink: 0 }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(it.menuItemId, it.quantity - 1)}
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: '1px solid #E2E8F0',
                                p: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#F8FAFC',
                                '&:hover': { bgcolor: '#F1F5F9' },
                              }}
                            >
                              <RemoveRoundedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{
                                minWidth: 22,
                                textAlign: 'center',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                              }}
                            >
                              {it.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(it.menuItemId, it.quantity + 1)}
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: '1px solid #E2E8F0',
                                p: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#F8FAFC',
                                '&:hover': { bgcolor: '#F1F5F9' },
                              }}
                            >
                              <AddRoundedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Stack>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(it.menuItemId)}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              alignSelf: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </>
              ) : activeOrder ? (
                /* When order is active and 0 extra dishes selected: compact card without duplicate widgets */
                <Card
                  variant="outlined"
                  sx={{
                    p: 2.25,
                    textAlign: 'center',
                    bgcolor: '#FFFFFF',
                    borderRadius: 2.5,
                    borderStyle: 'dashed',
                    borderColor: '#CBD5E1',
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#475569' }}>
                    Want to order more dishes?
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Select items from the menu to add extra dishes to Table #{activeOrder.tableNumber || activeOrder.tableId}.
                  </Typography>
                </Card>
              ) : (
                /* When starting empty cart */
                <Card
                  variant="outlined"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: '#FFFFFF',
                    borderRadius: 3,
                    borderStyle: 'dashed',
                  }}
                >
                  <RestaurantMenuRoundedIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No dishes selected yet.
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Click &quot;Add to Table&quot; on any dish in the menu to start your order.
                  </Typography>
                </Card>
              )}
            </Box>

            {/* 5. Kitchen Prep Time Estimation Widget (Shown ONLY when draft items exist to prevent duplicate info) */}
            {items.length > 0 && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', color: '#64748B', mb: 1, display: 'block' }}>
                  {activeOrder ? 'Estimated Preparation for Additional Dishes' : 'Estimated Kitchen Preparation Time'}
                </Typography>
                <PrepTimeMiniWidget
                  items={items}
                  isVip={Boolean(activeOrder?.isVipRoom)}
                  orderId={activeOrder?.id || null}
                  position="relative"
                />
              </Box>
            )}

            {/* 6. Customer Note to Kitchen (Max 150 chars, no system overwriting) */}
            {items.length > 0 && (
              <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#475569', textTransform: 'uppercase' }}>
                    Kitchen Note (Optional)
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ color: customerNote.length >= 140 ? '#DC2626' : '#94A3B8', fontSize: '0.72rem' }}
                  >
                    {customerNote.length}/150 chars
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={3}
                  size="small"
                  placeholder="e.g. Less spicy, no onions, seafood allergy, dessert served later..."
                  value={customerNote}
                  onChange={(e) => {
                    if (e.target.value.length <= 150) {
                      setCustomerNote(e.target.value);
                    }
                  }}
                  inputProps={{ maxLength: 150 }}
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: 1.5,
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.85rem',
                    },
                  }}
                />
              </Card>
            )}
          </Stack>
        </Box>

        {/* ─── Drawer Footer (Totals & Action Buttons) ───────────────── */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <Stack spacing={2}>
            {/* Price Breakdown */}
            <Stack spacing={0.75}>
              {/* VIP Room Fee row */}
              {((!activeOrder && isVipRoom && selectedRoomPrice > 0) || (activeOrder?.isVipRoom && (activeOrder?.roomPrice > 0 || selectedRoomPrice > 0))) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#B45309', fontWeight: 600 }}>
                    👑 VIP Suite Fee:
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#B45309' }}>
                    + {formatMenuPrice(activeOrder?.roomPrice || selectedRoomPrice)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Dishes Subtotal:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatMenuPrice(
                    activeOrder
                      ? Math.max(0, (Number(activeOrder.totalAmount) || 0) - (Number(activeOrder.roomPrice) || (activeOrder.isVipRoom ? Number(selectedRoomPrice || 0) : 0)) + draftSubtotal)
                      : draftSubtotal
                  )}
                </Typography>
              </Box>

              {activeOrder?.discountRate != null && Number(activeOrder.discountRate) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#059669' }}>
                    {tierDiscountLabel}:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#059669' }}>
                    - {formatMenuPrice(activeOrder.discountAmount || 0)}
                  </Typography>
                </Box>
              )}

              {activeOrder?.alreadyPaidAmount != null && Number(activeOrder.alreadyPaidAmount) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#16A34A' }}>
                    Advance Deposit Paid:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#16A34A' }}>
                    - {formatMenuPrice(activeOrder.alreadyPaidAmount)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0F172A' }}>
                  {unpaidAmount > 0 && (Number(activeOrder?.alreadyPaidAmount) > 0 || Number(activeOrder?.discountRate) > 0)
                    ? 'Total Remaining Due:'
                    : 'Total Amount:'}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#7C3AED' }}>
                  {formatMenuPrice(unpaidAmount > 0 ? unpaidAmount + draftSubtotal : grandTotal)}
                </Typography>
              </Box>
            </Stack>

            {/* Action Buttons */}
            {activeOrder ? (
              <Stack spacing={1}>
                {isOrderPaid ? (
                  <Stack spacing={1.5}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: '#F0FDF4',
                        borderColor: '#86EFAC',
                        borderRadius: 2.5,
                        textAlign: 'center',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 0.5 }}>
                        <CheckCircleRoundedIcon sx={{ color: '#16A34A', fontSize: 24 }} />
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#15803D' }}>
                          Bill Fully Settled (100%)
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {(activeOrder.isVipRoom || isVipRoom)
                          ? `VIP Suite ${activeOrder.roomName || selectedRoomName || ''} dining bill has been completely paid via VNPay. You may add extra dishes at any time!`
                          : `Table #${activeOrder.tableNumber || activeOrder.tableId} dining bill has been completely paid via VNPay. You may add extra dishes at any time!`}
                      </Typography>
                    </Card>

                    {/* Customer adding extra dishes while dining */}
                    {items.length > 0 && (
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={submitting}
                        onClick={handleAddMoreItems}
                        sx={{
                          bgcolor: '#7C3AED',
                          '&:hover': { bgcolor: '#6D28D9' },
                          textTransform: 'none',
                          fontWeight: 700,
                          py: 1.25,
                          borderRadius: 2.5,
                        }}
                      >
                        {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : `Send Extra ${items.length} Dishes to Kitchen`}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <>
                    {items.length > 0 && (
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={submitting}
                        onClick={handleAddMoreItems}
                        sx={{
                          bgcolor: '#7C3AED',
                          '&:hover': { bgcolor: '#6D28D9' },
                          textTransform: 'none',
                          fontWeight: 700,
                          py: 1.25,
                          borderRadius: 2.5,
                        }}
                      >
                        {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : `Send Extra ${items.length} Dishes to Kitchen`}
                      </Button>
                    )}

                    {/* Notice if 50% deposit has already been paid */}
                    {hasPaidDeposit && unpaidAmount > 0 && isEligibleForAdvanceDeposit && (
                      <Alert severity="success" sx={{ borderRadius: 2, py: 0.5, fontSize: '0.8rem' }}>
                        50% Advance deposit paid ({formatMenuPrice(alreadyPaidAmount)}). Remaining balance can be paid during dining.
                      </Alert>
                    )}
                    {alreadyPaidAmount > 0 && unpaidAmount > 0 && !isEligibleForAdvanceDeposit && (
                      <Alert severity="info" sx={{ borderRadius: 2, py: 0.5, fontSize: '0.8rem' }}>
                        Advance deposit credited ({formatMenuPrice(alreadyPaidAmount)}). Please settle the remaining balance for additional dishes.
                      </Alert>
                    )}

                    {/* Pay 50% Deposit Button (shown when deposit not yet paid and >= 5,000 VND) */}
                    {requiredDeposit > 0 && (
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={paying || submitting}
                        startIcon={paying ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <PaymentRoundedIcon />}
                        onClick={() => {
                          if (onInitiatePayment) {
                            onInitiatePayment(activeOrder, requiredDeposit);
                          } else {
                            handlePayWithVnPay(requiredDeposit);
                          }
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          py: 1.25,
                          borderRadius: 2.5,
                          bgcolor: '#16A34A',
                          '&:hover': { bgcolor: '#15803D' },
                        }}
                      >
                        {paying
                          ? 'Connecting to VNPay...'
                          : `Pay 50% Deposit (${formatMenuPrice(requiredDeposit)})`}
                      </Button>
                    )}

                    {/* VNPay Full Settlement Button */}
                    <Button
                      variant={requiredDeposit > 0 ? 'outlined' : 'contained'}
                      fullWidth
                      color={requiredDeposit > 0 ? 'primary' : 'success'}
                      disabled={paying || submitting || unpaidAmount <= 0}
                      startIcon={paying && requiredDeposit <= 0 ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <PaymentRoundedIcon />}
                      onClick={() => {
                        if (onInitiatePayment) {
                          onInitiatePayment(activeOrder, unpaidAmount);
                        } else {
                          handlePayWithVnPay(unpaidAmount);
                        }
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.25,
                        borderRadius: 2.5,
                        ...(requiredDeposit <= 0
                          ? {
                              bgcolor: '#16A34A',
                              '&:hover': { bgcolor: '#15803D' },
                            }
                          : {}),
                      }}
                    >
                      {paying && requiredDeposit <= 0
                        ? 'Connecting to VNPay...'
                        : requiredDeposit > 0
                        ? `Pay Full Balance (${formatMenuPrice(unpaidAmount)})`
                        : `Pay (${formatMenuPrice(unpaidAmount)})`}
                    </Button>
                  </>
                )}
              </Stack>
            ) : (
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={submitting || (items.length === 0 && (!isVipRoom || Number(selectedRoomPrice) <= 0))}
                  onClick={() => setConfirmDialogOpen(true)}
                  sx={{
                    bgcolor: '#7C3AED',
                    '&:hover': { bgcolor: '#6D28D9' },
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.25,
                    borderRadius: 2.5,
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={22} sx={{ color: '#fff' }} />
                  ) : isVipRoom ? (
                    items.length > 0
                      ? 'Confirm VIP Order & Proceed to Deposit'
                      : `Confirm VIP Suite & Pay Deposit (${formatMenuPrice(Math.round((Number(selectedRoomPrice) || 0) * 0.5))})`
                  ) : (
                    'Confirm & Send Order to Kitchen'
                  )}
                </Button>

                {items.length > 0 && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={clearDraft}
                    sx={{ textTransform: 'none', color: '#64748B', '&:hover': { color: '#EF4444' } }}
                  >
                    Clear selected dishes
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      </Drawer>

      {/* ─── Confirmation Modal (Prevent Wrong Table Collisions) ─────── */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleRoundedIcon sx={{ color: '#7C3AED' }} />
          {isVipRoom ? 'Confirm VIP Suite Reservation' : 'Confirm Dining Table Order'}
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ color: '#334155', mb: 2 }}>
            {isVipRoom ? (
              items.length > 0
                ? `You are about to reserve the VIP suite and pre-order ${items.length} dishes for:`
                : 'You are about to confirm your VIP suite reservation for:'
            ) : (
              <>You are about to send <strong>{items.length} dishes</strong> to the kitchen for:</>
            )}
          </DialogContentText>
          {isVipRoom ? (
            <Card
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: '#FFFBEB',
                borderColor: '#FCD34D',
                borderRadius: 2.5,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ color: '#92400E' }}>
                👑 VIP SUITE: {selectedRoomName || 'Diamond VIP Suite'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#B45309' }}>
                {selectedReservationNo ? `Reservation #${selectedReservationNo} • ` : ''}
                Room Reservation Fee: {formatMenuPrice(selectedRoomPrice)}
              </Typography>
            </Card>
          ) : (
            <Card
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: '#F5F3FF',
                borderColor: '#DDD6FE',
                borderRadius: 2.5,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ color: '#6D28D9' }}>
                TABLE #{currentTable?.tableNumber || selectedTableId || 'Not Selected'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Area: {currentTable?.area?.name || currentTable?.areaName || 'Main Dining'}
              </Typography>
            </Card>
          )}
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            {isVipRoom
              ? 'Advance 50% deposit will be requested via VNPay to confirm and guarantee your VIP reservation.'
              : 'Please confirm you are seated at this table so our serving staff can bring dishes directly to you.'}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ textTransform: 'none' }}>
            {isVipRoom ? 'Cancel' : 'Change Table'}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSubmitOrder}
            sx={{
              bgcolor: '#7C3AED',
              '&:hover': { bgcolor: '#6D28D9' },
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            {isVipRoom ? 'Confirm & Proceed to Payment' : 'Confirm & Send to Kitchen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Notification Snackbar ─────────────────────────────────── */}
      <Snackbar
        open={alertNotice.open}
        autoHideDuration={4000}
        onClose={() => setAlertNotice((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAlertNotice((prev) => ({ ...prev, open: false }))}
          severity={alertNotice.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2.5 }}
        >
          {alertNotice.message}
        </Alert>
      </Snackbar>
    </>
  );
}
