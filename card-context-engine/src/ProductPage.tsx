import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  TextField,
  InputAdornment,
  useTheme,
  alpha,
  Stack,
  Chip,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search,
  ArrowBack,
  FilterList,
  TuneRounded,
  AccountBalance,
  Timeline,
  Assessment,
  Security,
  CloudUpload,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ProductPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    navigate('/');
  };

  const handleSearch = () => {
    // Handle search functionality here
    console.log('Searching for:', searchQuery);
  };

  const searchFeatures = [
    {
      title: 'Natural Language Processing',
      description: 'Search using natural language queries for intuitive data exploration.',
      icon: <Search sx={{ color: 'primary.main' }} />,
    },
    {
      title: 'Real-time Filtering',
      description: 'Apply dynamic filters to narrow down results instantly.',
      icon: <FilterList sx={{ color: 'primary.main' }} />,
    },
    {
      title: 'Advanced Analytics',
      description: 'Get detailed insights and analytics on your search results.',
      icon: <Assessment sx={{ color: 'primary.main' }} />,
    },
    {
      title: 'Secure Processing',
      description: 'All searches are processed with enterprise-grade security.',
      icon: <Security sx={{ color: 'primary.main' }} />,
    },
  ];

  const recentSearches = [
    'Card transactions Q4 2023',
    'High-value transactions analysis',
    'Merchant category trends',
    'Fraud detection patterns',
    'Customer spending behavior',
  ];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: '#0066CC',
          boxShadow: 'none',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <AccountBalance sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            JPMorgan Chase - Card Context Engine
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

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 4 
          }}
        >
          {/* Main Search Area */}
          <Box sx={{ flex: 2 }}>
            <Stack spacing={4}>
              {/* Welcome Section */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, 
                    ${alpha('#0066CC', 0.05)} 0%, 
                    ${alpha('#004499', 0.08)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: 'text.primary',
                  }}
                >
                  Welcome to Card Context Engine
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 3, lineHeight: 1.6 }}
                >
                  Start exploring your card data with intelligent search capabilities. 
                  Use natural language queries or specific filters to find exactly what you need.
                </Typography>
                
                {/* Search Bar */}
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    placeholder="Search card transactions, analyze patterns, or explore insights..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleSearch} sx={{ color: 'primary.main' }}>
                            <TuneRounded />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        '& fieldset': {
                          borderColor: alpha(theme.palette.divider, 0.2),
                        },
                        '&:hover fieldset': {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    startIcon={<Search />}
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      bgcolor: '#0066CC',
                      '&:hover': {
                        bgcolor: '#004499',
                      },
                    }}
                  >
                    Search Now
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<CloudUpload />}
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                    }}
                  >
                    Upload Data
                  </Button>
                </Stack>
              </Paper>

              {/* Search Features */}
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Search Capabilities
                </Typography>
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 3 
                  }}
                >
                  {searchFeatures.map((feature, index) => (
                    <Card
                      key={index}
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Box sx={{ mt: 0.5 }}>{feature.icon}</Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {feature.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {feature.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>

              {/* Sample Queries */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Try These Sample Queries
                </Typography>
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2 
                  }}
                >
                  {[
                    'Show me all transactions above $10,000 last month',
                    'Analyze merchant spending patterns by category',
                    'Find unusual transaction patterns for fraud detection',
                    'Compare card usage trends year over year',
                  ].map((query, index) => (
                    <Chip
                      key={index}
                      label={query}
                      variant="outlined"
                      onClick={() => setSearchQuery(query)}
                      sx={{
                        height: 'auto',
                        p: 1,
                        '& .MuiChip-label': {
                          whiteSpace: 'normal',
                          lineHeight: 1.4,
                        },
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          borderColor: 'primary.main',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            </Stack>
          </Box>

          {/* Sidebar */}
          <Box sx={{ flex: 1 }}>
            <Stack spacing={3}>
              {/* Quick Stats */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  System Status
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Search Engine
                    </Typography>
                    <Chip
                      label="Online"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: 'success.main',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Data Processing
                    </Typography>
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: 'success.main',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Response Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      &lt; 50ms
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Recent Searches */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Searches
                </Typography>
                <List dense>
                  {recentSearches.map((search, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        px: 0,
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                      onClick={() => setSearchQuery(search)}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Timeline sx={{ fontSize: 20, color: 'text.secondary' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={search}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              {/* Help & Support */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: alpha('#0066CC', 0.02),
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Need Help?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Our support team is available 24/7 to help you get the most out of Card Context Engine.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Contact Support
                </Button>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ProductPage;