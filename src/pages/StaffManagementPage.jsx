import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AppPagination from '../components/ui/AppPagination';
import { roleManagementApi } from '../services/roleManagementService';
import { staffManagementApi } from '../services/staffManagementService';

const PAGE_SIZE = 10;
const DEPARTMENTS = ['RECEPTION', 'SERVICE', 'KITCHEN', 'MANAGER'];
const GENDERS = ['DEFAULT', 'MALE', 'FEMALE', 'OTHER'];
const EMPTY_FORM = {
  username: '',
  email: '',
  fullname: '',
  gender: 'DEFAULT',
  phone: '',
  role: '',
  department: 'MANAGER',
};

function getErrorMessage(error, fallback) {
  const message = error?.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    return message.map((item) => typeof item === 'string' ? item : item?.message || JSON.stringify(item)).join('; ');
  }
  if (message && typeof message === 'object') {
    return Object.entries(message).map(([field, detail]) => `${field}: ${detail}`).join('; ');
  }
  return error?.message || fallback;
}

function optionalValue(value) {
  return value?.trim() || undefined;
}

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const [notice, setNotice] = useState('');

  const params = { page: page - 1, size: PAGE_SIZE, sort: 'employeeCode,asc' };
  if (search) params.q = search;

  const staffQuery = useQuery({
    queryKey: ['admin', 'staff', params],
    queryFn: () => staffManagementApi.list(params),
  });
  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', 'options'],
    queryFn: () => roleManagementApi.list({ page: 0, size: 100, sort: 'name,asc' }),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const common = {
        email: optionalValue(form.email),
        fullname: form.fullname.trim(),
        gender: optionalValue(form.gender),
        phone: optionalValue(form.phone),
        role: form.role,
        department: optionalValue(form.department),
      };
      return editor.id
        ? staffManagementApi.update({ id: editor.id, ...common })
        : staffManagementApi.create({
          username: form.username.trim(),
          ...common,
        });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setEditor(null);
      setNotice('Staff member saved successfully.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: () => {
      const payload = { id: statusTarget.id, notifyUser };
      const reason = optionalValue(statusReason);
      if (reason) payload.reason = reason;
      return staffManagementApi.changeStatus(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setStatusTarget(null);
      setStatusReason('');
      setNotice('Staff status updated successfully.');
    },
  });

  const rows = staffQuery.data?.result ?? [];
  const meta = staffQuery.data?.meta ?? {};
  const roles = rolesQuery.data?.result ?? [];

  const openCreate = () => {
    saveMutation.reset();
    setEditorError('');
    setForm(EMPTY_FORM);
    setEditor({ id: null });
  };

  const openEdit = async (staff) => {
    saveMutation.reset();
    setEditorError('');
    setEditLoading(true);
    setEditor({ id: staff.id, username: staff.username });
    try {
      const detail = await staffManagementApi.getById(staff.id);
      setForm({
        username: detail.username ?? staff.username ?? '',
        email: detail.email ?? '',
        fullname: detail.fullname ?? '',
        gender: detail.gender ?? 'DEFAULT',
        phone: detail.phone ?? '',
        role: detail.role ?? staff.role ?? '',
        department: detail.department ?? 'MANAGER',
      });
    } catch (error) {
      setEditorError(getErrorMessage(error, 'Unable to load staff details.'));
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditor = () => {
    if (!saveMutation.isPending && !editLoading) setEditor(null);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (!form.fullname.trim() || !form.role) return;
    if (!editor.id && !form.username.trim()) return;
    saveMutation.mutate();
  };

  const openStatusDialog = (staff) => {
    statusMutation.reset();
    setStatusReason('');
    setNotifyUser(true);
    setStatusTarget(staff);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography variant="overline" color="primary">People</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Staff Management</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Manage staff accounts, roles, and contact details.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>Add staff</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Search staff"
              size="small"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              sx={{ flex: 1 }}
            />
            <Button type="submit" variant="outlined">Search</Button>
            <Button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>Reset</Button>
          </Stack>
        </Box>

        {staffQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(staffQuery.error, 'Unable to load staff.')}</Alert>}
        {rolesQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(rolesQuery.error, 'Unable to load roles.')}</Alert>}
        {saveMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(saveMutation.error, 'Unable to save staff member.')}</Alert>}
        {statusMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(statusMutation.error, 'Unable to update staff status.')}</Alert>}

        {staffQuery.isPending ? (
          <Typography sx={{ py: 5, textAlign: 'center' }}>Loading staff…</Typography>
        ) : !staffQuery.isError && (
          <>
            <TableContainer>
              <Table aria-label="Staff members">
                <TableHead>
                  <TableRow>
                    <TableCell>Staff member</TableCell>
                    <TableCell>Employee code</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length ? rows.map((staff) => (
                    <TableRow key={staff.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{staff.user.fullname || staff.username || '—'}</Typography>
                        <Typography variant="body2" color="text.secondary">{staff.email || staff.user.phone || '—'}</Typography>
                      </TableCell>
                      <TableCell>{staff.employeeCode || '—'}</TableCell>
                      <TableCell>{staff.role || '—'}</TableCell>
                      <TableCell>{staff.department || '—'}</TableCell>
                      <TableCell>{staff.joinDate || '—'}</TableCell>
                      <TableCell align="right">
                        <IconButton aria-label={`Edit ${staff.fullname || staff.username}`} onClick={() => openEdit(staff)}><EditRoundedIcon /></IconButton>
                        <IconButton aria-label={`Change status for ${staff.fullname || staff.username}`} color="warning" onClick={() => openStatusDialog(staff)}><PersonOffRoundedIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} align="center">No staff members found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <AppPagination
              page={page}
              pageCount={meta.pages ?? 0}
              total={meta.total ?? rows.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </>
        )}
      </Paper>

      <Dialog open={Boolean(editor)} onClose={closeEditor} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>{editor?.id ? 'Edit staff member' : 'Add staff member'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {editor?.id ? (
                <TextField label="Username" value={form.username} disabled fullWidth />
              ) : (
                <TextField
                  label="Username"
                  required
                  fullWidth
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                />
              )}
              <TextField
                label="Full name"
                required
                fullWidth
                value={form.fullname}
                onChange={(event) => setForm((current) => ({ ...current, fullname: event.target.value }))}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
              <TextField
                select
                label="Role"
                required
                fullWidth
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                disabled={rolesQuery.isPending || rolesQuery.isError}
              >
                {roles.map((role) => {
                  const value = role.code || role.name;
                  return <MenuItem key={role.id} value={value}>{role.name || value}</MenuItem>;
                })}
              </TextField>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="Gender"
                  required
                  fullWidth
                  value={form.gender}
                  onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                >
                  {GENDERS.map((gender) => (
                    <MenuItem key={gender} value={gender}>{gender}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Phone"
                  fullWidth
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </Stack>
              <TextField
                select
                label="Department"
                required
                fullWidth
                value={form.department}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
              >
                {DEPARTMENTS.map((department) => (
                  <MenuItem key={department} value={department}>{department}</MenuItem>
                ))}
              </TextField>
              {rolesQuery.isError && <Alert severity="error">{getErrorMessage(rolesQuery.error, 'Unable to load roles.')}</Alert>}
              {editorError && <Alert severity="error">{editorError}</Alert>}
              {saveMutation.isError && <Alert severity="error">{getErrorMessage(saveMutation.error, 'Unable to save staff member.')}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeEditor} disabled={editLoading || saveMutation.isPending}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={editLoading || saveMutation.isPending || rolesQuery.isPending || rolesQuery.isError}>
              {editLoading ? 'Loading…' : saveMutation.isPending ? 'Saving…' : 'Save staff'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(statusTarget)} onClose={() => !statusMutation.isPending && setStatusTarget(null)}>
        <DialogTitle>Change staff status?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>
              Apply the status change for {statusTarget?.fullname || statusTarget?.username || 'this staff member'}.
            </Typography>
            <TextField
              label="Reason (optional)"
              multiline
              minRows={2}
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
            />
            <FormControlLabel
              control={<Checkbox checked={notifyUser} onChange={(event) => setNotifyUser(event.target.checked)} />}
              label="Notify staff member"
            />
            {statusMutation.isError && <Alert severity="error">{getErrorMessage(statusMutation.error, 'Unable to update staff status.')}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusTarget(null)} disabled={statusMutation.isPending}>Cancel</Button>
          <Button variant="contained" color="warning" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate()}>
            {statusMutation.isPending ? 'Updating…' : 'Change status'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} message={notice} />
    </Box>
  );
}
