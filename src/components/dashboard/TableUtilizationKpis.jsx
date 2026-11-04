import React from 'react';
import { Box, Card, Grid, LinearProgress, Typography } from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

export default function TableUtilizationKpis({ data }) {
  if (!data) return null;

  const {
    overallUtilizationRate = 0,
    totalReservations = 0,
    averagePartySize = 0,
    totalTables = 0,
    mostPopularTable = 'N/A',
    peakHour = 'N/A',
  } = data;

  return (
    <Grid container spacing={2.5} sx={{ mb: 4 }}>
      {/* KPI 1: Overall Utilization Rate */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            p: 2.5,
            borderRadius: '20px',
            border: '1px solid #edf0ed',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f6faf7 100%)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 36,
                mb: 1.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: '#68776f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                }}
              >
                OVERALL OCCUPANCY RATE
              </Typography>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  bgcolor: '#e8f5ee',
                  color: '#167a5a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUpRoundedIcon fontSize="small" />
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#167a5a', mb: 1 }}>
              {overallUtilizationRate.toFixed(1)}%
            </Typography>
          </Box>
          <Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(overallUtilizationRate, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: '#e2ece6',
                '& .MuiLinearProgress-bar': {
                  bgcolor:
                    overallUtilizationRate >= 70
                      ? '#167a5a'
                      : overallUtilizationRate >= 40
                      ? '#0d9488'
                      : '#f59e0b',
                  borderRadius: 4,
                },
                mb: 1,
              }}
            />
            <Typography variant="caption" sx={{ color: '#7a8a81', display: 'block' }}>
              {overallUtilizationRate >= 70
                ? 'High utilization (Optimal target achieved)'
                : overallUtilizationRate >= 40
                ? 'Stable utilization during operating hours'
                : 'Low utilization, available capacity remaining'}
            </Typography>
          </Box>
        </Card>
      </Grid>

      {/* KPI 2: Total Reservations */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            p: 2.5,
            borderRadius: '20px',
            border: '1px solid #edf0ed',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f7f9fa 100%)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 36,
                mb: 1.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: '#68776f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                }}
              >
                TOTAL RESERVATIONS SERVED
              </Typography>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  bgcolor: '#e8f2f8',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CalendarMonthRoundedIcon fontSize="small" />
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a2e22', mb: 1 }}>
              {totalReservations}
              <Typography component="span" variant="body1" sx={{ color: '#7a8a81', ml: 1, fontWeight: 500 }}>
                bookings
              </Typography>
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#7a8a81' }}>
            Calculated from confirmed and completed seated dining reservations.
          </Typography>
        </Card>
      </Grid>

      {/* KPI 3: Average Party Size */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            p: 2.5,
            borderRadius: '20px',
            border: '1px solid #edf0ed',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            background: 'linear-gradient(135deg, #ffffff 0%, #faf8f5 100%)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 36,
                mb: 1.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: '#68776f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                }}
              >
                AVERAGE PARTY SIZE
              </Typography>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  bgcolor: '#fbf2df',
                  color: '#a56b14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <PeopleAltRoundedIcon fontSize="small" />
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a2e22', mb: 1 }}>
              {averagePartySize.toFixed(1)}
              <Typography component="span" variant="body1" sx={{ color: '#7a8a81', ml: 1, fontWeight: 500 }}>
                guests / table
              </Typography>
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#7a8a81' }}>
            Total dining tables managed: <strong>{totalTables} tables</strong>
          </Typography>
        </Card>
      </Grid>

      {/* KPI 4: Hot Table & Peak Hour */}
      <Grid item xs={12} sm={6} lg={3}>
        <Card
          sx={{
            p: 2.5,
            borderRadius: '20px',
            border: '1px solid #edf0ed',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            background: 'linear-gradient(135deg, #ffffff 0%, #fdf8fb 100%)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: 36,
                mb: 1.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: '#68776f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: 1.2,
                }}
              >
                TOP TABLE & PEAK HOUR
              </Typography>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  bgcolor: '#f5e8f5',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <StarRoundedIcon fontSize="small" />
              </Box>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#167a5a', mb: 0.5 }} noWrap>
              {mostPopularTable}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a2e22' }} noWrap>
              {peakHour}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#7a8a81', mt: 1 }}>
            Most preferred dining time slot and seating location.
          </Typography>
        </Card>
      </Grid>
    </Grid>
  );
}
