import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Loading from '../components/ui/Loading';
import { paymentApi } from '../services/paymentService';
import { useOrderStore } from '../stores/useOrderStore';
import { ROUTES } from '../routes/routeConstants';

// Standard VNPay response code mapping table (English)
const VNPAY_ERROR_MESSAGES = {
  '07': 'Transaction suspected of fraudulent activity.',
  '09': 'Card/Account has not enrolled in Internet Banking service.',
  '10': 'Customer entered incorrect card/account information 3 or more times.',
  '11': 'Payment waiting period has expired. Please try again.',
  '12': 'Card or bank account is currently locked.',
  '13': 'Incorrect OTP authentication code entered. Please try again.',
  '24': 'Transaction was cancelled by customer on VNPay gateway.',
  '51': 'Account balance is insufficient to complete this transaction.',
  '65': 'Transaction exceeded the daily limit for this account.',
  '75': 'The payment bank is currently undergoing scheduled maintenance.',
  '79': 'Incorrect payment password entered too many times.',
  '99': 'Transaction was rejected by payment gateway. Please try again.',
};

// Format currency to VND standard
const formatVnd = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return amount || '0';
  return num.toLocaleString('vi-VN');
};

// Format VNPay payDate or ISO string to GMT+7 (dd/MM/yyyy · HH:mm)
const formatPayDate = (rawDate) => {
  if (!rawDate) return 'Just now';

  // Handle VNPay compact format: yyyyMMddHHmmss
  if (typeof rawDate === 'string' && /^\d{14}$/.test(rawDate)) {
    const y = rawDate.slice(0, 4);
    const m = rawDate.slice(4, 6);
    const d = rawDate.slice(6, 8);
    const h = rawDate.slice(8, 10);
    const min = rawDate.slice(10, 12);
    return `${d}/${m}/${y} · ${h}:${min} (GMT+7)`;
  }

  // Handle ISO date format
  try {
    const date = new Date(rawDate);
    if (!isNaN(date.getTime())) {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
      return `${parts.replace(',', ' ·')} (GMT+7)`;
    }
  } catch {
    // Fallback to raw string
  }

  return rawDate;
};

