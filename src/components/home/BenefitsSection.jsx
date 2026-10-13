import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined';

const benefits = [
  {
    title: 'Smart Table Recommendations',
    description: 'Suggest the right table options based on party size, preferred time, and what is available.',
    icon: SmartToyOutlinedIcon,
  },
  {
    title: 'Convenient Reservations',
    description: 'Search, compare, and reserve a table in a simple guided process that keeps decisions easy.',
    icon: EventAvailableOutlinedIcon,
  },
  {
    title: 'Clear Booking Information',
    description: 'Review reservation details before checkout and confirm the booking flow when the backend is connected.',
    icon: InfoOutlinedIcon,
  },
  {
    title: 'Premium Dining Options',
    description: 'Explore special dining rooms, chef tables, and event-ready spaces for memorable occasions.',
    icon: CelebrationOutlinedIcon,
  },
];

function BenefitsSection() {
  return (
    <Box component="section" id="about" sx={{ py: { xs: 6, md: 8 } }}>
      <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, mb: 1.5 }}>
        A Better Way to Plan Your Dining Experience
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 660 }}>
        Thoughtful booking tools and a refined dining experience help you spend less time planning and more time enjoying the meal.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 3 }}>
        {benefits.map(({ title, description, icon: Icon }) => (
          <Card key={title} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                  }}
                >
                  <Icon fontSize="medium" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export default BenefitsSection;
