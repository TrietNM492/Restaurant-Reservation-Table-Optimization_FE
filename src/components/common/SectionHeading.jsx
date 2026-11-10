import { Box, Typography } from '@mui/material';

function SectionHeading({ eyebrow, title, subtitle, align = 'left' }) {
  return (
    <Box sx={{ mb: 4, textAlign: align }}>
      {eyebrow ? (
        <Typography
          variant="overline"
          sx={{
            display: 'inline-block',
            color: 'primary.main',
            fontWeight: 700,
            letterSpacing: '0.12em',
            mb: 1,
          }}
        >
          {eyebrow}
        </Typography>
      ) : null}
      <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, mb: 1.5 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620, mx: align === 'center' ? 'auto' : 0 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

export default SectionHeading;
