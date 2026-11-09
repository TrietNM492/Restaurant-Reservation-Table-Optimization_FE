import { Alert, Box, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import Button from '../ui/Button';
import { formatAllocationTime, tableNames } from '../../utils/tableAllocation';

export function AllocationMetrics({ items }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${items.length}, minmax(0, 1fr))` }, gap: 2, mb: 3 }}>
    {items.map(({ label, value, detail }) => <Paper key={label} variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h4" sx={{ my: 1 }}>{value ?? '—'}</Typography>
      {detail && <Typography variant="caption" color="text.secondary">{detail}</Typography>}
    </Paper>)}
  </Box>;
}

export function TableChips({ tables = [] }) {
  return <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
    {tables.map((table) => <Chip key={table.id} icon={<TableRestaurantRoundedIcon />} variant="outlined" label={`#${table.tableNumber ?? table.id} · ${table.capacity} seats`} />)}
  </Stack>;
}

export function ScoreBreakdown({ breakdown }) {
  if (!breakdown) return <Alert severity="info">A score breakdown is not available for this option.</Alert>;
  return <Stack spacing={1.5} sx={{ my: 2 }}>
    {[['Capacity fit', breakdown.capacityFit], ['Schedule packing', breakdown.schedulePacking], ['Preferred area match', breakdown.areaMatch]].map(([label, value]) => <Box key={label}>
      <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: .5 }}><Typography variant="caption">{label}</Typography><Typography variant="caption" color="text.secondary">{value == null ? 'Not requested' : `${Math.round(value * 100)}%`}</Typography></Stack>
      <LinearProgress aria-label={label} variant="determinate" value={value == null ? 0 : Math.max(0, Math.min(100, value * 100))} sx={{ height: 6, borderRadius: 3 }} />
    </Box>)}
  </Stack>;
}

export function RecommendationCard({ option, onSelect, showBreakdown = false, canBook = false }) {
  return <Paper component="article" variant="outlined" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
      <Box><Typography variant="overline" color="primary">Option #{option.rank}</Typography><Typography component="h3" variant="h6">{tableNames(option.tables)}</Typography><Typography variant="body2" color="text.secondary">{option.tables?.[0]?.areaName || option.tables?.[0]?.areaCode || 'Area unspecified'}</Typography></Box>
      <Box sx={{ bgcolor: 'primary.light', color: 'primary.main', borderRadius: 2, p: 1.5, alignSelf: 'flex-start', textAlign: 'center', flexShrink: 0 }}><Typography variant="h5">{Number(option.score).toFixed(1)}</Typography><Typography variant="caption">/ 100</Typography></Box>
    </Stack>
    <TableChips tables={option.tables} />
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
      <Chip size="small" label={option.type === 'TABLE_COMBINATION' ? 'Table combination' : 'Single table'} color="primary" variant="outlined" />
      <Chip size="small" label={`${option.totalCapacity} total seats`} /><Chip size="small" label={`${option.spareSeats} spare seats`} />
    </Stack>
    {showBreakdown && <ScoreBreakdown breakdown={option.scoreBreakdown} />}
    <Box component="ul" sx={{ pl: 2, my: 2, color: 'text.secondary', fontSize: 13, flex: 1 }}>{option.reasons?.map((reason, index) => <li key={index}>{reason}</li>)}</Box>
    <Button variant="secondary" fullWidth onClick={() => onSelect(option)}>{canBook ? 'Review & book' : 'View details'}</Button>
  </Paper>;
}

const alternativeLabels = { EARLIER_START: 'Earlier start', LATER_START: 'Later start', SHORTER_DURATION: 'Shorter stay', TABLE_COMBINATION: 'Combine tables', MORE_TABLES: 'Additional tables' };

export function AlternativeCard({ alternative, onSelect, canBook }) {
  return <Paper component="article" variant="outlined" sx={{ p: 2.5 }}>
    <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mb: 2 }}><Chip size="small" color="primary" variant="outlined" label={alternativeLabels[alternative.type] || alternative.type} /><Typography fontWeight={700}>{Number(alternative.score).toFixed(1)} / 100</Typography></Stack>
    <Typography variant="h6" component="h3">{tableNames(alternative.recommendation?.tables)}</Typography>
    <Typography variant="body2" sx={{ my: 1 }}>{formatAllocationTime(alternative.startTime)} → {formatAllocationTime(alternative.endTime)}</Typography>
    <TableChips tables={alternative.recommendation?.tables} />
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ my: 2 }}>
      <Chip size="small" label={`Shift: ${alternative.shiftMinutes > 0 ? '+' : ''}${alternative.shiftMinutes} min`} />
      <Chip size="small" label={`Stay: ${alternative.durationMinutes} min (${alternative.durationChangeMinutes > 0 ? '+' : ''}${alternative.durationChangeMinutes})`} />
      <Chip size="small" label={`Convenience: ${alternative.convenienceScore}/100`} />
    </Stack>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{alternative.explanation}</Typography>
    <Button variant="secondary" onClick={() => onSelect(alternative.recommendation, alternative)}>{canBook ? 'Review alternative & book' : 'View alternative details'}</Button>
  </Paper>;
}
