import React, { useEffect, useState } from 'react';
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

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Loading from '../components/ui/Loading';
import { paymentApi } from '../services/paymentService';
import { useOrderStore } from '../stores/useOrderStore';
import { ROUTES } from '../routes/routeConstants';

// Helper to determine if invoice or return result represents full payment
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

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const processReturn = async () => {
      try {
        setLoading(true);

        // Extract query params into an object
        const params = {};
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }

        // If no query parameters at all, user visited directly
        if (Object.keys(params).length === 0) {
          setLoading(false);
          return;
        }

        // Case 1: Direct test / view by paymentId (e.g. ?paymentId=14)
        if (params.paymentId && !params.vnp_SecureHash) {
          try {
            const inv = await paymentApi.getInvoice(params.paymentId);
            const fullyPaid = checkIsFullyPaid(inv);
            setInvoice(inv);
            setResult({
              success: inv.paymentStatus === 'PAID' || inv.paymentStatus === 'PARTIALLY_PAID',
              responseCode: '00',
              message: 'Payment verified',
              paymentId: inv.paymentId,
              txnRef: `INV-${inv.orderId}-${inv.paymentId}`,
              transactionNo: `TXN-${inv.paymentId}`,
              bankCode: 'VNPAY',
              amount: String(inv.paymentAmount),
              payDate: inv.paymentDate,
              orderInfo: `Thanh toan don hang ${inv.orderNo}`,
              isFullyPaid: fullyPaid,
            });
            return;
          } catch (invErr) {
            console.warn('Failed to load invoice directly by paymentId:', invErr);
          }
        }

        // Case 2: Returning from VNPay gateway
        const data = await paymentApi.processVnPayReturn(params);
        setResult(data);

        // Fetch detailed invoice for exact settlement breakdown (50% deposit vs 100% full)
        const pId = data?.paymentId || (params.vnp_TxnRef ? params.vnp_TxnRef.split('T')[0] : null);
        let detailedInvoice = null;
        if (pId) {
          try {
            detailedInvoice = await paymentApi.getInvoice(pId);
            setInvoice(detailedInvoice);
          } catch (invErr) {
            console.warn('Could not fetch detailed invoice:', invErr);
          }
        }

        const isFull = checkIsFullyPaid(detailedInvoice, data);

        // Update active order state if payment succeeded and fully settled
        if (data?.success && isFull) {
          const current = useOrderStore.getState().activeOrder;
          if (current) {
            useOrderStore.getState().setActiveOrder({ ...current, orderStatus: 'OK' });
          }
        }
      } catch (err) {
        // Fallback to query param interpretation if backend had temporary error
        const code = searchParams.get('vnp_ResponseCode');
        const isSuccess = code === '00';
        const pId = searchParams.get('paymentId') || (searchParams.get('vnp_TxnRef') ? searchParams.get('vnp_TxnRef').split('T')[0] : null);

        let detailedInvoice = null;
        if (pId) {
          try {
            detailedInvoice = await paymentApi.getInvoice(pId);
            setInvoice(detailedInvoice);
          } catch {
            // ignore
          }
        }

        const isFull = checkIsFullyPaid(detailedInvoice);

        setResult({
          success: isSuccess || (detailedInvoice && (detailedInvoice.paymentStatus === 'PAID' || detailedInvoice.paymentStatus === 'PARTIALLY_PAID')),
          responseCode: code,
          message: err.message || (isSuccess ? 'Transaction verified' : 'Transaction failed or cancelled'),
          paymentId: pId,
          txnRef: searchParams.get('vnp_TxnRef'),
          transactionNo: searchParams.get('vnp_TransactionNo'),
          bankCode: searchParams.get('vnp_BankCode'),
          amount: detailedInvoice?.paymentAmount
            ? String(detailedInvoice.paymentAmount)
            : (searchParams.get('vnp_Amount')
                ? String(Number(searchParams.get('vnp_Amount')) / 100)
                : '0'),
          payDate: detailedInvoice?.paymentDate || searchParams.get('vnp_PayDate'),
          orderInfo: searchParams.get('vnp_OrderInfo'),
          isFullyPaid: isFull,
        });
      } finally {
        setLoading(false);
      }
    };

    processReturn();
  }, [searchParams]);

  const handleDownloadInvoice = async () => {
    const pId = invoice?.paymentId || result?.paymentId || (searchParams.get('vnp_TxnRef') ? searchParams.get('vnp_TxnRef').split('T')[0] : null) || searchParams.get('paymentId');
    if (!pId) {
      alert('Invoice download is available once payment is recorded in the system.');
      return;
    }
    try {
      setDownloading(true);
      await paymentApi.downloadInvoicePdf(pId);
    } catch (err) {
      alert('Unable to download invoice: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const isSuccess = Boolean(
    result?.success ||
    result?.responseCode === '00' ||
    invoice?.paymentStatus === 'PAID' ||
    invoice?.paymentStatus === 'PARTIALLY_PAID'
  );

  const isFullyPaid = checkIsFullyPaid(invoice, result);

  // Format currency
  const formatVnd = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return amount || '0';
    return num.toLocaleString('vi-VN');
  };

  // Format VNPay payDate (YYYYMMDDHHmmss -> readable)
  const formatPayDate = (rawDate) => {
    if (!rawDate) return 'Just now';
    if (rawDate.includes('-') || rawDate.includes('/')) return rawDate;
    if (rawDate.length >= 14) {
      const y = rawDate.slice(0, 4);
      const m = rawDate.slice(4, 6);
      const d = rawDate.slice(6, 8);
      const h = rawDate.slice(8, 10);
      const min = rawDate.slice(10, 12);
      return `${y}-${m}-${d} ${h}:${min}`;
    }
    return rawDate;
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fbfcfb' }}>
      {/* ─── Top Navbar ──────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ─── Main Content Container ─────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 6, md: 9 },
          background: 'linear-gradient(180deg, #f0f7f3 0%, #fbfcfb 260px)',
        }}
      >
        <Container maxWidth="md">
          {loading ? (
            <Box sx={{ py: 12, textAlign: 'center' }}>
              <Loading />
              <Typography variant="body1" sx={{ mt: 2.5, color: '#167a5a', fontWeight: 700 }}>
                Verifying transaction with VNPay Gateway...
              </Typography>
              <Typography variant="caption" sx={{ color: '#88988e' }}>
                Please keep this page open while we confirm your reservation status.
              </Typography>
            </Box>
          ) : !result ? (
            /* Case: Direct Visit without Parameters */
            <Card
              sx={{
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                borderRadius: '28px',
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
                This page displays confirmation after completing a transaction via VNPay. You can view your current bookings or browse available dining tables.
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
          ) : (
            /* ─── Luxury Dining Receipt Card ─────────────────────────────────────── */
            <Card
              sx={{
                borderRadius: '28px',
                border: '1px solid #dbe6df',
                boxShadow: '0 20px 60px rgba(22, 122, 90, 0.08)',
                overflow: 'hidden',
                bgcolor: '#ffffff',
                maxWidth: 720,
                mx: 'auto',
              }}
            >
              {/* Header Banner */}
              <Box
                sx={{
                  p: { xs: 4, sm: 5 },
                  textAlign: 'center',
                  bgcolor: isSuccess ? '#eef7f2' : '#fdf2f2',
                  borderBottom: `1px solid ${isSuccess ? '#cce5d6' : '#f8d2d2'}`,
                  position: 'relative',
                }}
              >
                {/* Glowing Icon Circle */}
                <Box
                  sx={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    bgcolor: isSuccess ? '#167a5a' : '#dc2626',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    mx: 'auto',
                    mb: 2.5,
                    boxShadow: isSuccess
                      ? '0 10px 28px rgba(22, 122, 90, 0.32)'
                      : '0 10px 28px rgba(220, 38, 38, 0.28)',
                  }}
                >
                  {isSuccess ? (
                    <CheckCircleRoundedIcon sx={{ fontSize: 48 }} />
                  ) : (
                    <ErrorOutlineRoundedIcon sx={{ fontSize: 48 }} />
                  )}
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: isSuccess ? '#167a5a' : '#b91c1c',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  {isSuccess
                    ? (isFullyPaid ? 'OFFICIAL TABLE DINING RECEIPT' : 'OFFICIAL RESERVATION CONFIRMATION')
                    : 'PAYMENT NOTICE'}
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: isSuccess ? '#124e38' : '#991b1b',
                    letterSpacing: '-0.02em',
                    mb: 1,
                    fontSize: { xs: '1.625rem', sm: '2.125rem' },
                  }}
                >
                  {isSuccess
                    ? (isFullyPaid ? 'Order Payment Successful!' : 'Reservation Deposit Confirmed!')
                    : 'Payment Incomplete or Cancelled'}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: isSuccess ? '#2e6b52' : '#7f1d1d',
                    maxWidth: 520,
                    mx: 'auto',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {isSuccess
                    ? (isFullyPaid
                        ? 'Thank you for dining with us. Your table order has been fully settled (100%) via VNPay.'
                        : 'Thank you for choosing The Greenhouse. Your 50% reservation deposit has been validated and our kitchen team has been alerted for your dining time.')
                    : result?.message ||
                      'The payment was not completed by the gateway. If this was a mistake, you can initiate payment again from your reservation details.'}
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
                    bgcolor: '#f5faf6',
                    border: '1px solid #dcebe1',
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
                        {isFullyPaid ? 'Total Amount Settled' : 'Deposit Amount Paid'}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 900,
                          color: '#167a5a',
                          letterSpacing: '-0.02em',
                          mt: 0.25,
                        }}
                      >
                        {formatVnd(result.amount)}{' '}
                        <Typography component="span" variant="h6" sx={{ color: '#167a5a', fontWeight: 600 }}>
                          VND
                        </Typography>
                      </Typography>
                    </Box>

                    <Chip
                      label={
                        isSuccess
                          ? (isFullyPaid
                            ? '100% FULLY SETTLED'
                            : 'PAID (50% ADVANCE DEPOSIT)')
                          : 'TRANSACTION UNPAID'
                      }
                      size="medium"
                      sx={{
                        fontWeight: 800,
                        fontSize: 12,
                        bgcolor: isSuccess ? '#167a5a' : '#fee2e2',
                        color: isSuccess ? '#ffffff' : '#b91c1c',
                        borderRadius: '10px',
                        px: 1,
                        height: 32,
                      }}
                    />
                  </Box>

                  {!isFullyPaid && invoice?.orderRemainingAmount != null && Number(invoice.orderRemainingAmount) > 0 && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #d0e2d7' }}>
                      <Typography variant="caption" sx={{ color: '#4d6556', fontWeight: 600 }}>
                        Total order value: <strong>{formatVnd(invoice.orderTotalAmount)} VND</strong> &bull; Remaining balance due upon dining: <strong style={{ color: '#167a5a' }}>{formatVnd(invoice.orderRemainingAmount)} VND</strong>
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* 4-Item Key Details Grid */}
                <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                  {/* Item 1: Reference Code */}
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#f0f5f2', color: '#167a5a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <TagRoundedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#7a8a81', display: 'block' }}>
                          Reference Code
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                          {result.txnRef || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Item 2: Payment Gateway */}
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#f0f5f2', color: '#167a5a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <AccountBalanceRoundedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#7a8a81', display: 'block' }}>
                          Payment Channel
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                          VNPay ({result.bankCode || 'Direct'})
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Item 3: VNPay Transaction No */}
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#f0f5f2', color: '#167a5a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <ReceiptLongRoundedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#7a8a81', display: 'block' }}>
                          VNPay Transaction ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                          {result.transactionNo || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Item 4: Timestamp */}
                  <Grid item xs={12} sm={6}>
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
                    bgcolor: '#f8faf9',
                    border: '1px solid #e5ebe7',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    mb: 4,
                  }}
                >
                  <InfoOutlinedIcon sx={{ color: '#167a5a', fontSize: 20, mt: 0.25, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ color: '#55655b', lineHeight: 1.6 }}>
                    {isFullyPaid ? (
                      <>
                        <strong>Full Settlement Policy:</strong> Your dining invoice has been fully paid (100%). No additional charges remain. You can preview and download the official PDF invoice below. We look forward to serving you again!
                      </>
                    ) : (
                      <>
                        <strong>Deposit Policy (50% Advance):</strong> Your 50% deposit secures your reservation and kitchen station preparation. The remaining balance will be settled at the restaurant after dining.
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
                  {/* PDF Download Button */}
                  {isSuccess ? (
                    <Button
                      variant="outlined"
                      onClick={handleDownloadInvoice}
                      disabled={downloading}
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
                      <FileDownloadRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
                      {downloading ? 'Downloading PDF...' : 'Download Official Invoice (PDF)'}
                    </Button>
                  ) : (
                    <Box />
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
                      <HomeRoundedIcon sx={{ mr: 0.75, fontSize: 18 }} />
                      Dining Home
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => navigate(ROUTES.RESERVATIONS_ME)}
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
                      <CalendarMonthRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
                      My Reservations
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Card>
          )}
        </Container>
      </Box>

      {/* ─── Bottom Footer ──────────────────────────────────────────────────── */}
      <Footer />
    </Box>
  );
}
