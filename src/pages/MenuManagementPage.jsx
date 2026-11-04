import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuEditor from '../components/menu/MenuEditor';
import { MenuEmpty, MenuError, MenuImage, MenuLoading, MenuPagination } from '../components/menu/MenuStates';
import { categoryApi, itemApi } from '../services/menuManagementService';
import { formatMenuPrice, MENU_STATUSES, menuError } from '../utils/menuUtils';
import { ROUTES } from '../routes/routeConstants';

export default function MenuManagementPage({ kind }) {
  const isCategory = kind === 'category';
  const [filters, setFilters] = useState({ q: '', categoryId: '', status: '', sort: 'id,desc' });
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [action, setAction] = useState(null);
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient();
  const params = { ...filters, page: page - 1, size: 10 };
  if (!params.categoryId) delete params.categoryId;
  if (!params.status) delete params.status;
  const list = useQuery({ queryKey: ['menu', 'admin', kind, 'list', params], queryFn: ({ signal }) => (isCategory ? categoryApi : itemApi).list(params, signal) });
  const categories = useQuery({ queryKey: ['menu', 'admin', 'category-options'], queryFn: ({ signal }) => categoryApi.options(signal), enabled: !isCategory });
  const mutation = useMutation({
    mutationFn: ({ row, type, status }) => type === 'delete' ? categoryApi.remove(row.id) : type === 'archive' ? itemApi.archive(row.id) : itemApi.status(row.id, status),
    onSuccess: async () => {
      if (list.data?.result.length === 1 && page > 1) setPage(page - 1);
      await queryClient.invalidateQueries({ queryKey: ['menu'] });
      setAction(null);
      setNotice('Menu updated successfully.');
    },
  });
  const updateFilters = (next) => { setFilters(next); setPage(1); };
  const openAction = (next) => { mutation.reset(); setAction(next); };
  return <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
      <Box><Typography variant="overline" color="primary">Menu management</Typography><Typography variant="h4">{isCategory ? 'Menu categories' : 'Menu items'}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{isCategory ? 'Build a menu that is easy to explore.' : 'Manage your dishes, prices and availability in one place.'}</Typography></Box>
      <Stack direction="row" spacing={1}><Button component={Link} to={ROUTES.MENUS} variant="outlined">View public menu</Button><Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditor({ id: null })}>Add {isCategory ? 'category' : 'item'}</Button></Stack>
    </Stack>
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Box component="form" onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); updateFilters({ ...filters, q: String(values.get('q')).trim() }); }} sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField name="q" label={isCategory ? 'Search name or code' : 'Search item name'} defaultValue={filters.q} key={filters.q} size="small" sx={{ flex: 1, minWidth: 180 }} />
          {!isCategory && <>
            <TextField select label="Category" size="small" value={filters.categoryId} onChange={(event) => updateFilters({ ...filters, categoryId: event.target.value })} sx={{ minWidth: 170 }}><MenuItem value="">All categories</MenuItem>{(categories.data ?? []).map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}</TextField>
            <TextField select label="Status" size="small" value={filters.status} onChange={(event) => updateFilters({ ...filters, status: event.target.value })} sx={{ minWidth: 160 }}><MenuItem value="">All statuses</MenuItem>{Object.entries(MENU_STATUSES).map(([value, status]) => <MenuItem key={value} value={value}>{status.label}</MenuItem>)}</TextField>
          </>}
          <TextField select label="Sort" size="small" value={filters.sort} onChange={(event) => updateFilters({ ...filters, sort: event.target.value })} sx={{ minWidth: 150 }}>
            <MenuItem value="id,desc">Newest first</MenuItem><MenuItem value={isCategory ? 'name,asc' : 'itemName,asc'}>Name A–Z</MenuItem>{!isCategory && [<MenuItem key="asc" value="price,asc">Price: low to high</MenuItem>, <MenuItem key="desc" value="price,desc">Price: high to low</MenuItem>]}
          </TextField>
          <Button type="submit" variant="outlined">Search</Button>
          <Button onClick={() => updateFilters({ q: '', categoryId: '', status: '', sort: 'id,desc' })}>Reset</Button>
        </Stack>
      </Box>
      {!isCategory && categories.isError && <MenuError error={categories.error} retry={categories.refetch} />}
      {list.isPending ? <MenuLoading /> : list.isError ? <MenuError error={list.error} retry={list.refetch} /> : <>
        {!list.data.result.length ? <MenuEmpty title={isCategory ? 'No categories found' : 'No menu items found'} description="Add a new record or adjust your filters." /> : <TableContainer><Table aria-label={isCategory ? 'Menu categories' : 'Menu items'} sx={{ minWidth: 740 }}>
          <TableHead><TableRow><TableCell>{isCategory ? 'Category' : 'Item'}</TableCell><TableCell>{isCategory ? 'Code' : 'Category'}</TableCell><TableCell>{isCategory ? 'Items' : 'Price'}</TableCell>{!isCategory && <TableCell>Status</TableCell>}<TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>{list.data.result.map((row) => <TableRow key={row.id} hover>
            <TableCell><Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}><Box sx={{ width: 58, flexShrink: 0, borderRadius: 2, overflow: 'hidden' }}><MenuImage src={isCategory ? row.menuPicture : row.itemPicture} alt="" height={58} /></Box><Box><Typography fontWeight={700}>{isCategory ? row.name : row.itemName}</Typography><Typography variant="body2" color="text.secondary" sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description || 'No description'}</Typography></Box></Stack></TableCell>
            <TableCell>{isCategory ? <Chip size="small" label={row.code} variant="outlined" /> : row.categoryName}</TableCell>
            <TableCell>{isCategory ? row.itemCount : formatMenuPrice(row.price)}</TableCell>
            {!isCategory && <TableCell><Chip size="small" label={MENU_STATUSES[row.status]?.label || row.status} color={MENU_STATUSES[row.status]?.color || 'default'} /></TableCell>}
            <TableCell align="right"><Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button size="small" onClick={() => setEditor({ id: row.id })} aria-label={`Edit ${row.name || row.itemName}`}>Edit</Button>
              {isCategory ? <Button size="small" color="error" disabled={row.itemCount > 0} title={row.itemCount > 0 ? 'Move all items, including archived items, before deleting this category.' : 'Delete empty category'} onClick={() => openAction({ row, type: 'delete' })}>Delete</Button> : <>
                <Button size="small" onClick={() => openAction({ row, type: 'status', status: row.status === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE' })}>{row.status === 'AVAILABLE' ? 'Mark sold out' : row.status === 'ARCHIVED' ? 'Restore' : 'Make available'}</Button>
                {row.status !== 'ARCHIVED' && <Button size="small" color="error" onClick={() => openAction({ row, type: 'archive' })}>Archive</Button>}
              </>}
            </Stack></TableCell>
          </TableRow>)}</TableBody>
        </Table></TableContainer>}
        <MenuPagination meta={list.data.meta} page={page} onChange={setPage} />
        {isCategory && <Typography variant="caption" color="text.secondary">Item counts include archived dishes. Categories can only be deleted when empty.</Typography>}
      </>}
    </Paper>
    {editor && <MenuEditor kind={kind} id={editor.id} onClose={() => setEditor(null)} onSaved={setNotice} />}
    <Dialog open={Boolean(action)} onClose={() => { if (!mutation.isPending) setAction(null); }} aria-labelledby="menu-action-title">
      <DialogTitle id="menu-action-title">{action?.type === 'delete' ? 'Delete category?' : action?.type === 'archive' ? 'Archive menu item?' : 'Change availability?'}</DialogTitle>
      <DialogContent><DialogContentText>{action?.type === 'delete' ? `Permanently delete “${action.row.name}”?` : action?.type === 'archive' ? `“${action.row.itemName}” will be hidden from the public menu. You can restore it later. Existing orders are kept.` : `Set “${action?.row.itemName}” to ${MENU_STATUSES[action?.status]?.label.toLowerCase()}?`}</DialogContentText>{mutation.isError && <Alert severity="error" sx={{ mt: 2 }}>{menuError(mutation.error)}</Alert>}</DialogContent>
      <DialogActions><Button disabled={mutation.isPending} onClick={() => setAction(null)}>Cancel</Button><Button variant="contained" color={action?.type === 'status' ? 'primary' : 'error'} disabled={mutation.isPending} onClick={() => mutation.mutate(action)}>{mutation.isPending ? 'Updating…' : 'Confirm'}</Button></DialogActions>
    </Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </Box>;
}
