import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
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

const PAGE_SIZE = 10;
const EMPTY_FORM = { name: '', description: '', permissionIds: [] };

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

export default function RoleManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notice, setNotice] = useState('');

  const params = { page: page - 1, size: PAGE_SIZE, sort: 'name,asc' };
  if (search) params.q = search;

  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', params],
    queryFn: () => roleManagementApi.list(params),
  });
  const permissionsQuery = useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: roleManagementApi.listAllPermissions,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        permissionIds: form.permissionIds,
      };
      return editor.id
        ? roleManagementApi.update(editor.id, payload)
        : roleManagementApi.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setEditor(null);
      setNotice('Role saved successfully.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => roleManagementApi.remove(deleteTarget.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setDeleteTarget(null);
      setNotice('Role deleted successfully.');
    },
  });

  const rows = rolesQuery.data?.result ?? [];
  const meta = rolesQuery.data?.meta ?? {};
  const permissions = permissionsQuery.data ?? [];
  const filteredPermissions = permissions.filter((permission) => {
    const text = `${permission.name ?? ''} ${permission.method ?? permission.permissionMethod ?? ''}`;
    return text.toLowerCase().includes(permissionSearch.toLowerCase());
  });

  const openCreate = () => {
    saveMutation.reset();
    setForm(EMPTY_FORM);
    setPermissionSearch('');
    setEditor({ id: null });
  };

  const openEdit = (role) => {
    saveMutation.reset();
    setForm({
      name: role.name ?? '',
      description: role.description ?? '',
      permissionIds: (role.permissions ?? []).map((permission) => permission.id).filter(Number.isFinite),
    });
    setPermissionSearch('');
    setEditor({ id: role.id, name: role.name });
  };

  const closeEditor = () => {
    if (!saveMutation.isPending) setEditor(null);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const togglePermission = (permissionId) => {
    setForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(form.name.trim())) return;
    if (form.description.trim().length > 255) return;
    saveMutation.mutate();
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography variant="overline" color="primary">Access control</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Role Management</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Create roles and assign permissions.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>Add role</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Search roles"
              size="small"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              sx={{ flex: 1 }}
            />
            <Button type="submit" variant="outlined">Search</Button>
            <Button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>Reset</Button>
          </Stack>
        </Box>

        {rolesQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(rolesQuery.error, 'Unable to load roles.')}</Alert>}
        {permissionsQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(permissionsQuery.error, 'Unable to load permissions.')}</Alert>}
        {saveMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(saveMutation.error, 'Unable to save role.')}</Alert>}
        {deleteMutation.isError && <Alert severity="error" sx={{ mb: 2 }}>{getErrorMessage(deleteMutation.error, 'Unable to delete role.')}</Alert>}

        {rolesQuery.isPending ? (
          <Typography sx={{ py: 5, textAlign: 'center' }}>Loading roles…</Typography>
        ) : !rolesQuery.isError && (
          <>
            <TableContainer>
              <Table aria-label="Roles">
                <TableHead>
                  <TableRow>
                    <TableCell>Role</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length ? rows.map((role) => (
                    <TableRow key={role.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{role.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{role.code || `ID: ${role.id}`}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320, whiteSpace: 'normal' }}>{role.description || '—'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                          {(role.permissions ?? []).slice(0, 4).map((permission) => (
                            <Chip key={permission.id ?? permission.name} size="small" variant="outlined" label={permission.name || permission.method} />
                          ))}
                          {(role.permissions?.length ?? 0) > 4 && <Chip size="small" label={`+${role.permissions.length - 4}`} />}
                          {!role.permissions?.length && <Typography variant="body2" color="text.secondary">No permissions</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton aria-label={`Edit ${role.name}`} onClick={() => openEdit(role)}><EditRoundedIcon /></IconButton>
                        <IconButton aria-label={`Delete ${role.name}`} color="error" onClick={() => { deleteMutation.reset(); setDeleteTarget(role); }}><DeleteOutlineRoundedIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} align="center">No roles found.</TableCell></TableRow>
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

      <Dialog open={Boolean(editor)} onClose={closeEditor} fullWidth maxWidth="md">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>{editor?.id ? `Edit ${editor.name || 'role'}` : 'Create role'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <TextField
                label="Role name"
                required
                fullWidth
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                inputProps={{ maxLength: 50, pattern: '[A-Za-z0-9_-]+' }}
                helperText="Use up to 50 letters, numbers, underscores, or hyphens."
                error={Boolean(form.name) && !/^[A-Za-z0-9_-]{1,50}$/.test(form.name.trim())}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                inputProps={{ maxLength: 255 }}
              />
              <Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={700}>Permissions ({form.permissionIds.length} selected)</Typography>
                  <TextField label="Filter permissions" size="small" value={permissionSearch} onChange={(event) => setPermissionSearch(event.target.value)} />
                </Stack>
                {permissionsQuery.isPending ? (
                  <Typography color="text.secondary">Loading permissions…</Typography>
                ) : (
                  <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 300, overflow: 'auto' }}>
                    {filteredPermissions.length ? filteredPermissions.map((permission) => (
                      <FormControlLabel
                        key={permission.id}
                        sx={{ display: 'flex', mx: 0, py: 0.25 }}
                        control={
                          <Checkbox
                            checked={form.permissionIds.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            disabled={!Number.isFinite(permission.id)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{permission.name || 'Unnamed permission'}</Typography>
                            <Typography variant="caption" color="text.secondary">{permission.method || permission.permissionMethod || ''}</Typography>
                          </Box>
                        }
                      />
                    )) : <Typography color="text.secondary">No permissions found.</Typography>}
                  </Paper>
                )}
              </Box>
              {saveMutation.isError && <Alert severity="error">{getErrorMessage(saveMutation.error, 'Unable to save role.')}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeEditor} disabled={saveMutation.isPending}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending || permissionsQuery.isPending || permissionsQuery.isError}>
              {saveMutation.isPending ? 'Saving…' : 'Save role'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}>
        <DialogTitle>Delete role?</DialogTitle>
        <DialogContent>
          <Typography>Delete “{deleteTarget?.name}”? This action cannot be undone.</Typography>
          {deleteMutation.isError && <Alert severity="error" sx={{ mt: 2 }}>{getErrorMessage(deleteMutation.error, 'Unable to delete role.')}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancel</Button>
          <Button color="error" variant="contained" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} message={notice} />
    </Box>
  );
}
