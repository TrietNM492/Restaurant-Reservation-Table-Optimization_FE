import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, Card, CardActionArea, CardContent, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { MenuEmpty, MenuError, MenuImage, MenuLoading, MenuPagination } from '../components/menu/MenuStates';
import { publicMenuApi } from '../services/menuManagementService';
import { formatMenuPrice, readBrowseParams } from '../utils/menuUtils';

function BrowseFilters({ params, onApply, onReset }) {
  const { register, handleSubmit, getValues, formState: { errors } } = useForm({ defaultValues: { q: params.q ?? '', minPrice: params.minPrice ?? '', maxPrice: params.maxPrice ?? '', sort: params.sort, size: params.size } });
  const priceRules = { validate: (value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0) || 'Enter a nonnegative price.' };
  return <Paper component="form" variant="outlined" onSubmit={handleSubmit(onApply)} noValidate sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'flex-start' }, flexWrap: { md: 'wrap', lg: 'nowrap' } }}>
      <TextField label="Search dishes" {...register('q')} size="small" fullWidth sx={{ flex: 2, minWidth: 160 }} />
      <TextField label="Min price (VND)" type="number" {...register('minPrice', priceRules)} error={Boolean(errors.minPrice)} helperText={errors.minPrice?.message} size="small" fullWidth sx={{ flex: 1 }} slotProps={{ htmlInput: { min: 0, step: 'any' } }} />
      <TextField label="Max price (VND)" type="number" {...register('maxPrice', { validate: (value) => {
        const valid = priceRules.validate(value);
        if (valid !== true) return valid;
        return value === '' || getValues('minPrice') === '' || Number(value) >= Number(getValues('minPrice')) || 'Maximum must be at least the minimum.';
      } })} error={Boolean(errors.maxPrice)} helperText={errors.maxPrice?.message} size="small" fullWidth sx={{ flex: 1 }} slotProps={{ htmlInput: { min: 0, step: 'any' } }} />
      <TextField select label="Sort by" defaultValue={params.sort} {...register('sort')} size="small" sx={{ minWidth: 180 }}><MenuItem value="name">Name A–Z</MenuItem><MenuItem value="price_asc">Price: low to high</MenuItem><MenuItem value="price_desc">Price: high to low</MenuItem><MenuItem value="newest">Newest dishes</MenuItem></TextField>
      <TextField select label="Per page" defaultValue={params.size} {...register('size')} size="small" sx={{ minWidth: 100 }}>{[...new Set([12, 24, 50, params.size])].sort((a, b) => a - b).map((size) => <MenuItem key={size} value={size}>{size}</MenuItem>)}</TextField>
      <Button variant="contained" type="submit">Search</Button><Button onClick={onReset}>Reset</Button>
    </Stack>
  </Paper>;
}

function MenuDetail({ id, onClose }) {
  const query = useQuery({ queryKey: ['menu', 'public', 'detail', id], queryFn: ({ signal }) => publicMenuApi.detail(id, signal) });
  const item = query.data;
  return <Dialog open fullWidth maxWidth="sm" onClose={onClose} aria-labelledby="dish-detail-title">
    <DialogTitle id="dish-detail-title">{item?.itemName || 'Dish details'}</DialogTitle>
    <DialogContent dividers>
      {query.isPending ? <MenuLoading /> : query.isError ? <MenuError error={query.error} retry={query.refetch} /> : <Stack spacing={2.5}>
        <Box sx={{ borderRadius: 2, overflow: 'hidden' }}><MenuImage src={item.itemPicture} alt={item.itemName} height={260} /></Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Chip label={item.categoryName} variant="outlined" /><Chip label={item.available ? 'Available' : 'Out of stock'} color={item.available ? 'success' : 'warning'} /></Stack>
        <Typography variant="h5" color="primary">{formatMenuPrice(item.price)}</Typography>
        {item.description && <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.description}</Typography>}
        <Divider />
        {item.estimatedPrepMinutes != null && <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><AccessTimeIcon color="action" /><Typography>Estimated preparation: {item.estimatedPrepMinutes} minutes</Typography></Stack>}
        {item.originMadeIn && <Typography color="text.secondary">Origin: {item.originMadeIn}</Typography>}
        {!item.available && <Alert severity="warning">This dish is currently sold out. Please check back later.</Alert>}
      </Stack>}
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Back to menu</Button></DialogActions>
  </Dialog>;
}

