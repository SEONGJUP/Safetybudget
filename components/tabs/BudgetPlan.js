'use client';
import { useState } from 'react';
import { useBudget } from '@/lib/store';
import { BUDGET_CATEGORIES } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import CompanyLogo from '@/components/ui/CompanyLogo';
import { formatCurrency, formatPercent, calcExecutionRate, generateId } from '@/lib/utils';
import { Save, Send, Edit3 } from 'lucide-react';

export default function BudgetPlan() {
  const { data, saveBudgetPlan, selectedPeriod, selectedYear } = useBudget();
  const [editModal, setEditModal] = useState(null);

  if (!data) return null;

  const { companies, budgetPlans, executionRecords } = data;

  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;

  // 각 회사별 예산 plan 가져오기
  const getCompanyPlan = (companyId) => {
    return budgetPlans.find((bp) => {
      if (bp.companyId !== companyId) return false;
      if (selectedPeriod === 'total') return bp.period === 'total';
      return bp.period === 'yearly' && bp.year === selectedYear;
    });
  };

  // 예산 또는 실적이 있는 회사만 필터
  const activeCompanies = companies.filter((comp) => {
    const hasPlan = budgetPlans.some((bp) => {
      if (bp.companyId !== comp.id) return false;
      if (selectedPeriod === 'total') return bp.period === 'total';
      return bp.period === 'yearly' && bp.year === selectedYear;
    });
    const hasExecution = executionRecords.some((r) => {
      if (r.companyId !== comp.id) return false;
      if (selectedPeriod === 'yearly') return r.year === selectedYear;
      return true;
    });
    return hasPlan || hasExecution;
  });

  // 카테고리별·회사별 금액 매트릭스
  const matrixData = BUDGET_CATEGORIES.map((cat) => {
    const row = { category: cat };
    let rowTotal = 0;
    activeCompanies.forEach((comp) => {
      const plan = getCompanyPlan(comp.id);
      const item = plan?.items.find((i) => i.categoryId === cat.id);
      const amount = item ? Number(item.amount) || 0 : 0;
      row[comp.id] = amount;
      rowTotal += amount;
    });
    row.total = rowTotal;
    return row;
  });

  // 회사별 합계
  const companyTotals = {};
  activeCompanies.forEach((comp) => {
    companyTotals[comp.id] = matrixData.reduce((sum, row) => sum + (row[comp.id] || 0), 0);
  });
  const grandTotal = Object.values(companyTotals).reduce((s, v) => s + v, 0);

  // 집행액 합계
  const totalExecuted = executionRecords
    .filter((r) => {
      if (selectedPeriod === 'yearly' && r.year !== selectedYear) return false;
      return true;
    })
    .reduce((sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

  const execRate = calcExecutionRate(totalExecuted, grandTotal);
  const remaining = grandTotal - totalExecuted;

  // 승인된 회사 수
  const approvedCount = activeCompanies.filter((c) => getCompanyPlan(c.id)?.status === 'approved').length;

  // 회사별 결재 상태
  const getCompanyStatus = (companyId) => {
    const plan = getCompanyPlan(companyId);
    return plan?.status || null;
  };

  return (
    <div className="space-y-4">
      {/* 예산·승인 요약 */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 bg-white rounded-xl border border-gray-100 px-5 py-3">
        <span className="text-sm text-gray-500">{periodLabel} 예산 <strong className="text-gray-900">{formatCurrency(grandTotal)}원</strong></span>
        <span className="text-sm text-gray-500">집행 <strong className="text-primary">{formatCurrency(totalExecuted)}원</strong> <span className="text-xs text-gray-400">({formatPercent(execRate)})</span></span>
        <span className="text-sm text-gray-500">잔여 <strong className={remaining >= 0 ? 'text-gray-900' : 'text-red-500'}>{formatCurrency(remaining)}원</strong></span>
        <span className="text-sm text-gray-500">승인 <strong className="text-gray-900">{approvedCount}</strong><span className="text-gray-400">/{activeCompanies.length}개사</span></span>
      </div>

      {/* 회사별 예산 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {activeCompanies.map((comp) => {
          const plan = getCompanyPlan(comp.id);
          const total = companyTotals[comp.id] || 0;
          return (
            <div
              key={comp.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setEditModal({ plan, company: comp })}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <CompanyLogo company={comp} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{comp.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {comp.type === 'primary' ? '원도급사' : '협력사'} · 배분 {comp.budgetRatio}%
                  </p>
                </div>
                {plan && <Badge status={plan.status} />}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400">예산액</p>
                  <p className="text-base font-extrabold text-gray-900">{formatCurrency(total)}원</p>
                </div>
                <Button variant="ghost" size="sm" icon={Edit3}>편집</Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 회사별 컬럼 매트릭스 테이블 */}
      <Card title={`예산편성 현황 (${periodLabel})`} noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[140px]">
                  코드
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 sticky left-[140px] bg-gray-50 z-10 min-w-[120px]">
                  항목
                </th>
                {activeCompanies.map((comp) => (
                  <th key={comp.id} className="px-3 py-3 text-right min-w-[130px]">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <CompanyLogo company={comp} size="xs" />
                        <span className="font-semibold text-gray-700 text-xs whitespace-nowrap">
                          {comp.name.replace(/\(주\)/g, '').trim()}
                        </span>
                      </div>
                      {getCompanyStatus(comp.id) && (
                        <Badge status={getCompanyStatus(comp.id)} />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-bold text-gray-800 min-w-[120px] bg-primary-light/30">
                  합계
                </th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row) => (
                <tr key={row.category.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-500 sticky left-0 bg-white z-10">
                    {row.category.code}
                  </td>
                  <td className="px-4 py-2.5 font-medium sticky left-[140px] bg-white z-10 whitespace-nowrap">
                    {row.category.shortName}
                  </td>
                  {activeCompanies.map((comp) => (
                    <td key={comp.id} className="px-3 py-2.5 text-right text-gray-700 tabular-nums">
                      {row[comp.id] > 0 ? formatCurrency(row[comp.id]) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right font-bold text-primary tabular-nums bg-primary-light/10">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td className="px-4 py-3 sticky left-0 bg-gray-50 z-10" colSpan={2}>
                  합계 (원)
                </td>
                {activeCompanies.map((comp) => (
                  <td key={comp.id} className="px-3 py-3 text-right tabular-nums">
                    {formatCurrency(companyTotals[comp.id])}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-primary tabular-nums bg-primary-light/30">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* 편집 모달 */}
      {editModal && (
        <BudgetPlanEditModal
          plan={editModal.plan}
          company={editModal.company}
          periodFilter={selectedPeriod}
          yearFilter={selectedYear}
          onSave={(plan) => {
            saveBudgetPlan(plan);
            setEditModal(null);
          }}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}

function BudgetPlanEditModal({ plan, company, periodFilter, yearFilter, onSave, onClose }) {
  const initialItems = plan
    ? [...plan.items]
    : BUDGET_CATEGORIES.map((cat) => ({ categoryId: cat.id, amount: 0, note: '' }));

  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState(plan?.status || 'draft');

  const handleAmountChange = (categoryId, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.categoryId === categoryId ? { ...item, amount: value } : item
      )
    );
  };

  const handleNoteChange = (categoryId, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.categoryId === categoryId ? { ...item, note: value } : item
      )
    );
  };

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const handleSave = (newStatus) => {
    onSave({
      id: plan?.id || generateId(),
      companyId: company.id,
      period: periodFilter,
      year: periodFilter === 'yearly' ? yearFilter : null,
      items,
      status: newStatus || status,
      totalAmount: total,
      createdAt: plan?.createdAt || new Date().toISOString().slice(0, 10),
      approvedAt: newStatus === 'approved' ? new Date().toISOString().slice(0, 10) : plan?.approvedAt,
    });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CompanyLogo company={company} size="sm" />
          <span>{company.name} 예산편성</span>
        </div>
      }
      size="lg"
    >
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-gray-600 w-16">코드</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">항목</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-600 w-44">예산액(원)</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 w-36">비고</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const cat = BUDGET_CATEGORIES.find((c) => c.id === item.categoryId);
                return (
                  <tr key={item.categoryId} className="border-b border-gray-50">
                    <td className="px-3 py-2 text-gray-500">{cat?.code}</td>
                    <td className="px-3 py-2 text-sm">{cat?.shortName}</td>
                    <td className="px-3 py-2">
                      <CurrencyInput
                        value={item.amount}
                        onChange={(val) => handleAmountChange(item.categoryId, val)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleNoteChange(item.categoryId, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="비고"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-primary-light font-bold">
                <td className="px-3 py-2.5" colSpan={2}>합계</td>
                <td className="px-3 py-2.5 text-right text-primary">{formatCurrency(total)}원</td>
                <td className="px-3 py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button variant="outline" icon={Save} onClick={() => handleSave('draft')}>
            임시저장
          </Button>
          <Button icon={Send} onClick={() => handleSave('submitted')}>
            검토요청
          </Button>
        </div>
      </div>
    </Modal>
  );
}
