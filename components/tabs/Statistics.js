'use client';
import { useState, useMemo } from 'react';
import { useBudget } from '@/lib/store';
import { BUDGET_CATEGORIES, MONTHS, DEFAULT_YEARS } from '@/lib/constants';
import Card from '@/components/ui/Card';
import { formatCurrency, formatPercent, formatThousand, calcExecutionRate } from '@/lib/utils';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#00B7AF', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#EC4899', '#6366F1', '#14B8A6'];

export default function Statistics() {
  const { data, selectedPeriod, selectedYear, selectedCompanyId } = useBudget();

  if (!data) return null;

  const { companies, executionRecords, budgetPlans } = data;

  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;

  // 기본 필터 (회사)
  const companyFilteredRecords = executionRecords.filter((r) => {
    if (selectedCompanyId !== 'all' && r.companyId !== selectedCompanyId) return false;
    return true;
  });

  // 기간 필터된 레코드
  const periodRecords = selectedPeriod === 'yearly'
    ? companyFilteredRecords.filter((r) => r.year === selectedYear)
    : companyFilteredRecords;

  // 1. 월별 집행 추이 (천원 단위)
  const monthlyTrend = MONTHS.map((name, idx) => {
    const month = idx + 1;
    const total = periodRecords
      .filter((r) => r.month === month)
      .reduce((sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);
    return { name, 집행액: Math.round(total / 1000) };
  });

  // 누적 추이
  let cumulative = 0;
  const cumulativeTrend = monthlyTrend.map((item) => {
    cumulative += item.집행액;
    return { ...item, 누적: cumulative };
  });

  // 2. 년도별 비교 (천원 단위)
  const yearlyComparison = DEFAULT_YEARS.map((year) => {
    const total = companyFilteredRecords
      .filter((r) => r.year === year)
      .reduce((sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

    const yearPlan = budgetPlans
      .filter(
        (bp) =>
          bp.period === 'yearly' &&
          bp.year === year &&
          (selectedCompanyId === 'all' || bp.companyId === selectedCompanyId)
      )
      .reduce((sum, bp) => sum + bp.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

    return {
      name: `${year}년`,
      예산: Math.round(yearPlan / 1000),
      집행: Math.round(total / 1000),
      집행률: yearPlan > 0 ? ((total / yearPlan) * 100).toFixed(1) : 0,
    };
  });

  // 3. 카테고리별 집행 (천원 단위)
  const categoryBreakdown = BUDGET_CATEGORIES.map((cat) => {
    const total = periodRecords.reduce((sum, rec) => {
      const item = rec.items.find((i) => i.categoryId === cat.id);
      return sum + (item ? Number(item.amount) || 0 : 0);
    }, 0);
    return { name: cat.shortName, value: Math.round(total / 1000) };
  });

  // 4. 회사별 집행 (천원 단위)
  const companyBreakdown = companies.map((comp) => {
    const total = executionRecords
      .filter((r) => {
        if (r.companyId !== comp.id) return false;
        if (selectedPeriod === 'yearly' && r.year !== selectedYear) return false;
        return true;
      })
      .reduce((sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);
    return {
      name: comp.name.replace(/\(주\)/g, '').trim(),
      집행액: Math.round(total / 1000),
    };
  });

  // 5. 회사별 월 추이 (천원 단위)
  const companyMonthly = MONTHS.map((name, idx) => {
    const month = idx + 1;
    const row = { name };
    companies.forEach((comp) => {
      const total = executionRecords
        .filter((r) => {
          if (r.companyId !== comp.id || r.month !== month) return false;
          if (selectedPeriod === 'yearly' && r.year !== selectedYear) return false;
          return true;
        })
        .reduce((sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);
      row[comp.name.replace(/\(주\)/g, '').trim()] = Math.round(total / 1000);
    });
    return row;
  });

  return (
    <div className="space-y-4">
      {/* 월별 집행 추이 + 누적 */}
      <Card title={`${periodLabel} 월별 집행 추이`}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B7AF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00B7AF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString()}`} />
              <Tooltip
                formatter={(value, name) => [`${Number(value).toLocaleString()}천원`, name]}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="누적"
                stroke="#00B7AF"
                fill="url(#colorExec)"
                strokeWidth={2}
              />
              <Bar dataKey="집행액" fill="#00B7AF" radius={[4, 4, 0, 0]} opacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-gray-400 text-right mt-1">단위: 천원</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 년도별 비교 */}
        <Card title="년도별 예산 대비 집행 비교">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyComparison} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString()}`} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()}천원`]}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="예산" fill="#E0F7F5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="집행" fill="#00B7AF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1">단위: 천원</p>
        </Card>

        {/* 카테고리별 파이차트 */}
        <Card title={`${periodLabel} 항목별 집행 비율`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown.filter((c) => c.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}천원`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 회사별 집행 비교 */}
      <Card title={`${periodLabel} 관계사별 집행 현황`}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={companyBreakdown}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString()}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()}천원`]}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="집행액" fill="#00B7AF" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-gray-400 text-right mt-1">단위: 천원</p>
      </Card>

      {/* 회사별 월 추이 */}
      <Card title={`${periodLabel} 관계사별 월별 집행 추이`}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={companyMonthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toLocaleString()}`} />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()}천원`]}
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              {companies.map((comp, idx) => (
                <Line
                  key={comp.id}
                  type="monotone"
                  dataKey={comp.name.replace(/\(주\)/g, '').trim()}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-gray-400 text-right mt-1">단위: 천원</p>
      </Card>

      {/* 집행률 요약 테이블 (원 단위) */}
      <Card title="년도별 집행률 요약" noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold">년도</th>
                <th className="px-4 py-3 text-right font-semibold">예산(원)</th>
                <th className="px-4 py-3 text-right font-semibold">집행(원)</th>
                <th className="px-4 py-3 text-right font-semibold">잔액(원)</th>
                <th className="px-4 py-3 text-right font-semibold">집행률</th>
                <th className="px-4 py-3 text-left font-semibold w-32">진행도</th>
              </tr>
            </thead>
            <tbody>
              {yearlyComparison.map((row) => {
                const rate = Number(row.집행률);
                const remaining = row.예산 - row.집행;
                return (
                  <tr key={row.name} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.예산 * 1000)}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      {formatCurrency(row.집행 * 1000)}
                    </td>
                    <td className={`px-4 py-3 text-right ${remaining < 0 ? 'text-red-500' : ''}`}>
                      {formatCurrency(remaining * 1000)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatPercent(rate)}</td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${rate > 100 ? 'bg-red-400' : rate > 80 ? 'bg-amber-400' : 'bg-primary'}`}
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
