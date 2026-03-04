'use client';
import { X, Building2, Users, ChevronDown, FileText, CheckCircle2, Clock, AlertTriangle, Settings } from 'lucide-react';
import { useBudget } from '@/lib/store';
import { useState } from 'react';
import { DEFAULT_YEARS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import CompanyLogo from '@/components/ui/CompanyLogo';
import { LogoWhite } from '@/components/ui/Logo';

export default function Sidebar({ isOpen, onClose }) {
  const {
    data, selectedCompanyId, setSelectedCompanyId,
    selectedPeriod, setSelectedPeriod, selectedYear, setSelectedYear,
  } = useBudget();
  const [companyOpen, setCompanyOpen] = useState(true);

  if (!data) return null;

  const { project, companies, monthlyReports, budgetPlans } = data;

  // 원도급사 이름
  const primaryCompany = companies.find((c) => c.type === 'primary');
  const primaryName = primaryCompany?.name || '원도급사';

  // 기간에 따른 안전관리비 계산
  const yearlyBudgetTotal = budgetPlans
    .filter((bp) => bp.period === 'yearly' && bp.year === selectedYear)
    .reduce((sum, bp) => sum + bp.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);
  const displayBudget = selectedPeriod === 'total' ? project.totalSafetyBudget : yearlyBudgetTotal;

  // 보고서 현황 계산 (선택 년도)
  const yearReports = monthlyReports.filter((r) => r.year === selectedYear);
  const approvedCount = yearReports.filter((r) => r.status === 'approved').length;
  const pendingCount = yearReports.filter((r) => r.status === 'submitted' || r.status === 'draft').length;
  const rejectedCount = yearReports.filter((r) => r.status === 'rejected').length;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-sidebar text-white z-50
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
          <LogoWhite size="md" />
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Project Info */}
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-xs text-gray-400 mb-1">{primaryName}</p>
          <p className="text-sm font-medium leading-snug">{project.name}</p>
          <p className="text-xs text-gray-400 mt-2">계약번호: {project.contractNo}</p>
          <p className="text-xs text-gray-400">
            공사기간: {project.startDate} ~ {project.endDate}
          </p>
        </div>

        {/* 기간 선택 + 안전관리비 */}
        <div className="px-5 py-3 border-b border-white/10">
          <div className="flex rounded-lg overflow-hidden border border-white/20 mb-2">
            <div className="relative flex-1 group">
              <button
                onClick={() => setSelectedPeriod('total')}
                className={`w-full py-1.5 text-xs font-medium transition-colors ${
                  selectedPeriod === 'total'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
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
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                selectedPeriod === 'yearly'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              년도별
            </button>
          </div>
          {selectedPeriod === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-primary mb-2 [&>option]:text-gray-900"
            >
              {DEFAULT_YEARS.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          )}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-400">
              {selectedPeriod === 'total' ? '안전관리비 총액' : `${selectedYear}년 안전관리비`}
            </p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(displayBudget)}
              <span className="text-xs font-normal text-gray-400 ml-1">원</span>
            </p>
          </div>
        </div>

        {/* 보고서 현황 - 년도별일 때만 표시 */}
        {selectedPeriod === 'yearly' && (
          <div className="px-5 py-3 border-b border-white/10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FileText size={12} />
              {selectedYear}년 보고서 현황
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-500/15 rounded-lg px-2 py-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle2 size={10} className="text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">{approvedCount}</span>
                </div>
                <p className="text-[9px] text-emerald-400/80">승인</p>
              </div>
              <div className="bg-amber-500/15 rounded-lg px-2 py-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Clock size={10} className="text-amber-400" />
                  <span className="text-lg font-bold text-amber-400">{pendingCount}</span>
                </div>
                <p className="text-[9px] text-amber-400/80">대기</p>
              </div>
              <div className="bg-red-500/15 rounded-lg px-2 py-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <AlertTriangle size={10} className="text-red-400" />
                  <span className="text-lg font-bold text-red-400">{rejectedCount}</span>
                </div>
                <p className="text-[9px] text-red-400/80">반려</p>
              </div>
            </div>
          </div>
        )}

        {/* Company List */}
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => setCompanyOpen(!companyOpen)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <Users size={14} />
              <span>관계사 ({companies.length})</span>
            </div>
            <ChevronDown size={14} className={`transition-transform ${companyOpen ? '' : '-rotate-90'}`} />
          </button>

          {companyOpen && (
            <div className="px-3 pb-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedCompanyId('all')}
                  className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedCompanyId === 'all'
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Building2 size={16} />
                  <span className="flex-1 text-left">전체</span>
                </button>
                <button
                  onClick={() => alert('세이프버디 > 환경설정 > 협력사 관리로 이동')}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-[10px] text-gray-400 hover:bg-white/10 hover:text-primary transition-colors whitespace-nowrap"
                  title="협력사 설정"
                >
                  <Settings size={12} />
                  <span className="hidden xl:inline">협력사 설정</span>
                </button>
              </div>

              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompanyId(company.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedCompanyId === company.id
                      ? 'bg-primary/20 text-primary'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <CompanyLogo company={company} size="sm" />
                  <span className="flex-1 text-left truncate">{company.name}</span>
                  <span className="text-xs text-gray-500">{company.budgetRatio}%</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-white/10 text-[10px] text-gray-600 flex items-center justify-between">
          <span>SAFE BUDDY v1.0</span>
          <span>산업안전보건법</span>
        </div>
      </aside>
    </>
  );
}
