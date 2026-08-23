import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0066CC', // JPMorgan Chase blue
      dark: '#004499',
      light: '#3384D6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1976d2',
      dark: '#115293',
      light: '#4791db',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
    success: {
      main: '#4caf50',
      dark: '#388e3c',
      light: '#81c784',
    },
    error: {
      main: '#f44336',
      dark: '#d32f2f',
      light: '#e57373',
    },
    warning: {
      main: '#ff9800',
      dark: '#f57c00',
      light: '#ffb74d',
    },
    info: {
      main: '#2196f3',
      dark: '#1976d2',
      light: '#64b5f6',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 102, 204, 0.2)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 102, 204, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0066CC',
            },
          },
        },
      },
    },
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.08)',
    '0px 2px 4px rgba(0, 0, 0, 0.1)',
    '0px 2px 6px rgba(0, 0, 0, 0.12)',
    '0px 3px 8px rgba(0, 0, 0, 0.14)',
    '0px 4px 10px rgba(0, 0, 0, 0.16)',
    '0px 5px 12px rgba(0, 0, 0, 0.18)',
    '0px 6px 14px rgba(0, 0, 0, 0.2)',
    '0px 8px 16px rgba(0, 0, 0, 0.22)',
    '0px 10px 18px rgba(0, 0, 0, 0.24)',
    '0px 12px 20px rgba(0, 0, 0, 0.26)',
    '0px 14px 22px rgba(0, 0, 0, 0.28)',
    '0px 16px 24px rgba(0, 0, 0, 0.3)',
    '0px 18px 26px rgba(0, 0, 0, 0.32)',
    '0px 20px 28px rgba(0, 0, 0, 0.34)',
    '0px 22px 30px rgba(0, 0, 0, 0.36)',
    '0px 24px 32px rgba(0, 0, 0, 0.38)',
    '0px 26px 34px rgba(0, 0, 0, 0.4)',
    '0px 28px 36px rgba(0, 0, 0, 0.42)',
    '0px 30px 38px rgba(0, 0, 0, 0.44)',
    '0px 32px 40px rgba(0, 0, 0, 0.46)',
    '0px 34px 42px rgba(0, 0, 0, 0.48)',
    '0px 36px 44px rgba(0, 0, 0, 0.5)',
    '0px 38px 46px rgba(0, 0, 0, 0.52)',
  ],
});

export default theme;