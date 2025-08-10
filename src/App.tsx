import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { Scale, CheckCircle } from 'lucide-react';
import CaseAnalysis from './components/CaseAnalysis';
import DocumentGenerator from './components/DocumentGenerator';
import LawQuery from './components/LawQuery';
import Navigation from './components/Navigation';
import LegalConsultation from './components/LegalConsultation';
import DocumentsResult from './pages/DocumentsResult'; // 新增：法律咨询

function App() {
  const location = useLocation();
  const topLevel = location.pathname.split('/')[1] || 'analysis';

  return (
    <div className="min-h-screen-mobile bg-gradient-to-br from-slate-50 to-blue-50 mobile-tap">
      {/* 移除全局 Header：保持页面简洁 */}

      {/* Navigation */}
      <Navigation activeTab={topLevel} setActiveTab={() => {}} />

      {/* Main Content - 保持边距 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-20 sm:pb-8">
        <Routes>
          <Route path="/" element={<Navigate to="/analysis" replace />} />
          <Route path="/analysis" element={<CaseAnalysis />} />
          <Route path="/documents" element={<DocumentGenerator />} />
          <Route path="/documents/result" element={<DocumentsResult />} />
          <Route path="/laws" element={<LawQuery />} />
          <Route path="/consult" element={<LegalConsultation />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;