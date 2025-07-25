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
} from '@mui/material';
import {
  ArrowBack,
  AccountBalance,
  Storage,
  ViewColumn,
  DataObject,
  Schedule,
  Person,
  Visibility,
  Lock,
  Public,
  NavigateNext,
  TableChart,
  Description,
  Category,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface DetailPageProps {
  type?: 'table' | 'column';
}

const DetailPage: React.FC<DetailPageProps> = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { type, id } = useParams<{ type: string; id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleBack = () => {
    navigate('/product');
  };

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  // Placeholder data for table details
  const tableData = {
    id: 'tbl_customer_transactions_001',
    name: 'customer_transactions',
    displayName: 'Customer Transactions',
    description: 'Comprehensive table containing all customer transaction records including payment details, merchant information, and transaction metadata.',
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

  // Placeholder data for column details
  const columnData = {
    id: 'col_transaction_amount',
    name: 'transaction_amount',
    displayName: 'Transaction Amount',
    description: 'The monetary value of each transaction recorded in USD currency. This field captures the exact amount debited or credited in customer accounts.',
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
        {/* Breadcrumbs */}
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
                '&:hover': { color: 'primary.main' }
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
                '&:hover': { color: 'primary.main' }
              }}
            >
              Search
            </Link>
            <Typography color="text.primary" variant="body2">
              {isTableView ? 'Table Details' : 'Column Details'}
            </Typography>
          </Breadcrumbs>
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 4 
          }}
        >
          {/* Main Content */}
          <Box sx={{ flex: 2 }}>
            <Stack spacing={4}>
              {/* Header Section */}
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
                <Stack direction="row" spacing={3} alignItems="flex-start">
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
                      <Chip
                        label={currentData.classification}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(currentData.classification), 0.1),
                          color: getStatusColor(currentData.classification),
                          fontWeight: 600,
                        }}
                      />
                    </Stack>
                    
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mb: 2, lineHeight: 1.6 }}
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
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* Details Section */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {isTableView ? 'Table Information' : 'Column Information'}
                  </Typography>
                </Box>
                
                <Box sx={{ p: 3 }}>
                  <Box 
                    sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 3 
                    }}
                  >
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {isTableView ? 'Table Name' : 'Column Name'}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                          {currentData.name}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Database
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {currentData.database}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Schema
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {currentData.schema}
                        </Typography>
                      </Box>

                      {!isTableView && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Data Type
                          </Typography>
                          <Chip
                            label={columnData.dataType}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: 'info.main',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      )}
                    </Stack>

                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Source
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {currentData.source}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Source ID
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                          {currentData.sourceId}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Owner
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {currentData.owner}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Last Modified
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {new Date(currentData.lastModified).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {isTableView && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      <Box 
                        sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                          gap: 2 
                        }}
                      >
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                            {tableData.rowCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Rows
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                            {tableData.columns.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Columns
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                            {tableData.dataSize}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Data Size
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Chip
                            icon={<Lock />}
                            label={tableData.accessLevel}
                            sx={{
                              bgcolor: alpha(getStatusColor(tableData.accessLevel), 0.1),
                              color: getStatusColor(tableData.accessLevel),
                              fontWeight: 600,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Access Level
                          </Typography>
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>

              {/* Related Items Section */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {isTableView ? 'Columns' : 'Valid Values'} ({relatedItems.length})
                    </Typography>
                    <Chip
                      label={`Page ${currentPage}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.grey[50], 0.5) }}>
                      <TableRow>
                        {isTableView ? (
                          <>
                            <TableCell sx={{ fontWeight: 600 }}>Column Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Data Type</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Nullable</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell sx={{ fontWeight: 600 }}>Value Range</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
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
                            },
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
                  />
                </Box>
              </Paper>
            </Stack>
          </Box>

          {/* Sidebar */}
          <Box sx={{ flex: 1 }}>
            <Stack spacing={3}>
              {/* Quick Actions */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Preview Data
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Export Schema
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Schedule />}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    View History
                  </Button>
                </Stack>
              </Paper>

              {/* Metadata */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Metadata
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Created Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(currentData.createdDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                      {currentData.id}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Data Quality */}
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
                  Data Quality
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2">Schema Validated</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2">Data Fresh</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning sx={{ color: 'warning.main', fontSize: 20 }} />
                    <Typography variant="body2">Compliance Review Due</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default DetailPage;