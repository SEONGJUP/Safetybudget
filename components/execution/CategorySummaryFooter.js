'use client';
import { BUDGET_CATEGORIES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { calcDetailsTotal } from '@/lib/categoryFields';

export default function CategorySummaryFooter({
  categoryId,
  currentDetails,
  budgetPlans,
  executionRecords,
  companyId,
  year,
  month,
}) {
  const cat = BUDGET_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;

  // 계상액 (계획): 해당 카테고리의 연간 예산
  const planAmount = budgetPlans
    .filter((bp) => bp.companyId === companyId && ((bp.period === 'yearly' && bp.year === year) || bp.period === 'total'))
    .reduce((sum, bp) => {
      const item = bp.items.find((i) => i.categoryId === categoryId);
      return sum + (item ? Number(item.amount) || 0 : 0);
    }, 0);

  // 전월까지 누계(A): 해당 연도, 해당 월 이전까지의 집행 합계
  const prevMonthTotal = executionRecords
    .filter((er) => er.companyId === companyId && er.year === year && er.month < month)
    .reduce((sum, er) => {
      const item = er.items.find((i) => i.categoryId === categoryId);
      return sum + (item ? Number(item.amount) || 0 : 0);
    }, 0);

  // 금월(B): 현재 상세 내역의 합계
  const currentMonth = calcDetailsTotal(categoryId, currentDetails);

  // 누계(A+B)
  const cumulative = prevMonthTotal + currentMonth;

  const cells = [
    { label: '계상액(계획)', value: planAmount, color: 'text-gray-700' },
    { label: '전월까지 누계(A)', value: prevMonthTotal, color: 'text-blue-600' },
    { label: '금월(B)', value: currentMonth, color: 'text-primary' },
    { label: '누계(A+B)', value: cumulative, color: 'text-gray-900' },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
      <div className="grid grid-cols-4 divide-x divide-gray-200">
        {cells.map((cell) => (
          <div key={cell.label} className="px-3 py-3 text-center bg-gray-50">
            <p className="text-[10px] text-gray-500 mb-1">{cell.label}</p>
            <p className={`text-sm font-bold tabular-nums ${cell.color}`}>
              {formatCurrency(cell.value)}
              <span className="text-[10px] text-gray-400 ml-0.5">원</span>
            </p>
          </div>
        ))}
      </div>
      {planAmount > 0 && (
        <div className="px-3 py-1.5 bg-white border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>집행률</span>
          <span className={`font-bold ${cumulative / planAmount > 1 ? 'text-red-500' : 'text-primary'}`}>
            {planAmount > 0 ? ((cumulative / planAmount) * 100).toFixed(1) : 0}%
          </span>
        </div>
      )}
    </div>
  );
}
