import { useCallback, useEffect, useMemo, useState } from 'react';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import {
  Box,
  Card,
  Grid,
  IconButton,
  LinearProgress,
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

const STATUS_COLORS = {
  QUEUED: '#8b5cf6',
  PENDING: '#a78bfa',
  ON_HOLD: '#64748b',
  COOKING: '#f59e0b',
  PREPARING: '#d97706',
  READY: '#16a34a',
  DONE: '#22c55e',
  SERVED: '#0284c7',
  SERVCED: '#38bdf8',
  CANCELLED: '#ef4444',
  CANCELED: '#f87171',
  REJECTED: '#b91c1c',
};

const STATUS_LABELS = {
  QUEUED: 'Queued',
  PENDING: 'Pending',
  ON_HOLD: 'On hold',
  COOKING: 'Cooking',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DONE: 'Done',
  SERVED: 'Served',
  SERVCED: 'Served',
  CANCELLED: 'Cancelled',
  CANCELED: 'Cancelled',
  REJECTED: 'Rejected',
};

const formatNumber = (value, fractionDigits = 0) => new Intl.NumberFormat('en-US', {
  maximumFractionDigits: fractionDigits,
}).format(value ?? 0);

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(value ?? 0);

function MetricCard({ label, value, detail, icon: Icon, tone, background }) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: '20px',
        border: '1px solid #edf0ed',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        background: `linear-gradient(135deg, #ffffff 0%, ${background} 100%)`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: '#68776f', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {label}
          </Typography>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: background,
              color: tone,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
        </Stack>
        <Typography variant="h4" sx={{ color: '#1a2e22', fontWeight: 800, mb: 1 }}>
          {value}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ color: '#7a8a81' }}>{detail}</Typography>
    </Card>
  );
}

