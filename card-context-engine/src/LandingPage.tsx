import React, { useState, useEffect, useRef } from 'react';
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
  Fade,
  Slide,
  Zoom,
  keyframes,
} from '@mui/material';
import {
  Search,
  Analytics,
  Security,
  Speed,
  TrendingUp,
  AccountBalance,
  AutoAwesome,
  Rocket,
  Shield,
  FlashOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Animated counter hook
const useAnimatedCounter = (end: number, duration: number = 2000, delay: number = 0) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          setTimeout(() => {
            let start = 0;
            const increment = end / (duration / 16);
            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                setCount(end);
                clearInterval(timer);
              } else {
                // Easing function for smooth deceleration
                const progress = start / end;
                const eased = 1 - Math.pow(1 - progress, 3);
                setCount(Math.floor(eased * end));
              }
            }, 16);
          }, delay);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, delay, isVisible]);

  return { count, ref };
};

// Floating particles animation
const particleFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-20px) rotate(120deg); }
  66% { transform: translateY(10px) rotate(240deg); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(0, 102, 204, 0.3); }
  50% { box-shadow: 0 0 40px rgba(0, 102, 204, 0.6), 0 0 60px rgba(0, 102, 204, 0.4); }
`;

const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Particle: React.FC<{ delay: number; size: number; left: string; top: string }> = ({ delay, size, left, top }) => (
  <Box
    sx={{
      position: 'absolute',
      left,
      top,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `linear-gradient(45deg, ${alpha('#0066CC', 0.3)}, ${alpha('#004499', 0.5)})`,
      animation: `${particleFloat} ${3 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      zIndex: 1,
    }}
  />
);

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const accuracyCounter = useAnimatedCounter(99.9, 2500, 500);
  const responseCounter = useAnimatedCounter(100, 2000, 800);
  const availabilityCounter = useAnimatedCounter(24, 1500, 1100);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartSearching = () => {
    navigate('/product');
  };

  const features = [
    {
      icon: <Search sx={{ fontSize: 40 }} />,
      title: 'Advanced Search',
      description: 'Intelligent search capabilities powered by machine learning to find relevant card contexts instantly.',
      color: '#0066CC',
      gradient: 'linear-gradient(135deg, #0066CC 0%, #0052A3 100%)',
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Real-time Analytics',
      description: 'Get comprehensive insights and analytics on card usage patterns and trends.',
      color: '#00A86B',
      gradient: 'linear-gradient(135deg, #00A86B 0%, #008B5A 100%)',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Enterprise Security',
      description: 'Bank-grade security with end-to-end encryption and compliance with financial regulations.',
      color: '#FF6B35',
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)',
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Lightning Fast',
      description: 'Sub-second response times with optimized algorithms and cloud infrastructure.',
      color: '#9B59B6',
      gradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Header with enhanced styling */}
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
          boxShadow: '0 4px 20px rgba(0, 102, 204, 0.3)',
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
              fontSize: '0.75rem',
              animation: `${pulseGlow} 3s ease-in-out infinite`,
            }} 
          />
        </Toolbar>
      </AppBar>

      {/* Enhanced Hero Section with floating particles */}
      <Box
        sx={{
          background: `
            linear-gradient(135deg, 
              ${alpha('#0066CC', 0.05)} 0%, 
              ${alpha('#004499', 0.08)} 50%,
              ${alpha('#0066CC', 0.03)} 100%
            )
          `,
          backgroundSize: '400% 400%',
          animation: `${gradientShift} 8s ease infinite`,
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Floating Particles */}
        {mounted && (
          <>
            <Particle delay={0} size={8} left="10%" top="20%" />
            <Particle delay={1} size={12} left="85%" top="15%" />
            <Particle delay={2} size={6} left="75%" top="60%" />
            <Particle delay={0.5} size={10} left="15%" top="70%" />
            <Particle delay={1.5} size={14} left="90%" top="80%" />
            <Particle delay={2.5} size={8} left="5%" top="50%" />
            <Particle delay={3} size={16} left="80%" top="30%" />
          </>
        )}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              alignItems: 'center',
              gap: 6 
            }}
          >
            <Fade in={mounted} timeout={1000}>
              <Box sx={{ flex: 1 }}>
                <Stack spacing={4}>
                  <Box>
                    <Slide in={mounted} direction="up" timeout={800}>
                      <Chip 
                        label="NEW RELEASE" 
                        color="primary" 
                        size="small" 
                        icon={<AutoAwesome />}
                        sx={{ 
                          mb: 3, 
                          fontWeight: 600,
                          background: 'linear-gradient(45deg, #0066CC, #004499)',
                          animation: `${slideInUp} 0.8s ease-out`,
                        }}
                      />
                    </Slide>
                    
                    <Slide in={mounted} direction="up" timeout={1000}>
                      <Typography
                        variant="h2"
                        component="h1"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '2.5rem', md: '4rem' },
                          lineHeight: 1.1,
                          color: 'text.primary',
                          mb: 3,
                          background: 'linear-gradient(135deg, #1a1a1a 0%, #0066CC 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animation: `${slideInUp} 1s ease-out`,
                        }}
                      >
                        Card Context
                        <Box 
                          component="span" 
                          sx={{ 
                            display: 'block',
                            background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          Engine
                        </Box>
                      </Typography>
                    </Slide>
                    
                    <Slide in={mounted} direction="up" timeout={1200}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '1.3rem',
                          lineHeight: 1.6,
                          maxWidth: '550px',
                          animation: `${slideInUp} 1.2s ease-out`,
                        }}
                      >
                        Revolutionize your card data analysis with AI-powered contextual search 
                        and intelligent insights. Built for enterprise-scale financial operations.
                      </Typography>
                    </Slide>
                  </Box>

                  <Slide in={mounted} direction="up" timeout={1400}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 4 }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleStartSearching}
                        startIcon={<Rocket />}
                        sx={{
                          py: 2,
                          px: 5,
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          borderRadius: 3,
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
                          boxShadow: '0 8px 32px rgba(0, 102, 204, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #004499 0%, #003366 100%)',
                            transform: 'translateY(-3px)',
                            boxShadow: '0 12px 40px rgba(0, 102, 204, 0.6)',
                          },
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          animation: `${slideInUp} 1.4s ease-out`,
                        }}
                      >
                        Start Searching
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<Shield />}
                        sx={{
                          py: 2,
                          px: 5,
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          borderRadius: 3,
                          textTransform: 'none',
                          borderWidth: 2,
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          '&:hover': {
                            borderWidth: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            borderColor: 'primary.main',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0, 102, 204, 0.2)',
                          },
                          transition: 'all 0.3s ease',
                          animation: `${slideInUp} 1.6s ease-out`,
                        }}
                      >
                        Learn More
                      </Button>
                    </Stack>
                  </Slide>

                  <Slide in={mounted} direction="up" timeout={1800}>
                    <Box sx={{ mt: 4, animation: `${slideInUp} 1.8s ease-out` }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Trusted by leading financial institutions
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                        {['SOC 2 Compliant', 'PCI DSS Level 1', 'ISO 27001'].map((cert, index) => (
                          <Chip 
                            key={cert}
                            label={cert} 
                            variant="outlined" 
                            size="small"
                            icon={<Shield />}
                            sx={{
                              animation: `${slideInUp} ${2 + index * 0.2}s ease-out`,
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: theme.shadows[4],
                              },
                              transition: 'all 0.2s ease',
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Slide>
                </Stack>
              </Box>
            </Fade>

            <Zoom in={mounted} timeout={1500}>
              <Box sx={{ flex: 1 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 5,
                    borderRadius: 4,
                    background: `
                      linear-gradient(135deg, 
                        ${alpha(theme.palette.background.paper, 0.9)} 0%, 
                        ${alpha(theme.palette.background.paper, 0.7)} 100%
                      )
                    `,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    boxShadow: '0 20px 60px rgba(0, 102, 204, 0.1)',
                    animation: `${pulseGlow} 4s ease-in-out infinite`,
                  }}
                >
                  <Stack spacing={4}>
                    <Box sx={{ textAlign: 'center' }} ref={accuracyCounter.ref}>
                      <TrendingUp sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                      <Typography 
                        variant="h2" 
                        sx={{ 
                          fontWeight: 700, 
                          mb: 1,
                          background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {accuracyCounter.count.toFixed(1)}%
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        Search Accuracy
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Box sx={{ flex: 1, textAlign: 'center' }} ref={responseCounter.ref}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 700, 
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                          }}
                        >
                          <FlashOn sx={{ fontSize: 30 }} />
                          &lt;{responseCounter.count}ms
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Response Time
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: 'center' }} ref={availabilityCounter.ref}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 700, 
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                          }}
                        >
                          <AutoAwesome sx={{ fontSize: 30 }} />
                          {availabilityCounter.count}/7
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Availability
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Zoom>
          </Box>
        </Container>
      </Box>

      {/* Enhanced Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Fade in={mounted} timeout={2000}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                background: 'linear-gradient(135deg, #1a1a1a 0%, #0066CC 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Powerful Features for Modern Banking
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: '700px', mx: 'auto', fontSize: '1.2rem', lineHeight: 1.6 }}
            >
              Discover how our advanced technology transforms card data management 
              and delivers actionable insights for your business.
            </Typography>
          </Box>
        </Fade>

        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
            gap: 4 
          }}
        >
          {features.map((feature, index) => (
            <Zoom key={index} in={mounted} timeout={1000 + index * 200}>
              <Card
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: `2px solid ${alpha(feature.color, 0.2)}`,
                  background: hoveredFeature === index 
                    ? `linear-gradient(135deg, ${alpha(feature.color, 0.05)} 0%, ${alpha(feature.color, 0.1)} 100%)`
                    : 'background.paper',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredFeature === index ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: hoveredFeature === index 
                    ? `0 20px 60px ${alpha(feature.color, 0.3)}`
                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': hoveredFeature === index ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: feature.gradient,
                  } : {},
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box 
                    sx={{ 
                      mb: 3,
                      color: feature.color,
                      transform: hoveredFeature === index ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: hoveredFeature === index ? feature.color : 'text.primary' }}>
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      lineHeight: 1.7,
                      flex: 1,
                      fontSize: '1rem',
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          ))}
        </Box>
      </Container>

      {/* Enhanced CTA Section */}
      <Box
        sx={{
          background: `
            linear-gradient(135deg, 
              ${alpha('#0066CC', 0.03)} 0%, 
              ${alpha('#004499', 0.05)} 50%,
              ${alpha('#0066CC', 0.02)} 100%
            )
          `,
          py: 10,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="md">
          <Fade in={mounted} timeout={2500}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                component="h2"
                sx={{ 
                  fontWeight: 700, 
                  mb: 3,
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0066CC 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Ready to Transform Your Card Operations?
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 5, maxWidth: '600px', mx: 'auto', fontSize: '1.2rem', lineHeight: 1.6 }}
              >
                Join thousands of financial professionals who trust Card Context Engine 
                for their data analysis needs.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartSearching}
                startIcon={<Rocket />}
                sx={{
                  py: 2.5,
                  px: 8,
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
                  boxShadow: '0 12px 40px rgba(0, 102, 204, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #004499 0%, #003366 100%)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 16px 50px rgba(0, 102, 204, 0.6)',
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Start Searching Now
              </Button>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Enhanced Footer */}
      <Box
        sx={{
          bgcolor: alpha(theme.palette.grey[900], 0.02),
          py: 5,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={3}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <AccountBalance sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                © 2024 JPMorgan Chase & Co. All rights reserved.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={4}>
              {['Privacy Policy', 'Terms of Service', 'Support'].map((item) => (
                <Typography 
                  key={item}
                  variant="body1" 
                  color="text.secondary" 
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: 500,
                    '&:hover': {
                      color: 'primary.main',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;