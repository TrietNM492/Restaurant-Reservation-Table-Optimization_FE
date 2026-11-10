import { Box, Container, Link, Stack, Typography } from '@mui/material';

const footerSections = [
  {
    title: 'Explore',
    links: ['Restaurants', 'Dining Categories', 'Reservations'],
  },
  {
    title: 'Support',
    links: ['Help Center', 'Contact', 'Frequently Asked Questions'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service'],
  },
];

function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#0F172A', color: '#E2E8F0', py: { xs: 5, md: 6 } }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: '1.2fr repeat(3, minmax(0, 0.9fr))' }, gap: 4 }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, mb: 1.5 }}>
              Intelligent Restaurant
            </Typography>
            <Typography variant="body2" color="inherit" sx={{ opacity: 0.8, maxWidth: 290 }}>
              Discover memorable dining, reserve a table effortlessly, and make every meal feel special.
            </Typography>
          </Box>

          {footerSections.map((section) => (
            <Box key={section.title}>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, mb: 1.5 }}>
                {section.title}
              </Typography>
              <Stack spacing={1}>
                {section.links.map((item) => (
                  <Link href="#" key={item} color="inherit" underline="hover" sx={{ opacity: 0.8 }}>
                    {item}
                  </Link>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>

        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', mt: 4, pt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            © 2026 Intelligent Restaurant. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ opacity: 0.75 }}>
            <Link href="#" color="inherit" underline="hover">Instagram</Link>
            <Link href="#" color="inherit" underline="hover">Facebook</Link>
            <Link href="#" color="inherit" underline="hover">X</Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