export default function KitchenPerformanceAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setData(await dashboardApi.getKitchenPerformance());
    } catch (err) {
      setError(err.message || 'Unable to load kitchen performance analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(initialLoad);
  }, [fetchData]);

  const statuses = useMemo(() => {
    const entries = Object.entries(data?.orderCountByStatus ?? {})
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]));
    const maxCount = Math.max(...entries.map(([, count]) => Number(count)), 1);
    const total = entries.reduce((sum, [, count]) => sum + Number(count), 0);
    const chartStatuses = entries.map(([status, count], index) => {
      const value = Number(count);
      const startDeg = entries
        .slice(0, index)
        .reduce((sum, [, previousCount]) => sum + (Number(previousCount) / total) * 360, 0);
      const deg = total > 0 ? (value / total) * 360 : 0;
      return {
        status,
        count: value,
        startDeg,
        deg,
        maxCount,
        color: STATUS_COLORS[status] ?? '#94a3b8',
      };
    });

    return { entries: chartStatuses, total };
  }, [data]);

  const dishes = useMemo(() => data?.mostOrderedDishes ?? [], [data]);
  const maxDishQuantity = useMemo(
    () => Math.max(...dishes.map((dish) => dish.totalQuantityOrdered ?? 0), 1),
    [dishes],
  );
  const prepRange = Math.max(data?.maxPrepTimeMinutes ?? 0, 1);

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
            <Badge tone="neutral">KITCHEN PERFORMANCE</Badge>
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
            Kitchen Performance Analytics
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#5b6b61' }}>
            Monitor preparation speed, live kitchen workload, and your most ordered dishes.
          </Typography>
        </Box>
        <Tooltip title="Refresh analytics">
          <span>
            <IconButton
              aria-label="Refresh kitchen analytics"
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
            Analyzing kitchen performance...
          </Typography>
        </Box>
      )}

      {error && !loading && (
        <ErrorState
          title="Unable to load kitchen analytics"
          description={error}
          onRetry={fetchData}
        />
      )}

      {!loading && !error && data && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} xl={3}>
              <MetricCard
                label="Average prep time"
                value={data.averagePrepTimeMinutes == null
                  ? 'N/A'
                  : `${formatNumber(data.averagePrepTimeMinutes, 1)} min`}
                detail={`${formatNumber(data.completedOrdersCount)} completed orders analyzed`}
                icon={AccessTimeRoundedIcon}
                tone="#167a5a"
                background="#e8f5ee"
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MetricCard
                label="Kitchen workload"
                value={`${formatNumber(data.workloadPercent, 1)}%`}
                detail={`${formatNumber(data.preparingOrders + data.readyOrders)} orders in active workflow`}
                icon={LocalFireDepartmentRoundedIcon}
                tone="#d97706"
                background="#fbf2df"
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MetricCard
                label="Active kitchen orders"
                value={formatNumber(data.totalActiveOrders)}
                detail={`${formatNumber(data.pendingOrders)} waiting · ${formatNumber(data.preparingOrders)} preparing · ${formatNumber(data.readyOrders)} ready`}
                icon={RestaurantMenuRoundedIcon}
                tone="#0284c7"
                background="#e8f2f8"
              />
            </Grid>
            <Grid item xs={12} sm={6} xl={3}>
              <MetricCard
                label="Preparation time range"
                value={data.minPrepTimeMinutes == null || data.maxPrepTimeMinutes == null
                  ? 'N/A'
                  : `${formatNumber(data.minPrepTimeMinutes, 1)}–${formatNumber(data.maxPrepTimeMinutes, 1)} min`}
                detail="Fastest to longest completed order"
                icon={CheckCircleRoundedIcon}
                tone="#8b5cf6"
                background="#f5e8f5"
              />
            </Grid>
          </Grid>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
              gap: 2.5,
              mb: 3,
            }}
          >
            <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid #edf0ed', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: '#1a2e22', fontSize: 16, fontWeight: 700 }}>
                    Kitchen Workload
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#7a8a81' }}>
                    Live order distribution by status
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
                  minHeight: 230,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    role="img"
                    aria-label={`Kitchen workload: ${formatNumber(data.workloadPercent, 1)} percent`}
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: statuses.total > 0
                        ? `conic-gradient(${statuses.entries.map((entry) => `${entry.color} ${entry.startDeg}deg ${entry.startDeg + entry.deg}deg`).join(', ')})`
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
                        WORKLOAD
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#167a5a', fontWeight: 800, lineHeight: 1.2 }}>
                        {formatNumber(data.workloadPercent, 1)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9aa8a0', fontSize: 10 }}>
                        {formatNumber(data.totalActiveOrders)} active
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Stack spacing={1}>
                  {statuses.entries.length > 0 ? statuses.entries.map((entry) => (
                    <Box
                      key={entry.status}
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
                        <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: entry.color }} />
                        <Typography variant="caption" sx={{ color: '#27382f', fontWeight: 600 }}>
                          {STATUS_LABELS[entry.status] ?? entry.status.replaceAll('_', ' ')}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#167a5a', fontWeight: 700 }}>
                        {formatNumber(entry.count)}
                      </Typography>
                    </Box>
                  )) : (
                    <Typography variant="body2" sx={{ color: '#88988e', textAlign: 'center' }}>
                      No kitchen orders to display.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Card>

            <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid #edf0ed', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: '#1a2e22', fontSize: 16, fontWeight: 700 }}>
                    Preparation Time
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#7a8a81' }}>
                    Fastest, average, and longest completed order
                  </Typography>
                </Box>
                <Badge tone="neutral">Minutes</Badge>
              </Stack>
              {data.averagePrepTimeMinutes == null ? (
                <Box sx={{ minHeight: 230, display: 'grid', placeItems: 'center', color: '#88988e', fontSize: 13 }}>
                  No completed orders with preparation times are available.
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    gap: 2,
                    height: 230,
                    pt: 4,
                    pb: 1,
                    px: 2,
                    borderBottom: '1px solid #e1e7e2',
                  }}
                >
                  {[
                    { label: 'Fastest', value: data.minPrepTimeMinutes, color: '#6eb39a' },
                    { label: 'Average', value: data.averagePrepTimeMinutes, color: '#167a5a' },
                    { label: 'Longest', value: data.maxPrepTimeMinutes, color: '#f59e0b' },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        gap: 0.75,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#55655b', fontWeight: 700 }}>
                        {formatNumber(item.value, 1)} min
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: 64,
                          height: `${Math.max(((item.value ?? 0) / prepRange) * 100, 4)}%`,
                          minHeight: 5,
                          bgcolor: item.color,
                          borderRadius: '6px 6px 2px 2px',
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 0.25, color: '#7a8a81', fontSize: 10 }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#88988e' }}>
                Based on {formatNumber(data.completedOrdersCount)} completed orders with timestamps.
              </Typography>
            </Card>
          </Box>

          <Paper elevation={0} sx={{ overflow: 'hidden', border: '1px solid #edf0ed', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography variant="h6" sx={{ color: '#1a2e22', fontSize: 16, fontWeight: 700 }}>
                Most Ordered Dishes
              </Typography>
              <Typography variant="caption" sx={{ color: '#7a8a81' }}>
                Top {formatNumber(dishes.length)} dishes ranked by total quantity ordered
              </Typography>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 740 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8faf9' }}>
                    <TableCell sx={{ color: '#68776f', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Rank & dish</TableCell>
                    <TableCell sx={{ color: '#68776f', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Category</TableCell>
                    <TableCell sx={{ minWidth: 210, color: '#68776f', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Quantity ordered</TableCell>
                    <TableCell align="right" sx={{ color: '#68776f', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Orders</TableCell>
                    <TableCell align="right" sx={{ color: '#68776f', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dishes.length > 0 ? dishes.map((dish) => (
                    <TableRow key={dish.menuItemId ?? dish.rank} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: '10px',
                              bgcolor: dish.rank === 1 ? '#fbf2df' : '#f0f5f2',
                              color: dish.rank === 1 ? '#a56b14' : '#167a5a',
                              fontSize: 12,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            #{dish.rank}
                          </Box>
                          <Typography variant="body2" sx={{ color: '#1a2e22', fontWeight: 700 }}>
                            {dish.dishName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Badge tone="neutral">{dish.categoryName || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="body2" sx={{ width: 54, color: '#167a5a', fontWeight: 700 }}>
                            {formatNumber(dish.totalQuantityOrdered)}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={((dish.totalQuantityOrdered ?? 0) / maxDishQuantity) * 100}
                            sx={{
                              flex: 1,
                              height: 7,
                              borderRadius: 4,
                              bgcolor: '#e9ede9',
                              '& .MuiLinearProgress-bar': { bgcolor: '#6eb39a', borderRadius: 4 },
                            }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{formatNumber(dish.orderCount)}</TableCell>
                      <TableCell align="right" sx={{ color: '#1a2e22', fontWeight: 600 }}>
                        {formatCurrency(dish.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5, color: '#88988e' }}>
                        No dish order statistics are available.
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
