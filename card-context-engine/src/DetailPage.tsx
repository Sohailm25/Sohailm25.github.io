import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  useTheme,
  alpha,
  Stack,
  Chip,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Breadcrumbs,
  Link,
  Divider,
  Avatar,
  Tooltip,
  Fade,
  Slide,
  Skeleton,
  LinearProgress,
  Collapse,
  Badge,
  keyframes,
} from '@mui/material';
import {
  ArrowBack,
  AccountBalance,
  ViewColumn,
  Schedule,
  Visibility,
  Lock,
  NavigateNext,
  TableChart,
  Description,
  CheckCircle,
  Warning,
  ExpandMore,
  ExpandLess,
  ContentCopy,
  Share,
  BookmarkBorder,
  Bookmark,
  Refresh,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface DetailPageProps {
  type?: 'table' | 'column';
}

// Smooth fade-in animation
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Gentle pulse for important elements
const gentlePulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;



const DetailPage: React.FC<DetailPageProps> = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { type } = useParams<{ type: string; id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    details: true,
    metadata: true,
    quality: true,
  });
  const [bookmarked, setBookmarked] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    navigate('/product');
  };

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCopyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  // Enhanced placeholder data with more realistic information
  const tableData = {
    id: 'tbl_customer_transactions_001',
    name: 'customer_transactions',
    displayName: 'Customer Transactions',
    description: 'Comprehensive table containing all customer transaction records including payment details, merchant information, and transaction metadata. This is the primary source for transaction analytics and reporting.',
    database: 'payments_db',
    schema: 'core',
    source: 'Oracle Database 19c',
    sourceId: 'ORCL_PROD_001',
    owner: 'data-engineering-team',
    createdDate: '2023-08-15T10:30:00Z',
    lastModified: '2024-01-22T14:45:30Z',
    rowCount: '2,847,392',
    dataSize: '1.2 GB',
    accessLevel: 'Restricted',
    classification: 'Confidential',
    tags: ['PCI-DSS', 'Financial', 'Customer Data', 'Transactions'],
    qualityScore: 94,
    columns: [
      {
        id: 'col_transaction_id',
        name: 'transaction_id',
        type: 'VARCHAR(50)',
        nullable: false,
        primaryKey: true,
        description: 'Unique identifier for each transaction',
        sampleValues: ['TXN_20240122_001', 'TXN_20240122_002', 'TXN_20240122_003']
      },
      {
        id: 'col_customer_id',
        name: 'customer_id',
        type: 'VARCHAR(20)',
        nullable: false,
        primaryKey: false,
        description: 'Customer identifier linked to customer master table',
        sampleValues: ['CUST_123456', 'CUST_789012', 'CUST_345678']
      },
      {
        id: 'col_amount',
        name: 'transaction_amount',
        type: 'DECIMAL(15,2)',
        nullable: false,
        primaryKey: false,
        description: 'Transaction amount in USD',
        sampleValues: ['1,250.00', '89.99', '2,500.50']
      },
      {
        id: 'col_merchant',
        name: 'merchant_name',
        type: 'VARCHAR(100)',
        nullable: true,
        primaryKey: false,
        description: 'Name of the merchant where transaction occurred',
        sampleValues: ['Amazon.com', 'Starbucks #1234', 'Shell Gas Station']
      },
      {
        id: 'col_timestamp',
        name: 'transaction_timestamp',
        type: 'TIMESTAMP',
        nullable: false,
        primaryKey: false,
        description: 'Exact timestamp when transaction was processed',
        sampleValues: ['2024-01-22 10:30:45', '2024-01-22 11:15:22', '2024-01-22 12:00:10']
      }
    ]
  };

  const columnData = {
    id: 'col_transaction_amount',
    name: 'transaction_amount',
    displayName: 'Transaction Amount',
    description: 'The monetary value of each transaction recorded in USD currency. This field captures the exact amount debited or credited in customer accounts and is used for financial reporting and analysis.',
    table: 'customer_transactions',
    database: 'payments_db',
    schema: 'core',
    dataType: 'DECIMAL(15,2)',
    nullable: false,
    primaryKey: false,
    foreignKey: false,
    indexed: true,
    defaultValue: null,
    constraints: ['CHECK (transaction_amount > 0)', 'NOT NULL'],
    source: 'Oracle Database 19c',
    sourceId: 'ORCL_PROD_001',
    owner: 'data-engineering-team',
    createdDate: '2023-08-15T10:30:00Z',
    lastModified: '2024-01-22T14:45:30Z',
    classification: 'Confidential',
    tags: ['Financial', 'Amount', 'Currency', 'PCI-DSS'],
    qualityScore: 97,
    validValues: [
      {
        id: 'val_001',
        value: '0.01 - 100.00',
        frequency: '45%',
        description: 'Small transactions (under $100)',
        category: 'Micro Transactions'
      },
      {
        id: 'val_002',
        value: '100.01 - 1,000.00',
        frequency: '35%',
        description: 'Medium transactions ($100-$1000)',
        category: 'Standard Transactions'
      },
      {
        id: 'val_003',
        value: '1,000.01 - 10,000.00',
        frequency: '18%',
        description: 'Large transactions ($1K-$10K)',
        category: 'High Value Transactions'
      },
      {
        id: 'val_004',
        value: '10,000.01+',
        frequency: '2%',
        description: 'Very large transactions (over $10K)',
        category: 'Ultra High Value'
      }
    ]
  };

  const isTableView = type === 'table';
  const currentData = isTableView ? tableData : columnData;
  const relatedItems = isTableView ? tableData.columns : columnData.validValues;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
        return theme.palette.success.main;
      case 'restricted':
      case 'confidential':
        return theme.palette.warning.main;
      case 'deprecated':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'table') return <TableChart sx={{ color: 'primary.main' }} />;
    return <ViewColumn sx={{ color: 'primary.main' }} />;
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
        <AppBar position="static" sx={{ bgcolor: '#0066CC' }}>
          <Toolbar>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Skeleton variant="text" width={200} height={40} />
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Skeleton variant="text" width={300} height={30} sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box sx={{ flex: 2 }}>
              <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" height={300} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" height={400} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="rounded" height={150} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" height={180} />
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Enhanced Header with progress indicator */}
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
          boxShadow: '0 4px 20px rgba(0, 102, 204, 0.2)',
        }}
      >
        <Toolbar>
          <Tooltip title="Back to Search" arrow>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBack}
              sx={{ 
                mr: 2,
                '&:hover': { 
                  bgcolor: alpha('white', 0.1),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <AccountBalance sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            JPMorgan Chase - Card Context Engine
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title={bookmarked ? "Remove bookmark" : "Bookmark this item"} arrow>
              <IconButton
                color="inherit"
                onClick={handleBookmark}
                sx={{ 
                  '&:hover': { bgcolor: alpha('white', 0.1) },
                  transition: 'all 0.2s ease',
                }}
              >
                {bookmarked ? <Bookmark /> : <BookmarkBorder />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Share" arrow>
              <IconButton
                color="inherit"
                sx={{ 
                  '&:hover': { bgcolor: alpha('white', 0.1) },
                  transition: 'all 0.2s ease',
                }}
              >
                <Share />
              </IconButton>
            </Tooltip>
            <Chip 
              label="Enterprise Solution" 
              variant="outlined" 
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)',
                fontSize: '0.75rem'
              }} 
            />
          </Stack>
        </Toolbar>
        <LinearProgress 
          variant="determinate" 
          value={100} 
          sx={{ 
            height: 2,
            bgcolor: 'transparent',
            '& .MuiLinearProgress-bar': {
              bgcolor: alpha('white', 0.8),
            }
          }} 
        />
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Enhanced Breadcrumbs */}
        <Fade in timeout={600}>
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs
              separator={<NavigateNext fontSize="small" />}
              sx={{ mb: 2 }}
            >
              <Link
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick('/')}
                sx={{ 
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { 
                    color: 'primary.main',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Home
              </Link>
              <Link
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick('/product')}
                sx={{ 
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { 
                    color: 'primary.main',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Search
              </Link>
              <Typography color="text.primary" variant="body2" sx={{ fontWeight: 500 }}>
                {isTableView ? 'Table Details' : 'Column Details'}
              </Typography>
            </Breadcrumbs>
          </Box>
        </Fade>

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 4 
          }}
        >
          {/* Enhanced Main Content */}
          <Box sx={{ flex: 2 }}>
            <Stack spacing={4}>
              {/* Enhanced Header Section */}
              <Slide in timeout={800} direction="up">
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, 
                      ${alpha('#0066CC', 0.05)} 0%, 
                      ${alpha('#004499', 0.08)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    animation: `${fadeInUp} 0.8s ease-out`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #0066CC, #004499)',
                    }
                  }}
                >
                  <Stack direction="row" spacing={3} alignItems="flex-start">
                    <Avatar
                      sx={{
                        width: 72,
                        height: 72,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        border: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        animation: `${gentlePulse} 3s ease-in-out infinite`,
                      }}
                    >
                      {getTypeIcon(type || 'table')}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: 700, color: 'text.primary' }}
                        >
                          {currentData.displayName || currentData.name}
                        </Typography>
                        <Badge
                          badgeContent={`${currentData.qualityScore}%`}
                          sx={{
                            '& .MuiBadge-badge': {
                              bgcolor: getQualityColor(currentData.qualityScore),
                              color: 'white',
                              fontWeight: 600,
                            }
                          }}
                        >
                          <Chip
                            label={currentData.classification}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(currentData.classification), 0.1),
                              color: getStatusColor(currentData.classification),
                              fontWeight: 600,
                            }}
                          />
                        </Badge>
                      </Stack>
                      
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 3, lineHeight: 1.7, fontSize: '1.1rem' }}
                      >
                        {currentData.description}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {currentData.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              mb: 1,
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: theme.shadows[2],
                              },
                              transition: 'all 0.2s ease',
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>

                    <Stack spacing={1}>
                      <Tooltip title="Copy ID" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyToClipboard(currentData.id, 'id')}
                          sx={{
                            bgcolor: copiedField === 'id' ? 'success.main' : alpha(theme.palette.primary.main, 0.1),
                            color: copiedField === 'id' ? 'white' : 'primary.main',
                            '&:hover': { bgcolor: 'primary.main', color: 'white' },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {copiedField === 'id' ? <CheckCircle /> : <ContentCopy />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Refresh" arrow>
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
                            '&:hover': { 
                              bgcolor: 'primary.main', 
                              color: 'white',
                              transform: 'rotate(180deg)',
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <Refresh />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              </Slide>

              {/* Enhanced Details Section with Collapsible */}
              <Slide in timeout={1000} direction="up">
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    overflow: 'hidden',
                    animation: `${fadeInUp} 1s ease-out`,
                    '&:hover': {
                      boxShadow: '0 8px 32px rgba(0, 102, 204, 0.1)',
                    },
                    transition: 'box-shadow 0.3s ease',
                  }}
                >
                  <Box 
                    sx={{ 
                      p: 3, 
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                      transition: 'background-color 0.2s ease',
                    }}
                    onClick={() => toggleSection('details')}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {isTableView ? 'Table Information' : 'Column Information'}
                      </Typography>
                      {expandedSections.details ? <ExpandLess /> : <ExpandMore />}
                    </Stack>
                  </Box>
                  
                  <Collapse in={expandedSections.details}>
                    <Box sx={{ p: 4 }}>
                      <Box 
                        sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                          gap: 4 
                        }}
                      >
                        <Stack spacing={3}>
                          {[
                            { label: isTableView ? 'Table Name' : 'Column Name', value: currentData.name, copyable: true },
                            { label: 'Database', value: currentData.database, copyable: true },
                            { label: 'Schema', value: currentData.schema, copyable: true },
                            ...(isTableView ? [] : [{ label: 'Data Type', value: columnData.dataType, copyable: false }])
                          ].map((item, index) => (
                            <Box key={index}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                                {item.label}
                              </Typography>
                              {item.copyable ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace', flex: 1 }}>
                                    {item.value}
                                  </Typography>
                                  <Tooltip title="Copy" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCopyToClipboard(item.value, item.label)}
                                      sx={{
                                        opacity: 0.7,
                                        '&:hover': { opacity: 1, color: 'primary.main' },
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      {copiedField === item.label ? <CheckCircle color="success" /> : <ContentCopy />}
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Chip
                                  label={item.value}
                                  size="small"
                                  sx={{
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    color: 'info.main',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                  }}
                                />
                              )}
                            </Box>
                          ))}
                        </Stack>

                        <Stack spacing={3}>
                          {[
                            { label: 'Source', value: currentData.source },
                            { label: 'Source ID', value: currentData.sourceId, copyable: true },
                            { label: 'Owner', value: currentData.owner },
                            { label: 'Last Modified', value: new Date(currentData.lastModified).toLocaleDateString() }
                          ].map((item, index) => (
                            <Box key={index}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                                {item.label}
                              </Typography>
                              {item.copyable ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace', flex: 1 }}>
                                    {item.value}
                                  </Typography>
                                  <Tooltip title="Copy" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCopyToClipboard(item.value, item.label)}
                                      sx={{
                                        opacity: 0.7,
                                        '&:hover': { opacity: 1, color: 'primary.main' },
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      {copiedField === item.label ? <CheckCircle color="success" /> : <ContentCopy />}
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {item.value}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>

                      {isTableView && (
                        <>
                          <Divider sx={{ my: 4 }} />
                          <Box 
                            sx={{ 
                              display: 'grid', 
                              gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                              gap: 3 
                            }}
                          >
                            {[
                              { label: 'Total Rows', value: tableData.rowCount, color: 'primary.main' },
                              { label: 'Columns', value: tableData.columns.length, color: 'primary.main' },
                              { label: 'Data Size', value: tableData.dataSize, color: 'primary.main' },
                              { label: 'Access Level', value: tableData.accessLevel, color: getStatusColor(tableData.accessLevel), isChip: true }
                            ].map((stat, index) => (
                              <Box key={index} sx={{ textAlign: 'center', p: 2 }}>
                                {stat.isChip ? (
                                  <>
                                    <Chip
                                      icon={<Lock />}
                                      label={stat.value}
                                      sx={{
                                        bgcolor: alpha(stat.color, 0.1),
                                        color: stat.color,
                                        fontWeight: 600,
                                      }}
                                    />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                      {stat.label}
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color, mb: 0.5 }}>
                                      {stat.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {stat.label}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              </Slide>

              {/* Enhanced Related Items Section */}
              <Slide in timeout={1200} direction="up">
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    overflow: 'hidden',
                    animation: `${fadeInUp} 1.2s ease-out`,
                    '&:hover': {
                      boxShadow: '0 8px 32px rgba(0, 102, 204, 0.1)',
                    },
                    transition: 'box-shadow 0.3s ease',
                  }}
                >
                  <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {isTableView ? 'Columns' : 'Valid Values'} ({relatedItems.length})
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`Page ${currentPage}`}
                          size="small"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          Quality: {currentData.qualityScore}%
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: alpha(theme.palette.grey[50], 0.8) }}>
                        <TableRow>
                          {isTableView ? (
                            <>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Column Name</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Data Type</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Nullable</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Key</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Description</TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Value Range</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Frequency</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Category</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Description</TableCell>
                            </>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relatedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item: any, index) => (
                          <TableRow
                            key={item.id}
                            sx={{
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                cursor: 'pointer',
                                transform: 'scale(1.001)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => navigate(`/detail/${isTableView ? 'column' : 'value'}/${item.id}`)}
                          >
                            {isTableView ? (
                              <>
                                <TableCell>
                                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                    {item.name}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.type}
                                    size="small"
                                    sx={{
                                      bgcolor: alpha(theme.palette.info.main, 0.1),
                                      color: 'info.main',
                                      fontFamily: 'monospace',
                                      fontSize: '0.75rem',
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  {item.nullable ? (
                                    <Chip label="Yes" size="small" color="warning" />
                                  ) : (
                                    <Chip label="No" size="small" color="success" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {item.primaryKey && <Chip label="PK" size="small" color="primary" />}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.description}
                                  </Typography>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>
                                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                    {item.value}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    {item.frequency}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.category}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.description}
                                  </Typography>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      count={Math.ceil(relatedItems.length / itemsPerPage)}
                      page={currentPage}
                      onChange={(event, value) => setCurrentPage(value)}
                      color="primary"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                          transition: 'transform 0.2s ease',
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Slide>
            </Stack>
          </Box>

          {/* Enhanced Sidebar */}
          <Box sx={{ flex: 1 }}>
            <Stack spacing={3}>
              {/* Enhanced Quick Actions */}
              <Fade in timeout={1000}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    animation: `${fadeInUp} 1s ease-out`,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Quick Actions
                  </Typography>
                  <Stack spacing={2}>
                    {[
                      { icon: <Visibility />, label: 'Preview Data', color: 'primary' },
                      { icon: <Description />, label: 'Export Schema', color: 'secondary' },
                      { icon: <Schedule />, label: 'View History', color: 'info' }
                    ].map((action, index) => (
                      <Button
                        key={index}
                        variant="outlined"
                        startIcon={action.icon}
                        fullWidth
                        sx={{ 
                          justifyContent: 'flex-start',
                          py: 1.5,
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: theme.shadows[4],
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Stack>
                </Paper>
              </Fade>

              {/* Enhanced Metadata */}
              <Fade in timeout={1200}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    overflow: 'hidden',
                    animation: `${fadeInUp} 1.2s ease-out`,
                  }}
                >
                  <Box 
                    sx={{ 
                      p: 3, 
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                      transition: 'background-color 0.2s ease',
                    }}
                    onClick={() => toggleSection('metadata')}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Metadata
                      </Typography>
                      {expandedSections.metadata ? <ExpandLess /> : <ExpandMore />}
                    </Stack>
                  </Box>
                  <Collapse in={expandedSections.metadata}>
                    <Box sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        {[
                          { label: 'Created Date', value: new Date(currentData.createdDate).toLocaleDateString() },
                          { label: 'ID', value: currentData.id, copyable: true }
                        ].map((item, index) => (
                          <Box key={index}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                              {item.label}
                            </Typography>
                            {item.copyable ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', flex: 1, fontSize: '0.8rem' }}>
                                  {item.value}
                                </Typography>
                                <Tooltip title="Copy" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyToClipboard(item.value, item.label)}
                                    sx={{
                                      opacity: 0.7,
                                      '&:hover': { opacity: 1, color: 'primary.main' },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    {copiedField === item.label ? <CheckCircle color="success" /> : <ContentCopy />}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.value}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Collapse>
                </Paper>
              </Fade>

              {/* Enhanced Data Quality */}
              <Fade in timeout={1400}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: alpha('#0066CC', 0.02),
                    overflow: 'hidden',
                    animation: `${fadeInUp} 1.4s ease-out`,
                  }}
                >
                  <Box 
                    sx={{ 
                      p: 3, 
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      transition: 'background-color 0.2s ease',
                    }}
                    onClick={() => toggleSection('quality')}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Data Quality
                      </Typography>
                      {expandedSections.quality ? <ExpandLess /> : <ExpandMore />}
                    </Stack>
                  </Box>
                  <Collapse in={expandedSections.quality}>
                    <Box sx={{ p: 3 }}>
                      <Box sx={{ mb: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Overall Score
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: getQualityColor(currentData.qualityScore) }}>
                            {currentData.qualityScore}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={currentData.qualityScore}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.grey[300], 0.3),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getQualityColor(currentData.qualityScore),
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>
                      <Stack spacing={2}>
                        {[
                          { icon: <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />, text: 'Schema Validated' },
                          { icon: <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />, text: 'Data Fresh' },
                          { icon: <Warning sx={{ color: 'warning.main', fontSize: 20 }} />, text: 'Compliance Review Due' }
                        ].map((item, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.icon}
                            <Typography variant="body2">{item.text}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Collapse>
                </Paper>
              </Fade>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default DetailPage;