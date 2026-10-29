import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import Badge from '../ui/Badge';

export default function TableUsageTable({ tableUsageStats = [] }) {
  const [tableSearch, setTableSearch] = useState('');
  const [tableSort, setTableSort] = useState('utilization_desc');

  const filteredTableStats = useMemo(() => {
    let list = [...tableUsageStats];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(
        (t) =>
          String(t.tableNumber).includes(q) ||
          (t.areaName && t.areaName.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (tableSort === 'utilization_desc') {
        return (b.utilizationRatePercent || 0) - (a.utilizationRatePercent || 0);
      }
      if (tableSort === 'utilization_asc') {
        return (a.utilizationRatePercent || 0) - (b.utilizationRatePercent || 0);
      }
      if (tableSort === 'reservations_desc') {
        return (b.totalReservationsCount || 0) - (a.totalReservationsCount || 0);
      }
      if (tableSort === 'table_asc') {
        return (a.tableNumber || 0) - (b.tableNumber || 0);
      }
      return 0;
    });

    return list;
  }, [tableUsageStats, tableSearch, tableSort]);

  return (
    <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid #edf0ed', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      {/* Table Filters & Search */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2e22', fontSize: 16 }}>
            Detailed Table Performance Breakdown
          </Typography>
          <Typography variant="caption" sx={{ color: '#7a8a81' }}>
            Total: {filteredTableStats.length} matching tables
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Search by table number or area..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: '#88988e' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              minWidth: { xs: '100%', sm: 260 },
              '& .MuiOutlinedInput-root': {
                height: 40,
                borderRadius: '10px',
                fontSize: 12,
                bgcolor: '#fff',
              },
            }}
          />

          <Select
            size="small"
            value={tableSort}
            onChange={(e) => setTableSort(e.target.value)}
            sx={{
              height: 40,
              borderRadius: '10px',
              fontSize: 12,
              bgcolor: '#fff',
              minWidth: 180,
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                py: 0,
                fontSize: 12,
              },
            }}
          >
            <MenuItem value="utilization_desc">Occupancy: High → Low</MenuItem>
            <MenuItem value="utilization_asc">Occupancy: Low → High</MenuItem>
            <MenuItem value="reservations_desc">Bookings: Most → Least</MenuItem>
            <MenuItem value="table_asc">Table Number: Ascending</MenuItem>
          </Select>
        </Stack>
      </Stack>

      {/* Table View */}
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e1e7e2', backgroundColor: '#f8faf9' }}>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#68776f', textTransform: 'uppercase' }}>TABLE & AREA</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#68776f', textTransform: 'uppercase' }}>CAPACITY</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#68776f', textTransform: 'uppercase' }}>TOTAL BOOKINGS</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#68776f', textTransform: 'uppercase' }}>OCCUPIED HOURS</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#68776f', textTransform: 'uppercase' }}>UTILIZATION RATE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#68776f', textTransform: 'uppercase' }}>PERFORMANCE</th>
            </tr>
          </thead>
          <tbody>
            {filteredTableStats.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#88988e' }}>
                  No table performance data matching the selected filter.
                </td>
              </tr>
            ) : (
              filteredTableStats.map((row) => {
                const util = row.utilizationRatePercent || 0;
                const statusTone = util >= 70 ? 'success' : util >= 30 ? 'info' : 'warning';
                const statusLabel = util >= 70 ? 'High Utilization' : util >= 30 ? 'Moderate' : 'Low Occupancy';

                return (
                  <tr
                    key={row.tableId || row.tableNumber}
                    style={{
                      borderBottom: '1px solid #edf0ed',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fbfcfb')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Table & Area */}
                    <td style={{ padding: '14px 16px' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            bgcolor: '#f0f5f2',
                            color: '#167a5a',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <TableRestaurantRoundedIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                            Table {row.tableNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#7a8a81' }}>
                            {row.areaName || 'Main Dining Area'}
                          </Typography>
                        </Box>
                      </Stack>
                    </td>

                    {/* Capacity */}
                    <td style={{ padding: '14px 16px' }}>
                      <Typography variant="body2" sx={{ color: '#334138' }}>
                        {row.capacity} seats
                      </Typography>
                    </td>

                    {/* Total Bookings */}
                    <td style={{ padding: '14px 16px' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#167a5a' }}>
                        {row.totalReservationsCount || 0} bookings
                      </Typography>
                    </td>

                    {/* Occupied Hours */}
                    <td style={{ padding: '14px 16px' }}>
                      <Typography variant="body2" sx={{ color: '#55655b' }}>
                        {row.totalOccupiedHours != null ? `${row.totalOccupiedHours.toFixed(1)}h` : '0h'}
                      </Typography>
                    </td>

                    {/* Utilization Rate + progress */}
                    <td style={{ padding: '14px 16px', minWidth: 160 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2e22', width: 48 }}>
                          {util.toFixed(1)}%
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(util, 100)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#e9ede9',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: util >= 70 ? '#167a5a' : util >= 30 ? '#0284c7' : '#f59e0b',
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </td>

                    {/* Performance Badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <Badge tone={statusTone}>{statusLabel}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Box>
      </Box>
    </Card>
  );
}
