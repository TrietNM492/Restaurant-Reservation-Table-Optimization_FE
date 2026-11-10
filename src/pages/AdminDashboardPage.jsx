import React, { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import Loading from '../components/ui/Loading';
import { dashboardApi } from '../services/dashboardService';

import TableUtilizationKpis from '../components/dashboard/TableUtilizationKpis';
import PeakHoursBarChart from '../components/dashboard/PeakHoursBarChart';
import PartySizeDonutChart from '../components/dashboard/PartySizeDonutChart';
import TableUsageTable from '../components/dashboard/TableUsageTable';

export default function AdminDashboardPage() {
  const [startDate, setStartDate] = useState(() =>
    dayjs().subtract(29, 'day').format('YYYY-MM-DD')
  );
  const [endDate, setEndDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [activePreset, setActivePreset] = useState('30d');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (start, end) => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardApi.getTableUtilization({
        startDate: start,
        endDate: end,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to load table utilization analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(startDate, endDate);
  }, [fetchData, startDate, endDate]);

  const handleApplyPreset = (preset) => {
    setActivePreset(preset);
    let s = dayjs();
    const e = dayjs().format('YYYY-MM-DD');

    if (preset === '7d') {
      s = dayjs().subtract(6, 'day');
    } else if (preset === '30d') {
      s = dayjs().subtract(29, 'day');
    } else if (preset === 'month') {
      s = dayjs().startOf('month');
    } else if (preset === '90d') {
      s = dayjs().subtract(89, 'day');
    }

    const formattedStart = s.format('YYYY-MM-DD');
    setStartDate(formattedStart);
    setEndDate(e);
  };

  const handleManualDateChange = (type, val) => {
    setActivePreset('custom');
    if (type === 'start') setStartDate(val);
    if (type === 'end') setEndDate(val);
  };

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* ─── Top Header & Controls ────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Box sx={{ mb: 0.75 }}>
            <Badge tone="success">ADMIN & MANAGER OS</Badge>
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.5rem', md: '1.875rem' },
              color: '#1a2e22',
              letterSpacing: '-0.02em',
            }}
          >
            Table Utilization & Capacity Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: '#5b6b61', mt: 0.5 }}>
            Monitor table occupancy rates, peak dining hours, and guest group sizes to optimize seating capacity.
          </Typography>
        </Box>

        {/* Date Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            border: '1px solid #e1e7e2',
            borderRadius: '16px',
            bgcolor: '#ffffff',
            boxShadow: '0 4px 16px rgba(22, 122, 90, 0.05)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/* Preset Buttons */}
          <Stack direction="row" spacing={0.5}>
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: '90d', label: '90 Days' },
            ].map((p) => (
              <Button
                key={p.id}
                size="small"
                variant={activePreset === p.id ? 'contained' : 'text'}
                onClick={() => handleApplyPreset(p.id)}
                sx={{
                  minHeight: 32,
                  px: 1.5,
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: '10px',
                  bgcolor: activePreset === p.id ? '#167a5a' : 'transparent',
                  color: activePreset === p.id ? '#fff' : '#55655b',
                  '&:hover': {
                    bgcolor: activePreset === p.id ? '#12664b' : '#f0f4f1',
                  },
                }}
              >
                {p.label}
              </Button>
            ))}
          </Stack>

          {/* Date Pickers */}
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => handleManualDateChange('start', e.target.value)}
              sx={{
                width: { xs: 130, sm: 140 },
                '& .MuiOutlinedInput-root': {
                  height: 34,
                  fontSize: 12,
                  borderRadius: '10px',
                  bgcolor: '#fcfdfc',
                },
                '& .MuiOutlinedInput-input': {
                  py: 0,
                  height: 34,
                  fontSize: 12,
                  boxSizing: 'border-box',
                },
              }}
            />
            <Typography
              component="span"
              sx={{
                color: '#88988e',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: '34px',
                height: 34,
                display: 'inline-flex',
                alignItems: 'center',
                userSelect: 'none',
              }}
            >
              to
            </Typography>
            <TextField
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => handleManualDateChange('end', e.target.value)}
              sx={{
                width: { xs: 130, sm: 140 },
                '& .MuiOutlinedInput-root': {
                  height: 34,
                  fontSize: 12,
                  borderRadius: '10px',
                  bgcolor: '#fcfdfc',
                },
                '& .MuiOutlinedInput-input': {
                  py: 0,
                  height: 34,
                  fontSize: 12,
                  boxSizing: 'border-box',
                },
              }}
            />
            <Tooltip title="Refresh analytics">
              <IconButton
                size="small"
                onClick={() => fetchData(startDate, endDate)}
                disabled={loading}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  bgcolor: '#f0f5f2',
                  color: '#167a5a',
                  '&:hover': { bgcolor: '#e2ece6' },
                }}
              >
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>
      </Box>

      {/* ─── Loading / Error State ────────────────────────────────────────── */}
      {loading && (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Loading />
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
            Analyzing table utilization & capacity data...
          </Typography>
        </Box>
      )}

      {error && !loading && (
        <ErrorState
          title="Unable to load utilization report"
          message={error}
          onRetry={() => fetchData(startDate, endDate)}
        />
      )}

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      {!loading && !error && data && (
        <>
          {/* Days Analyzed Banner */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2.5,
              py: 1.25,
              mb: 3,
              borderRadius: '12px',
              bgcolor: '#eaf4ee',
              border: '1px solid #cce2d5',
              color: '#167a5a',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <AccessTimeRoundedIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Analysis for {data.daysAnalyzed} days: from{' '}
                <strong>{data.startDate}</strong> to <strong>{data.endDate}</strong>
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#276850', fontWeight: 500 }}>
              Live system metrics
            </Typography>
          </Box>

          {/* ─── 4 Summary KPI Cards ──────────────────────────────────────── */}
          <TableUtilizationKpis data={data} />

          {/* ─── 2 Interactive Visual Charts ───────────────────────────────── */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={7}>
              <PeakHoursBarChart hourlyPeakDistribution={data.hourlyPeakDistribution} />
            </Grid>
            <Grid item xs={12} lg={5}>
              <PartySizeDonutChart
                partySizeDistribution={data.partySizeDistribution}
                averagePartySize={data.averagePartySize}
              />
            </Grid>
          </Grid>

          {/* ─── Detailed Table Usage Data Table ───────────────────────────── */}
          <TableUsageTable tableUsageStats={data.tableUsageStats} />
        </>
      )}
    </Box>
  );
}
