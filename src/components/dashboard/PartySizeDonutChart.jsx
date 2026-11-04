import React, { useMemo } from 'react';
import { Box, Card, Grid, Stack, Typography } from '@mui/material';
import Badge from '../ui/Badge';

const PARTY_COLORS = ['#167a5a', '#0d9488', '#0284c7', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function PartySizeDonutChart({ partySizeDistribution = [], averagePartySize = 0 }) {
  const partySlices = useMemo(() => {
    if (!partySizeDistribution.length) return [];
    let currentDeg = 0;
    return partySizeDistribution.map((item, index) => {
      const pct = item.percentage || 0;
      const deg = (pct / 100) * 360;
      const startDeg = currentDeg;
      currentDeg += deg;
      return {
        ...item,
        color: PARTY_COLORS[index % PARTY_COLORS.length],
        startDeg,
        deg,
      };
    });
  }, [partySizeDistribution]);

  return (
    <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid #edf0ed', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2e22', fontSize: 16 }}>
            Party Size Distribution
          </Typography>
          <Typography variant="caption" sx={{ color: '#7a8a81' }}>
            Distribution of party types (Single, Couple, Group, Large)
          </Typography>
        </Box>
        <Badge tone="neutral">Party Size</Badge>
      </Stack>

      <Grid container spacing={2} alignItems="center" sx={{ minHeight: 220 }}>
        {/* SVG Conic Gradient Representation */}
        <Grid item xs={12} sm={5} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              background:
                partySlices.length > 0
                  ? `conic-gradient(${partySlices
                      .map((s) => `${s.color} ${s.startDeg}deg ${s.startDeg + s.deg}deg`)
                      .join(', ')})`
                  : '#e6ede8',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            }}
          >
            <Box
              sx={{
                width: 86,
                height: 86,
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
                AVG SIZE
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, color: '#167a5a', lineHeight: 1 }}>
                {averagePartySize.toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9aa8a0', fontSize: 9 }}>
                guests/table
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Legend list */}
        <Grid item xs={12} sm={7}>
          <Stack spacing={1}>
            {partySlices.map((p) => (
              <Box
                key={p.partySize}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 0.8,
                  borderRadius: '8px',
                  bgcolor: '#f9fbf9',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: p.color }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#27382f' }}>
                    {p.label || p.partySize}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" sx={{ color: '#7a8a81' }}>
                    {p.reservationCount || 0} bookings
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#167a5a', width: 44, textAlign: 'right' }}>
                    {(p.percentage || 0).toFixed(1)}%
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Card>
  );
}
