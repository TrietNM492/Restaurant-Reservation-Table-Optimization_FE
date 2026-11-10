import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Checkbox, Chip, CircularProgress, FormControlLabel, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { AllocationMetrics, TableChips } from './AllocationResults';
import { tableAllocationApi } from '../../services/tableAllocationService';
import { allocationError, buildOptimizationRequest, formatAllocationTime, localDateTime } from '../../utils/tableAllocation';

const metricRows = [
  ['reservations', 'Reservations'], ['requiredSeats', 'Required seats'], ['assignedSeats', 'Assigned seats'],
  ['wastedSeats', 'Spare seats'], ['seatUtilizationPercent', 'Seat utilization'], ['idleGaps', 'Short idle gaps'], ['multiTableReservations', 'Multi-table reservations'],
];

export default function OptimizationPanel({ canApply }) {
  const [form, setForm] = useState(() => ({ windowStart: localDateTime(), windowEnd: localDateTime(new Date(Date.now() + 24 * 3600000)), lockWindowMinutes: 60, maxMoves: 10, includeConfirmed: true }));
  const [validation, setValidation] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const queryClient = useQueryClient();
  const preview = useMutation({
    mutationFn: async (request) => ({ request, result: await tableAllocationApi.preview(request) }),
    retry: false,
  });
  const apply = useMutation({
    mutationFn: (request) => tableAllocationApi.apply(request),
    retry: false,
    onSuccess: () => { preview.reset(); queryClient.invalidateQueries({ queryKey: ['table-allocation'] }); },
    // An unsuccessful response may have an uncertain write outcome. Require a fresh preview.
    onError: () => preview.reset(),
    onSettled: () => setConfirmation(false),
  });
  const result = apply.data ?? preview.data?.result;
  const busy = preview.isPending || apply.isPending;
  function update(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    preview.reset(); apply.reset(); setValidation('');
  }
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    setValidation(''); preview.reset(); apply.reset();
    try { preview.mutate(buildOptimizationRequest(form)); }
    catch (error) { setValidation(error.message); }
  }
  const closeConfirmation = () => { if (!apply.isPending) setConfirmation(false); };
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: '320px minmax(0,1fr)' }, alignItems: 'start', gap: 3 }}>
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}><TuneRoundedIcon color="primary" /><Typography component="h2" variant="h6">Optimization scope</Typography></Stack>
      <Box component="form" onSubmit={submit}>
        <Box component="fieldset" disabled={busy} sx={{ m: 0, p: 0, border: 0, minWidth: 0 }}>
          <Stack spacing={2.5}>
            <TextField label="Window start" name="windowStart" type="datetime-local" required value={form.windowStart} onChange={update} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Window end" name="windowEnd" type="datetime-local" required value={form.windowEnd} onChange={update} slotProps={{ inputLabel: { shrink: true } }} helperText="Local time. Maximum window: 72 hours." />
            <TextField label="Lock window (minutes)" name="lockWindowMinutes" type="number" required value={form.lockWindowMinutes} onChange={update} slotProps={{ htmlInput: { min: 0, max: 720, step: 1 } }} helperText="Do not move reservations starting this soon from now." />
            <TextField label="Maximum moves" name="maxMoves" type="number" required value={form.maxMoves} onChange={update} slotProps={{ htmlInput: { min: 1, max: 100, step: 1 } }} />
            <FormControlLabel control={<Checkbox name="includeConfirmed" checked={form.includeConfirmed} onChange={update} />} label="Include confirmed reservations" />
            <Alert severity="info">Preview does not modify reservations. Changing the scope clears the previous plan.</Alert>
            <Button type="submit" disabled={busy} startIcon={preview.isPending ? <CircularProgress size={16} color="inherit" /> : <TuneRoundedIcon />}>{preview.isPending ? 'Computing preview…' : 'Preview optimization'}</Button>
          </Stack>
        </Box>
      </Box>
    </Paper>
    <Stack spacing={3} sx={{ minWidth: 0 }} aria-busy={busy}>
      {(validation || preview.isError || apply.isError) && <Alert severity="error">{validation || allocationError(preview.error || apply.error)}</Alert>}
      {preview.isPending ? <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }} role="status"><CircularProgress /><Typography sx={{ mt: 2 }}>Finding a more efficient allocation…</Typography></Paper> : !result ? <EmptyState title="See the impact before making a change" description="Preview an optimization window to compare utilization and review proposed reservation moves." icon={<TuneRoundedIcon />} /> : <>
        <Stack direction="row" justifyContent="space-between" spacing={1}><Typography variant="h6" component="h2">Allocation performance</Typography><Chip label={result.applied ? 'Applied' : 'Preview only'} color={result.applied ? 'success' : 'primary'} variant="outlined" /></Stack>
        <Typography variant="body2" color="text.secondary">{formatAllocationTime(result.windowStart)} → {formatAllocationTime(result.windowEnd)}</Typography>
        <AllocationMetrics items={[{ label: 'Reservations in scope', value: result.reservationsInScope }, { label: 'Movable reservations', value: result.movableReservations }, { label: 'Proposed moves', value: result.movesCount }]} />
        {result.message && <Alert severity={result.applied ? 'success' : 'info'}>{result.message}</Alert>}
        <TableContainer component={Paper} variant="outlined"><Table size="small" aria-label="Optimization metrics before and after"><TableHead><TableRow><TableCell>Metric</TableCell><TableCell align="right">Before</TableCell><TableCell align="right">After</TableCell><TableCell align="right">Change</TableCell></TableRow></TableHead><TableBody>
          {metricRows.map(([key, label]) => {
            const before = result.before?.[key];
            const after = result.after?.[key];
            const percent = key === 'seatUtilizationPercent';
            const format = (value) => value == null ? '—' : percent ? `${value.toFixed(1)}%` : value;
            const delta = after != null && before != null ? after - before : null;
            return <TableRow key={key}><TableCell component="th" scope="row">{label}</TableCell><TableCell align="right">{format(before)}</TableCell><TableCell align="right"><strong>{format(after)}</strong></TableCell><TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{delta == null ? '—' : `${delta > 0 ? '+' : ''}${percent ? delta.toFixed(1) : delta}${percent ? ' pp' : ''}`}</TableCell></TableRow>;
          })}
        </TableBody></Table></TableContainer>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}><Typography variant="h6" component="h2">Reservation moves</Typography>{canApply && !result.applied && result.movesCount > 0 && preview.data && <Button disabled={busy} onClick={() => setConfirmation(true)}>Apply optimization</Button>}</Stack>
        {!canApply && <Alert severity="info">STAFF can preview. Only MANAGER and ADMIN accounts can apply an optimization.</Alert>}
        {result.moves?.length ? result.moves.map((move) => <Paper component="article" variant="outlined" key={move.reservationId} sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}><Typography variant="subtitle1" fontWeight={700}>{move.reservationNo || `#${move.reservationId}`}</Typography><Chip size="small" label={move.reservationStatus} /></Stack>
          <Typography variant="body2" color="text.secondary">{formatAllocationTime(move.startTime)} → {formatAllocationTime(move.endTime)}</Typography>
          <Typography variant="caption" color="text.secondary">{move.requiredSeats} required seats · {move.partySize} party-size bucket</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, my: 2 }}>
            <Box><Typography variant="overline">From · {move.wastedSeatsBefore} spare seats</Typography><TableChips tables={move.fromTables} /></Box>
            <Box><Typography variant="overline" color="primary">To · {move.wastedSeatsAfter} spare seats</Typography><TableChips tables={move.toTables} /></Box>
          </Box>
          <Typography variant="body2" color="text.secondary">{move.reason}</Typography>
        </Paper>) : <EmptyState title="No moves proposed" description="No reservation needs to move under the selected optimization rules." />}
      </>}
    </Stack>
    {confirmation && result && preview.data && <Modal open title="Apply allocation optimization?" onClose={closeConfirmation}>
      <Stack spacing={2} sx={{ pt: 1 }}><Typography>{result.movesCount} moves were proposed for {formatAllocationTime(result.windowStart)} → {formatAllocationTime(result.windowEnd)}.</Typography><Alert severity="warning">The server recalculates the plan using the latest data before saving. Actual moves may differ from this preview.</Alert><Stack direction="row" spacing={1} justifyContent="flex-end"><Button variant="secondary" disabled={apply.isPending} onClick={closeConfirmation}>Cancel</Button><Button disabled={apply.isPending} onClick={() => { if (!apply.isPending && preview.data && canApply) apply.mutate(preview.data.request); }}>{apply.isPending ? 'Applying…' : 'Confirm optimization'}</Button></Stack></Stack>
    </Modal>}
  </Box>;
}
