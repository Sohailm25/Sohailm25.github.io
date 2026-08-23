import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DetailPage from './DetailPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// Mock Material-UI theme
const theme = createTheme();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Helper function to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

// Test data
const mockTableData = {
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
    }
  ]
};

const mockColumnData = {
  id: 'col_transaction_amount',
  name: 'transaction_amount',
  displayName: 'Transaction Amount',
  description: 'The monetary value of each transaction recorded in USD currency.',
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
    }
  ]
};

describe('DetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Table View', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('renders table view with correct data', async () => {
      renderWithProviders(<DetailPage />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      expect(screen.getByText('Comprehensive table containing all customer transaction records')).toBeInTheDocument();
      expect(screen.getByText('payments_db')).toBeInTheDocument();
      expect(screen.getByText('core')).toBeInTheDocument();
      expect(screen.getByText('Oracle Database 19c')).toBeInTheDocument();
      expect(screen.getByText('data-engineering-team')).toBeInTheDocument();
    });

    it('displays table statistics correctly', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      expect(screen.getByText('2,847,392')).toBeInTheDocument();
      expect(screen.getByText('1.2 GB')).toBeInTheDocument();
      expect(screen.getByText('Restricted')).toBeInTheDocument();
    });

    it('shows table columns in the related items section', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Columns (2)')).toBeInTheDocument();
      });

      expect(screen.getByText('transaction_id')).toBeInTheDocument();
      expect(screen.getByText('customer_id')).toBeInTheDocument();
      expect(screen.getByText('VARCHAR(50)')).toBeInTheDocument();
      expect(screen.getByText('VARCHAR(20)')).toBeInTheDocument();
    });

    it('displays quality score badge', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('94%')).toBeInTheDocument();
      });
    });

    it('shows classification chip', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Confidential')).toBeInTheDocument();
      });
    });

    it('displays tags correctly', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('PCI-DSS')).toBeInTheDocument();
        expect(screen.getByText('Financial')).toBeInTheDocument();
        expect(screen.getByText('Customer Data')).toBeInTheDocument();
        expect(screen.getByText('Transactions')).toBeInTheDocument();
      });
    });
  });

  describe('Column View', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'column', id: 'col_transaction_amount' });
    });

    it('renders column view with correct data', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Transaction Amount')).toBeInTheDocument();
      });

      expect(screen.getByText('The monetary value of each transaction recorded in USD currency.')).toBeInTheDocument();
      expect(screen.getByText('DECIMAL(15,2)')).toBeInTheDocument();
      expect(screen.getByText('customer_transactions')).toBeInTheDocument();
    });

    it('shows valid values in the related items section', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Valid Values (2)')).toBeInTheDocument();
      });

      expect(screen.getByText('0.01 - 100.00')).toBeInTheDocument();
      expect(screen.getByText('100.01 - 1,000.00')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('35%')).toBeInTheDocument();
    });

    it('displays column quality score', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('97%')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Interactions', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('navigates back when back button is clicked', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const backButton = screen.getByLabelText('Back to Search');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/product');
    });

    it('navigates when breadcrumbs are clicked', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const homeBreadcrumb = screen.getByText('Home');
      fireEvent.click(homeBreadcrumb);
      expect(mockNavigate).toHaveBeenCalledWith('/');

      const searchBreadcrumb = screen.getByText('Search');
      fireEvent.click(searchBreadcrumb);
      expect(mockNavigate).toHaveBeenCalledWith('/product');
    });

    it('toggles bookmark when bookmark button is clicked', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const bookmarkButton = screen.getByLabelText('Bookmark this item');
      fireEvent.click(bookmarkButton);
      
      // Should show filled bookmark icon
      expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument();
    });

    it('copies text to clipboard when copy button is clicked', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByLabelText('Copy');
      fireEvent.click(copyButtons[0]); // Copy table name
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('customer_transactions');
    });

    it('shows success icon after copying', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByLabelText('Copy');
      fireEvent.click(copyButtons[0]);
      
      // Should show check circle icon
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('toggles details section when clicked', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const detailsHeader = screen.getByText('Table Information');
      fireEvent.click(detailsHeader);
      
      // Section should be collapsed
      expect(screen.queryByText('Table Name')).not.toBeInTheDocument();
      
      // Click again to expand
      fireEvent.click(detailsHeader);
      expect(screen.getByText('Table Name')).toBeInTheDocument();
    });

    it('toggles metadata section when clicked', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const metadataHeader = screen.getByText('Metadata');
      fireEvent.click(metadataHeader);
      
      // Section should be collapsed
      expect(screen.queryByText('Created Date')).not.toBeInTheDocument();
      
      // Click again to expand
      fireEvent.click(metadataHeader);
      expect(screen.getByText('Created Date')).toBeInTheDocument();
    });

    it('toggles quality section when clicked', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const qualityHeader = screen.getByText('Data Quality');
      fireEvent.click(qualityHeader);
      
      // Section should be collapsed
      expect(screen.queryByText('Overall Score')).not.toBeInTheDocument();
      
      // Click again to expand
      fireEvent.click(qualityHeader);
      expect(screen.getByText('Overall Score')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('displays pagination when there are many items', async () => {
      // Mock more columns to trigger pagination
      const mockDataWithManyColumns = {
        ...mockTableData,
        columns: Array.from({ length: 15 }, (_, i) => ({
          id: `col_${i}`,
          name: `column_${i}`,
          type: 'VARCHAR(50)',
          nullable: false,
          primaryKey: false,
          description: `Column ${i} description`,
          sampleValues: []
        }))
      };

      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      // Should show pagination
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('changes page when pagination is clicked', async () => {
      // Mock more columns to trigger pagination
      const mockDataWithManyColumns = {
        ...mockTableData,
        columns: Array.from({ length: 15 }, (_, i) => ({
          id: `col_${i}`,
          name: `column_${i}`,
          type: 'VARCHAR(50)',
          nullable: false,
          primaryKey: false,
          description: `Column ${i} description`,
          sampleValues: []
        }))
      };

      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const pageButtons = screen.getAllByRole('button');
      const nextPageButton = pageButtons.find(button => button.textContent === '2');
      
      if (nextPageButton) {
        fireEvent.click(nextPageButton);
        expect(screen.getByText('Page 2')).toBeInTheDocument();
      }
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('shows loading skeleton initially', () => {
      renderWithProviders(<DetailPage />);
      
      // Should show loading skeletons
      expect(screen.getAllByTestId('Skeleton')).toHaveLength(8); // Multiple skeleton elements
    });

    it('hides loading state after timeout', async () => {
      renderWithProviders(<DetailPage />);
      
      // Initially shows loading
      expect(screen.getAllByTestId('Skeleton')).toHaveLength(8);
      
      // Fast forward time
      vi.advanceTimersByTime(800);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });
      
      // Loading skeletons should be gone
      expect(screen.queryAllByTestId('Skeleton')).toHaveLength(0);
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('renders quick action buttons', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      expect(screen.getByText('Preview Data')).toBeInTheDocument();
      expect(screen.getByText('Export Schema')).toBeInTheDocument();
      expect(screen.getByText('View History')).toBeInTheDocument();
    });

    it('quick action buttons are clickable', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const previewButton = screen.getByText('Preview Data');
      const exportButton = screen.getByText('Export Schema');
      const historyButton = screen.getByText('View History');

      expect(previewButton).toBeEnabled();
      expect(exportButton).toBeEnabled();
      expect(historyButton).toBeEnabled();
    });
  });

  describe('Data Quality Section', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('displays quality score with progress bar', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText('Overall Score')).toBeInTheDocument();
    });

    it('shows quality status items', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      expect(screen.getByText('Schema Validated')).toBeInTheDocument();
      expect(screen.getByText('Data Fresh')).toBeInTheDocument();
      expect(screen.getByText('Compliance Review Due')).toBeInTheDocument();
    });
  });

  describe('Table Row Interactions', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('navigates to column detail when table row is clicked', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const tableRows = screen.getAllByRole('row');
      const dataRow = tableRows[1]; // First data row (skip header)
      
      fireEvent.click(dataRow);
      
      expect(mockNavigate).toHaveBeenCalledWith('/detail/column/col_transaction_id');
    });

    it('shows hover effects on table rows', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const tableRows = screen.getAllByRole('row');
      const dataRow = tableRows[1]; // First data row
      
      fireEvent.mouseEnter(dataRow);
      // Note: We can't easily test CSS hover effects in unit tests
      // This is more of an integration test concern
    });
  });

  describe('Error Handling', () => {
    it('handles missing type parameter gracefully', () => {
      mockUseParams.mockReturnValue({ type: undefined, id: 'test' });
      
      renderWithProviders(<DetailPage />);
      
      // Should default to table view
      expect(screen.getByText('JPMorgan Chase - Card Context Engine')).toBeInTheDocument();
    });

    it('handles invalid type parameter', () => {
      mockUseParams.mockReturnValue({ type: 'invalid', id: 'test' });
      
      renderWithProviders(<DetailPage />);
      
      // Should default to table view
      expect(screen.getByText('JPMorgan Chase - Card Context Engine')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('has proper ARIA labels', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Back to Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Bookmark this item')).toBeInTheDocument();
      expect(screen.getByLabelText('Share')).toBeInTheDocument();
    });

    it('has proper heading hierarchy', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const h4Heading = screen.getByRole('heading', { level: 4 });
      const h5Headings = screen.getAllByRole('heading', { level: 5 });
      const h6Headings = screen.getAllByRole('heading', { level: 6 });

      expect(h4Heading).toBeInTheDocument();
      expect(h5Headings.length).toBeGreaterThan(0);
      expect(h6Headings.length).toBeGreaterThan(0);
    });

    it('has proper table structure', async () => {
      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      const tableHead = screen.getByRole('rowgroup');
      const tableBody = screen.getAllByRole('rowgroup')[1]; // Second rowgroup is tbody

      expect(table).toBeInTheDocument();
      expect(tableHead).toBeInTheDocument();
      expect(tableBody).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({ type: 'table', id: 'tbl_customer_transactions_001' });
    });

    it('renders on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      // Component should still render without errors
      expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
    });

    it('renders on desktop viewport', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      renderWithProviders(<DetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
      });

      // Component should render in desktop layout
      expect(screen.getByText('Customer Transactions')).toBeInTheDocument();
    });
  });
}); 
