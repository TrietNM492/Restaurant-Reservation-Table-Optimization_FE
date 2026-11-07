import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
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
  Tooltip,
  Typography,
} from '@mui/material';

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import SoupKitchenRoundedIcon from '@mui/icons-material/SoupKitchenRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';

import PrepTimeMiniWidget from '../prediction/PrepTimeMiniWidget';
import { orderApi } from '../../services/orderService';
import { formatMenuPrice } from '../../utils/menuUtils';
import { useOrderStore } from '../../stores/useOrderStore';

// ─── Status Configurations ──────────────────────────────────────────────────
const KITCHEN_STATUS_CONFIG = {
  PENDING: { label: 'Chờ chuyển bếp', color: 'default' },
  QUEUED: { label: 'Đang xếp hàng', color: 'info' },
  COOKING: { label: 'Bếp đang nấu', color: 'warning' },
  PREPARING: { label: 'Đang chuẩn bị', color: 'warning' },
  READY_TO_SERVE: { label: 'Món sẵn sàng phục vụ', color: 'success' },
  COMPLETED: { label: 'Đã hoàn thành', color: 'success' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
};

const ORDER_STATUS_CONFIG = {
  PENDING: { label: 'Đơn mới tạo', color: 'warning' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', color: 'info' },
  PAID: { label: 'Đã thanh toán', color: 'success' },
  COMPLETED: { label: 'Hoàn tất', color: 'success' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
};

export default function DiningOrderDrawer({ onInitiatePayment }) {
  const {
    items,
    selectedTableId,
    activeOrder,
    isDrawerOpen,
    setDrawerOpen,
    setSelectedTableId,
    setActiveOrder,
    updateQuantity,
    removeItem,
    clearDraft,
    resetOrder,
  } = useOrderStore();

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [alertNotice, setAlertNotice] = useState({ open: false, message: '', severity: 'info' });

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

  // Current selected table object
  const currentTable = useMemo(() => {
    const id = activeOrder?.tableId || selectedTableId;
    return tables.find((t) => t.id === Number(id)) || null;
  }, [tables, selectedTableId, activeOrder]);

  // Calculate Draft Subtotal
  const draftSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  }, [items]);

  // Grand Total: active order amount + draft items (if adding extra dishes)
  const grandTotal = useMemo(() => {
    const activeAmount = Number(activeOrder?.totalAmount) || 0;
    return activeAmount + draftSubtotal;
  }, [activeOrder, draftSubtotal]);

  // Auto-refresh active order status
  const handleRefreshStatus = async () => {
    if (!activeOrder?.id) return;
    try {
      setRefreshing(true);
      const updated = await orderApi.getOrderStatus(activeOrder.id);
      if (updated) {
        setActiveOrder(updated);
        setAlertNotice({
          open: true,
          message: 'Đã cập nhật tiến độ bếp mới nhất!',
          severity: 'success',
        });
      }
    } catch (err) {
      setAlertNotice({
        open: true,
        message: err.message || 'Không thể làm mới trạng thái đơn.',
        severity: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Submit new order (Create Order)
  const handleConfirmSubmitOrder = async () => {
    setConfirmDialogOpen(false);
    if (!selectedTableId && !activeOrder?.tableId) {
      setAlertNotice({
        open: true,
        message: 'Vui lòng chọn vị trí bàn trước khi gửi gọi món!',
        severity: 'warning',
      });
      return;
    }

    if (items.length === 0) {
      setAlertNotice({
        open: true,
        message: 'Chưa có món ăn nào trong giỏ gọi món.',
        severity: 'warning',
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        tableId: selectedTableId || activeOrder?.tableId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
      };

      const result = await orderApi.createOrder(payload);
      setActiveOrder(result);
      clearDraft();
      setAlertNotice({
        open: true,
        message: `Tạo đơn gọi món thành công! Mã đơn: ${result.orderNo || ''}`,
        severity: 'success',
      });
    } catch (err) {
      setAlertNotice({
        open: true,
        message: err.message || 'Gửi gọi món thất bại. Vui lòng thử lại!',
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
        });
      }

      clearDraft();
      const updated = await orderApi.getOrderStatus(activeOrder.id);
      setActiveOrder(updated);
      setAlertNotice({
        open: true,
        message: 'Đã bổ sung món vào bếp thành công!',
        severity: 'success',
      });
    } catch (err) {
      setAlertNotice({
        open: true,
        message: err.message || 'Không thể bổ sung món.',
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
        message: 'Đã xóa món khỏi đơn thành công.',
        severity: 'info',
      });
    } catch (err) {
      setAlertNotice({
        open: true,
        message: err.message || 'Không thể xóa món khi bếp đã nấu.',
        severity: 'error',
      });
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
  const activeOrderStatus = activeOrder?.orderStatus || 'PENDING';
  const readyTimeStr = formatTime(activeOrder?.estimatedReadyTime);

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
                Đơn Gọi Món Tại Bàn
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeOrder ? `Mã đơn: ${activeOrder.orderNo}` : 'Dine-in Order & Kitchen Queue'}
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
            {/* 1. Active Order Banner (If order created) */}
            {activeOrder ? (
              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: '#F5F3FF',
                  borderColor: '#DDD6FE',
                  borderRadius: 3,
                }}
              >
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TableRestaurantRoundedIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#5B21B6' }}>
                        Bàn số {activeOrder.tableNumber || currentTable?.tableNumber || activeOrder.tableId}
                      </Typography>
                    </Stack>
                    <Tooltip title="Làm mới tiến độ bếp">
                      <IconButton
                        size="small"
                        onClick={handleRefreshStatus}
                        disabled={refreshing}
                        sx={{ color: '#7C3AED' }}
                      >
                        {refreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      icon={<SoupKitchenRoundedIcon />}
                      label={KITCHEN_STATUS_CONFIG[activeKitchenStatus]?.label || activeKitchenStatus}
                      color={KITCHEN_STATUS_CONFIG[activeKitchenStatus]?.color || 'default'}
                      variant="filled"
                    />
                    <Chip
                      size="small"
                      label={ORDER_STATUS_CONFIG[activeOrderStatus]?.label || activeOrderStatus}
                      color={ORDER_STATUS_CONFIG[activeOrderStatus]?.color || 'default'}
                      variant="outlined"
                    />
                  </Box>

                  {readyTimeStr && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: '#EDE9FE',
                        p: 1,
                        borderRadius: 2,
                      }}
                    >
                      <AccessTimeRoundedIcon sx={{ fontSize: 18, color: '#6D28D9' }} />
                      <Typography variant="caption" fontWeight={600} sx={{ color: '#5B21B6' }}>
                        Dự kiến phục vụ hoàn tất lúc: <strong>{readyTimeStr}</strong>
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Card>
            ) : (
              /* 2. Table Selector (When creating new order) */
              <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#FFFFFF' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#334155' }}>
                  Vị trí bàn ăn của bạn
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel id="table-select-label">Chọn Bàn ăn</InputLabel>
                  <Select
                    labelId="table-select-label"
                    value={selectedTableId ?? ''}
                    label="Chọn Bàn ăn"
                    disabled={loadingTables}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>-- Vui lòng chọn bàn bạn đang ngồi --</em>
                    </MenuItem>
                    {tables.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        Bàn {t.tableNumber} - {t.area?.name || t.areaName || 'Trong nhà'} ({t.capacity} chỗ)
                        {t.statusCode ? ` [${t.statusCode}]` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {currentTable && (
                  <Typography variant="caption" sx={{ color: '#64748B', mt: 1, display: 'block' }}>
                    Đã chọn: <strong>Bàn {currentTable.tableNumber}</strong> - Khu vực:{' '}
                    {currentTable.area?.name || currentTable.areaName || 'Khu chính'}
                  </Typography>
                )}
              </Card>
            )}

            {/* 3. Ordered Items List (From Active Order) */}
            {activeOrder?.items && activeOrder.items.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#334155' }}>
                  Món đã gửi vào bếp ({activeOrder.items.length})
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
                            {formatMenuPrice(it.unitPrice)} x {it.quantity}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#7C3AED' }}>
                          {formatMenuPrice(it.subtotal || it.unitPrice * it.quantity)}
                        </Typography>
                        {activeKitchenStatus === 'PENDING' && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteActiveItem(it.id)}
                            title="Hủy món"
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

            {/* 4. Newly Selected Draft Items */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#334155' }}>
                  {activeOrder ? 'Món chọn thêm' : 'Món đang chọn'} ({items.length})
                </Typography>
                {items.length > 0 && (
                  <Button size="small" color="inherit" onClick={clearDraft} sx={{ fontSize: 12, textTransform: 'none' }}>
                    Xóa tất cả
                  </Button>
                )}
              </Box>

              {items.length === 0 ? (
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
                    Chưa có món nào được chọn.
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Bấm &quot;Thêm vào bàn&quot; trên các món ăn trong thực đơn để bắt đầu gọi món.
                  </Typography>
                </Card>
              ) : (
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
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(it.menuItemId, it.quantity - 1)}
                            sx={{ p: 0.5, border: '1px solid #E2E8F0' }}
                          >
                            <RemoveRoundedIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <Typography variant="body2" fontWeight={700} sx={{ minWidth: 20, textAlign: 'center' }}>
                            {it.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(it.menuItemId, it.quantity + 1)}
                            sx={{ p: 0.5, border: '1px solid #E2E8F0' }}
                          >
                            <AddRoundedIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeItem(it.menuItemId)}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>

            {/* 5. Live Kitchen Preparation Time Estimation Widget */}
            {(items.length > 0 || activeOrder?.id) && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', color: '#64748B', mb: 1, display: 'block' }}>
                  Dự đoán thời gian chế biến của Bếp
                </Typography>
                <PrepTimeMiniWidget
                  items={items}
                  isVip={Boolean(activeOrder?.isVipRoom)}
                  orderId={activeOrder?.id || null}
                  position="relative"
                />
              </Box>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Tổng tiền món:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatMenuPrice(grandTotal)}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0F172A' }}>
                  Tổng cộng:
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#7C3AED' }}>
                  {formatMenuPrice(grandTotal)}
                </Typography>
              </Box>
            </Stack>

            {/* Action Buttons */}
            {activeOrder ? (
              <Stack spacing={1}>
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
                    {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Gửi thêm món vào bếp'}
                  </Button>
                )}

                {/* Thanh toán VNPay Trigger (Wired in Phase 3) */}
                <Button
                  variant="contained"
                  fullWidth
                  color="success"
                  startIcon={<PaymentRoundedIcon />}
                  onClick={() => {
                    if (onInitiatePayment) {
                      onInitiatePayment(activeOrder);
                    } else {
                      setAlertNotice({
                        open: true,
                        message: `Đang kết nối cổng VNPay cho hoá đơn bàn ${activeOrder.tableNumber || ''}...`,
                        severity: 'info',
                      });
                    }
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.25,
                    borderRadius: 2.5,
                  }}
                >
                  Thanh toán hoá đơn bàn ({formatMenuPrice(activeOrder.totalAmount)})
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={resetOrder}
                  sx={{ textTransform: 'none', color: '#64748B', borderColor: '#CBD5E1' }}
                >
                  Đóng đơn / Bàn mới
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                fullWidth
                disabled={submitting || items.length === 0}
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
                {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Xác nhận gọi món'}
              </Button>
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
          Xác nhận vị trí bàn gọi món
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ color: '#334155', mb: 2 }}>
            Bạn đang chuẩn bị gửi <strong>{items.length} món ăn</strong> vào bếp cho:
          </DialogContentText>
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
              BÀN SỐ {currentTable?.tableNumber || selectedTableId || 'Chưa chọn'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Khu vực: {currentTable?.area?.name || currentTable?.areaName || 'Trong nhà'}
            </Typography>
          </Card>
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            Vui lòng xác nhận bạn đang ngồi tại bàn này để nhân viên phục vụ mang món đúng vị trí của bạn.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Chọn lại bàn
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
            Chính xác, gửi món
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