export default function MenuBrowsingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const params = readBrowseParams(searchParams);
  const categories = useQuery({ queryKey: ['menu', 'public', 'categories'], queryFn: ({ signal }) => publicMenuApi.categories(signal) });
  const list = useQuery({ queryKey: ['menu', 'public', 'browse', params], queryFn: ({ signal }) => publicMenuApi.browse(params, signal) });
  const updateParams = (patch) => {
    const next = { ...params, ...patch };
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value !== '' && value != null).map(([key, value]) => [key, String(value)])));
  };
  const selectedCategory = categories.data?.find((category) => category.id === params.categoryId);
  return <>
    <Navbar />
    <Box component="main" sx={{ bgcolor: '#faf9fc', minHeight: '70vh', pb: 6 }}>
      <Box sx={{ bgcolor: '#f2edfc', borderBottom: '1px solid #e8ddfa', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg"><Typography variant="overline" color="primary" sx={{ letterSpacing: '0.16em' }}>Freshly prepared · Thoughtfully served</Typography><Typography component="h1" variant="h2" sx={{ mt: 1, fontSize: { xs: '2.3rem', md: '3.6rem' } }}>Find your next favorite.</Typography><Typography color="text.secondary" sx={{ mt: 2, maxWidth: 580 }}>Explore our menu, discover something delicious, and make your next visit one to look forward to.</Typography><Button component={Link} to="/reservations/new" variant="outlined" endIcon={<ArrowForwardIcon />} sx={{ mt: 3 }}>Reserve a table</Button></Container>
      </Box>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {categories.isError ? <MenuError error={categories.error} retry={categories.refetch} /> : categories.isPending ? <Typography role="status" color="text.secondary" sx={{ mb: 3 }}>Loading categories…</Typography> : <Stack component="nav" aria-label="Menu categories" direction="row" spacing={1} useFlexGap sx={{ mb: 3, flexWrap: 'wrap' }}>
          <Chip label="All dishes" color={!params.categoryId ? 'primary' : 'default'} onClick={() => updateParams({ categoryId: null, page: 1 })} aria-pressed={!params.categoryId} />
          {categories.data.map((category) => <Chip key={category.id} label={`${category.name} (${category.itemCount})`} color={params.categoryId === category.id ? 'primary' : 'default'} onClick={() => updateParams({ categoryId: category.id, page: 1 })} aria-pressed={params.categoryId === category.id} />)}
        </Stack>}
        <BrowseFilters key={searchParams.toString()} params={params} onApply={(values) => updateParams({ ...values, q: values.q.trim(), page: 1 })} onReset={() => setSearchParams({})} />
        <Stack direction="row" sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'baseline' }}><Typography component="h2" variant="h5">{selectedCategory?.name || 'Our menu'}</Typography>{list.data && <Typography variant="body2" color="text.secondary">{list.data.meta.total} dishes</Typography>}</Stack>
        {list.isPending ? <MenuLoading /> : list.isError ? <MenuError error={list.error} retry={list.refetch} /> : <>
          {!list.data.result.length ? <MenuEmpty title="No dishes found" description="Try another category, search term or price range." /> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
            {list.data.result.map((item) => <Card key={item.id} sx={{ height: '100%', overflow: 'hidden' }}>
              <CardActionArea component={Link} to={`/menus/${item.id}?${searchParams.toString()}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ position: 'relative' }}><MenuImage src={item.itemPicture} alt={item.itemName} height={210} />{!item.available && <Chip label="Out of stock" color="warning" size="small" sx={{ position: 'absolute', top: 14, right: 14 }} />}</Box>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="overline" color="primary" sx={{ lineHeight: 1.5 }}>{item.categoryName}</Typography>
                  <Typography component="h3" variant="h6" sx={{ mt: 0.75, mb: 1, overflowWrap: 'anywhere' }}>{item.itemName}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description || 'Prepared with care, served with a warm welcome.'}</Typography>
                  <Stack direction="row" sx={{ mt: 'auto', pt: 1, justifyContent: 'space-between', alignItems: 'center' }}><Typography fontWeight={800} color="primary">{formatMenuPrice(item.price)}</Typography>{item.estimatedPrepMinutes != null && <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}><AccessTimeIcon sx={{ fontSize: 16 }} /><Typography variant="caption">{item.estimatedPrepMinutes} min</Typography></Stack>}</Stack>
                </CardContent>
              </CardActionArea>
            </Card>)}
          </Box>}
          <MenuPagination meta={list.data.meta} page={params.page} onChange={(page) => updateParams({ page })} />
        </>}
      </Container>
    </Box>
    <Footer />
    {id && <MenuDetail key={id} id={id} onClose={() => navigate(`/menus?${searchParams.toString()}`)} />}
  </>;
}
