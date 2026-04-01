'use client';
import { useBudget } from '@/lib/store';
import { BUDGET_CATEGORIES } from '@/lib/constants';
import { StatCard } from '@/components/ui/Card';
import Card from '@/components/ui/Card';
import CompanySummary from '@/components/layout/CompanySummary';
import { formatCurrency, formatPercent, calcExecutionRate } from '@/lib/utils';
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
  const { data, isGeneral } = useBudget();
  if (!data) return null;
  return isGeneral ? <GeneralOverview /> : <ConstructionOverview />;
}

/* ─── 건설현장 대시보드 (기존) ─── */
function ConstructionOverview() {
  const { data, selectedCompanyId, selectedPeriod, selectedYear } = useBudget();
  if (!data) return null;

  const { project, companies, budgetPlans, executionRecords } = data;
  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;

  const budgetPlanFilter = (bp) => {
    if (selectedPeriod === 'total') {
      return bp.period === 'total' && (selectedCompanyId === 'all' || bp.companyId === selectedCompanyId);
    }
    return bp.period === 'yearly' && bp.year === selectedYear && (selectedCompanyId === 'all' || bp.companyId === selectedCompanyId);
  };

  const totalBudget = budgetPlans
    .filter(budgetPlanFilter)
    .reduce((sum, bp) => sum + bp.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

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
      name: cat.name,
      예산: planned,
      집행: executed,
      집행률: planned > 0 ? ((executed / planned) * 100).toFixed(1) : 0,
    };
  });

  const maxBarValue = Math.max(...categoryData.map((c) => Math.max(c.예산, c.집행)), 1);

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
      value: executed,
    };
  });

  const now = new Date();
  const currentMonthRecords = executionRecords.filter((r) => {
    if (selectedCompanyId !== 'all' && r.companyId !== selectedCompanyId) return false;
    return r.year === now.getFullYear() && r.month === now.getMonth() + 1;
  });
  const currentMonthTotal = currentMonthRecords.reduce(
    (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    0
  );

  const totalPlanned = categoryData.reduce((s, c) => s + c.예산, 0);
  const totalExec = categoryData.reduce((s, c) => s + c.집행, 0);

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card title={`${periodLabel} 법정 항목별 예산 대비 집행 현황`} noPad>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs w-14">코드</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs">항목명</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs w-28">예산</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs w-28">집행</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs w-16">집행률</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs w-24">
                      <div className="flex items-center gap-2">
                        <span>집행 현황</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-normal text-gray-400">
                          <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-[#E0F7F5] border border-primary/30" />예산</span>
                          <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-primary" />집행</span>
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
                        <td className="px-3 py-2.5 text-right text-xs text-gray-500 whitespace-nowrap">{formatCurrency(cat.예산)}원</td>
                        <td className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap">{formatCurrency(cat.집행)}원</td>
                        <td className={`px-3 py-2.5 text-right text-xs font-semibold ${rate > 100 ? 'text-red-500' : rate > 80 ? 'text-amber-500' : 'text-primary'}`}>
                          {formatPercent(rate)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="space-y-1 w-40">
                            <div className="bg-gray-100 rounded h-2 overflow-hidden">
                              <div className="h-full bg-[#E0F7F5] border border-primary/20 rounded transition-all" style={{ width: `${budgetPct}%` }} />
                            </div>
                            <div className="bg-gray-100 rounded h-2 overflow-hidden">
                              <div className={`h-full rounded transition-all ${rate > 100 ? 'bg-red-400' : rate > 80 ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${execPct}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold text-xs">
                    <td className="px-3 py-2.5" colSpan={2}>합계</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(totalPlanned)}원</td>
                    <td className="px-3 py-2.5 text-right text-primary">{formatCurrency(totalExec)}원</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${calcExecutionRate(totalExec, totalPlanned) > 100 ? 'text-red-500' : 'text-primary'}`}>
                      {formatPercent(calcExecutionRate(totalExec, totalPlanned))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
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
                <Tooltip formatter={(value) => [`${formatCurrency(value)}원`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <CompanySummary />
    </div>
  );
}

/* ─── 일반사업장 대시보드 ─── */
function GeneralOverview() {
  const { data, activeCompanies, activeBudgetPlans, activeExecutionRecords, selectedYear } = useBudget();
  if (!data) return null;

  const now = new Date();
  const year = selectedYear;

  // 해당 연도 예산 합계
  const yearPlans = activeBudgetPlans.filter((bp) => bp.year === year);
  const totalBudget = yearPlans.reduce(
    (sum, bp) => sum + (bp.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0),
    0
  );

  // 해당 연도 집행 합계
  const yearRecords = activeExecutionRecords.filter((r) => r.year === year);
  const totalExecuted = yearRecords.reduce(
    (sum, rec) => sum + (rec.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0),
    0
  );

  const executionRate = calcExecutionRate(totalExecuted, totalBudget);
  const remaining = totalBudget - totalExecuted;

  // 당월 집행
  const currentMonthTotal = activeExecutionRecords
    .filter((r) => r.year === now.getFullYear() && r.month === now.getMonth() + 1)
    .reduce((sum, rec) => sum + (rec.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

  // 회사별 집행 파이 데이터
  const companyPieData = activeCompanies.map((comp) => {
    const executed = yearRecords
      .filter((r) => r.companyId === comp.id)
      .reduce((sum, rec) => sum + (rec.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);
    return { name: comp.name.replace(/\(주\)/g, '').replace(/주식회사\s*/gi, '').trim(), value: executed };
  }).filter((d) => d.value > 0);

  // 항목별 통합 테이블 (고유 항목명 수집)
  const getPlan = (companyId) => yearPlans.find((bp) => bp.companyId === companyId);
  const allItemNames = [...new Set(
    activeCompanies.flatMap((comp) => (getPlan(comp.id)?.items || []).map((i) => i.name))
  )].filter(Boolean);

  // 항목별 예산/집행 집계
  const itemRows = allItemNames.map((itemName) => {
    const budgetTotal = activeCompanies.reduce((sum, comp) => {
      const plan = getPlan(comp.id);
      const item = (plan?.items || []).find((i) => i.name === itemName);
      return sum + (item ? Number(item.amount) || 0 : 0);
    }, 0);
    const execTotal = yearRecords.reduce((sum, rec) => {
      const item = (rec.items || []).find((i) => i.name === itemName);
      return sum + (item ? Number(item.amount) || 0 : 0);
    }, 0);
    const rate = budgetTotal > 0 ? (execTotal / budgetTotal) * 100 : 0;
    return { name: itemName, budget: budgetTotal, executed: execTotal, rate };
  });

  const maxBarValue = Math.max(...itemRows.map((r) => Math.max(r.budget, r.executed)), 1);

  return (
    <div className="space-y-4">
      {/* 1. 스탯 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={`${year}년 예산`}
          value={`${formatCurrency(totalBudget)}원`}
          sub={data.project?.totalRevenue > 0 ? `매출 대비 ${((totalBudget / data.project.totalRevenue) * 100).toFixed(2)}%` : '예산 편성'}
          icon={Wallet}
          color="primary"
        />
        <StatCard
          label={`${year}년 집행액`}
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

      {/* 2. 항목별 예산·집행 현황 + 회사별 파이차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card title={`${year}년 항목별 예산 대비 집행 현황`} noPad>
            {itemRows.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">예산 항목이 없습니다. 예산수립 탭에서 항목을 추가하세요.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs">항목명</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs w-28">예산</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs w-28">집행</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs w-16">집행률</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs w-24">
                        <div className="flex items-center gap-2">
                          <span>집행 현황</span>
                          <div className="flex items-center gap-1.5 text-[10px] font-normal text-gray-400">
                            <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-[#E0F7F5] border border-primary/30" />예산</span>
                            <span className="flex items-center gap-0.5"><span className="inline-block w-2 h-2 rounded-sm bg-primary" />집행</span>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemRows.map((row, idx) => {
                      const budgetPct = maxBarValue > 0 ? (row.budget / maxBarValue) * 100 : 0;
                      const execPct = maxBarValue > 0 ? (row.executed / maxBarValue) * 100 : 0;
                      return (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-800">{row.name}</td>
                          <td className="px-3 py-2.5 text-right text-xs text-gray-500 whitespace-nowrap">{formatCurrency(row.budget)}원</td>
                          <td className="px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap">{formatCurrency(row.executed)}원</td>
                          <td className={`px-3 py-2.5 text-right text-xs font-semibold ${row.rate > 100 ? 'text-red-500' : row.rate > 80 ? 'text-amber-500' : 'text-primary'}`}>
                            {formatPercent(row.rate)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="space-y-1 w-40">
                              <div className="bg-gray-100 rounded h-2 overflow-hidden">
                                <div className="h-full bg-[#E0F7F5] border border-primary/20 rounded transition-all" style={{ width: `${budgetPct}%` }} />
                              </div>
                              <div className="bg-gray-100 rounded h-2 overflow-hidden">
                                <div className={`h-full rounded transition-all ${row.rate > 100 ? 'bg-red-400' : row.rate > 80 ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${execPct}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold text-xs">
                      <td className="px-3 py-2.5">합계</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(totalBudget)}원</td>
                      <td className="px-3 py-2.5 text-right text-primary">{formatCurrency(totalExecuted)}원</td>
                      <td className={`px-3 py-2.5 text-right ${executionRate > 100 ? 'text-red-500' : 'text-primary'}`}>{formatPercent(executionRate)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* 회사별 파이차트 */}
        <Card title={`${year}년 회사별 집행 비율`}>
          <div className="h-64">
            {companyPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">집행 데이터 없음</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={companyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {companyPieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${formatCurrency(value)}원`]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* 3. 관계사별 예산·집행 현황 */}
      <CompanySummary />
    </div>
  );
}
