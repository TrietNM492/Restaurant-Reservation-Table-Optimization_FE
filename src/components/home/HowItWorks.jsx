import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

const steps = [
  {
    number: '1',
    title: 'Discover',
    description: 'Find restaurants that match your location, preferences, and occasion.',
  },
  {
    number: '2',
    title: 'Choose',
    description: 'Select a date, time, and party size to refine suitable dining options.',
  },
  {
    number: '3',
    title: 'Reserve',
    description: 'Review reservation details and submit your booking with confidence.',
  },
];

function HowItWorks() {
  return (
    <Box component="section" id="how-it-works" sx={{ py: { xs: 6, md: 8 }, backgroundColor: '#FFF7ED' }}>
      <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.7rem' }, mb: 1.5 }}>
        Your Next Dining Experience in Three Steps
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        A simple, guided process that makes it easy to find the right restaurant and secure the perfect table.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 3 }}>
        {steps.map((step) => (
          <Card key={step.number} sx={{ height: '100%', position: 'relative', overflow: 'visible', border: '1px solid rgba(249, 115, 22, 0.12)' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  {step.number}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {step.title}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export default HowItWorks;
