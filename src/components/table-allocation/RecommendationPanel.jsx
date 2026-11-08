import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Alert, Box, Checkbox, CircularProgress, FormControlLabel, Paper, Stack, TextField, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { AllocationMetrics, AlternativeCard, RecommendationCard } from './AllocationResults';
import AllocationBookingDialog from './AllocationBookingDialog';
import { tableAllocationApi } from '../../services/tableAllocationService';
import { multiTableCombinationApi } from '../../services/multiTableCombinationService';
import { allocationError, buildRecommendationRequest, formatAllocationTime, localDateTime } from '../../utils/tableAllocation';
import { ROUTES } from '../../routes/routeConstants';

const numericProps = (min, max) => ({ htmlInput: { min, max, step: 1 } });

export default function RecommendationPanel({ mode, combination, canBook }) {
  const alternatives = mode === 'alternatives';
  const scoring = mode === 'scoring';
  const [form, setForm] = useState(() => ({ guestCount: combination ? 10 : 4, startTime: localDateTime(new Date(Date.now() + 3600000)), durationMinutes: 90, preferredAreaId: '', maxResults: 5, allowCombination: true, alternativeMode: 'AUTO', maxAlternatives: 5, maxShiftMinutes: 120 }));
  const [validation, setValidation] = useState('');
  const [selection, setSelection] = useState(null);
  const [notice, setNotice] = useState('');
  const areas = useQuery({ queryKey: ['table-allocation', 'areas'], queryFn: ({ signal }) => tableAllocationApi.areas(signal) });
  const search = useMutation({
    mutationFn: (request) => combination ? multiTableCombinationApi.recommend(request) : alternatives ? tableAllocationApi.alternatives(request) : tableAllocationApi.recommend(request),
    retry: false,
  });
  const result = search.data;
  const options = (result?.recommendations ?? []).filter((option) => !combination || option.type === 'TABLE_COMBINATION');
  const alternativeOptions = result?.alternatives ?? [];
  function update(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    search.reset(); setValidation(''); setNotice('');
  }
  function submit(event) {
    event.preventDefault();
    if (search.isPending) return;
    setValidation(''); setNotice(''); search.reset();
    try { search.mutate(buildRecommendationRequest(form, { combination, alternatives })); }
    catch (error) { setValidation(error.message); }
  }
  function select(option, slot = result) {
    setSelection({ option, startTime: slot.startTime, endTime: slot.endTime, partySize: result.suggestedPartySize, guestCount: result.guestCount });
  }
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: '320px minmax(0,1fr)' }, alignItems: 'start', gap: 3 }}>
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}><AutoAwesomeRoundedIcon color="primary" /><Typography variant="h6" component="h2">Dining preferences</Typography></Stack>
      <Box component="form" onSubmit={submit}>
        <Box component="fieldset" disabled={search.isPending} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
          <Stack spacing={2.5}>
            <TextField label="Guest count" name="guestCount" type="number" required value={form.guestCount} onChange={update} slotProps={numericProps(1, 100)} />
            <TextField label="Start time" name="startTime" type="datetime-local" value={form.startTime} onChange={update} slotProps={{ inputLabel: { shrink: true } }} helperText="Local time. Leave empty for a walk-in search." />
            <TextField label="Duration (minutes)" name="durationMinutes" type="number" required value={form.durationMinutes} onChange={update} slotProps={numericProps(30, 360)} />
            <TextField label="Preferred area" name="preferredAreaId" select value={form.preferredAreaId} onChange={update} slotProps={{ select: { native: true }, inputLabel: { shrink: true } }} helperText="A soft preference; other areas may also be suggested.">
              <option value="">Any area</option>{(areas.data ?? []).map((area) => <option key={area.areaId} value={area.areaId}>{area.areaName} · {area.areaCode}</option>)}
            </TextField>
            {areas.isError && <Alert severity="warning" action={<Button variant="ghost" size="small" onClick={() => areas.refetch()}>Retry</Button>}>Could not load areas. You can search without an area preference.</Alert>}
            {!combination && <><TextField label="Result limit" name="maxResults" type="number" required value={form.maxResults} onChange={update} slotProps={numericProps(1, 10)} /><FormControlLabel control={<Checkbox name="allowCombination" checked={form.allowCombination} onChange={update} />} label="Allow table combinations" /></>}
            {combination && <Alert severity="info">Combinations use tables in the same area. Single tables are prioritized; combinations fill remaining places in up to 10 results.</Alert>}
            <Box component="details" open={alternatives} sx={{ fontSize: 13 }}>
              <Box component="summary" sx={{ cursor: 'pointer', color: 'primary.main', mb: 2 }}>Alternative preferences</Box>
              <Stack spacing={2}>
                {!alternatives && <TextField label="Find alternatives" name="alternativeMode" select value={form.alternativeMode} onChange={update} slotProps={{ select: { native: true } }}><option value="AUTO">When no option fits</option><option value="ALWAYS">Always</option><option value="NEVER">Never</option></TextField>}
                <TextField label="Alternative limit" name="maxAlternatives" type="number" required value={form.maxAlternatives} onChange={update} slotProps={numericProps(1, 10)} />
                <TextField label="Maximum time shift (minutes)" name="maxShiftMinutes" type="number" required value={form.maxShiftMinutes} onChange={update} slotProps={numericProps(15, 180)} />
              </Stack>
            </Box>
            <Button type="submit" disabled={search.isPending} startIcon={search.isPending ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}>
              {search.isPending ? 'Searching…' : alternatives ? 'Find alternatives' : combination ? 'Find combinations' : 'Recommend tables'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Paper>
    <Stack spacing={3} sx={{ minWidth: 0 }} aria-busy={search.isPending}>
      {notice && <Alert severity="success" action={<Button component={Link} to={ROUTES.RESERVATIONS_ME} variant="ghost" size="small">My reservations</Button>}>{notice}</Alert>}
      {(validation || search.isError) && <Alert severity="error">{validation || allocationError(search.error)}</Alert>}
      {search.isPending ? <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }} role="status"><CircularProgress /><Typography sx={{ mt: 2 }}>Checking availability and ranking options…</Typography></Paper> : !result ? <EmptyState title="Make room for a great experience" description="Enter dining preferences and search to see recommendations from the restaurant." icon={<AutoAwesomeRoundedIcon />} /> : <>
        <AllocationMetrics items={[{ label: 'Guests', value: result.guestCount }, { label: 'Tables free for this slot', value: result.availableTableCount }, { label: 'Duration', value: `${result.durationMinutes} min` }]} />
        <Box><Typography component="h2" variant="h6">{alternatives ? 'Flexible alternatives' : scoring ? 'Combination scores' : 'Recommended allocations'}</Typography><Typography variant="body2" color="text.secondary">{formatAllocationTime(result.startTime)} → {formatAllocationTime(result.endTime)}</Typography></Box>
        {result.message && <Alert severity="info">{result.message}</Alert>}
        {scoring && <Alert severity="info">Server scoring uses capacity fit (70%) and schedule packing (30%). With a preferred area, weights are 55%, 25% and 20%. Capacity fit already includes a 12% reduction for each extra table. Displayed components are rounded.</Alert>}
        {!alternatives && (options.length ? <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>{options.map((option) => <RecommendationCard key={option.tableIds.join('-')} option={option} onSelect={select} canBook={canBook} showBreakdown={scoring} />)}</Box> : <EmptyState title={combination ? 'No combinations in these results' : 'No allocation fits this slot'} description={combination ? 'Single tables may already seat your party, or no suitable combination is available. Try a different guest count or time.' : 'Change the dining preferences or explore alternative options.'} />)}
        {(alternatives || alternativeOptions.length > 0) && <Stack spacing={2}><Typography variant="h6" component="h2">Alternatives ({alternativeOptions.length})</Typography>{alternativeOptions.length ? alternativeOptions.map((alternative) => <AlternativeCard key={`${alternative.type}-${alternative.startTime}-${alternative.durationMinutes}-${alternative.recommendation.tableIds.join('-')}`} alternative={alternative} onSelect={select} canBook={canBook} />) : <EmptyState title="No alternatives found" description="Try a larger time shift or a different requested slot." />}</Stack>}
      </>}
    </Stack>
    {selection && <AllocationBookingDialog selection={selection} canBook={canBook} onClose={() => setSelection(null)} onBooked={(reservation) => { setSelection(null); search.reset(); setNotice(`Reservation ${reservation.reservationNo || ''} created successfully. Search again for updated availability.`); }} />}
  </Box>;
}
