'use client';
import { useState } from 'react';
import { useBudget } from '@/lib/store';
import CompanyLogo from '@/components/ui/CompanyLogo';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CompanySummary() {
  const {
    data, isGeneral,
    activeCompanies, activeBudgetPlans, activeExecutionRecords,
    selectedPeriod, selectedYear,
  } = useBudget();
  const [expanded, setExpanded] = useState(true);

  if (!data) return null;

  const isTotal = selectedPeriod === 'total' && !isGeneral;

  // 회사별 데이터 계산 (기본)
  const baseCompanyRows = activeCompanies.map((company) => {
    const getBudget = (period, year) => {
      const plan = activeBudgetPlans.find((bp) =>
        bp.companyId === company.id &&
        (period === 'total' ? bp.period === 'total' : bp.period === 'yearly' && bp.year === year)
      );
      return plan ? plan.items.reduce((s, i) => s + (Number(i.amount) || 0), 0) : 0;
    };

    const getExecuted = (year) =>
      activeExecutionRecords
        .filter((r) => r.companyId === company.id && (year == null || r.year === year))
        .reduce((sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

    const totalBudget = getBudget('total');
    const yearBudget = getBudget('yearly', selectedYear);
    const totalExecuted = getExecuted(null);
    const yearExecuted = getExecuted(selectedYear);

    return {
      company,
      totalBudget,
      totalExecuted,
      totalRate: totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0,
      totalRemaining: totalBudget - totalExecuted,
      yearBudget,
      yearExecuted,
      yearRate: yearBudget > 0 ? (yearExecuted / yearBudget) * 100 : 0,
      yearRemaining: yearBudget - yearExecuted,
    };
  });

  // 원도급 포함 처리: includedInPrimary=true인 협력사 집행액을 원도급사에 합산
  const includedSubs = activeCompanies.filter((c) => c.includedInPrimary);
  const companyRows = baseCompanyRows.map((row) => {
    if (row.company.type === 'primary' && includedSubs.length > 0) {
      const extraTotalExecuted = includedSubs.reduce((sum, sub) => {
        const sr = baseCompanyRows.find((r) => r.company.id === sub.id);
        return sum + (sr?.totalExecuted || 0);
      }, 0);
      const extraYearExecuted = includedSubs.reduce((sum, sub) => {
        const sr = baseCompanyRows.find((r) => r.company.id === sub.id);
        return sum + (sr?.yearExecuted || 0);
      }, 0);
      const extraTotalBudget = includedSubs.reduce((sum, sub) => {
        const sr = baseCompanyRows.find((r) => r.company.id === sub.id);
        return sum + (sr?.totalBudget || 0);
      }, 0);
      const extraYearBudget = includedSubs.reduce((sum, sub) => {
        const sr = baseCompanyRows.find((r) => r.company.id === sub.id);
        return sum + (sr?.yearBudget || 0);
      }, 0);
      const newTotalExecuted = row.totalExecuted + extraTotalExecuted;
      const newYearExecuted = row.yearExecuted + extraYearExecuted;
      const newTotalBudget = row.totalBudget + extraTotalBudget;
      const newYearBudget = row.yearBudget + extraYearBudget;
      return {
        ...row,
        totalExecuted: newTotalExecuted,
        totalBudget: newTotalBudget,
        totalRate: newTotalBudget > 0 ? (newTotalExecuted / newTotalBudget) * 100 : 0,
        totalRemaining: newTotalBudget - newTotalExecuted,
        yearExecuted: newYearExecuted,
        yearBudget: newYearBudget,
        yearRate: newYearBudget > 0 ? (newYearExecuted / newYearBudget) * 100 : 0,
        yearRemaining: newYearBudget - newYearExecuted,
      };
    }
    return row;
  });

  // 합계
  const totals = companyRows.reduce(
    (acc, row) => ({
      totalBudget: acc.totalBudget + row.totalBudget,
      totalExecuted: acc.totalExecuted + row.totalExecuted,
      yearBudget: acc.yearBudget + row.yearBudget,
      yearExecuted: acc.yearExecuted + row.yearExecuted,
    }),
    { totalBudget: 0, totalExecuted: 0, yearBudget: 0, yearExecuted: 0 }
  );
  totals.totalRate = totals.totalBudget > 0 ? (totals.totalExecuted / totals.totalBudget) * 100 : 0;
  totals.yearRate = totals.yearBudget > 0 ? (totals.yearExecuted / totals.yearBudget) * 100 : 0;

  const fmtAmt = (val) => `${formatCurrency(val)}원`;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-extrabold text-gray-800">관계사별 예산·집행 현황</h3>
          <span className="text-xs text-gray-400 hidden sm:inline">
            ({activeCompanies.length}개사{!isTotal && ` · ${selectedYear}년 기준`})
          </span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600" rowSpan={2}>관계사</th>
                {isTotal && (
                  <th className="px-3 py-1.5 text-center font-semibold text-gray-500 text-xs border-b border-gray-200" colSpan={4}>
                    전체기간
                  </th>
                )}
                <th className="px-3 py-1.5 text-center font-semibold text-primary text-xs border-b border-gray-200 border-l border-gray-200" colSpan={4}>
                  {selectedYear}년
                </th>
              </tr>
              <tr className="bg-gray-50/50">
                {isTotal && (
                  <>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">예산</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">집행</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">잔액</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">집행률</th>
                  </>
                )}
                <th className="px-3 py-2 text-right text-xs font-medium text-primary border-l border-gray-200">예산</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-primary">집행</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-primary">잔액</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-primary">집행률</th>
              </tr>
            </thead>
            <tbody>
              {companyRows.map((row) => (
                <tr key={row.company.id} className="border-b border-gray-50 hover:bg-primary-light/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <CompanyLogo company={row.company} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{row.company.name}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="text-[10px] text-gray-400">{row.company.type === 'primary' ? '원도급사' : '협력사'}</p>
                          {row.company.includedInPrimary && (
                            <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded-full font-medium">원도급 포함</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {isTotal && (
                    <>
                      <td className="px-3 py-2.5 text-right text-xs text-gray-600 whitespace-nowrap">{fmtAmt(row.totalBudget)}</td>
                      <td className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap">{fmtAmt(row.totalExecuted)}</td>
                      <td className={`px-3 py-2.5 text-right text-xs whitespace-nowrap ${row.totalRemaining < 0 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                        {fmtAmt(row.totalRemaining)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[40px]">
                            <div className={`h-1.5 rounded-full ${row.totalRate > 100 ? 'bg-red-400' : row.totalRate > 80 ? 'bg-amber-400' : 'bg-primary'}`}
                              style={{ width: `${Math.min(row.totalRate, 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 w-10 text-right">{formatPercent(row.totalRate)}</span>
                        </div>
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2.5 text-right text-xs text-gray-600 border-l border-gray-100 whitespace-nowrap">{fmtAmt(row.yearBudget)}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap">{fmtAmt(row.yearExecuted)}</td>
                  <td className={`px-3 py-2.5 text-right text-xs whitespace-nowrap ${row.yearRemaining < 0 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    {fmtAmt(row.yearRemaining)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[40px]">
                        <div className={`h-1.5 rounded-full ${row.yearRate > 100 ? 'bg-red-400' : row.yearRate > 80 ? 'bg-amber-400' : 'bg-primary'}`}
                          style={{ width: `${Math.min(row.yearRate, 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500 w-10 text-right">{formatPercent(row.yearRate)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold text-xs">
                <td className="px-4 py-2.5 font-bold text-gray-800">합계</td>
                {isTotal && (
                  <>
                    <td className="px-3 py-2.5 text-right">{fmtAmt(totals.totalBudget)}</td>
                    <td className="px-3 py-2.5 text-right text-primary">{fmtAmt(totals.totalExecuted)}</td>
                    <td className="px-3 py-2.5 text-right">{fmtAmt(totals.totalBudget - totals.totalExecuted)}</td>
                    <td className="px-3 py-2.5 text-center">{formatPercent(totals.totalRate)}</td>
                  </>
                )}
                <td className="px-3 py-2.5 text-right border-l border-gray-200">{fmtAmt(totals.yearBudget)}</td>
                <td className="px-3 py-2.5 text-right text-primary">{fmtAmt(totals.yearExecuted)}</td>
                <td className="px-3 py-2.5 text-right">{fmtAmt(totals.yearBudget - totals.yearExecuted)}</td>
                <td className="px-3 py-2.5 text-center">{formatPercent(totals.yearRate)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
