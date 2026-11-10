import { useCallback, useEffect, useMemo, useState } from 'react';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import Badge from '../components/ui/Badge';
import ErrorState from '../components/ui/ErrorState';
import Loading from '../components/ui/Loading';
import { dashboardApi } from '../services/dashboardService';

const STATUS_TONE = {
  AVAILABLE: 'success',
  RESERVED: 'info',
  PREPARING: 'warning',
  OCCUPIED: 'danger',
  CLEANING: 'neutral',
  MAINTENANCE: 'warning',
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value ?? 0);

const formatNumber = (value, maximumFractionDigits = 0) => new Intl.NumberFormat('en-US', {
  maximumFractionDigits,
}).format(value ?? 0);

function MetricCard({ label, value, detail, icon: Icon, tone = '#167a5a' }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid #e1e7e2',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(22, 122, 90, 0.04)',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="body2" sx={{ color: '#66756b', fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 1, color: '#1a2e22', fontWeight: 800 }}>
              {value}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: '#7b8a80' }}>
              {detail}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 42,
              height: 42,
              borderRadius: '13px',
              bgcolor: `${tone}14`,
              color: tone,
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function VipRoomAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setData(await dashboardApi.getVipRoomAnalytics());
    } catch (err) {
      setError(err.message || 'Unable to load VIP room analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(initialLoad);
  }, [fetchData]);

  const rooms = useMemo(() => data?.rooms ?? [], [data]);
  const maximumRevenue = useMemo(
    () => Math.max(...rooms.map((room) => room.totalRevenue ?? 0), 0),
    [rooms],
  );
  const utilizationSegments = useMemo(() => {
    const occupied = data?.occupiedVipRooms ?? 0;
    const available = data?.availableVipRooms ?? 0;
    const other = Math.max((data?.totalVipRooms ?? 0) - occupied - available, 0);
    const total = data?.totalVipRooms ?? 0;
    let currentDeg = 0;

    return [
      { label: 'In use', value: occupied, color: '#167a5a' },
      { label: 'Available', value: available, color: '#6eb39a' },
      { label: 'Other status', value: other, color: '#f59e0b' },
    ].map((segment) => {
      const startDeg = currentDeg;
      const deg = total > 0 ? (segment.value / total) * 360 : 0;
      currentDeg += deg;
      return { ...segment, startDeg, deg };
    });
  }, [data]);

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3.5 }}
      >
        <Box>
          <Box sx={{ mb: 0.75 }}>
            <Badge tone="neutral">ROOM PERFORMANCE</Badge>
          </Box>
          <Typography
            variant="h4"
            sx={{
              color: '#1a2e22',
              fontSize: { xs: '1.5rem', md: '1.875rem' },
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            VIP Room Analytics
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#5b6b61' }}>
            Track room utilization, reservation frequency, and revenue across your VIP rooms.
          </Typography>
        </Box>
        <Tooltip title="Refresh analytics">
          <span>
            <IconButton
              aria-label="Refresh VIP room analytics"
              onClick={fetchData}
              disabled={loading}
              sx={{
                width: 40,
                height: 40,
                border: '1px solid #dfe8e1',
                borderRadius: '12px',
                bgcolor: '#fff',
                color: '#167a5a',
              }}
            >
              <RefreshRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {loading && (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Loading />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading VIP room performance...
          </Typography>
        </Box>
      )}

      {error && !loading && (
        <ErrorState
          title="Unable to load VIP room analytics"
          description={error}
          onRetry={fetchData}
        />
      )}

      {!loading && !error && data && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} xl={3}>
              <MetricCard
                label="VIP rooms"
                value={formatNumber(data.totalVipRooms)}
                detail={`${formatNumber(data.availableVipRooms)} currently available`}
                icon={MeetingRoomRoundedIcon}
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MetricCard
                label="Current utilization"
                value={`${formatNumber(data.overallUtilizationPercent, 1)}%`}
                detail={`${formatNumber(data.occupiedVipRooms)} rooms currently in use`}
                icon={PeopleAltRoundedIcon}
                tone="#7c3aed"
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MetricCard
                label="Total VIP revenue"
                value={formatCurrency(data.totalVipRevenue)}
                detail="From paid and partially paid bookings"
                icon={AttachMoneyRoundedIcon}
                tone="#d97706"
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MetricCard
                label="VIP bookings"
                value={formatNumber(data.totalVipBookings)}
                detail={`${formatNumber(data.averageBookingsPerRoom, 1)} bookings per room on average`}
                icon={EventAvailableRoundedIcon}
                tone="#2563eb"
              />
            </Grid>
          </Grid>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' },
              gap: 2.5,
              mb: 3,
            }}
          >
            <Card
              sx={{
                p: 3,
                borderRadius: '20px',
                border: '1px solid #edf0ed',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                height: '100%',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: '#1a2e22', fontSize: 16, fontWeight: 700 }}>
                    VIP Room Utilization
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#7a8a81' }}>
                    Current status distribution across VIP rooms
                  </Typography>
                </Box>
                <Badge tone="info">Live Metrics</Badge>
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'minmax(150px, 0.8fr) minmax(0, 1.2fr)' },
                  alignItems: 'center',
                  gap: 2.5,
                  minHeight: 220,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    role="img"
                    aria-label={`Room utilization: ${formatNumber(data.occupiedVipRooms)} in use, ${formatNumber(data.availableVipRooms)} available`}
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: (data.totalVipRooms ?? 0) > 0
                        ? `conic-gradient(${utilizationSegments.map((segment) => `${segment.color} ${segment.startDeg}deg ${segment.startDeg + segment.deg}deg`).join(', ')})`
                        : '#e6ede8',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        bgcolor: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#7a8a81', fontSize: 10, fontWeight: 700 }}>
                        UTILIZATION
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#167a5a', fontWeight: 800, lineHeight: 1.2 }}>
                        {formatNumber(data.overallUtilizationPercent, 1)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9aa8a0', fontSize: 10 }}>
                        {formatNumber(data.totalVipRooms)} rooms
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Stack spacing={1}>
                  {utilizationSegments.map((segment) => (
                    <Box
                      key={segment.label}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        p: 1,
                        borderRadius: '8px',
                        bgcolor: '#f9fbf9',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: segment.color }} />
                        <Typography variant="caption" sx={{ color: '#27382f', fontWeight: 600 }}>
                          {segment.label}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#167a5a', fontWeight: 700 }}>
                        {formatNumber(segment.value)} rooms
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Card>

            <Card
              sx={{
                p: 3,
                borderRadius: '20px',
                border: '1px solid #edf0ed',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                height: '100%',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: '#1a2e22', fontSize: 16, fontWeight: 700 }}>
                    Revenue by VIP Room
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#7a8a81' }}>
                    Paid booking revenue for each room
                  </Typography>
                </Box>
                <Badge tone="neutral">VND</Badge>
              </Stack>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: { xs: 1, sm: 2 },
                  height: 220,
                  pt: 4,
                  pb: 1,
                  px: 1,
                  overflowX: 'auto',
                  borderBottom: '1px solid #e1e7e2',
                }}
              >
                {rooms.map((room) => {
                  const revenue = room.totalRevenue ?? 0;
                  const heightPercent = maximumRevenue > 0 ? (revenue / maximumRevenue) * 100 : 4;

                  return (
                    <Box
                      key={room.roomId}
                      sx={{
                        flex: '1 0 44px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        minWidth: 44,
                      }}
                    >
                      <Tooltip title={`${room.roomName}: ${formatCurrency(revenue)}`} arrow placement="top">
                        <Box
                          sx={{
                            width: '100%',
                            maxWidth: 42,
                            height: `${Math.max(heightPercent, 4)}%`,
                            minHeight: 5,
                            borderRadius: '6px 6px 2px 2px',
                            bgcolor: revenue > 0 ? '#6eb39a' : '#e6ede8',
                            transition: 'all 0.2s ease',
                            cursor: 'default',
                            '&:hover': {
                              bgcolor: '#167a5a',
                              transform: 'translateY(-3px)',
                              boxShadow: '0 6px 14px rgba(22, 122, 90, 0.2)',
                            },
                          }}
                        />
                      </Tooltip>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ mt: 1, maxWidth: 76, color: '#7a8a81', fontSize: 10 }}
                      >
                        {room.roomName}
                      </Typography>
                    </Box>
                  );
                })}
                {rooms.length === 0 && (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#88988e',
                      fontSize: 13,
                    }}
                  >
                    No VIP room revenue data available.
                  </Box>
                )}
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#88988e' }}>
                {rooms.length > 0
                  ? 'Hover over a bar to see its room revenue.'
                  : 'Add VIP rooms and record paid bookings to populate this chart.'}
              </Typography>
            </Card>
          </Box>

          <Paper
            elevation={0}
            sx={{ overflow: 'hidden', border: '1px solid #e1e7e2', borderRadius: '16px' }}
          >
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography variant="subtitle1" sx={{ color: '#1a2e22', fontWeight: 750 }}>
                VIP room performance
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.25, color: '#718077' }}>
                Utilization, booking frequency, and revenue per room
              </Typography>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 850 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f7faf8' }}>
                    <TableCell sx={{ color: '#66756b', fontWeight: 700 }}>Room</TableCell>
                    <TableCell sx={{ color: '#66756b', fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ color: '#66756b', fontWeight: 700 }}>Capacity</TableCell>
                    <TableCell align="right" sx={{ color: '#66756b', fontWeight: 700 }}>Utilization</TableCell>
                    <TableCell align="right" sx={{ color: '#66756b', fontWeight: 700 }}>Bookings</TableCell>
                    <TableCell align="right" sx={{ color: '#66756b', fontWeight: 700 }}>Revenue</TableCell>
                    <TableCell align="right" sx={{ color: '#66756b', fontWeight: 700 }}>Price / session</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rooms.length > 0 ? rooms.map((room) => (
                    <TableRow key={room.roomId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#1a2e22', fontWeight: 700 }}>
                          {room.roomName}
                        </Typography>
                        {room.description && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              maxWidth: 260,
                              overflow: 'hidden',
                              color: '#718077',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {room.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge tone={STATUS_TONE[room.roomStatus] ?? 'neutral'}>
                          {(room.roomStatus ?? 'UNKNOWN').replaceAll('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">{formatNumber(room.capacity)}</TableCell>
                      <TableCell align="right">{formatNumber(room.utilizationPercent, 1)}%</TableCell>
                      <TableCell align="right">{formatNumber(room.bookingCount)}</TableCell>
                      <TableCell align="right">{formatCurrency(room.totalRevenue)}</TableCell>
                      <TableCell align="right">{formatCurrency(room.pricePerSession)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5, color: '#718077' }}>
                        No VIP rooms are available to report.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
