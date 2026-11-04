import React, { useMemo } from 'react';
import { Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import Badge from '../ui/Badge';

export default function PeakHoursBarChart({ hourlyPeakDistribution = [] }) {
  const maxHourlyCount = useMemo(() => {
    if (!hourlyPeakDistribution.length) return 1;
    const max = Math.max(...hourlyPeakDistribution.map((h) => h.reservationCount || 0));
    return max > 0 ? max : 1;
  }, [hourlyPeakDistribution]);

  return (
    <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid #edf0ed', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2e22', fontSize: 16 }}>
            Peak Dining Hours (10:00 - 22:00)
          </Typography>
          <Typography variant="caption" sx={{ color: '#7a8a81' }}>
            Hourly reservation distribution across operating hours
          </Typography>
        </Box>
        <Badge tone="info">Live Metrics</Badge>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: { xs: 0.5, sm: 1.5 },
          height: 240,
          pt: 4,
          pb: 1,
          px: 1,
          borderBottom: '1px solid #e1e7e2',
        }}
      >
        {hourlyPeakDistribution.map((slot) => {
          const count = slot.reservationCount || 0;
          const heightPercent = maxHourlyCount > 0 ? (count / maxHourlyCount) * 100 : 0;
          const isPeak = count === maxHourlyCount && count > 0;

          return (
            <Box
              key={slot.hour}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
            >
              <Tooltip
                title={
                  <Box sx={{ textAlign: 'center', p: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                      {slot.timeSlot || `${slot.hour}:00`}
                    </Typography>
                    <Typography variant="caption">
                      {count} bookings ({isPeak ? 'Peak Hour' : 'Standard'})
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 36,
                    height: `${Math.max(heightPercent, 4)}%`,
                    bgcolor: isPeak ? '#167a5a' : count > 0 ? '#6eb39a' : '#e6ede8',
                    borderRadius: '6px 6px 2px 2px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: isPeak ? '#105941' : '#167a5a',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 14px rgba(22, 122, 90, 0.25)',
                    },
                  }}
                >
                  {isPeak && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: '#167a5a',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 800,
                        px: 0.75,
                        py: 0.2,
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      TOP
                    </Box>
                  )}
                </Box>
              </Tooltip>
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  fontSize: 10,
                  color: isPeak ? '#167a5a' : '#7a8a81',
                  fontWeight: isPeak ? 800 : 500,
                }}
              >
                {slot.hour}h
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          mt: 2,
        }}
      >
        <Typography variant="caption" sx={{ color: '#88988e' }}>
          * Operating service hours: 10:00 - 22:00
        </Typography>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#167a5a',
                flexShrink: 0,
              }}
            />
            <Typography
              component="span"
              sx={{
                fontSize: 11,
                color: '#55655b',
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              Peak dining hour
            </Typography>
          </Box>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#6eb39a',
                flexShrink: 0,
              }}
            />
            <Typography
              component="span"
              sx={{
                fontSize: 11,
                color: '#55655b',
                lineHeight: 1,
              }}
            >
              Standard hours
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
}
