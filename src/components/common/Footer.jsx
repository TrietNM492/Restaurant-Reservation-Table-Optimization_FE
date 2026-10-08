import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

function Footer() {
  return (
    <Box component="footer" className="app-footer">
      <Typography component="span">© {new Date().getFullYear()} Seatwise</Typography>
      <Typography component="span">Thoughtful tools for memorable dining.</Typography>
      <Box className="app-footer__links">
        <Link href="#support" underline="hover">Support</Link>
        <Link href="#privacy" underline="hover">Privacy</Link>
      </Box>
    </Box>
  );
}

export default Footer;