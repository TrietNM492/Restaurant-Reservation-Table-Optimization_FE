import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Stack, TextField, Typography } from '@mui/material';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ScoreBreakdown, TableChips } from './AllocationResults';
import { reservationApi } from '../../services/reservationService';
import { allocationError, buildAllocationBooking, formatAllocationTime } from '../../utils/tableAllocation';

export default function AllocationBookingDialog({ selection, canBook, onClose, onBooked }) {
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();
  const booking = useMutation({
    mutationFn: () => reservationApi.create(buildAllocationBooking(selection, note)),
    retry: false,
    onSuccess: (reservation) => {
      queryClient.invalidateQueries({ queryKey: ['table-allocation'] });
      onBooked(reservation);
    },
  });
  const close = () => { if (!booking.isPending) onClose(); };
  return <Modal open title={canBook ? 'Review your table allocation' : 'Allocation details'} onClose={close}>
    <Stack spacing={2} sx={{ pt: 1 }}>
      <TableChips tables={selection.option.tables} />
      <Typography variant="body2"><strong>Start:</strong> {formatAllocationTime(selection.startTime)}<br /><strong>End:</strong> {formatAllocationTime(selection.endTime)}<br /><strong>Guests:</strong> {selection.guestCount} · <strong>Capacity:</strong> {selection.option.totalCapacity} seats<br /><strong>Recommendation score:</strong> {selection.option.score}/100</Typography>
      <ScoreBreakdown breakdown={selection.option.scoreBreakdown} />
      {canBook ? <Stack component="form" spacing={2} onSubmit={(event) => { event.preventDefault(); if (!booking.isPending) booking.mutate(); }}>
        <TextField name="note" label="Booking note" multiline minRows={2} value={note} onChange={(event) => setNote(event.target.value)} disabled={booking.isPending} slotProps={{ htmlInput: { maxLength: 500 } }} helperText={`${note.length}/500 characters`} />
        <Alert severity="info">Tables are held only after the server confirms your booking. Availability can change before confirmation.</Alert>
        {booking.isError && <Alert severity="error">{allocationError(booking.error)}</Alert>}
        <Stack direction="row" spacing={1} justifyContent="flex-end"><Button variant="secondary" disabled={booking.isPending} onClick={close}>Cancel</Button><Button type="submit" disabled={booking.isPending}>{booking.isPending ? 'Booking…' : 'Confirm booking'}</Button></Stack>
      </Stack> : <><Alert severity="info">Only CUSTOMER accounts can create reservations through the current booking API. Staff can review these allocations.</Alert><Button onClick={close}>Close details</Button></>}
    </Stack>
  </Modal>;
}
