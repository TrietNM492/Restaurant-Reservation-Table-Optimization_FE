import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { categoryApi, itemApi } from '../../services/menuManagementService';
import { applyMenuFieldErrors, categoryBody, itemBody, MENU_STATUSES, menuError } from '../../utils/menuUtils';
import { MenuError, MenuLoading } from './MenuStates';

const requiredText = (label, max) => ({
  required: `${label} is required.`,
  validate: (value) => Boolean(value.trim()) || `${label} is required.`,
  maxLength: { value: max, message: `Use at most ${max} characters.` },
});
const optionalLength = (max) => ({ maxLength: { value: max, message: `Use at most ${max} characters.` } });

function EditorForm({ kind, record, categories, onClose, onSaved }) {
  const isCategory = kind === 'category';
  const queryClient = useQueryClient();
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    defaultValues: isCategory ? {
      code: record?.code ?? '', name: record?.name ?? '', description: record?.description ?? '',
      menuQr: record?.menuQr ?? '', menuPicture: record?.menuPicture ?? '',
    } : {
      categoryId: record?.categoryId ?? '', itemName: record?.itemName ?? '',
      description: record?.description ?? '', price: record?.price ?? '',
      itemPicture: record?.itemPicture ?? '', estimatedPrepMinutes: record?.estimatedPrepMinutes ?? '',
      originId: record?.originId ?? '', status: record?.status ?? 'AVAILABLE',
    },
  });
  const mutation = useMutation({
    mutationFn: (values) => {
      const api = isCategory ? categoryApi : itemApi;
      const body = isCategory ? categoryBody(values) : itemBody(values);
      return record ? api.update(record.id, body) : api.create(body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menu'] });
      onSaved(`${isCategory ? 'Category' : 'Menu item'} ${record ? 'updated' : 'created'} successfully.`);
      onClose();
    },
    onError: (error) => applyMenuFieldErrors(error, setError),
  });
  const field = (name, label, rules = {}, props = {}) => (
    <TextField key={name} label={label} fullWidth {...register(name, rules)} error={Boolean(errors[name])} helperText={errors[name]?.message || props.helperText} {...Object.fromEntries(Object.entries(props).filter(([key]) => key !== 'helperText'))} />
  );
  return <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
    <DialogContent dividers>
      <Stack spacing={2.5}>
        {mutation.isError && <Alert severity="error">{menuError(mutation.error)}</Alert>}
        {isCategory ? <>
          {field('code', 'Category code', { ...requiredText('Code', 50), pattern: { value: /^[A-Za-z0-9_-]+$/, message: 'Use letters, numbers, underscores or hyphens.' }, setValueAs: (value) => value.trim() }, { helperText: 'For example MAIN or DRINKS. Saved in uppercase.' })}
          {field('name', 'Category name', requiredText('Name', 100))}
          {field('description', 'Description', optionalLength(500), { multiline: true, minRows: 3 })}
          {field('menuPicture', 'Category image URL', optionalLength(255), { helperText: 'Paste an image URL. File upload is not available yet.' })}
          {field('menuQr', 'Menu QR reference', optionalLength(255))}
        </> : <>
          {field('categoryId', 'Category', { required: 'Choose a category.' }, { select: true, defaultValue: record?.categoryId ?? '', children: [<MenuItem key="empty" value="" disabled>Choose a category</MenuItem>, ...categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)] })}
          {!categories.length && <Alert severity="info">Create a category before adding a menu item.</Alert>}
          {field('itemName', 'Item name', requiredText('Item name', 150))}
          {field('description', 'Description', optionalLength(500), { multiline: true, minRows: 3 })}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {field('price', 'Price (VND)', { required: 'Price is required.', validate: (value) => (String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0) || 'Enter a price of zero or more.' }, { type: 'number', slotProps: { htmlInput: { min: 0, step: 'any' } } })}
            {field('estimatedPrepMinutes', 'Preparation time (minutes)', { validate: (value) => value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 2147483647) || 'Enter a nonnegative whole number up to 2147483647.' }, { type: 'number', slotProps: { htmlInput: { min: 0, step: 1 } } })}
          </Stack>
          {field('status', 'Status', { required: true }, { select: true, defaultValue: record?.status ?? 'AVAILABLE', children: Object.entries(MENU_STATUSES).map(([value, status]) => <MenuItem key={value} value={value}>{status.label}</MenuItem>) })}
          {field('itemPicture', 'Item image URL', optionalLength(225), { helperText: 'Paste an image URL (maximum 225 characters).' })}
          <input type="hidden" {...register('originId')} />
          {record?.originMadeIn && <TextField label="Origin" value={record.originMadeIn} fullWidth slotProps={{ input: { readOnly: true } }} />}
        </>}
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
      <Button type="submit" variant="contained" disabled={mutation.isPending || (!isCategory && !categories.length)}>{mutation.isPending ? 'Saving…' : 'Save changes'}</Button>
    </DialogActions>
  </form>;
}

export default function MenuEditor({ kind, id, onClose, onSaved }) {
  const isCategory = kind === 'category';
  const detail = useQuery({
    queryKey: ['menu', 'admin', kind, id],
    queryFn: ({ signal }) => (isCategory ? categoryApi : itemApi).detail(id, signal),
    enabled: id != null,
    staleTime: 0,
  });
  const categories = useQuery({ queryKey: ['menu', 'admin', 'category-options'], queryFn: ({ signal }) => categoryApi.options(signal), enabled: !isCategory });
  const loading = (id != null && detail.isPending) || (!isCategory && categories.isPending);
  const error = detail.error || (!isCategory && categories.error);
  return <Dialog open fullWidth maxWidth="sm" aria-labelledby="menu-editor-title">
    <DialogTitle id="menu-editor-title">{id != null ? 'Edit' : 'Create'} {isCategory ? 'category' : 'menu item'}<Typography variant="body2" color="text.secondary">{isCategory ? 'Organize your menu into clear, useful categories.' : 'Keep dish information and availability up to date.'}</Typography></DialogTitle>
    {loading ? <DialogContent><MenuLoading /></DialogContent> : error ? <><DialogContent><MenuError error={error} retry={() => { detail.refetch(); if (!isCategory) categories.refetch(); }} /></DialogContent><DialogActions><Button onClick={onClose}>Close</Button></DialogActions></> : <EditorForm kind={kind} record={id != null ? detail.data : null} categories={categories.data ?? []} onClose={onClose} onSaved={onSaved} />}
  </Dialog>;
}
