import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { CreatePDFPage } from './pages/CreatePDFPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { VerificationPage } from './pages/VerificationPage';
import { CombinerPage } from './pages/CombinerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/create-pdf" element={<CreatePDFPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/processing/:id" element={<ProcessingPage />} />
        <Route path="/verification/:id" element={<VerificationPage />} />
        <Route path="/combiner" element={<CombinerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
