import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import LandingPage from './LandingPage';
import ProductPage from './ProductPage';
import DataListPage from './DataListPage';
import DetailPage from './DetailPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/product" element={<ProductPage />} />
          <Route path="/data" element={<DataListPage />} />
          <Route path="/detail/:type/:id" element={<DetailPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