// Helper to determine if invoice or return result represents full settlement
const checkIsFullyPaid = (inv, res) => {
  if (inv) {
    if (inv.fullyPaid === true || inv.isFullyPaid === true) return true;
    if (inv.paymentStatus === 'PAID') return true;
    if (inv.orderRemainingAmount != null && Number(inv.orderRemainingAmount) <= 0) return true;
    if (inv.remainingMessage && inv.remainingMessage.toLowerCase().includes('fully')) return true;
    return false;
  }
  if (res) {
    if (res.paymentStatus === 'PAID') return true;
    return Boolean((res.fullyPaid || res.isFullyPaid) && res.paymentType !== 'DEPOSIT');
  }
  return false;
};

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State machine: 'verifying' | 'paid' | 'partially_paid' | 'processing_timeout' | 'failed' | 'invalid' | 'error' | 'not_found' | 'forbidden' | 'no_payment'
  const [pageState, setPageState] = useState('verifying');
  const [result, setResult] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Refs for tracking active polling timers and mounted state
  const isMountedRef = useRef(true);
  const timerRef = useRef(null);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Safe invoice fetcher once terminal status confirmed
  const loadInvoiceDetails = useCallback(async (paymentId, returnData) => {
    if (!paymentId) return null;
    try {
      const inv = await paymentApi.getInvoice(paymentId);
      if (isMountedRef.current) {
        setInvoice(inv);
        // If fully paid, sync activeOrder in order store
        if (checkIsFullyPaid(inv, returnData)) {
          const currentOrder = useOrderStore.getState().activeOrder;
          if (currentOrder) {
            useOrderStore.getState().setActiveOrder({ ...currentOrder, orderStatus: 'OK' });
          }
        }
      }
      return inv;
    } catch (invErr) {
      console.warn('Could not fetch detailed invoice:', invErr);
      return null;
    }
  }, []);

  // Main verification procedure
  const executeVerification = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setPageState('verifying');

    const params = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    // Case 0: Direct visit with no query parameters
    if (Object.keys(params).length === 0) {
      setPageState('no_payment');
      return;
    }

    // Case 1: Direct inspection by paymentId (?paymentId=14) without VNPay secure hash
    if (params.paymentId && !params.vnp_SecureHash) {
      try {
        const inv = await paymentApi.getInvoice(params.paymentId);
        if (!isMountedRef.current) return;

        setInvoice(inv);
        const fullyPaid = checkIsFullyPaid(inv);
        const isPaid = inv.paymentStatus === 'PAID';
        const isPartiallyPaid = inv.paymentStatus === 'PARTIALLY_PAID';

        setResult({
          paymentId: inv.paymentId,
          referenceCode: inv.invoiceNo,
          orderNo: inv.orderNo,
          amount: String(inv.paymentAmount),
          payDate: inv.paymentDate,
          bankCode: null,
          transactionNo: null,
          isFullyPaid: fullyPaid,
          paymentStatus: inv.paymentStatus,
        });

        if (isPaid) {
          setPageState('paid');
          const current = useOrderStore.getState().activeOrder;
          if (current) {
            useOrderStore.getState().setActiveOrder({ ...current, orderStatus: 'OK' });
          }
        } else if (isPartiallyPaid) {
          setPageState('partially_paid');
        } else {
          setPageState('processing_timeout');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        const msg = String(err?.message || '');

        if (msg.includes('status PENDING') || msg.includes('PENDING')) {
          setResult({ paymentId: params.paymentId });
          setPageState('processing_timeout');
        } else if (msg.includes('only access invoices for your own orders') || err?.response?.status === 403) {
          setPageState('forbidden');
        } else if (err?.response?.status === 404 || msg.includes('not found')) {
          setPageState('not_found');
        } else {
          setPageState('error');
        }
      }
      return;
    }

    // Case 2: Returning from VNPay gateway with signed query parameters
    // Smart Polling schedule: 1.5s -> 3s -> 5s -> 5s -> 5s (~20 seconds total)
    const delays = [1500, 3000, 5000, 5000, 5000];

    const pollReturn = async (attemptIndex) => {
      if (!isMountedRef.current) return;

      try {
        const data = await paymentApi.processVnPayReturn(params);
        if (!isMountedRef.current) return;

        setResult(data);

        // Rule 1: Signature check
        if (data.signatureValid === false) {
          setPageState('invalid');
          return;
        }

        // Rule 2: Non-successful gateway response code
        if (data.responseCode !== '00') {
          setPageState('failed');
          return;
        }

        // Rule 3: Success responseCode ('00') - Inspect backend paymentStatus
        const status = data.paymentStatus;
        const pId = data.paymentId || (data.txnRef ? data.txnRef.split('T')[0] : null);

        if (status === 'PAID') {
          setPageState('paid');
          await loadInvoiceDetails(pId, data);
          return;
        }

        if (status === 'PARTIALLY_PAID') {
          setPageState('partially_paid');
          await loadInvoiceDetails(pId, data);
          return;
        }

        if (status === 'FAILED' || status === 'CANCELLED') {
          setPageState('failed');
          return;
        }

        // Status is still PENDING or database webhook is currently in flight
        if (attemptIndex < delays.length) {
          const waitMs = delays[attemptIndex];
          timerRef.current = setTimeout(() => {
            pollReturn(attemptIndex + 1);
          }, waitMs);
        } else {
          // Polling exceeded 20 seconds: Graceful processing state (never declare false failure)
          setPageState('processing_timeout');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error('Failed to verify return data from backend:', err);
        setPageState('error');
      }
    };

    // Trigger initial polling attempt
    pollReturn(0);
  }, [searchParams, loadInvoiceDetails]);

  useEffect(() => {
    isMountedRef.current = true;
    executeVerification();

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [executeVerification]);

  // Handle PDF invoice download
  const handleDownloadInvoice = async () => {
    const pId = invoice?.paymentId || result?.paymentId || (result?.txnRef ? result.txnRef.split('T')[0] : null) || searchParams.get('paymentId');
    if (!pId) {
      showSnackbar('Invoice download is not yet available for this transaction.', 'warning');
      return;
    }

    if (pageState !== 'paid' && pageState !== 'partially_paid') {
      showSnackbar('Invoice can only be downloaded once payment status is confirmed by the system.', 'warning');
      return;
    }

    try {
      setDownloading(true);
      await paymentApi.downloadInvoicePdf(pId);
      showSnackbar('Invoice PDF downloaded successfully.', 'success');
    } catch (err) {
      showSnackbar('Unable to download invoice: ' + (err.message || 'Server error'), 'error');
    } finally {
      if (isMountedRef.current) {
        setDownloading(false);
      }
    }
  };

  // State properties mapping
  const isPaid = pageState === 'paid';
  const isPartiallyPaid = pageState === 'partially_paid';
  const isSettled = isPaid || isPartiallyPaid;
  const isFullSettlement = isPaid && checkIsFullyPaid(invoice, result);

  const getFailureReason = () => {
    const code = result?.responseCode;
    if (code && VNPAY_ERROR_MESSAGES[code]) {
      return VNPAY_ERROR_MESSAGES[code];
    }
    return result?.message || 'The transaction could not be completed by the payment gateway.';
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fbfcfb' }}>
      <Navbar />

      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 5, md: 8 },
          background: 'linear-gradient(180deg, #f0f7f3 0%, #fbfcfb 260px)',
        }}
      >
        <Container maxWidth="md">
          {/* ─── State: Verifying ────────────────────────────────────────────────── */}
          {pageState === 'verifying' && (
            <Box sx={{ py: 12, textAlign: 'center' }} aria-live="polite">
              <Loading />
              <Typography variant="h6" sx={{ mt: 3, color: '#167a5a', fontWeight: 700 }}>
                Verifying Transaction with VNPay Gateway...
              </Typography>
              <Typography variant="body2" sx={{ color: '#688274', mt: 1 }}>
                Please keep this page open while we synchronize your payment confirmation with the bank.
              </Typography>
            </Box>
          )}

          {/* ─── State: Direct Visit without Parameters ──────────────────────────── */}
          {pageState === 'no_payment' && (
            <Card
              sx={{
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                borderRadius: '24px',
                border: '1px solid #e1e9e3',
                boxShadow: '0 12px 40px rgba(0,0,0,0.04)',
                bgcolor: '#fff',
                maxWidth: 520,
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#f0f5f2',
                  color: '#167a5a',
                  display: 'grid',
                  placeItems: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <ReceiptLongRoundedIcon sx={{ fontSize: 36 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a2e22', mb: 1 }}>
                No Active Payment Found
              </Typography>
              <Typography variant="body2" sx={{ color: '#55655b', mb: 4, lineHeight: 1.6 }}>
                This page confirms orders processed via VNPay. You can view your current bookings or browse the dining menu.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate(ROUTES.HOME)}
                sx={{
                  bgcolor: '#167a5a',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: 700,
                  px: 3,
                  py: 1.25,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#115e45' },
                }}
              >
                Return to Homepage
              </Button>
            </Card>
          )}

          {/* ─── State: Invalid Signature ────────────────────────────────────────── */}
          {pageState === 'invalid' && (
            <Card
              sx={{
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                borderRadius: '24px',
                border: '1px solid #fed7aa',
                boxShadow: '0 12px 40px rgba(234, 88, 12, 0.08)',
                bgcolor: '#fff',
                maxWidth: 560,
                mx: 'auto',
              }}
              aria-live="polite"
            >
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  bgcolor: '#fff7ed',
                  color: '#ea580c',
                  display: 'grid',
                  placeItems: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: 36 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#9a3412', mb: 1 }}>
                Security Signature Verification Failed
              </Typography>
              <Typography variant="body2" sx={{ color: '#7c2d12', mb: 4, lineHeight: 1.6 }}>
                The cryptographic HMAC signature returned from VNPay did not match our system security keys. To protect your account integrity, transaction details have been concealed.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => navigate(ROUTES.HOME)}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, color: '#9a3412', borderColor: '#fdba74' }}
                >
                  Return to Homepage
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate(ROUTES.RESERVATIONS_ME)}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' } }}
                >
                  Check Bookings
                </Button>
              </Stack>
            </Card>
          )}

          {/* ─── State: Processing Timeout (Neutral Graceful Fallback) ────────────── */}
          {pageState === 'processing_timeout' && (
            <Card
              sx={{
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                borderRadius: '24px',
                border: '1px solid #bfdbfe',
                boxShadow: '0 12px 40px rgba(59, 130, 246, 0.08)',
                bgcolor: '#fff',
                maxWidth: 600,
                mx: 'auto',
              }}
              aria-live="polite"
            >
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  bgcolor: '#eff6ff',
                  color: '#2563eb',
                  display: 'grid',
                  placeItems: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <AccessTimeRoundedIcon sx={{ fontSize: 38 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e3a8a', mb: 1 }}>
                Payment Recorded — Waiting for Bank Confirmation
              </Typography>
              <Typography variant="body2" sx={{ color: '#3b82f6', mb: 1.5, fontWeight: 700 }}>
                Please do not initiate another payment.
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', mb: 4, lineHeight: 1.6 }}>
                Your transaction has been submitted to VNPay. The automated bank synchronization is taking a few moments longer than usual. Your funds are protected and your booking will update automatically once confirmed.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  onClick={executeVerification}
                  startIcon={<RefreshRoundedIcon />}
                  sx={{
                    bgcolor: '#2563eb',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    py: 1.25,
                    '&:hover': { bgcolor: '#1d4ed8' },
                  }}
                >
                  Check Status Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(ROUTES.RESERVATIONS_ME)}
                  sx={{
                    borderRadius: '12px',
                    fontWeight: 600,
                    textTransform: 'none',
                    color: '#1e3a8a',
                    borderColor: '#93c5fd',
                  }}
                >
                  My Reservations
                </Button>
              </Stack>
            </Card>
          )}

          {/* ─── State: Network Error or Server 500 ──────────────────────────────── */}
          {pageState === 'error' && (
            <Card
              sx={{
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                borderRadius: '24px',
                border: '1px solid #fecaca',
                bgcolor: '#fff',
                maxWidth: 540,
                mx: 'auto',
              }}
              aria-live="polite"
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#fef2f2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <ErrorOutlineRoundedIcon sx={{ fontSize: 36 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#991b1b', mb: 1 }}>
                Connection Error
              </Typography>
              <Typography variant="body2" sx={{ color: '#7f1d1d', mb: 4, lineHeight: 1.6 }}>
                We could not connect to the restaurant reservation server to verify this transaction. Please check your network connection and try again.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  onClick={executeVerification}
                  startIcon={<RefreshRoundedIcon />}
                  sx={{ bgcolor: '#dc2626', borderRadius: '12px', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#b91c1c' } }}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(ROUTES.HOME)}
                  sx={{ borderRadius: '12px', fontWeight: 600, textTransform: 'none', color: '#991b1b', borderColor: '#fca5a5' }}
                >
                  Homepage
                </Button>
              </Stack>
            </Card>
          )}

          {/* ─── State: Forbidden (403) ─────────────────────────────────────────── */}
          {pageState === 'forbidden' && (
            <Card
              sx={{
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                borderRadius: '24px',
                border: '1px solid #fed7aa',
                bgcolor: '#fff',
                maxWidth: 520,
                mx: 'auto',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#9a3412', mb: 1 }}>
                Access Restricted
              </Typography>
              <Typography variant="body2" sx={{ color: '#7c2d12', mb: 4, lineHeight: 1.6 }}>
                You are not authorized to view the invoice for this transaction. Invoices are accessible only by the original reservation owner or restaurant staff.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate(ROUTES.HOME)}
                sx={{ bgcolor: '#167a5a', borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
              >
                Return to Homepage
              </Button>
            </Card>
          )}

          {/* ─── State: Not Found (404) ─────────────────────────────────────────── */}
          {pageState === 'not_found' && (
            <Card
              sx={{
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                bgcolor: '#fff',
                maxWidth: 520,
                mx: 'auto',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#334155', mb: 1 }}>
                Transaction Not Found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 4, lineHeight: 1.6 }}>
                No payment record was found matching this identifier. Please verify your payment reference or booking history.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate(ROUTES.HOME)}
                sx={{ bgcolor: '#167a5a', borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
              >
                Return to Homepage
              </Button>
            </Card>
          )}

          {/* ─── State: Settlement Success ('paid' | 'partially_paid') or Gateway Failed ('failed') */}
          {(isSettled || pageState === 'failed') && result && (
            <Card
              sx={{
                borderRadius: '28px',
                border: '1px solid #dbe6df',
                boxShadow: isSettled ? '0 20px 60px rgba(22, 122, 90, 0.08)' : '0 20px 60px rgba(220, 38, 38, 0.08)',
                overflow: 'hidden',
                bgcolor: '#ffffff',
                maxWidth: 720,
                mx: 'auto',
              }}
              aria-live="polite"
            >
              {/* Header Banner */}
              <Box
                sx={{
                  p: { xs: 4, sm: 5 },
                  textAlign: 'center',
                  bgcolor: isSettled ? '#eef7f2' : '#fdf2f2',
                  borderBottom: `1px solid ${isSettled ? '#cce5d6' : '#f8d2d2'}`,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    bgcolor: isSettled ? '#167a5a' : '#dc2626',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    mx: 'auto',
                    mb: 2.5,
                    boxShadow: isSettled
                      ? '0 10px 28px rgba(22, 122, 90, 0.32)'
                      : '0 10px 28px rgba(220, 38, 38, 0.28)',
                  }}
                >
                  {isSettled ? (
                    <CheckCircleRoundedIcon sx={{ fontSize: 48 }} />
                  ) : (
                    <ErrorOutlineRoundedIcon sx={{ fontSize: 48 }} />
                  )}
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: isSettled ? '#167a5a' : '#b91c1c',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  {isSettled
                    ? (isFullSettlement ? 'OFFICIAL TABLE DINING RECEIPT' : 'OFFICIAL RESERVATION CONFIRMATION')
                    : 'PAYMENT NOTICE'}
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: isSettled ? '#124e38' : '#991b1b',
                    letterSpacing: '-0.02em',
                    mb: 1,
                    fontSize: { xs: '1.625rem', sm: '2.125rem' },
                  }}
                >
                  {isSettled
                    ? (isFullSettlement ? 'Order Payment Successful!' : 'Reservation Deposit Confirmed!')
                    : 'Payment Incomplete or Cancelled'}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: isSettled ? '#2e6b52' : '#7f1d1d',
                    maxWidth: 520,
                    mx: 'auto',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {isSettled
                    ? (isFullSettlement
                        ? 'Thank you for dining with us. Your table order has been fully settled via VNPay.'
                        : 'Thank you for choosing Intelligent Restaurant. Your 50% reservation deposit has been validated and your table has been confirmed.')
                    : getFailureReason()}
                </Typography>
              </Box>

              {/* Receipt Details Body */}
              <Box sx={{ p: { xs: 3, sm: 5 } }}>
                {/* Amount Box */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    bgcolor: isSettled ? '#f5faf6' : '#fffbfa',
                    border: `1px solid ${isSettled ? '#dcebe1' : '#fcdad7'}`,
                    mb: 3.5,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ color: '#55655b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isSettled ? (isFullSettlement ? 'Total Amount Settled' : 'Deposit Amount Paid') : 'Attempted Amount'}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 900,
                          color: isSettled ? '#167a5a' : '#991b1b',
                          letterSpacing: '-0.02em',
                          mt: 0.25,
                        }}
                      >
                        {formatVnd(result.amount)}{' '}
                        <Typography component="span" variant="h6" sx={{ color: isSettled ? '#167a5a' : '#991b1b', fontWeight: 600 }}>
                          VND
                        </Typography>
                      </Typography>
                    </Box>

                    <Chip
                      label={
                        isSettled
                          ? (isFullSettlement ? 'PAID (100% FULL SETTLEMENT)' : 'PAID (50% ADVANCE DEPOSIT)')
                          : 'TRANSACTION UNPAID'
                      }
                      size="medium"
                      sx={{
                        fontWeight: 800,
                        fontSize: 12,
                        bgcolor: isSettled ? '#167a5a' : '#fee2e2',
                        color: isSettled ? '#ffffff' : '#b91c1c',
                        borderRadius: '10px',
                        px: 1,
                        height: 32,
                      }}
                    />
                  </Box>

                  {/* Remaining balance note for 50% deposits */}
                  {isPartiallyPaid && invoice?.orderRemainingAmount != null && Number(invoice.orderRemainingAmount) > 0 && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #d0e2d7' }}>
                      <Typography variant="caption" sx={{ color: '#4d6556', fontWeight: 600 }}>
                        Total order value: <strong>{formatVnd(invoice.orderTotalAmount)} VND</strong> &bull; Remaining balance due upon dining: <strong style={{ color: '#167a5a' }}>{formatVnd(invoice.orderRemainingAmount)} VND</strong>
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Key Details Grid - MUI v9 Syntax (size={{ xs: 12, sm: 6 }}) */}
                <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                  {/* Item 1: Reference Code */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#f0f5f2', color: '#167a5a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <TagRoundedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#7a8a81', display: 'block' }}>
                          Reference Code
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                          {result.referenceCode || result.txnRef || (result.paymentId ? `INV-${result.paymentId}` : 'N/A')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Item 2: Payment Gateway Channel */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#f0f5f2', color: '#167a5a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <AccountBalanceRoundedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#7a8a81', display: 'block' }}>
                          Payment Channel
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                          {result.bankCode ? `VNPay (${result.bankCode})` : 'VNPay Gateway'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Item 3: VNPay Transaction ID */}
                  {result.transactionNo && result.transactionNo !== '0' && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#f0f5f2', color: '#167a5a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <ReceiptLongRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#7a8a81', display: 'block' }}>
                            VNPay Transaction ID
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                            {result.transactionNo}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  )}

                  {/* Item 4: Timestamp */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#f0f5f2', color: '#167a5a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <AccessTimeRoundedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#7a8a81', display: 'block' }}>
                          Transaction Timestamp
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                          {formatPayDate(result.payDate)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>

                {/* Policy Notice Box */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '14px',
                    bgcolor: isSettled ? '#f8faf9' : '#fff7f7',
                    border: `1px solid ${isSettled ? '#e5ebe7' : '#fecaca'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    mb: 4,
                  }}
                >
                  <InfoOutlinedIcon sx={{ color: isSettled ? '#167a5a' : '#dc2626', fontSize: 20, mt: 0.25, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ color: isSettled ? '#55655b' : '#991b1b', lineHeight: 1.6 }}>
                    {isSettled ? (
                      isFullSettlement ? (
                        <>
                          <strong>Full Settlement Policy:</strong> Your dining invoice has been fully paid (100%). No additional charges remain. You can preview and download the official PDF invoice below. We look forward to welcoming you!
                        </>
                      ) : (
                        <>
                          <strong>Deposit Policy (50% Advance):</strong> Your 50% deposit secures your reservation. The remaining balance will be settled at the restaurant after your dining session.
                        </>
                      )
                    ) : (
                      <>
                        <strong>Payment Notice:</strong> If your bank account was debited but the gateway shows incomplete, please wait a few moments and click &quot;Check Status Again&quot; or check your reservation history before attempting another payment.
                      </>
                    )}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {/* Action Buttons Row */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {/* PDF Download Button (Active only when paid/partially_paid) */}
                  {isSettled ? (
                    <Button
                      variant="outlined"
                      onClick={handleDownloadInvoice}
                      disabled={downloading}
                      startIcon={downloading ? <CircularProgress size={16} sx={{ color: '#167a5a' }} /> : <FileDownloadRoundedIcon />}
                      sx={{
                        width: { xs: '100%', sm: 'auto' },
                        borderColor: '#167a5a',
                        color: '#167a5a',
                        borderRadius: '12px',
                        height: 44,
                        px: 2.5,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: 13,
                        '&:hover': {
                          borderColor: '#115e45',
                          bgcolor: '#f0f7f3',
                        },
                      }}
                    >
                      {downloading ? 'Downloading PDF...' : 'Download Official Invoice (PDF)'}
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={executeVerification}
                      startIcon={<RefreshRoundedIcon />}
                      sx={{
                        width: { xs: '100%', sm: 'auto' },
                        borderColor: '#dc2626',
                        color: '#dc2626',
                        borderRadius: '12px',
                        height: 44,
                        px: 2.5,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: 13,
                        '&:hover': { borderColor: '#b91c1c', bgcolor: '#fef2f2' },
                      }}
                    >
                      Re-check Gateway Status
                    </Button>
                  )}

                  {/* Navigation Buttons */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    <Button
                      variant="text"
                      onClick={() => navigate(ROUTES.HOME)}
                      startIcon={<HomeRoundedIcon />}
                      sx={{
                        color: '#55655b',
                        borderRadius: '12px',
                        height: 44,
                        px: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: 13,
                        '&:hover': { bgcolor: '#f0f4f1' },
                      }}
                    >
                      Dining Home
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => navigate(ROUTES.RESERVATIONS_ME)}
                      startIcon={<CalendarMonthRoundedIcon />}
                      sx={{
                        bgcolor: '#167a5a',
                        color: '#ffffff',
                        borderRadius: '12px',
                        height: 44,
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: 13,
                        boxShadow: '0 4px 14px rgba(22, 122, 90, 0.25)',
                        '&:hover': {
                          bgcolor: '#115e45',
                          boxShadow: '0 6px 18px rgba(22, 122, 90, 0.35)',
                        },
                      }}
                    >
                      My Reservations
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Card>
          )}
        </Container>
      </Box>

      {/* Snackbar for Notifications instead of window.alert */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </Box>
  );
}
