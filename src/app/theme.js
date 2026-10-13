import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6D28D9',
      dark: '#5B21B6',
      light: '#F5F3FF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#A78BFA',
      light: '#EDE9FE',
    },
    text: {
      primary: '#1E1B2E',
      secondary: '#64748B',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
      subtle: '#F8FAFC',
    },
    success: {
      main: '#16A34A',
    },
    warning: {
      main: '#D97706',
    },
    error: {
      main: '#DC2626',
    },
    info: {
      main: '#2563EB',
    },
    divider: '#E2E8F0',
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.06em',
      lineHeight: 1.05,
      color: '#1E1B2E',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.04em',
      lineHeight: 1.15,
      color: '#1E1B2E',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
      lineHeight: 1.2,
      color: '#1E1B2E',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
      color: '#1E1B2E',
    },
    body1: {
      lineHeight: 1.7,
    },
    body2: {
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '0.8rem 1.4rem',
          minHeight: 46,
          fontSize: '0.96rem',
          fontWeight: 700,
          textTransform: 'none',
          letterSpacing: '0',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
          },
        },
        outlinedPrimary: {
          borderColor: '#C4B5FD',
          color: '#6D28D9',
          '&:hover': {
            backgroundColor: '#F5F3FF',
            borderColor: '#8B5CF6',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(148, 163, 184, 0.18)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 999,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A78BFA',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6D28D9',
            borderWidth: 1.5,
            boxShadow: '0 0 0 3px rgba(109, 40, 217, 0.12)',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: '#F5F3FF',
            color: '#6D28D9',
          },
          '&:hover': {
            backgroundColor: '#F5F3FF',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
