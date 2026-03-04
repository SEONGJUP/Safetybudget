'use client';
import { useBudget } from '@/lib/store';
import { BUDGET_CATEGORIES } from '@/lib/constants';
import { StatCard } from '@/components/ui/Card';
import Card from '@/components/ui/Card';
import CompanySummary from '@/components/layout/CompanySummary';
import { formatCurrency, formatPercent, formatThousand, calcExecutionRate } from '@/lib/utils';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#00B7AF', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#EC4899', '#6366F1', '#14B8A6'];

export default function BudgetOverview() {
  const { data, selectedCompanyId, selectedPeriod, selectedYear } = useBudget();

  if (!data) return null;

  const { project, companies, budgetPlans, executionRecords } = data;

  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;

  // 기간에 따른 예산 필터
  const budgetPlanFilter = (bp) => {
    if (selectedPeriod === 'total') {
      return bp.period === 'total' && (selectedCompanyId === 'all' || bp.companyId === selectedCompanyId);
    }
    return bp.period === 'yearly' && bp.year === selectedYear && (selectedCompanyId === 'all' || bp.companyId === selectedCompanyId);
  };

  const totalBudget = budgetPlans
    .filter(budgetPlanFilter)
    .reduce((sum, bp) => sum + bp.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

  // 기간에 따른 집행액
  const filteredRecords = executionRecords.filter((r) => {
    if (selectedCompanyId !== 'all' && r.companyId !== selectedCompanyId) return false;
    if (selectedPeriod === 'yearly' && r.year !== selectedYear) return false;
    return true;
  });

  const totalExecuted = filteredRecords.reduce(
    (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    0
  );

  const executionRate = calcExecutionRate(totalExecuted, totalBudget);
  const remaining = totalBudget - totalExecuted;

  // 카테고리별 집행현황
  const categoryData = BUDGET_CATEGORIES.map((cat) => {
    const executed = filteredRecords.reduce((sum, rec) => {
      const item = rec.items.find((i) => i.categoryId === cat.id);
      return sum + (item ? Number(item.amount) || 0 : 0);
    }, 0);

    const planned = budgetPlans
      .filter(budgetPlanFilter)
      .reduce((sum, bp) => {
        const item = bp.items.find((i) => i.categoryId === cat.id);
        return sum + (item ? Number(item.amount) || 0 : 0);
      }, 0);

    return {
      name: cat.shortName,
      예산: Math.round(planned / 1000),
      집행: Math.round(executed / 1000),
      집행률: planned > 0 ? ((executed / planned) * 100).toFixed(1) : 0,
    };
  });

  // 인라인 바 차트용 최대값
  const maxBarValue = Math.max(...categoryData.map((c) => Math.max(c.예산, c.집행)), 1);

  // 회사별 현황 (Pie chart)
  const companyData = companies.map((comp) => {
    const compRecords = executionRecords.filter((r) => {
      if (r.companyId !== comp.id) return false;
      if (selectedPeriod === 'yearly' && r.year !== selectedYear) return false;
      return true;
    });
    const executed = compRecords.reduce(
      (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
      0
    );
    return {
      name: comp.name.replace(/\(주\)/g, '').trim(),
      value: Math.round(executed / 1000),
    };
  });

  // 당월 집행
  const now = new Date();
  const currentMonthRecords = executionRecords.filter((r) => {
    if (selectedCompanyId !== 'all' && r.companyId !== selectedCompanyId) return false;
    return r.year === now.getFullYear() && r.month === now.getMonth() + 1;
  });
  const currentMonthTotal = currentMonthRecords.reduce(
    (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    0
  );

  // 합계
  const totalPlanned = categoryData.reduce((s, c) => s + c.예산, 0);
  const totalExec = categoryData.reduce((s, c) => s + c.집행, 0);

  return (
    <div className="space-y-4">
      {/* 1. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={`${periodLabel} 예산`}
          value={`${formatCurrency(totalBudget)}원`}
          sub={selectedPeriod === 'total' ? `요율 ${project.safetyBudgetRate}%` : `전체 대비 ${project.totalSafetyBudget > 0 ? ((totalBudget / project.totalSafetyBudget) * 100).toFixed(0) : 0}%`}
          icon={Wallet}
          color="primary"
        />
        <StatCard
          label={`${periodLabel} 집행액`}
          value={`${formatCurrency(totalExecuted)}원`}
          sub={`집행률 ${formatPercent(executionRate)}`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          label="잔여 예산"
          value={`${formatCurrency(remaining)}원`}
          sub={`${formatPercent(remaining > 0 ? 100 - executionRate : 0)} 잔여`}
          icon={remaining > 0 ? CheckCircle2 : AlertTriangle}
          color={remaining > 0 ? 'success' : 'danger'}
        />
        <StatCard
          label="당월 집행"
          value={`${formatCurrency(currentMonthTotal)}원`}
          sub={`${now.getFullYear()}년 ${now.getMonth() + 1}월`}
          icon={Clock}
          color="warning"
        />
      </div>

      {/* 2. 관계사별 예산·집행 현황 (좌 3/4) + 관계사별 집행 비율 파이차트 (우 1/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <CompanySummary />
        </div>
        <Card title={`${periodLabel} 관계사별 집행 비율`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={companyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {companyData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${formatCurrency(value)}천원`]} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 3. 법정 항목별 집행 현황 (인라인 예산/집행 바 포함) */}
      <Card title={`${periodLabel} 법정 항목별 예산 대비 집행 현황`} noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs w-14">코드</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs">항목명</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs w-20">예산</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs w-20">집행</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs w-16">집행률</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">
                  <div className="flex items-center gap-3">
                    <span>예산 대비 집행</span>
                    <div className="flex items-center gap-2 text-[10px] font-normal text-gray-400">
                      <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-[#E0F7F5] border border-primary/30" />예산</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-primary" />집행</span>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {categoryData.map((cat, idx) => {
                const rate = Number(cat.집행률);
                const budgetPct = maxBarValue > 0 ? (cat.예산 / maxBarValue) * 100 : 0;
                const execPct = maxBarValue > 0 ? (cat.집행 / maxBarValue) * 100 : 0;
                return (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-gray-400">{BUDGET_CATEGORIES[idx].code}</td>
                    <td className="px-3 py-2.5 text-xs font-medium text-gray-800">{cat.name}</td>
                    <td className="px-3 py-2.5 text-right text-xs text-gray-500 whitespace-nowrap">{formatCurrency(cat.예산)}</td>
                    <td className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap">{formatCurrency(cat.집행)}</td>
                    <td className={`px-3 py-2.5 text-right text-xs font-semibold ${rate > 100 ? 'text-red-500' : rate > 80 ? 'text-amber-500' : 'text-primary'}`}>
                      {formatPercent(rate)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="space-y-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-50 rounded h-3 overflow-hidden">
                            <div
                              className="h-full bg-[#E0F7F5] border border-primary/20 rounded transition-all"
                              style={{ width: `${budgetPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 w-12 text-right">{formatCurrency(cat.예산)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-50 rounded h-3 overflow-hidden">
                            <div
                              className={`h-full rounded transition-all ${rate > 100 ? 'bg-red-400' : rate > 80 ? 'bg-amber-400' : 'bg-primary'}`}
                              style={{ width: `${execPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium w-12 text-right">{formatCurrency(cat.집행)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold text-xs">
                <td className="px-3 py-2.5" colSpan={2}>합계 (천원)</td>
                <td className="px-3 py-2.5 text-right">{formatCurrency(totalPlanned)}</td>
                <td className="px-3 py-2.5 text-right text-primary">{formatCurrency(totalExec)}</td>
                <td className={`px-3 py-2.5 text-right font-semibold ${executionRate > 100 ? 'text-red-500' : 'text-primary'}`}>
                  {formatPercent(executionRate)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                        <div className="h-full bg-[#E0F7F5] border border-primary/20 rounded" style={{ width: '100%' }} />
                      </div>
                      <span className="text-[10px] text-gray-400 w-12 text-right">{formatCurrency(totalPlanned)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded"
                          style={{ width: `${totalPlanned > 0 ? Math.min((totalExec / totalPlanned) * 100, 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium w-12 text-right">{formatCurrency(totalExec)}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
