import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  useTheme,
  alpha,
  Stack,
  Chip,
  Paper,
} from '@mui/material';
import {
  Search,
  Analytics,
  Security,
  Speed,
  TrendingUp,
  AccountBalance,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleStartSearching = () => {
    navigate('/product');
  };

  const features = [
    {
      icon: <Search sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Advanced Search',
      description: 'Intelligent search capabilities powered by machine learning to find relevant card contexts instantly.',
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Real-time Analytics',
      description: 'Get comprehensive insights and analytics on card usage patterns and trends.',
    },
    {
      icon: <Security sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Enterprise Security',
      description: 'Bank-grade security with end-to-end encryption and compliance with financial regulations.',
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Lightning Fast',
      description: 'Sub-second response times with optimized algorithms and cloud infrastructure.',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: '#0066CC', // JPMorgan Chase blue
          boxShadow: 'none',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Toolbar>
          <AccountBalance sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            JPMorgan Chase
          </Typography>
          <Chip 
            label="Enterprise Solution" 
            variant="outlined" 
            sx={{ 
              color: 'white', 
              borderColor: 'rgba(255,255,255,0.3)',
              fontSize: '0.75rem'
            }} 
          />
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, 
            ${alpha('#0066CC', 0.05)} 0%, 
            ${alpha('#004499', 0.08)} 100%)`,
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              alignItems: 'center',
              gap: 4 
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Stack spacing={3}>
                <Box>
                  <Chip 
                    label="NEW RELEASE" 
                    color="primary" 
                    size="small" 
                    sx={{ mb: 2, fontWeight: 600 }}
                  />
                  <Typography
                    variant="h2"
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      lineHeight: 1.2,
                      color: 'text.primary',
                      mb: 2,
                    }}
                  >
                    Card Context
                    <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
                      Engine
                    </Box>
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '1.25rem',
                      lineHeight: 1.5,
                      maxWidth: '500px',
                    }}
                  >
                    Revolutionize your card data analysis with AI-powered contextual search 
                    and intelligent insights. Built for enterprise-scale financial operations.
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleStartSearching}
                    startIcon={<Search />}
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      bgcolor: '#0066CC',
                      '&:hover': {
                        bgcolor: '#004499',
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8],
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Start Searching
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    Learn More
                  </Button>
                </Stack>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Trusted by leading financial institutions
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip label="SOC 2 Compliant" variant="outlined" size="small" />
                    <Chip label="PCI DSS Level 1" variant="outlined" size="small" />
                    <Chip label="ISO 27001" variant="outlined" size="small" />
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Stack spacing={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      99.9%
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Search Accuracy
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        &lt;100ms
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Response Time
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        24/7
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Availability
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Powerful Features for Modern Banking
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto' }}
          >
            Discover how our advanced technology transforms card data management 
            and delivers actionable insights for your business.
          </Typography>
        </Box>

        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: 4 
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[12],
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: alpha('#0066CC', 0.02),
          py: 8,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ fontWeight: 700, mb: 2 }}
            >
              Ready to Transform Your Card Operations?
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: '500px', mx: 'auto' }}
            >
              Join thousands of financial professionals who trust Card Context Engine 
              for their data analysis needs.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartSearching}
              startIcon={<Search />}
              sx={{
                py: 2,
                px: 6,
                fontSize: '1.2rem',
                fontWeight: 600,
                borderRadius: 3,
                textTransform: 'none',
                bgcolor: '#0066CC',
                '&:hover': {
                  bgcolor: '#004499',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[12],
                },
                transition: 'all 0.3s ease',
              }}
            >
              Start Searching Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: alpha(theme.palette.grey[900], 0.02),
          py: 4,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <AccountBalance sx={{ color: 'primary.main' }} />
              <Typography variant="body2" color="text.secondary">
                © 2024 JPMorgan Chase & Co. All rights reserved.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3}>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
                Privacy Policy
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
                Terms of Service
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
                Support
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;