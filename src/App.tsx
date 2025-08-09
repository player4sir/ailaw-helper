import React, { useState } from 'react';
import { Scale, CheckCircle } from 'lucide-react';
import CaseAnalysis from './components/CaseAnalysis';
import DocumentGenerator from './components/DocumentGenerator';
import LawQuery from './components/LawQuery';
import Navigation from './components/Navigation';
import LegalConsultation from './components/LegalConsultation'; // 新增：法律咨询

function App() {
  const [activeTab, setActiveTab] = useState('analysis');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'analysis':
        return <CaseAnalysis />;
      case 'documents':
        return <DocumentGenerator />;
      case 'laws':
        return <LawQuery />;
      case 'consult':
        return <LegalConsultation />; // 新增：法律咨询
      default:
        return <CaseAnalysis />;
    }
  };

  return (
    <div className="min-h-screen-mobile bg-gradient-to-br from-slate-50 to-blue-50 mobile-tap">
      {/* 移除全局 Header：保持页面简洁 */}

      {/* Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content - 保持边距 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-20 sm:pb-8">
        {renderActiveComponent()}
      </main>
    </div>
  );
}

export default App;