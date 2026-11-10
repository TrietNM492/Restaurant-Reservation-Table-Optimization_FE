import { Box, Button, Container, Stack, Tab, Tabs, Typography, Alert } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import RecommendationPanel from '../components/table-allocation/RecommendationPanel';
import OptimizationPanel from '../components/table-allocation/OptimizationPanel';
import { useAuthStore } from '../stores/useAuthStore';
import { allocationPermissions } from '../utils/tableAllocation';
import { ROUTES } from '../routes/routeConstants';

export default function TablePlanningPage({ module = 'intelligent', customer = false }) {
  const [params, setParams] = useSearchParams();
  const { user, accessToken } = useAuthStore();
  const permissions = allocationPermissions(user, accessToken);
  const combination = module === 'combination';
  const tabs = combination
    ? [['allocation', 'Multi-Table Allocation'], ['scoring', 'Combination Scoring']]
    : [['recommendations', 'Table Recommendation'], ['alternatives', 'Alternative Recommendation'], ...(!customer ? [['optimization', 'Allocation Optimization']] : [])];
  const view = tabs.some(([value]) => value === params.get('view')) ? params.get('view') : tabs[0][0];
  const allowed = customer ? permissions.canRecommend : permissions.canPreview;
  const content = <Box sx={{ maxWidth: 1440, mx: 'auto', minWidth: 0 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Typography variant="overline" color="primary">Smart seating</Typography>
        <Typography variant="h4" component="h1">{combination ? 'Multi-Table Combination' : 'Intelligent Table Allocation'}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>{combination ? 'Bring larger parties together with ranked table combinations.' : 'Find the right table, explore flexible options and improve seat utilization.'}</Typography>
      </Box>
      <Button component={Link} to={combination ? (customer ? ROUTES.TABLE_RECOMMENDATIONS : ROUTES.TABLE_ALLOCATION) : (customer ? ROUTES.TABLE_COMBINATIONS : ROUTES.MULTI_TABLE_COMBINATION)} sx={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
        {combination ? 'Table recommendations' : 'Explore table combinations'} →
      </Button>
    </Stack>
    {!allowed ? <Alert severity="warning">{customer ? 'A customer or restaurant staff account is required to view recommendations.' : 'This workspace is available to STAFF, MANAGER and ADMIN accounts.'}</Alert> : <>
      <Tabs value={view} onChange={(_, next) => setParams({ view: next })} variant="scrollable" scrollButtons="auto" aria-label={combination ? 'Table combination features' : 'Table allocation features'} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map(([value, label]) => <Tab key={value} value={value} label={label} id={`planning-tab-${value}`} aria-controls={`planning-panel-${value}`} />)}
      </Tabs>
      <Box role="tabpanel" id={`planning-panel-${view}`} aria-labelledby={`planning-tab-${view}`}>
        {view === 'optimization' ? <OptimizationPanel key={view} canApply={permissions.canApply} /> : <RecommendationPanel key={`${module}-${view}`} mode={view} combination={combination} canBook={permissions.canBook} />}
      </Box>
    </>}
  </Box>;
  if (!customer) return content;
  return <><Navbar /><Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, minHeight: '70vh' }}>{content}</Container><Footer /></>;
}
