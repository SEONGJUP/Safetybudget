'use client';
import { useState, useEffect } from 'react';
import { BudgetProvider, useBudget } from '@/lib/store';
import { TABS, DEFAULT_YEARS } from '@/lib/constants';
import TabNav from '@/components/ui/TabNav';
import BudgetOverview from '@/components/tabs/BudgetOverview';
import BudgetPlan from '@/components/tabs/BudgetPlan';
import ExecutionRecord from '@/components/tabs/ExecutionRecord';
import Statistics from '@/components/tabs/Statistics';
import Tutorial from '@/components/ui/Tutorial';
import { HelpCircle } from 'lucide-react';

function PeriodSelector() {
  const { data, selectedPeriod, setSelectedPeriod, selectedYear, setSelectedYear } = useBudget();
  if (!data) return null;

  return (
    <div className="flex items-center gap-3" data-tutorial="period">
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        <div className="relative group">
          <button
            onClick={() => setSelectedPeriod('total')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedPeriod === 'total'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            전체기간
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-lg">
            사업장이 &quot;건설업&quot;인 경우
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </div>
        <button
          onClick={() => setSelectedPeriod('yearly')}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedPeriod === 'yearly'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          년도별
        </button>
      </div>
      {selectedPeriod === 'yearly' && (
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {DEFAULT_YEARS.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
      )}
    </div>
  );
}

function AppContent() {
  const { data, activeTab, setActiveTab } = useBudget();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (data && !localStorage.getItem('tutorial_done')) {
      const timer = setTimeout(() => setShowTutorial(true), 600);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FFFE]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">시스템 로딩 중...</p>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <BudgetOverview />;
      case 'plan':
        return <BudgetPlan />;
      case 'execution':
        return <ExecutionRecord />;
      case 'statistics':
        return <Statistics />;
      default:
        return <BudgetOverview />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FFFE]">
      {/* 상단 헤더: 로고 + 기간선택 + 사용자 */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <p className="text-xs text-gray-400">{data?.project?.name || ''}</p>
          </div>
        </div>
        <PeriodSelector />
        <div className="flex items-center gap-2">
          <button
            data-tutorial="help"
            onClick={() => setShowTutorial(true)}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-primary/10 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
            title="사용 안내"
          >
            <HelpCircle size={16} />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            관
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">관리자</span>
        </div>
      </header>

      <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {renderTab()}
      </main>

      {showTutorial && (
        <Tutorial onComplete={() => {
          setShowTutorial(false);
          localStorage.setItem('tutorial_done', '1');
        }} />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <BudgetProvider>
      <AppContent />
    </BudgetProvider>
  );
}
