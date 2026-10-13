import { Link } from 'react-router-dom';
import { Box, Container, Typography, Stack, IconButton, Divider } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';

const footerLinks = {
    Explore: [
        { label: 'Restaurants', path: '/restaurants' },
        { label: 'Dining Categories', path: '/restaurants' },
        { label: 'Reservations', path: '/reservations/new' },
    ],
    Support: [
        { label: 'Help Center', path: '/#help' },
        { label: 'Contact', path: '/#contact' },
        { label: 'FAQ', path: '/#faq' },
    ],
    Legal: [
        { label: 'Privacy Policy', path: '/#privacy' },
        { label: 'Terms of Service', path: '/#terms' },
    ],
};

function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: '#0F172A',
                color: '#CBD5E1',
                pt: { xs: 6, md: 8 },
                pb: 4,
                mt: 8,
            }}
        >
            <Container>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' },
                        gap: { xs: 4, md: 6 },
                    }}
                >
                    <Box>
                        <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
                            <RestaurantIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                                Intelligent Restaurant
                            </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ maxWidth: 320, lineHeight: 1.6 }}>
                            Discover exceptional restaurants, explore menus, and reserve the perfect table for every occasion.
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                            <IconButton
                                size="small"
                                sx={{ color: '#94A3B8', border: '1px solid #334155', '&:hover': { color: 'primary.main', borderColor: 'primary.main' } }}
                                aria-label="Facebook"
                            >
                                <FacebookIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                sx={{ color: '#94A3B8', border: '1px solid #334155', '&:hover': { color: 'primary.main', borderColor: 'primary.main' } }}
                                aria-label="Instagram"
                            >
                                <InstagramIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                sx={{ color: '#94A3B8', border: '1px solid #334155', '&:hover': { color: 'primary.main', borderColor: 'primary.main' } }}
                                aria-label="X (formerly Twitter)"
                            >
                                <XIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Box>

                    {Object.entries(footerLinks).map(([heading, links]) => (
                        <Box key={heading}>
                            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' }}>
                                {heading}
                            </Typography>
                            <Stack spacing={1.5}>
                                {links.map((link) => (
                                    <Link
                                        key={link.label}
                                        to={link.path}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#94A3B8',
                                                '&:hover': { color: 'primary.main' },
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {link.label}
                                        </Typography>
                                    </Link>
                                ))}
                            </Stack>
                        </Box>
                    ))}
                </Box>

                <Divider sx={{ my: 4, borderColor: '#1E293B' }} />

                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', textAlign: 'center' }}>
                    {new Date().getFullYear()} Intelligent Restaurant. All rights reserved. This is a demonstration project.
                </Typography>
            </Container>
        </Box>
    );
}

export default Footer;