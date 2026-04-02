'use client';
import { useState, useEffect } from 'react';
import { BudgetProvider, useBudget } from '@/lib/store';
import { TABS, ASIDE_TABS, DEFAULT_YEARS } from '@/lib/constants';
import TabNav from '@/components/ui/TabNav';
import BudgetOverview from '@/components/tabs/BudgetOverview';
import BudgetPlan from '@/components/tabs/BudgetPlan';
import ExecutionRecord from '@/components/tabs/ExecutionRecord';
import Statistics from '@/components/tabs/Statistics';
import CompanyManagement from '@/components/tabs/CompanyManagement';
import DevGuide from '@/components/tabs/DevGuide';
import Tutorial from '@/components/ui/Tutorial';
import { HelpCircle, HardHat, Building } from 'lucide-react';

/* ─── 기간 선택 (중앙) ─── */
function PeriodSelector() {
  const { data, selectedPeriod, setSelectedPeriod, selectedYear, setSelectedYear } = useBudget();
  if (!data) return null;

  const isConstruction = data.project?.siteCategory !== 'general';

  const handleTotalClick = () => {
    if (!isConstruction) return;
    setSelectedPeriod('total');
  };

  return (
    <div className="flex items-center gap-3" data-tutorial="period">
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        {/* 전체기간: 건설업만 가능 */}
        <div className="relative group">
          <button
            onClick={handleTotalClick}
            disabled={!isConstruction}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedPeriod === 'total' && isConstruction
                ? 'bg-primary text-white'
                : isConstruction
                ? 'bg-white text-gray-500 hover:bg-gray-50'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            전체기간
          </button>
          {/* 툴팁 */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-800 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-lg">
            {isConstruction
              ? '건설업 사업장에서 사용 가능'
              : '일반사업장은 년도별만 선택 가능 · 사업장 생성 시 설정됨'}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
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

/* ─── 헤더 좌측: 회사명 + 현장명 + 사업장구분 ─── */
function HeaderLeft() {
  const { data, updateProject, selectedPeriod, setSelectedPeriod } = useBudget();
  if (!data) return null;

  const primaryCompany = data.companies?.find((c) => c.type === 'primary');
  const siteCategory = data.project?.siteCategory || 'construction';

  const handleCategoryChange = (val) => {
    updateProject({ siteCategory: val });
    // 일반사업장 선택 시 전체기간이면 년도별로 전환
    if (val === 'general' && selectedPeriod === 'total') {
      setSelectedPeriod('yearly');
    }
  };

  return (
    <div className="flex items-center gap-4 min-w-0">
      {/* 회사명 강조 */}
      {primaryCompany && (
        <div className="hidden md:flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
            {primaryCompany.name.replace(/주식회사\s*/gi, '').replace(/\(주\)/g, '').trim().charAt(0)}
          </div>
          <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
            {primaryCompany.name}
          </span>
        </div>
      )}

      {/* 구분선 */}
      {primaryCompany && (
        <div className="hidden md:block w-px h-5 bg-gray-200 shrink-0" />
      )}

      {/* 현장명 */}
      <p className="text-xs text-gray-400 truncate hidden sm:block max-w-[180px]">
        {data.project?.name || ''}
      </p>

      {/* 사업장 구분 라디오 */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 shrink-0">
        <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors select-none ${
          siteCategory === 'construction'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
        }`}>
          <input
            type="radio"
            name="siteCategory"
            value="construction"
            checked={siteCategory === 'construction'}
            onChange={() => handleCategoryChange('construction')}
            className="sr-only"
          />
          <HardHat size={13} />
          <span className="hidden sm:inline">건설현장</span>
        </label>
        <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors select-none ${
          siteCategory === 'general'
            ? 'bg-white text-gray-700 shadow-sm'
            : 'text-gray-400 hover:text-gray-600'
        }`}>
          <input
            type="radio"
            name="siteCategory"
            value="general"
            checked={siteCategory === 'general'}
            onChange={() => handleCategoryChange('general')}
            className="sr-only"
          />
          <Building size={13} />
          <span className="hidden sm:inline">일반사업장</span>
        </label>
      </div>
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
      case 'overview': return <BudgetOverview />;
      case 'plan': return <BudgetPlan />;
      case 'execution': return <ExecutionRecord />;
      case 'statistics': return <Statistics />;
      case 'companies': return <CompanyManagement />;
      case 'devguide': return <DevGuide />;
      default: return <BudgetOverview />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FFFE]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* 좌측: 회사명 + 현장명 + 사업장구분 */}
          <HeaderLeft />

          {/* 중앙: 기간 선택 */}
          <PeriodSelector />

          {/* 우측: 도움말 + 사용자 */}
          <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </header>

      <TabNav tabs={TABS} asideTabs={ASIDE_TABS} activeTab={activeTab} onChange={setActiveTab} maxWidth="1280px" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto p-4 sm:p-6 space-y-4">
          {renderTab()}
        </div>
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
