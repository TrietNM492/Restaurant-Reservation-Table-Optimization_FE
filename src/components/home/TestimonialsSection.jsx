import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded';
import { testimonialData } from '../../data/restaurants';

function TestimonialsSection() {
  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
      <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, mb: 1.5 }}>
        Dining experiences guests keep talking about
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 620 }}>
        Sample feedback from guests exploring restaurants and planning memorable evenings.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 3 }}>
        {testimonialData.map((item) => (
          <Card key={item.author} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
                {[...Array(5)].map((_, index) => (
                  <StarRateRoundedIcon key={`${item.author}-${index}`} fontSize="small" sx={{ color: '#F59E0B' }} />
                ))}
              </Stack>
              <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                “{item.quote}”
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {item.author}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.detail}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export default TestimonialsSection;
