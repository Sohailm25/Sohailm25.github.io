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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Tabs,
  Tab,
  Avatar,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search,
  ArrowBack,
  FilterList,
  AccountBalance,
  TableChart,
  ViewColumn,
  NavigateNext,
  Storage,
  Lock,
  Public,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DataListPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const handleBack = () => {
    navigate('/product');
  };

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setCurrentPage(1);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  // Placeholder data for tables
  const tablesData = [
    {
      id: 'tbl_customer_transactions_001',
      name: 'customer_transactions',
      displayName: 'Customer Transactions',
      description: 'Comprehensive table containing all customer transaction records',
      database: 'payments_db',
      schema: 'core',
      rowCount: '2,847,392',
      columns: 25,
      classification: 'Confidential',
      lastModified: '2024-01-22T14:45:30Z',
      owner: 'data-engineering-team',
      tags: ['PCI-DSS', 'Financial', 'Customer Data']
    },
    {
      id: 'tbl_merchant_details_002',
      name: 'merchant_details',
      displayName: 'Merchant Details',
      description: 'Master table for merchant information and metadata',
      database: 'merchants_db',
      schema: 'master',
      rowCount: '145,892',
      columns: 18,
      classification: 'Internal',
      lastModified: '2024-01-20T09:15:22Z',
      owner: 'merchant-ops-team',
      tags: ['Merchant', 'Reference', 'Master Data']
    },
    {
      id: 'tbl_card_profiles_003',
      name: 'card_profiles',
      displayName: 'Card Profiles',
      description: 'Customer card profile information and preferences',
      database: 'cards_db',
      schema: 'profiles',
      rowCount: '892,445',
      columns: 32,
      classification: 'Restricted',
      lastModified: '2024-01-21T16:30:45Z',
      owner: 'cards-team',
      tags: ['Cards', 'Customer', 'PII', 'Profiles']
    },
    {
      id: 'tbl_fraud_alerts_004',
      name: 'fraud_alerts',
      displayName: 'Fraud Alerts',
      description: 'Real-time fraud detection alerts and investigations',
      database: 'security_db',
      schema: 'fraud',
      rowCount: '23,567',
      columns: 15,
      classification: 'Highly Confidential',
      lastModified: '2024-01-22T18:20:10Z',
      owner: 'fraud-detection-team',
      tags: ['Fraud', 'Security', 'Alerts', 'Investigation']
    },
    {
      id: 'tbl_account_balances_005',
      name: 'account_balances',
      displayName: 'Account Balances',
      description: 'Daily account balance snapshots and history',
      database: 'accounts_db',
      schema: 'balances',
      rowCount: '5,234,891',
      columns: 12,
      classification: 'Confidential',
      lastModified: '2024-01-22T23:59:59Z',
      owner: 'accounts-team',
      tags: ['Accounts', 'Balances', 'Financial', 'Daily']
    }
  ];

  // Placeholder data for columns
  const columnsData = [
    {
      id: 'col_transaction_id',
      name: 'transaction_id',
      displayName: 'Transaction ID',
      description: 'Unique identifier for each transaction',
      table: 'customer_transactions',
      database: 'payments_db',
      dataType: 'VARCHAR(50)',
      nullable: false,
      primaryKey: true,
      classification: 'Internal',
      owner: 'data-engineering-team',
      tags: ['Primary Key', 'Identifier']
    },
    {
      id: 'col_customer_id',
      name: 'customer_id',
      displayName: 'Customer ID',
      description: 'Customer identifier linked to customer master table',
      table: 'customer_transactions',
      database: 'payments_db',
      dataType: 'VARCHAR(20)',
      nullable: false,
      primaryKey: false,
      classification: 'Confidential',
      owner: 'data-engineering-team',
      tags: ['Customer', 'Foreign Key', 'PII']
    },
    {
      id: 'col_transaction_amount',
      name: 'transaction_amount',
      displayName: 'Transaction Amount',
      description: 'Transaction amount in USD currency',
      table: 'customer_transactions',
      database: 'payments_db',
      dataType: 'DECIMAL(15,2)',
      nullable: false,
      primaryKey: false,
      classification: 'Confidential',
      owner: 'data-engineering-team',
      tags: ['Financial', 'Amount', 'Currency']
    },
    {
      id: 'col_merchant_name',
      name: 'merchant_name',
      displayName: 'Merchant Name',
      description: 'Name of the merchant where transaction occurred',
      table: 'customer_transactions',
      database: 'payments_db',
      dataType: 'VARCHAR(100)',
      nullable: true,
      primaryKey: false,
      classification: 'Internal',
      owner: 'data-engineering-team',
      tags: ['Merchant', 'Business']
    },
    {
      id: 'col_card_number_hash',
      name: 'card_number_hash',
      displayName: 'Card Number Hash',
      description: 'Hashed card number for security and privacy',
      table: 'card_profiles',
      database: 'cards_db',
      dataType: 'VARCHAR(64)',
      nullable: false,
      primaryKey: false,
      classification: 'Highly Confidential',
      owner: 'cards-team',
      tags: ['PCI-DSS', 'Hash', 'Security', 'Card']
    }
  ];

  const isTablesView = currentTab === 0;
  
  // Filter data based on search query
  const filteredData = isTablesView 
    ? tablesData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : columnsData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'internal':
        return theme.palette.info.main;
      case 'confidential':
        return theme.palette.warning.main;
      case 'restricted':
      case 'highly confidential':
        return theme.palette.error.main;
      default:
        return theme.palette.success.main;
    }
  };

  const handleItemClick = (item: any) => {
    const type = isTablesView ? 'table' : 'column';
    navigate(`/detail/${type}/${item.id}`);
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
              Data Catalog
            </Typography>
          </Breadcrumbs>
        </Box>

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
            <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Storage sx={{ fontSize: 32, color: 'primary.main' }} />
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}
                >
                  Data Catalog
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  Explore tables and columns across JPMorgan Chase databases. 
                  Click on any item to view detailed information.
                </Typography>
              </Box>
            </Stack>

            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search tables, columns, descriptions..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton sx={{ color: 'primary.main' }}>
                      <FilterList />
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
          </Paper>

          {/* Tabs and Content */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden',
            }}
          >
            {/* Tabs */}
            <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                sx={{
                  px: 3,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                  },
                }}
              >
                <Tab
                  icon={<TableChart />}
                  iconPosition="start"
                  label={`Tables (${tablesData.length})`}
                />
                <Tab
                  icon={<ViewColumn />}
                  iconPosition="start"
                  label={`Columns (${columnsData.length})`}
                />
              </Tabs>
            </Box>

            {/* Results Header */}
            <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {filteredData.length} {isTablesView ? 'Tables' : 'Columns'} Found
                  {searchQuery && (
                    <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                      for "{searchQuery}"
                    </Typography>
                  )}
                </Typography>
                <Chip
                  label={`Page ${currentPage} of ${Math.ceil(filteredData.length / itemsPerPage)}`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>

            {/* Data Table */}
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.grey[50], 0.5) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    {isTablesView ? (
                      <>
                        <TableCell sx={{ fontWeight: 600 }}>Database</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Rows</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Columns</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={{ fontWeight: 600 }}>Table</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Data Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                      </>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>Classification</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((item: any) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          cursor: 'pointer',
                        },
                      }}
                      onClick={() => handleItemClick(item)}
                    >
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography sx={{ fontWeight: 600 }}>
                            {item.displayName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                          >
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                            {item.description}
                          </Typography>
                        </Stack>
                      </TableCell>
                      
                      {isTablesView ? (
                        <>
                          <TableCell>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                              {item.database}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {item.rowCount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600 }}>
                              {item.columns}
                            </Typography>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                              {item.table}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.dataType}
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
                            {item.primaryKey && <Chip label="PK" size="small" color="primary" />}
                          </TableCell>
                        </>
                      )}
                      
                      <TableCell>
                        <Chip
                          label={item.classification}
                          size="small"
                          sx={{
                            bgcolor: alpha(getStatusColor(item.classification), 0.1),
                            color: getStatusColor(item.classification),
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.owner}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <IconButton
                          size="small"
                          sx={{ color: 'primary.main' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={Math.ceil(filteredData.length / itemsPerPage)}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default DataListPage;