import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConstants';

function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <Box className="not-found-page">
            <Container maxWidth="md" className="not-found-page__container">
                <Box className="not-found-page__top">
                    <Link component={RouterLink} to={ROUTES.LOGIN} underline="none" className="not-found-page__brand">
                        <span>S</span>
                        seatwise
                    </Link>
                    <Typography component="span">Restaurant operations, thoughtfully done</Typography>
                </Box>

                <Box component="main" className="not-found-card">
                    <Box className="not-found-card__art" aria-hidden="true">
                        <span className="not-found-card__orbit not-found-card__orbit--one" />
                        <span className="not-found-card__orbit not-found-card__orbit--two" />
                        <span className="not-found-card__plate"><span>404</span></span>
                        <span className="not-found-card__spark not-found-card__spark--one">✦</span>
                        <span className="not-found-card__spark not-found-card__spark--two">✧</span>
                    </Box>
                    <Typography component="p" className="not-found-card__eyebrow">Well, this is awkward</Typography>
                    <Typography component="h1" className="not-found-card__title">We can’t find this page</Typography>
                    <Typography component="p" className="not-found-card__description">
                        The page may have moved, or the link might be out of date. Let’s get you back to something delicious.
                    </Typography>
                    <Box className="not-found-card__actions">
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackRoundedIcon />}
                            onClick={() => navigate(-1)}
                        >
                            Go back
                        </Button>
                        <Button
                            component={RouterLink}
                            to={ROUTES.LOGIN}
                            variant="contained"
                            endIcon={<ArrowForwardRoundedIcon />}
                        >
                            Back to sign in
                        </Button>
                    </Box>
                    <Typography component="p" className="not-found-card__support">
                        Need help? Sign in to reach your restaurant support team.
                    </Typography>
                </Box>

                <Box component="footer" className="not-found-page__footer">
                    <Typography component="span">© {new Date().getFullYear()} Seatwise</Typography>
                    <Typography component="span">Made for better service, one table at a time.</Typography>
                </Box>
            </Container>
        </Box>
    );
}

export default NotFoundPage;