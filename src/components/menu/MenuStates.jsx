import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Pagination, Stack, Typography } from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { menuError } from '../../utils/menuUtils';

export function MenuImage({ src, alt, height = 180 }) {
  const [failedSrc, setFailedSrc] = useState(null);
  return src && src !== failedSrc ? (
    <Box component="img" src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} sx={{ width: '100%', height, objectFit: 'cover', display: 'block', bgcolor: '#f5f3ff' }} />
  ) : (
    <Box role="img" aria-label={alt || 'No image'} sx={{ height, width: '100%', display: 'grid', placeItems: 'center', bgcolor: '#f5f3ff', color: '#a78bfa' }}>
      <RestaurantMenuIcon sx={{ fontSize: 44 }} />
    </Box>
  );
}

export function MenuLoading() {
  return <Stack role="status" aria-label="Loading menu" sx={{ py: 7, alignItems: 'center' }}><CircularProgress /><Typography sx={{ mt: 2 }} color="text.secondary">Loading menu…</Typography></Stack>;
}

export function MenuError({ error, retry }) {
  return <Alert severity="error" sx={{ my: 2 }} action={retry && <Button color="inherit" onClick={retry}>Retry</Button>}>{menuError(error)}</Alert>;
}

export function MenuEmpty({ title = 'No results found', description = 'Try a different search or clear your filters.' }) {
  return <Stack spacing={1} sx={{ py: 7, textAlign: 'center', alignItems: 'center' }}><RestaurantMenuIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} /><Typography variant="h6">{title}</Typography><Typography color="text.secondary">{description}</Typography></Stack>;
}

export function MenuPagination({ meta, page, onChange }) {
  if (!meta) return null;
  return <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ py: 3, alignItems: 'center', justifyContent: 'space-between' }}>
    <Typography variant="body2" color="text.secondary">{meta.total} results · Page {page} of {Math.max(1, meta.pages)}</Typography>
    <Pagination count={Math.max(1, meta.pages)} page={page} onChange={(_, value) => onChange(value)} color="primary" size="small" />
  </Stack>;
}
