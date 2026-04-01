'use client';
import { useState } from 'react';
import { useBudget } from '@/lib/store';
import { BUDGET_CATEGORIES } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import CompanyLogo from '@/components/ui/CompanyLogo';
import SafetyBudgetCalculatorModal from './SafetyBudgetCalculatorModal';
import { formatCurrency, formatPercent, calcExecutionRate, generateId } from '@/lib/utils';
import {
  Save, Edit3, Plus, Trash2, Calculator,
  ChevronRight, AlertTriangle,
  Search, Building2, ArrowRight,
} from 'lucide-react';

/* ════════════════════════════════════════════
   메인 진입점 – 사업장 유형에 따라 분기
════════════════════════════════════════════ */
export default function BudgetPlan() {
  const { isGeneral } = useBudget();
  return isGeneral ? <GeneralBudgetPlan /> : <ConstructionBudgetPlan />;
}

/* ════════════════════════════════════════════
   건설현장 예산수립
════════════════════════════════════════════ */
function ConstructionBudgetPlan() {
  const {
    data, activeCompanies, activeBudgetPlans, activeExecutionRecords,
    saveCurrentBudgetPlan, selectedPeriod, selectedYear,
    addCurrentCompany, removeCurrentCompany, updateCurrentCompany,
    updateProject, setActiveTab,
  } = useBudget();
  const [editModal, setEditModal] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);

  if (!data) return null;
  const { project } = data;
  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;
  const calculatedBudget = project?.calculatedSafetyBudget || 0;

  const primaryCompany = activeCompanies.find((c) => c.type === 'primary');
  const subCompanies = activeCompanies.filter((c) => c.type === 'sub');
  const orderedCompanies = [primaryCompany, ...subCompanies].filter(Boolean);

  const getCompanyPlan = (companyId) =>
    activeBudgetPlans.find((bp) => {
      if (bp.companyId !== companyId) return false;
      if (selectedPeriod === 'total') return bp.period === 'total';
      return bp.period === 'yearly' && bp.year === selectedYear;
    });

  const matrixData = BUDGET_CATEGORIES.map((cat) => {
    const row = { category: cat };
    let grandSum = 0;
    orderedCompanies.forEach((comp) => {
      const plan = getCompanyPlan(comp.id);
      const item = plan?.items.find((i) => i.categoryId === cat.id);
      const amount = item ? Number(item.amount) || 0 : 0;
      row[comp.id] = amount;
      if (!comp.includedInPrimary) grandSum += amount;
    });
    row.grandTotal = grandSum;
    return row;
  });

  const companyTotals = {};
  orderedCompanies.forEach((comp) => {
    companyTotals[comp.id] = matrixData.reduce((s, row) => s + (row[comp.id] || 0), 0);
  });

  const grandTotal = orderedCompanies
    .filter((c) => !c.includedInPrimary)
    .reduce((s, c) => s + (companyTotals[c.id] || 0), 0);

  const totalExecuted = activeExecutionRecords
    .filter((r) => selectedPeriod === 'yearly' ? r.year === selectedYear : true)
    .reduce((sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

  const execRate = calcExecutionRate(totalExecuted, grandTotal);
  const diffFromCalc = calculatedBudget - grandTotal;

  return (
    <div className="space-y-4">
      {/* 계상 헤더 */}
      <ConstructionSiteBudgetHeader
        project={project}
        calculatedBudget={calculatedBudget}
        grandTotal={grandTotal}
        diffFromCalc={diffFromCalc}
        execRate={execRate}
        onOpenCalculator={() => setShowCalculator(true)}
        onUpdateContractAmount={(val) => updateProject({ totalContractAmount: val })}
      />

      {/* 회사 카드 (가로 스크롤) */}
      <CompanyCardRow
        primaryCompany={primaryCompany}
        subCompanies={subCompanies}
        getTotal={(id) => companyTotals[id] || 0}
        getPlan={getCompanyPlan}
        grandTotal={grandTotal}
        calculatedBudget={calculatedBudget}
        diffFromCalc={diffFromCalc}
        onEdit={(comp) => setEditModal({ plan: getCompanyPlan(comp.id), company: comp })}
        onRemove={removeCurrentCompany}
        onToggleIncluded={(comp) => updateCurrentCompany(comp.id, { includedInPrimary: !comp.includedInPrimary })}
        onAddCompany={() => setShowAddCompany(true)}
      />

      {/* 매트릭스 테이블 */}
      <Card title={`예산편성 현황 (${periodLabel})`} noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: `${300 + orderedCompanies.length * 150}px` }}>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 w-12">코드</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 sticky left-12 bg-gray-50 z-10 w-40">항목</th>
                <th className="px-3 py-3 text-right font-bold text-primary min-w-[130px] bg-primary/5">전체 합계</th>
                {primaryCompany && (
                  <th className="px-3 py-3 text-right min-w-[140px]">
                    <CompanyColHeader company={primaryCompany} label="원도급사" />
                  </th>
                )}
                {subCompanies.map((comp) => (
                  <th key={comp.id} className="px-3 py-3 text-right min-w-[140px]">
                    <CompanyColHeader company={comp} includedInPrimary={comp.includedInPrimary} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row) => (
                <tr key={row.category.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-400 sticky left-0 bg-white z-10 text-xs">{row.category.code}</td>
                  <td className="px-4 py-2.5 font-medium sticky left-12 bg-white z-10 text-xs whitespace-nowrap">{row.category.shortName}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-primary tabular-nums bg-primary/5">
                    {row.grandTotal > 0 ? formatCurrency(row.grandTotal) : <span className="text-gray-300">-</span>}
                  </td>
                  {primaryCompany && (
                    <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">
                      {(row[primaryCompany.id] || 0) > 0 ? formatCurrency(row[primaryCompany.id]) : <span className="text-gray-300">-</span>}
                    </td>
                  )}
                  {subCompanies.map((comp) => (
                    <td key={comp.id} className={`px-3 py-2.5 text-right tabular-nums ${comp.includedInPrimary ? 'bg-amber-50/50 text-amber-700' : 'text-gray-700'}`}>
                      {(row[comp.id] || 0) > 0 ? formatCurrency(row[comp.id]) : <span className="text-gray-300">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td className="px-4 py-3 sticky left-0 bg-gray-50 z-10 text-xs" colSpan={2}>합계 (원)</td>
                <td className="px-3 py-3 text-right text-primary tabular-nums bg-primary/5">{formatCurrency(grandTotal)}</td>
                {primaryCompany && <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(companyTotals[primaryCompany.id] || 0)}</td>}
                {subCompanies.map((comp) => (
                  <td key={comp.id} className={`px-3 py-3 text-right tabular-nums ${comp.includedInPrimary ? 'bg-amber-50 text-amber-700' : ''}`}>
                    {formatCurrency(companyTotals[comp.id] || 0)}
                  </td>
                ))}
              </tr>
              {calculatedBudget > 0 && (
                <tr className="border-t border-dashed border-gray-200 text-xs">
                  <td colSpan={2} className="px-4 py-2 sticky left-0 bg-white z-10 text-gray-400">계상액 대비</td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${diffFromCalc >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {diffFromCalc >= 0 ? '+' : ''}{formatCurrency(diffFromCalc)}
                  </td>
                  <td colSpan={subCompanies.length + 1} />
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </Card>

      {showCalculator && (
        <SafetyBudgetCalculatorModal
          project={project}
          onSave={(result) => { updateProject(result); setShowCalculator(false); }}
          onClose={() => setShowCalculator(false)}
        />
      )}
      {showAddCompany && (
        <AddCompanyModal
          registry={data.companyRegistry || []}
          currentCompanyIds={activeCompanies.map((c) => c.id)}
          onAdd={(comp) => { addCurrentCompany(comp); setShowAddCompany(false); }}
          onGoToManagement={() => { setShowAddCompany(false); setActiveTab('companies'); }}
          onClose={() => setShowAddCompany(false)}
        />
      )}
      {editModal && (
        <ConstructionEditModal
          plan={editModal.plan}
          company={editModal.company}
          periodFilter={selectedPeriod}
          yearFilter={selectedYear}
          calculatedBudget={calculatedBudget}
          onSave={(plan) => { saveCurrentBudgetPlan(plan); setEditModal(null); }}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   일반사업장 예산수립
════════════════════════════════════════════ */
function GeneralBudgetPlan() {
  const {
    data, activeCompanies, activeBudgetPlans, activeExecutionRecords,
    saveCurrentBudgetPlan, selectedYear,
    addCurrentCompany, removeCurrentCompany, updateCurrentCompany,
    updateProject, setActiveTab,
  } = useBudget();
  const [editModal, setEditModal] = useState(null);
  const [showAddCompany, setShowAddCompany] = useState(false);

  if (!data) return null;
  const { project } = data;

  const totalRevenue = Number(project?.totalRevenue) || 0;
  const calculatedBudget = Math.round(totalRevenue * 0.005);

  const primaryCompany = activeCompanies.find((c) => c.type === 'primary');
  const subCompanies = activeCompanies.filter((c) => c.type === 'sub');
  const orderedCompanies = [primaryCompany, ...subCompanies].filter(Boolean);

  const getGeneralPlan = (companyId) =>
    activeBudgetPlans.find((bp) => bp.companyId === companyId && bp.period === 'yearly' && bp.year === selectedYear);

  // 전체 unique 항목명 (모든 회사 플랜 합산)
  const allItemNames = [...new Set(
    orderedCompanies.flatMap((comp) => (getGeneralPlan(comp.id)?.items || []).map((i) => i.name))
  )].filter(Boolean);

  // 매트릭스 rows
  const matrixRows = allItemNames.map((name) => {
    const row = { name };
    let grandTotal = 0;
    orderedCompanies.forEach((comp) => {
      const item = (getGeneralPlan(comp.id)?.items || []).find((i) => i.name === name);
      const amount = item ? Number(item.amount) || 0 : 0;
      row[comp.id] = amount;
      if (!comp.includedInPrimary) grandTotal += amount;
    });
    row.grandTotal = grandTotal;
    return row;
  });

  const companyTotals = {};
  orderedCompanies.forEach((comp) => {
    companyTotals[comp.id] = (getGeneralPlan(comp.id)?.items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  });

  const grandTotal = orderedCompanies
    .filter((c) => !c.includedInPrimary)
    .reduce((s, c) => s + (companyTotals[c.id] || 0), 0);

  const totalExecuted = activeExecutionRecords
    .filter((r) => r.year === selectedYear)
    .reduce((sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

  const execRate = calcExecutionRate(totalExecuted, grandTotal);
  const diffFromCalc = calculatedBudget - grandTotal;

  return (
    <div className="space-y-4">
      {/* 일반사업장 예산 헤더 */}
      <GeneralSiteBudgetHeader
        project={project}
        totalRevenue={totalRevenue}
        calculatedBudget={calculatedBudget}
        grandTotal={grandTotal}
        diffFromCalc={diffFromCalc}
        execRate={execRate}
        onUpdate={(val) => updateProject({ totalRevenue: val })}
      />

      {/* 회사 카드 (가로 스크롤) */}
      <CompanyCardRow
        primaryCompany={primaryCompany}
        subCompanies={subCompanies}
        getTotal={(id) => companyTotals[id] || 0}
        getPlan={getGeneralPlan}
        grandTotal={grandTotal}
        calculatedBudget={calculatedBudget}
        diffFromCalc={diffFromCalc}
        onEdit={(comp) => setEditModal({ plan: getGeneralPlan(comp.id), company: comp })}
        onRemove={removeCurrentCompany}
        onToggleIncluded={(comp) => updateCurrentCompany(comp.id, { includedInPrimary: !comp.includedInPrimary })}
        onAddCompany={() => setShowAddCompany(true)}
      />

      {/* 전체 예산편성 현황 (항목별 매트릭스) */}
      <Card title={`${selectedYear}년 예산편성 현황 (항목별)`} noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: `${300 + orderedCompanies.length * 150}px` }}>
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[180px]">항목명</th>
                <th className="px-3 py-3 text-right font-bold text-primary min-w-[130px] bg-primary/5">전체 합계</th>
                {primaryCompany && (
                  <th className="px-3 py-3 text-right min-w-[140px]">
                    <CompanyColHeader company={primaryCompany} label="원도급사" />
                  </th>
                )}
                {subCompanies.map((comp) => (
                  <th key={comp.id} className="px-3 py-3 text-right min-w-[140px]">
                    <CompanyColHeader company={comp} includedInPrimary={comp.includedInPrimary} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.length === 0 ? (
                <tr>
                  <td colSpan={2 + orderedCompanies.length} className="px-4 py-10 text-center text-sm text-gray-400">
                    편성된 항목이 없습니다. 각 회사의 편집 버튼을 눌러 예산항목을 추가하세요.
                  </td>
                </tr>
              ) : matrixRows.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-medium sticky left-0 bg-white z-10 text-sm">{row.name}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-primary tabular-nums bg-primary/5">
                    {row.grandTotal > 0 ? formatCurrency(row.grandTotal) : <span className="text-gray-300">-</span>}
                  </td>
                  {primaryCompany && (
                    <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums">
                      {(row[primaryCompany.id] || 0) > 0 ? formatCurrency(row[primaryCompany.id]) : <span className="text-gray-300">-</span>}
                    </td>
                  )}
                  {subCompanies.map((comp) => (
                    <td key={comp.id} className={`px-3 py-2.5 text-right tabular-nums ${comp.includedInPrimary ? 'bg-amber-50/50 text-amber-700' : 'text-gray-700'}`}>
                      {(row[comp.id] || 0) > 0 ? formatCurrency(row[comp.id]) : <span className="text-gray-300">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td className="px-4 py-3 sticky left-0 bg-gray-50 z-10 text-xs">합계 (원)</td>
                <td className="px-3 py-3 text-right text-primary tabular-nums bg-primary/5">{formatCurrency(grandTotal)}</td>
                {primaryCompany && <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(companyTotals[primaryCompany.id] || 0)}</td>}
                {subCompanies.map((comp) => (
                  <td key={comp.id} className={`px-3 py-3 text-right tabular-nums ${comp.includedInPrimary ? 'bg-amber-50 text-amber-700' : ''}`}>
                    {formatCurrency(companyTotals[comp.id] || 0)}
                  </td>
                ))}
              </tr>
              {calculatedBudget > 0 && (
                <tr className="border-t border-dashed border-gray-200 text-xs">
                  <td className="px-4 py-2 sticky left-0 bg-white z-10 text-gray-400">추천액 대비</td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${diffFromCalc >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {diffFromCalc >= 0 ? '+' : ''}{formatCurrency(diffFromCalc)}
                  </td>
                  <td colSpan={orderedCompanies.length} />
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </Card>

      {showAddCompany && (
        <AddCompanyModal
          registry={data.companyRegistry || []}
          currentCompanyIds={activeCompanies.map((c) => c.id)}
          onAdd={(comp) => { addCurrentCompany(comp); setShowAddCompany(false); }}
          onGoToManagement={() => { setShowAddCompany(false); setActiveTab('companies'); }}
          onClose={() => setShowAddCompany(false)}
        />
      )}
      {editModal && (
        <GeneralEditModal
          plan={editModal.plan}
          company={editModal.company}
          yearFilter={selectedYear}
          calculatedBudget={calculatedBudget}
          onSave={(plan) => { saveCurrentBudgetPlan(plan); setEditModal(null); }}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   공유 컴포넌트
════════════════════════════════════════════ */

/** 회사 카드 가로 스크롤 영역 */
function CompanyCardRow({
  primaryCompany, subCompanies,
  getTotal, getPlan, grandTotal, calculatedBudget, diffFromCalc,
  onEdit, onRemove, onToggleIncluded, onAddCompany,
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-3 min-w-max">
        {/* 전체 요약 카드 */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4 w-48 shrink-0">
          <p className="text-xs font-semibold text-primary/70 mb-2">전체 예산</p>
          <p className="text-xl font-extrabold text-primary tabular-nums">{formatCurrency(grandTotal)}</p>
          <p className="text-xs text-gray-400 mt-0.5">원</p>
          {calculatedBudget > 0 && (
            <div className={`mt-2 text-[11px] px-2 py-1 rounded-full inline-block font-medium ${
              diffFromCalc >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
            }`}>
              {diffFromCalc >= 0 ? `여유 ${formatCurrency(diffFromCalc)}원` : `초과 ${formatCurrency(-diffFromCalc)}원`}
            </div>
          )}
        </div>
        {/* 원도급사 */}
        {primaryCompany && (
          <CompanyCard
            company={primaryCompany}
            total={getTotal(primaryCompany.id)}
            plan={getPlan(primaryCompany.id)}
            isPrimary
            onEdit={() => onEdit(primaryCompany)}
          />
        )}
        {/* 협력사들 */}
        {subCompanies.map((comp) => (
          <CompanyCard
            key={comp.id}
            company={comp}
            total={getTotal(comp.id)}
            plan={getPlan(comp.id)}
            onEdit={() => onEdit(comp)}
            onRemove={() => onRemove(comp.id)}
            onToggleIncluded={() => onToggleIncluded(comp)}
          />
        ))}
        {/* 추가 버튼 */}
        <button
          onClick={onAddCompany}
          className="w-36 shrink-0 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary/40 hover:text-primary/60 transition-colors p-4"
        >
          <Plus size={20} />
          <span className="text-xs font-medium">협력사 추가</span>
        </button>
      </div>
    </div>
  );
}

/** 회사 카드 */
function CompanyCard({ company, total, plan, isPrimary, onEdit, onRemove, onToggleIncluded }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 shrink-0 hover:shadow-md transition-shadow"
      style={{ minWidth: '180px', maxWidth: '240px', width: 'fit-content' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CompanyLogo company={company} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug break-keep">{company.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{isPrimary ? '원도급사' : '협력사'}</p>
          </div>
        </div>
        {!isPrimary && onRemove && (
          <button onClick={onRemove} className="shrink-0 text-gray-300 hover:text-red-400 transition-colors ml-1">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-400">예산액</p>
        <p className="text-base font-extrabold text-gray-900 tabular-nums">{formatCurrency(total)}원</p>
      </div>

      {/* 하단 한 줄: [원도급 포함] ... [편집] */}
      <div className="flex items-center justify-between gap-1">
        {!isPrimary && onToggleIncluded ? (
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!company.includedInPrimary}
              onChange={onToggleIncluded}
              className="w-3.5 h-3.5 accent-amber-500 rounded"
            />
            <span className="text-[11px] text-gray-500">원도급 포함</span>
          </label>
        ) : <div />}
        <Button variant="ghost" size="sm" icon={Edit3} onClick={onEdit}>편집</Button>
      </div>
    </div>
  );
}

/** 테이블 컬럼 헤더 (회사) */
function CompanyColHeader({ company, label, includedInPrimary }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5 justify-end">
        <CompanyLogo company={company} size="xs" />
        <span className="font-semibold text-gray-700 text-xs text-right leading-tight break-keep max-w-[110px]">
          {company.name.replace(/주식회사\s*/g, '').replace(/\(주\)/g, '').trim()}
        </span>
      </div>
      {label && <span className="text-[10px] text-blue-600 font-medium">{label}</span>}
      {includedInPrimary && (
        <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">원도급 포함</span>
      )}
    </div>
  );
}

/** 협력사 추가 모달 (레지스트리 선택) */
function AddCompanyModal({ registry, currentCompanyIds, onAdd, onGoToManagement, onClose }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const currentNames = currentCompanyIds.map((id) => registry.find((r) => r.id === id)?.name).filter(Boolean);
  const available = registry.filter((c) => {
    if (currentCompanyIds.includes(c.id)) return false;
    if (currentNames.includes(c.name)) return false;
    if (c.type === 'primary') return false;
    return true;
  });
  const filtered = available.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.representative || '').includes(search)
  );

  return (
    <Modal isOpen onClose={onClose} title="협력사 추가" size="md">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="회사명 또는 대표자 검색" autoFocus
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              {search ? '검색 결과가 없습니다.' : '추가 가능한 협력사가 없습니다.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => setSelected(selected?.id === comp.id ? null : comp)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selected?.id === comp.id ? 'bg-primary/8 border-l-2 border-primary' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    selected?.id === comp.id ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}>
                    {selected?.id === comp.id && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <CompanyLogo company={comp} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{comp.name}</p>
                    <p className="text-xs text-gray-400">{[comp.representative, comp.contact].filter(Boolean).join(' · ')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onGoToManagement}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400 hover:border-primary/40 hover:text-primary/70 transition-colors"
        >
          <Building2 size={14} />
          <span>목록에 없는 회사는 <strong className="font-semibold">회사관리</strong> 페이지에서 추가하세요</span>
          <ArrowRight size={13} />
        </button>
        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button icon={Plus} disabled={!selected}
            onClick={() => selected && onAdd({
              name: selected.name, representative: selected.representative || '',
              contact: selected.contact || '', budgetRatio: 0, type: 'sub', includedInPrimary: false,
            })}>
            추가
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   건설현장 편집 모달
════════════════════════════════════════════ */
function ConstructionEditModal({ plan, company, periodFilter, yearFilter, calculatedBudget, onSave, onClose }) {
  const initialItems = plan
    ? [...plan.items]
    : BUDGET_CATEGORIES.map((cat) => ({ categoryId: cat.id, amount: 0, note: '' }));
  const [items, setItems] = useState(initialItems);

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const diff = calculatedBudget - total;
  const isPrimary = company.type === 'primary';

  const handleSave = () => {
    onSave({
      id: plan?.id || generateId(),
      companyId: company.id,
      period: periodFilter,
      year: periodFilter === 'yearly' ? yearFilter : null,
      items, totalAmount: total,
      createdAt: plan?.createdAt || new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <Modal isOpen onClose={onClose}
      title={<div className="flex items-center gap-2"><CompanyLogo company={company} size="sm" /><span>{company.name} 예산편성</span></div>}
      size="lg">
      <div className="space-y-4">
        {isPrimary && calculatedBudget > 0 && (
          <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border text-sm ${diff >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <span className="text-gray-500">계상액 <strong className="text-gray-800">{formatCurrency(calculatedBudget)}원</strong></span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-500">편성 <strong className="text-gray-800">{formatCurrency(total)}원</strong></span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className={`font-semibold ${diff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {diff >= 0 ? '여유 ' : '초과 '}{formatCurrency(Math.abs(diff))}원
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left text-gray-600 w-10 text-xs">코드</th>
                <th className="px-3 py-2 text-left text-gray-600">항목</th>
                <th className="px-3 py-2 text-right text-gray-600 w-44">예산액(원)</th>
                <th className="px-3 py-2 text-left text-gray-600 w-32">비고</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const cat = BUDGET_CATEGORIES.find((c) => c.id === item.categoryId);
                return (
                  <tr key={item.categoryId} className="border-b border-gray-50">
                    <td className="px-3 py-2 text-gray-400 text-xs">{cat?.code}</td>
                    <td className="px-3 py-2 text-sm">{cat?.shortName}</td>
                    <td className="px-3 py-2">
                      <CurrencyInput value={item.amount}
                        onChange={(val) => setItems((prev) => prev.map((i) => i.categoryId === item.categoryId ? { ...i, amount: val } : i))} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={item.note || ''} placeholder="비고"
                        onChange={(e) => setItems((prev) => prev.map((i) => i.categoryId === item.categoryId ? { ...i, note: e.target.value } : i))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={`font-bold ${isPrimary && calculatedBudget > 0 ? (diff >= 0 ? 'bg-emerald-50' : 'bg-red-50') : 'bg-primary/5'}`}>
                <td className="px-3 py-2.5" colSpan={2}>합계</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${isPrimary && calculatedBudget > 0 ? (diff >= 0 ? 'text-emerald-700' : 'text-red-600') : 'text-primary'}`}>
                  {formatCurrency(total)}원
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-400">
                  {isPrimary && calculatedBudget > 0 && (
                    <span className={diff >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                      {diff >= 0 ? `계상액 내 (여유 ${formatCurrency(diff)}원)` : `계상액 초과 (${formatCurrency(-diff)}원)`}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button icon={Save} onClick={handleSave}>저장</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   일반사업장 편집 모달 (커스텀 항목)
════════════════════════════════════════════ */
function GeneralEditModal({ plan, company, yearFilter, calculatedBudget, onSave, onClose }) {
  const [items, setItems] = useState(
    plan ? plan.items.map((i) => ({ ...i })) : []
  );

  const addItem = () => setItems((prev) => [...prev, { id: generateId(), name: '', amount: 0, note: '' }]);
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id, key, val) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, [key]: val } : i));

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const diff = calculatedBudget > 0 ? calculatedBudget - total : null;
  const isPrimary = company.type === 'primary';

  const handleSave = () => {
    onSave({
      id: plan?.id || generateId(),
      companyId: company.id,
      period: 'yearly',
      year: yearFilter,
      items,
      totalAmount: total,
      createdAt: plan?.createdAt || new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <Modal isOpen onClose={onClose}
      title={<div className="flex items-center gap-2"><CompanyLogo company={company} size="sm" /><span>{company.name} 예산편성</span></div>}
      size="lg">
      <div className="space-y-4">
        {/* 추천액 대비 표시 */}
        {isPrimary && calculatedBudget > 0 && diff !== null && (
          <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border text-sm ${diff >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <span className="text-gray-500">추천액 <strong className="text-gray-800">{formatCurrency(calculatedBudget)}원</strong><span className="text-gray-400 text-xs ml-1">(매출의 0.5%)</span></span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-500">편성 <strong className="text-gray-800">{formatCurrency(total)}원</strong></span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className={`font-semibold ${diff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {diff >= 0 ? '여유 ' : '초과 '}{formatCurrency(Math.abs(diff))}원
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left text-gray-600 font-semibold">항목명</th>
                <th className="px-3 py-2 text-right text-gray-600 font-semibold w-44">예산액(원)</th>
                <th className="px-3 py-2 text-left text-gray-600 font-semibold w-32">비고</th>
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-400">
                    항목이 없습니다. 아래 버튼으로 추가하세요.
                  </td>
                </tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="text" value={item.name} placeholder="항목명 입력"
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <CurrencyInput value={item.amount} onChange={(val) => updateItem(item.id, 'amount', val)} />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text" value={item.note || ''} placeholder="비고"
                      onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`font-bold ${isPrimary && diff !== null ? (diff >= 0 ? 'bg-emerald-50' : 'bg-red-50') : 'bg-primary/5'}`}>
                <td className="px-3 py-2.5 text-sm">합계</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${isPrimary && diff !== null ? (diff >= 0 ? 'text-emerald-700' : 'text-red-600') : 'text-primary'}`}>
                  {formatCurrency(total)}원
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-400" colSpan={2}>
                  {isPrimary && diff !== null && (
                    <span className={diff >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                      {diff >= 0 ? `추천액 내 여유 ${formatCurrency(diff)}원` : `추천액 초과 ${formatCurrency(-diff)}원`}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <Button variant="outline" icon={Plus} size="sm" onClick={addItem}>항목 추가</Button>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button icon={Save} onClick={handleSave}>저장</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   일반사업장 상단 헤더
════════════════════════════════════════════ */
function ConstructionSiteBudgetHeader({ project, calculatedBudget, grandTotal, diffFromCalc, execRate, onOpenCalculator, onUpdateContractAmount }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(project?.totalContractAmount || 0);
  const contractAmount = project?.totalContractAmount || 0;

  const handleConfirm = () => { onUpdateContractAmount(Number(inputVal) || 0); setEditing(false); };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 flex flex-wrap gap-6 items-end border-b border-gray-100">
        <div className="min-w-[140px]">
          <p className="text-xs text-gray-400 mb-1">사업장 구분</p>
          <p className="text-sm font-semibold text-gray-800">{project?.siteName || project?.name || '건설현장'}</p>
        </div>
        <div className="flex-1 min-w-[240px]">
          <p className="text-xs text-gray-400 mb-1">총공사금액 (VAT포함, 원)</p>
          <div className="flex items-center gap-3">
            {editing ? (
              <div className="flex items-center gap-2">
                <CurrencyInput value={inputVal} onChange={(v) => setInputVal(v)} />
                <Button size="sm" onClick={handleConfirm}>확인</Button>
                <Button size="sm" variant="secondary" onClick={() => { setInputVal(contractAmount); setEditing(false); }}>취소</Button>
              </div>
            ) : (
              <button onClick={() => { setInputVal(contractAmount); setEditing(true); }} className="flex items-center gap-2 group">
                <span className={`text-lg font-extrabold tabular-nums ${contractAmount > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                  {contractAmount > 0 ? formatCurrency(contractAmount) : '0'}
                </span>
                <span className="text-sm text-gray-400">원</span>
                <Edit3 size={13} className="text-gray-300 group-hover:text-primary transition-colors" />
              </button>
            )}
            <Button icon={Calculator} onClick={onOpenCalculator} variant="outline" size="sm">
              안전관리비 계상
            </Button>
          </div>
        </div>
        <div className="min-w-[200px] ml-auto text-right">
          <p className="text-xs text-gray-400 mb-1">
            안전보건관리비 계상액 <span className="text-blue-500 font-medium">(산업안전보건법 기준)</span>
          </p>
          {calculatedBudget > 0 ? (
            <p className="text-xl font-extrabold tabular-nums text-emerald-600">
              {formatCurrency(calculatedBudget)}<span className="text-sm font-normal text-gray-400 ml-1">원</span>
            </p>
          ) : (
            <p className="text-sm text-amber-500 flex items-center justify-end gap-1.5 mt-1">
              <AlertTriangle size={14} />
              계상 버튼을 눌러 사업장유형을 선택하세요
            </p>
          )}
        </div>
      </div>
      <div className="px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 bg-gray-50/60">
        <span className="text-sm text-gray-500">편성 합계 <strong className="text-gray-900">{formatCurrency(grandTotal)}원</strong></span>
        {calculatedBudget > 0 && (
          <span className={`text-sm font-medium ${diffFromCalc >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {diffFromCalc >= 0 ? '여유 ' : '초과 '}{formatCurrency(Math.abs(diffFromCalc))}원
          </span>
        )}
        <span className="text-xs text-gray-400">집행률 {formatPercent(execRate)}</span>
      </div>
    </div>
  );
}

function GeneralSiteBudgetHeader({ project, totalRevenue, calculatedBudget, grandTotal, diffFromCalc, execRate, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(totalRevenue);

  const handleConfirm = () => { onUpdate(Number(inputVal) || 0); setEditing(false); };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 flex flex-wrap gap-6 items-end border-b border-gray-100">
        <div className="min-w-[140px]">
          <p className="text-xs text-gray-400 mb-1">사업장 구분</p>
          <p className="text-sm font-semibold text-gray-800">{project?.siteName || '일반사업장'}</p>
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs text-gray-400 mb-1">총 매출액 (VAT포함, 원)</p>
          {editing ? (
            <div className="flex items-center gap-2">
              <CurrencyInput value={inputVal} onChange={(v) => setInputVal(v)} />
              <Button size="sm" onClick={handleConfirm}>확인</Button>
              <Button size="sm" variant="secondary" onClick={() => { setInputVal(totalRevenue); setEditing(false); }}>취소</Button>
            </div>
          ) : (
            <button onClick={() => { setInputVal(totalRevenue); setEditing(true); }} className="flex items-center gap-2 group">
              <span className={`text-lg font-extrabold tabular-nums ${totalRevenue > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                {formatCurrency(totalRevenue)}
              </span>
              <span className="text-sm text-gray-400">원</span>
              <Edit3 size={13} className="text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          )}
        </div>
        <div className="min-w-[200px]">
          <p className="text-xs text-gray-400 mb-1">
            추천 안전보건관리비 <span className="text-blue-500 font-medium">(총 매출액의 0.5%)</span>
          </p>
          <p className={`text-xl font-extrabold tabular-nums ${calculatedBudget > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
            {formatCurrency(calculatedBudget)}<span className="text-sm font-normal text-gray-400 ml-1">원</span>
          </p>
        </div>
      </div>
      {calculatedBudget > 0 && (
        <div className="px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 bg-gray-50/60">
          <span className="text-sm text-gray-500">편성 합계 <strong className="text-gray-900">{formatCurrency(grandTotal)}원</strong></span>
          <span className={`text-sm font-medium ${diffFromCalc >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {diffFromCalc >= 0 ? '여유 ' : '초과 '}{formatCurrency(Math.abs(diffFromCalc))}원
          </span>
          <span className="text-xs text-gray-400">집행률 {formatPercent(execRate)}</span>
        </div>
      )}
    </div>
  );
}
