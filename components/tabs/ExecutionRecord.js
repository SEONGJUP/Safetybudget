'use client';
import { useState } from 'react';
import { useBudget } from '@/lib/store';
import { BUDGET_CATEGORIES, MONTHS, DEFAULT_YEARS } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FileUpload from '@/components/ui/FileUpload';
import { formatCurrency, formatPercent, formatFileSize, formatDate, generateId, calcExecutionRate } from '@/lib/utils';
import CompanyLogo from '@/components/ui/CompanyLogo';
import CompanySelect from '@/components/ui/CompanySelect';
import Select from '@/components/ui/Select';
import { Save, Edit3, FileText, Paperclip, Download, Trash2, Eye, Check, X, Printer, List, AlertTriangle } from 'lucide-react';
import DetailEntryModal from '@/components/execution/DetailEntryModal';

export default function ExecutionRecord() {
  const {
    data, isGeneral,
    activeCompanies, activeBudgetPlans, activeExecutionRecords,
    selectedCompanyId, selectedPeriod, setSelectedPeriod, selectedYear, setSelectedYear,
    saveCurrentExecutionRecord, addEvidence, removeEvidence, updateReportStatus, addReport,
  } = useBudget();
  const [editModal, setEditModal] = useState(null);
  const [monthModal, setMonthModal] = useState(null);
  const [evidenceModal, setEvidenceModal] = useState(false);
  const [activeMonth, setActiveMonth] = useState(() => new Date().getMonth() + 1);

  if (!data) return null;

  const { evidences, monthlyReports } = data;
  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;

  // 기간 + 회사 필터
  const filtered = activeExecutionRecords.filter((r) => {
    if (selectedPeriod === 'yearly' && r.year !== selectedYear) return false;
    if (selectedCompanyId !== 'all' && r.companyId !== selectedCompanyId) return false;
    return true;
  });

  // 월별 합계
  const monthlyTotals = {};
  for (let m = 1; m <= 12; m++) {
    const monthRecords = filtered.filter((r) => r.month === m);
    monthlyTotals[m] = monthRecords.reduce(
      (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
      0
    );
  }

  // 예산
  const relevantPlans = activeBudgetPlans.filter((bp) => {
    if (selectedPeriod === 'total') {
      return bp.period === 'total' && (selectedCompanyId === 'all' || bp.companyId === selectedCompanyId);
    }
    return bp.period === 'yearly' && bp.year === selectedYear && (selectedCompanyId === 'all' || bp.companyId === selectedCompanyId);
  });
  const budgetTotal = relevantPlans.reduce(
    (sum, bp) => sum + bp.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    0
  );

  const yearExecuted = Object.values(monthlyTotals).reduce((s, v) => s + v, 0);
  const execRate = calcExecutionRate(yearExecuted, budgetTotal);
  const remaining = budgetTotal - yearExecuted;

  // 회사별 집행 통계 (기본)
  const baseCompanyStats = activeCompanies.map((comp) => {
    const compRecords = activeExecutionRecords.filter((r) => {
      if (r.companyId !== comp.id) return false;
      if (selectedPeriod === 'yearly' && r.year !== selectedYear) return false;
      return true;
    });
    const executed = compRecords.reduce(
      (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
      0
    );
    const compPlan = activeBudgetPlans.filter((bp) => {
      if (bp.companyId !== comp.id) return false;
      if (selectedPeriod === 'total') return bp.period === 'total';
      return bp.period === 'yearly' && bp.year === selectedYear;
    }).reduce((sum, bp) => sum + bp.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);
    return { company: comp, executed, budget: compPlan, rate: calcExecutionRate(executed, compPlan) };
  });

  // 원도급 포함 처리: includedInPrimary=true인 협력사 집행액을 원도급사에 합산
  const includedSubs = activeCompanies.filter((c) => c.includedInPrimary);
  const companyStats = baseCompanyStats.map((stat) => {
    if (stat.company.type === 'primary' && includedSubs.length > 0) {
      const extraExecuted = includedSubs.reduce((sum, sub) => {
        const subStat = baseCompanyStats.find((s) => s.company.id === sub.id);
        return sum + (subStat?.executed || 0);
      }, 0);
      const extraBudget = includedSubs.reduce((sum, sub) => {
        const subStat = baseCompanyStats.find((s) => s.company.id === sub.id);
        return sum + (subStat?.budget || 0);
      }, 0);
      const newExecuted = stat.executed + extraExecuted;
      const newBudget = stat.budget + extraBudget;
      return {
        ...stat,
        executed: newExecuted,
        budget: newBudget,
        rate: calcExecutionRate(newExecuted, newBudget),
        includedSubNames: includedSubs.map((s) => s.name.replace(/\(주\)/g, '').trim()),
      };
    }
    return stat;
  });

  // 증빙 파일 수
  const filteredEvidences = evidences.filter((ev) => {
    if (selectedPeriod === 'yearly' && ev.year !== selectedYear) return false;
    if (selectedCompanyId !== 'all' && ev.companyId !== selectedCompanyId) return false;
    return true;
  });

  const getMonthRecords = (month) => filtered.filter((r) => r.month === month);

  // 보고서 관련 헬퍼
  const getMonthReport = (month) => monthlyReports.find((r) => r.year === selectedYear && r.month === month);

  const handleCreateReport = (month) => {
    addReport({
      year: selectedYear,
      month,
      status: 'draft',
      submittedAt: null,
      approvedAt: null,
      approver: null,
      note: '',
    });
  };

  const handleSubmitReport = (reportId) => {
    updateReportStatus(reportId, 'submitted', {
      submittedAt: new Date().toISOString().slice(0, 10),
    });
  };

  const handleApproveReport = (reportId) => {
    updateReportStatus(reportId, 'approved', {
      approvedAt: new Date().toISOString().slice(0, 10),
      approver: '관리자',
    });
  };

  const handleRejectReport = (reportId) => {
    updateReportStatus(reportId, 'rejected');
  };

  return (
    <div className="space-y-4">
      {/* 예산·집행 요약 */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 bg-white rounded-xl border border-gray-100 px-5 py-3">
        <span className="text-sm text-gray-500">{periodLabel} 예산 <strong className="text-gray-900">{formatCurrency(budgetTotal)}원</strong></span>
        <span className="text-sm text-gray-500">집행 <strong className="text-primary">{formatCurrency(yearExecuted)}원</strong> <span className="text-xs text-gray-400">({formatPercent(execRate)})</span></span>
        <span className="text-sm text-gray-500">잔여 <strong className={remaining >= 0 ? 'text-gray-900' : 'text-red-500'}>{formatCurrency(remaining)}원</strong></span>
        <button
          onClick={() => setEvidenceModal(true)}
          className="text-sm text-gray-500 hover:text-primary transition-colors"
        >
          증빙 <strong className="text-gray-900">{filteredEvidences.length}건</strong>
        </button>
      </div>

      {/* 전체기간: 업체별 통계 카드만 (등록 불가) */}
      {selectedPeriod === 'total' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="w-1 h-4 bg-primary rounded-full shrink-0" />
            <h3 className="text-sm font-bold text-gray-700">업체별 집행현황</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {companyStats.map(({ company, executed, budget, rate, includedSubNames }) => (
            <div key={company.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <CompanyLogo company={company} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{company.name}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <p className="text-[10px] text-gray-400">{company.type === 'primary' ? '원도급사' : '협력사'}</p>
                    {company.includedInPrimary && (
                      <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded-full font-medium">원도급 포함</span>
                    )}
                    {includedSubNames?.length > 0 && (
                      <span className="text-[9px] bg-amber-50 text-amber-500 px-1 py-0.5 rounded-full">+협력사 포함</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">집행액</span>
                  <span className="font-extrabold text-gray-900">{formatCurrency(executed)}원</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">예산액</span>
                  <span className="text-gray-500">{formatCurrency(budget)}원</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${rate > 100 ? 'bg-red-400' : rate > 80 ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold ${rate > 100 ? 'text-red-500' : 'text-primary'}`}>{formatPercent(rate)}</span>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* 전체기간: 년도별 집행실적 요약 */}
      {selectedPeriod === 'total' && <YearSummaryGrid
        records={activeExecutionRecords}
        plans={activeBudgetPlans}
        selectedCompanyId={selectedCompanyId}
        onSelectYear={(year) => { setSelectedPeriod('yearly'); setSelectedYear(year); }}
      />}

      {/* 년도별: 월 선택 + 등록 통합 패널 */}
      {selectedPeriod === 'yearly' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full shrink-0" />
              <h3 className="text-sm font-bold text-gray-700">월별 집행현황 · 등록</h3>
            </div>
            <span className="text-xs text-gray-400">월 선택 → 업체 등록/수정</span>
          </div>

          {/* 월 그리드 (네비게이션) */}
          <div className="p-3 border-b border-gray-50">
            <div className="grid grid-cols-6 xl:grid-cols-12 gap-1.5">
              {MONTHS.map((name, idx) => {
                const month = idx + 1;
                const total = monthlyTotals[month] || 0;
                const records = getMonthRecords(month);
                const hasRecords = records.length > 0;
                const allApproved = records.length > 0 && records.every((r) => r.status === 'approved');
                const hasDraft = records.some((r) => r.status === 'draft');
                const report = getMonthReport(month);
                const isActive = activeMonth === month;
                return (
                  <div
                    key={month}
                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-between py-2.5 transition-all cursor-pointer hover:shadow-md hover:scale-[1.03] ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/30'
                        : hasRecords
                        ? allApproved
                          ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
                          : hasDraft
                          ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                          : 'border-blue-300 bg-blue-50/50 shadow-sm'
                        : 'border-gray-150 bg-gray-50 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                    onClick={() => {
                      setActiveMonth(month);
                      if (hasRecords) setMonthModal({ month, records });
                    }}
                  >
                    <span className={`text-base font-extrabold ${
                      isActive ? 'text-primary' :
                      hasRecords
                        ? allApproved ? 'text-emerald-600' : hasDraft ? 'text-amber-600' : 'text-blue-600'
                        : 'text-gray-400'
                    }`}>{month}월</span>
                    <span className={`text-[10px] leading-tight text-center tabular-nums ${total > 0 ? 'text-gray-600 font-semibold' : 'text-gray-300'}`}>
                      {total > 0 ? <>{formatCurrency(total)}<span className="text-gray-400 ml-px">원</span></> : '미등록'}
                    </span>
                    <div className="h-2.5 flex items-center justify-center">
                      {report && (
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          report.status === 'approved' ? 'bg-emerald-500' :
                          report.status === 'submitted' ? 'bg-amber-500' :
                          report.status === 'rejected' ? 'bg-red-500' :
                          'bg-blue-400'
                        }`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 선택된 월 — 업체별 등록/수정 */}
          <div className="p-4 bg-primary/3">
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full text-[10px] font-bold shrink-0">{activeMonth}</span>
              월 집행실적 — 업체를 선택하여 등록 또는 수정하세요
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {companyStats.map(({ company, executed, budget, rate, includedSubNames }) => {
                const monthRecord = activeExecutionRecords.find(
                  (r) => r.companyId === company.id && r.year === selectedYear && r.month === activeMonth
                );
                const monthAmt = monthRecord
                  ? monthRecord.items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
                  : 0;
                const hasMonthRecord = !!monthRecord;
                return (
                  <div key={company.id} className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col gap-2.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CompanyLogo company={company} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{company.name}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="text-[10px] text-gray-400">{company.type === 'primary' ? '원도급사' : '협력사'}</p>
                          {company.includedInPrimary && (
                            <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded-full font-medium">원도급 포함</span>
                          )}
                          {includedSubNames?.length > 0 && (
                            <span className="text-[9px] bg-amber-50 text-amber-500 px-1 py-0.5 rounded-full">+협력사 포함</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs border-t border-gray-50 pt-2">
                      <span className="text-gray-400">{periodLabel} 누계</span>
                      <span className="font-bold text-gray-700">{formatCurrency(executed)}원 <span className="text-gray-400 font-normal">({formatPercent(rate)})</span></span>
                    </div>
                    <div className={`flex justify-between text-xs rounded-lg px-2.5 py-1.5 ${hasMonthRecord ? 'bg-primary/10 border border-primary/20' : 'bg-gray-50 border border-dashed border-gray-200'}`}>
                      <span className={hasMonthRecord ? 'text-primary font-medium' : 'text-gray-400'}>{activeMonth}월 집행</span>
                      <span className={hasMonthRecord ? 'font-bold text-primary' : 'text-gray-300'}>
                        {hasMonthRecord ? `${formatCurrency(monthAmt)}원` : '미등록'}
                      </span>
                    </div>
                    <button
                      onClick={() => setEditModal({ month: activeMonth, record: monthRecord || null, isNew: !monthRecord, forCompany: company })}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                        hasMonthRecord
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                      }`}
                    >
                      {hasMonthRecord ? `${activeMonth}월 수정` : `${activeMonth}월 등록`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 항목별 누적 집행 — 전체기간 탭에서는 숨김 */}
      {selectedPeriod !== 'yearly' ? null :
      <Card title={`${periodLabel} 항목별 누적 집행`} noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600">항목</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-2.5 text-right font-semibold text-gray-600 text-xs">{m}</th>
                ))}
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">합계</th>
              </tr>
            </thead>
            <tbody>
              {isGeneral ? (
                // 일반사업장: 커스텀 항목명 기준
                [...new Set(filtered.flatMap((r) => r.items.map((i) => i.name)).filter(Boolean))].map((itemName) => {
                  const monthAmounts = MONTHS.map((_, mIdx) => {
                    const month = mIdx + 1;
                    return filtered.filter((r) => r.month === month)
                      .reduce((sum, rec) => {
                        const item = rec.items.find((i) => i.name === itemName);
                        return sum + (item ? Number(item.amount) || 0 : 0);
                      }, 0);
                  });
                  const catTotal = monthAmounts.reduce((s, v) => s + v, 0);
                  return (
                    <tr key={itemName} className="border-b border-gray-50">
                      <td className="px-4 py-2 font-medium whitespace-nowrap text-xs">{itemName}</td>
                      {monthAmounts.map((amt, mIdx) => (
                        <td key={mIdx} className="px-2 py-2 text-right text-xs text-gray-600 tabular-nums">
                          {amt > 0 ? formatCurrency(amt) : '-'}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-bold text-sm tabular-nums">{formatCurrency(catTotal)}</td>
                    </tr>
                  );
                })
              ) : (
                // 건설현장: 법정 카테고리 기준
                BUDGET_CATEGORIES.map((cat) => {
                  const monthAmounts = MONTHS.map((_, mIdx) => {
                    const month = mIdx + 1;
                    return filtered.filter((r) => r.month === month)
                      .reduce((sum, rec) => {
                        const item = rec.items.find((i) => i.categoryId === cat.id);
                        return sum + (item ? Number(item.amount) || 0 : 0);
                      }, 0);
                  });
                  const catTotal = monthAmounts.reduce((s, v) => s + v, 0);
                  return (
                    <tr key={cat.id} className="border-b border-gray-50">
                      <td className="px-4 py-2 font-medium whitespace-nowrap">{cat.shortName}</td>
                      {monthAmounts.map((amt, mIdx) => (
                        <td key={mIdx} className="px-2 py-2 text-right text-xs text-gray-600 tabular-nums">
                          {amt > 0 ? formatCurrency(amt) : '-'}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-bold text-sm tabular-nums">{formatCurrency(catTotal)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-2.5">합계(원)</td>
                {MONTHS.map((_, mIdx) => (
                  <td key={mIdx} className="px-2 py-2.5 text-right text-xs tabular-nums">
                    {monthlyTotals[mIdx + 1] > 0 ? formatCurrency(monthlyTotals[mIdx + 1]) : '-'}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right text-primary tabular-nums">{formatCurrency(yearExecuted)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>}

      {/* 월 상세 보기 모달 (피벗 + 보고서 기능) */}
      {monthModal && (
        <MonthViewModal
          isGeneral={isGeneral}
          periodLabel={periodLabel}
          month={monthModal.month}
          records={monthModal.records}
          companies={activeCompanies}
          executionRecords={activeExecutionRecords}
          report={getMonthReport(monthModal.month)}
          selectedYear={selectedYear}
          onEdit={(record) => {
            setMonthModal(null);
            setEditModal({ month: monthModal.month, record });
          }}
          onNewRecord={(companyId) => {
            setMonthModal(null);
            setEditModal({
              month: monthModal.month,
              isNew: true,
              forCompany: activeCompanies.find((c) => c.id === companyId) || activeCompanies[0],
            });
          }}
          onCreateReport={() => handleCreateReport(monthModal.month)}
          onSubmitReport={(id) => handleSubmitReport(id)}
          onApproveReport={(id) => handleApproveReport(id)}
          onRejectReport={(id) => handleRejectReport(id)}
          onClose={() => setMonthModal(null)}
        />
      )}

      {/* 편집 모달 */}
      {editModal && (
        <ExecutionEditModal
          isGeneral={isGeneral}
          year={selectedYear}
          month={editModal.month}
          record={editModal.record}
          isNew={editModal.isNew}
          companies={activeCompanies}
          budgetPlans={activeBudgetPlans}
          selectedCompanyId={editModal.forCompany?.id || (selectedCompanyId !== 'all' ? selectedCompanyId : activeCompanies[0]?.id)}
          onSave={(record, newEvidences) => {
            saveCurrentExecutionRecord(record);
            if (newEvidences?.length > 0) {
              newEvidences.forEach((ev) => addEvidence(ev));
            }
            setEditModal(null);
          }}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* 증빙파일 목록 모달 */}
      {evidenceModal && (
        <EvidenceListModal
          evidences={evidences || []}
          companies={activeCompanies}
          selectedPeriod={selectedPeriod}
          selectedYear={selectedYear}
          selectedCompanyId={selectedCompanyId}
          onRemove={removeEvidence}
          onClose={() => setEvidenceModal(false)}
        />
      )}
    </div>
  );
}

/* ─── 연도별 집행실적 요약 그리드 (전체기간 탭) ─── */
function YearSummaryGrid({ records, plans, selectedCompanyId, onSelectYear }) {
  const years = [...new Set(records.map((r) => r.year))].sort();

  if (years.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 px-5 py-8 text-center text-gray-400 text-sm">
        등록된 집행실적이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 pt-2 border-t border-gray-200">
        <span className="w-1 h-4 bg-amber-400 rounded-full shrink-0" />
        <h3 className="text-sm font-bold text-gray-700">연도별 집행현황</h3>
        <span className="text-xs text-gray-400">— 연도 클릭 시 해당 년도 상세보기</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {years.map((year) => {
          const yearRecords = records.filter((r) => {
            if (selectedCompanyId !== 'all' && r.companyId !== selectedCompanyId) return false;
            return r.year === year;
          });
          const executed = yearRecords.reduce(
            (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
            0
          );
          const yearPlans = plans.filter((bp) => {
            if (bp.period !== 'yearly' || bp.year !== year) return false;
            if (selectedCompanyId !== 'all' && bp.companyId !== selectedCompanyId) return false;
            return true;
          });
          const budget = yearPlans.reduce(
            (sum, bp) => sum + bp.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
            0
          );
          const rate = budget > 0 ? (executed / budget) * 100 : 0;
          const remaining = budget - executed;

          return (
            <div
              key={year}
              className="bg-amber-50/40 rounded-xl border border-amber-100 shadow-sm p-4 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer"
              onClick={() => onSelectYear(year)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-extrabold text-gray-800">{year}년</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rate > 100 ? 'bg-red-50 text-red-500' : rate > 80 ? 'bg-amber-50 text-amber-600' : 'bg-primary-light text-primary'}`}>
                  {formatPercent(rate)}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">집행액</span>
                  <span className="font-extrabold text-gray-900">{formatCurrency(executed)}원</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">예산액</span>
                  <span className="text-gray-500">{formatCurrency(budget)}원</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">잔액</span>
                  <span className={remaining < 0 ? 'text-red-500 font-medium' : 'text-gray-500'}>{formatCurrency(remaining)}원</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${rate > 100 ? 'bg-red-400' : rate > 80 ? 'bg-amber-400' : 'bg-primary'}`}
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 월 상세 보기 모달 (피벗 + 보고서 기능) ─── */
function MonthViewModal({ isGeneral, periodLabel, month, records, companies, executionRecords, report, selectedYear, onEdit, onNewRecord, onCreateReport, onSubmitReport, onApproveReport, onRejectReport, onClose }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const recordCompanies = companies.filter((c) => records.some((r) => r.companyId === c.id));
  const noRecordCompanies = companies.filter((c) => !records.some((r) => r.companyId === c.id));

  // 항목명 목록 (건설: BUDGET_CATEGORIES, 일반: 레코드에서 수집)
  const itemKeys = isGeneral
    ? [...new Set(records.flatMap((r) => r.items.map((i) => i.name)).filter(Boolean))]
    : BUDGET_CATEGORIES.map((c) => c.id);

  const matrixData = itemKeys.map((key) => {
    const row = { key };
    let rowTotal = 0;
    recordCompanies.forEach((comp) => {
      const record = records.find((r) => r.companyId === comp.id);
      const item = isGeneral
        ? record?.items.find((i) => i.name === key)
        : record?.items.find((i) => i.categoryId === key);
      const amount = item ? Number(item.amount) || 0 : 0;
      row[comp.id] = amount;
      rowTotal += amount;
    });
    row.total = rowTotal;
    if (!isGeneral) row.category = BUDGET_CATEGORIES.find((c) => c.id === key);
    return row;
  });

  const companyTotals = {};
  recordCompanies.forEach((comp) => {
    companyTotals[comp.id] = matrixData.reduce((sum, row) => sum + (row[comp.id] || 0), 0);
  });
  const grandTotal = Object.values(companyTotals).reduce((s, v) => s + v, 0);

  return (
    <Modal isOpen onClose={onClose} title={`${selectedYear}년 ${month}월 집행실적`} size="xl">
      <div className="space-y-4">
        {/* 회사 태그 + 편집 버튼 */}
        <div className="flex flex-wrap gap-2">
          {recordCompanies.map((comp) => {
            const record = records.find((r) => r.companyId === comp.id);
            return (
              <div key={comp.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                <CompanyLogo company={comp} size="xs" />
                <span className="text-xs font-medium text-gray-700">
                  {comp.name.replace(/\(주\)/g, '').trim()}
                </span>
                {record && <Badge status={record.status} />}
                {record && (
                  <button
                    onClick={() => onEdit(record)}
                    className="ml-1 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-primary"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
              </div>
            );
          })}
          {/* 미등록 회사 추가 버튼 */}
          {noRecordCompanies.map((comp) => (
            <button
              key={comp.id}
              onClick={() => onNewRecord(comp.id)}
              className="flex items-center gap-2 bg-white border border-dashed border-gray-300 rounded-lg px-3 py-1.5 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <CompanyLogo company={comp} size="xs" />
              <span className="text-xs text-gray-400">
                {comp.name.replace(/\(주\)/g, '').trim()}
              </span>
              <span className="text-[10px] text-primary font-medium">+ 등록</span>
            </button>
          ))}
        </div>

        {/* 피벗 테이블 */}
        {recordCompanies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {!isGeneral && <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs">코드</th>}
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs">항목명</th>
                  {recordCompanies.map((comp) => (
                    <th key={comp.id} className="px-3 py-2.5 text-right text-xs min-w-[100px]">
                      <div className="flex items-center justify-end gap-1">
                        <CompanyLogo company={comp} size="xs" />
                        <span className="font-semibold text-gray-700">{comp.name.replace(/\(주\)/g, '').trim()}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right font-bold text-gray-800 bg-primary-light/30 min-w-[90px]">합계</th>
                </tr>
              </thead>
              <tbody>
                {matrixData.map((row) => (
                  <tr key={row.key} className="border-b border-gray-50 hover:bg-gray-50/50">
                    {!isGeneral && <td className="px-3 py-2 text-xs text-gray-400">{row.category?.code}</td>}
                    <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">
                      {isGeneral ? row.key : row.category?.shortName}
                    </td>
                    {recordCompanies.map((comp) => (
                      <td key={comp.id} className="px-3 py-2 text-right text-xs tabular-nums">
                        {row[comp.id] > 0 ? (
                          <span className="text-gray-700">{formatCurrency(row[comp.id])}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right text-xs font-bold text-primary tabular-nums bg-primary-light/10">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                  <td className="px-3 py-2.5 text-xs" colSpan={isGeneral ? 1 : 2}>합계 (원)</td>
                  {recordCompanies.map((comp) => (
                    <td key={comp.id} className="px-3 py-2.5 text-right text-xs tabular-nums">
                      {formatCurrency(companyTotals[comp.id])}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-right text-sm text-primary tabular-nums bg-primary-light/30">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            등록된 집행실적이 없습니다. 회사를 클릭하여 등록하세요.
          </div>
        )}

        {/* 보고서 기능 영역 */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-500" />
              <h4 className="text-sm font-extrabold text-gray-700">월별 보고서</h4>
              {report && <Badge status={report.status} />}
            </div>
            <div className="flex items-center gap-2">
              {!report ? (
                <Button
                  size="sm"
                  variant="outline"
                  icon={FileText}
                  onClick={onCreateReport}
                  disabled={records.length === 0}
                >
                  보고서 생성
                </Button>
              ) : report.status === 'draft' ? (
                <>
                  <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreviewOpen(true)}>
                    미리보기
                  </Button>
                </>
              ) : report.status === 'submitted' ? (
                <>
                  <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreviewOpen(true)}>
                    상세
                  </Button>
                  <Button size="sm" variant="success" icon={Check} onClick={() => onApproveReport(report.id)}>
                    승인
                  </Button>
                  <Button size="sm" variant="danger" icon={X} onClick={() => onRejectReport(report.id)}>
                    반려
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" icon={Eye} onClick={() => setPreviewOpen(true)}>
                  상세보기
                </Button>
              )}
            </div>
          </div>
          {report && (report.status === 'approved' || report.status === 'rejected') && (
            <div className="mt-2 text-xs text-gray-500 flex gap-4">
              {report.submittedAt && <span>제출: {formatDate(report.submittedAt)}</span>}
              {report.approvedAt && <span>승인: {formatDate(report.approvedAt)}</span>}
              {report.approver && <span>결재자: {report.approver}</span>}
            </div>
          )}
        </div>
      </div>

      {/* 보고서 미리보기 모달 */}
      {previewOpen && (
        <ReportPreviewModal
          year={selectedYear}
          month={month}
          report={report}
          executionRecords={executionRecords}
          companies={companies}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </Modal>
  );
}

/* ─── 보고서 미리보기 모달 ─── */
function ReportPreviewModal({ year, month, report, executionRecords, companies, onClose }) {
  const monthRecords = executionRecords.filter(
    (r) => r.year === year && r.month === month
  );

  const getCompany = (id) => companies.find((c) => c.id === id);

  const categoryTotals = BUDGET_CATEGORIES.map((cat) => {
    const total = monthRecords.reduce((sum, rec) => {
      const item = rec.items.find((i) => i.categoryId === cat.id);
      return sum + (item ? Number(item.amount) || 0 : 0);
    }, 0);
    return { ...cat, total };
  });

  const grandTotal = categoryTotals.reduce((s, c) => s + c.total, 0);

  return (
    <Modal isOpen onClose={onClose} title={`${year}년 ${month}월 집행실적 보고서`} size="xl">
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
          <p><strong>보고기간:</strong> {year}년 {month}월</p>
          <p><strong>상태:</strong> {report ? report.status : '-'}</p>
          {report?.submittedAt && <p><strong>제출일:</strong> {formatDate(report.submittedAt)}</p>}
          {report?.approver && <p><strong>결재자:</strong> {report.approver}</p>}
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3">항목별 집행내역</h4>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold">코드</th>
                <th className="px-3 py-2 text-left font-semibold">항목</th>
                {monthRecords.map((rec) => (
                  <th key={rec.id} className="px-3 py-2 text-right font-semibold text-xs">
                    <div className="flex items-center justify-end gap-1.5">
                      {getCompany(rec.companyId) && (
                        <CompanyLogo company={getCompany(rec.companyId)} size="xs" />
                      )}
                      {(getCompany(rec.companyId)?.name || '').replace(/\(주\)/g, '').trim()}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-semibold">합계</th>
              </tr>
            </thead>
            <tbody>
              {categoryTotals.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-gray-500">{cat.code}</td>
                  <td className="px-3 py-2">{cat.shortName}</td>
                  {monthRecords.map((rec) => {
                    const item = rec.items.find((i) => i.categoryId === cat.id);
                    return (
                      <td key={rec.id} className="px-3 py-2 text-right text-xs tabular-nums">
                        {formatCurrency(item?.amount || 0)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{formatCurrency(cat.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary-light/50 font-bold border-t-2 border-gray-200">
                <td className="px-3 py-2.5" colSpan={2}>합계</td>
                {monthRecords.map((rec) => {
                  const recTotal = rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
                  return (
                    <td key={rec.id} className="px-3 py-2.5 text-right text-xs tabular-nums">
                      {formatCurrency(recTotal)}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-right text-primary tabular-nums">{formatCurrency(grandTotal)}원</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" icon={Printer} onClick={() => window.print()}>인쇄</Button>
          <Button variant="secondary" onClick={onClose}>닫기</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── 집행실적 편집 모달 (증빙 첨부 포함) ─── */
function ExecutionEditModal({ isGeneral, year, month, record, isNew, companies, budgetPlans, selectedCompanyId, onSave, onClose }) {
  const { data } = useBudget();
  const initCompanyId = record?.companyId || selectedCompanyId || companies[0]?.id;

  // 일반사업장: 예산 항목명에서 템플릿 생성
  const getGeneralInitItems = (compId) => {
    const plan = budgetPlans?.find((bp) => bp.companyId === compId && bp.year === year);
    if (plan?.items?.length) return plan.items.map((i) => ({ id: i.id, name: i.name, amount: 0, note: '' }));
    return [{ id: 'new-1', name: '안전관리비', amount: 0, note: '' }];
  };

  const getInitItems = (compId) => {
    if (record) {
      return isGeneral
        ? record.items.map((i) => ({ ...i }))
        : record.items.map((item) => ({ ...item, details: item.details || [], orgInfo: item.orgInfo || null, evidences: item.evidences || [] }));
    }
    if (isGeneral) return getGeneralInitItems(compId);
    return BUDGET_CATEGORIES.map((cat) => ({ categoryId: cat.id, amount: 0, note: '', details: [], orgInfo: null, evidences: [] }));
  };

  const [companyId, setCompanyId] = useState(initCompanyId);
  const [items, setItems] = useState(() => getInitItems(initCompanyId));
  const [categoryId, setCategoryId] = useState('all');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(null);

  // 회사 변경 시 항목 재초기화 (일반사업장 신규 등록 시)
  const handleCompanyChange = (newCompId) => {
    setCompanyId(newCompId);
    if (isGeneral && isNew) setItems(getGeneralInitItems(newCompId));
  };

  const handleAmountChange = (key, value) => {
    setItems((prev) =>
      prev.map((item) =>
        isGeneral ? (item.name === key ? { ...item, amount: value } : item)
                  : (item.categoryId === key ? { ...item, amount: value } : item)
      )
    );
  };

  // 일반사업장: 항목 추가
  const handleAddItem = () => {
    setItems((prev) => [...prev, { id: `new-${Date.now()}`, name: '', amount: 0, note: '' }]);
  };
  const handleItemNameChange = (idx, name) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, name } : item));
  };
  const handleRemoveItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  // ─── 예산 현황 계산 ───
  const execRecords = (isGeneral ? data?.generalExecutionRecords : data?.executionRecords) || [];

  // 이번 월 제외 기 집행액 (같은 회사, 같은 연도)
  const pastMonthRecords = execRecords.filter(
    (er) => er.companyId === companyId && er.year === year && er.month !== month
  );

  // 년도별 예산 플랜
  const yearPlan = budgetPlans?.find(
    (bp) => bp.companyId === companyId && bp.period === 'yearly' && bp.year === year
  );
  // 전체기간 예산 플랜 (건설현장만)
  const totalPlan = !isGeneral
    ? budgetPlans?.find((bp) => bp.companyId === companyId && bp.period === 'total')
    : null;

  const getItemYearBudget = (key) => {
    const planItem = isGeneral
      ? yearPlan?.items?.find((i) => i.name === key)
      : yearPlan?.items?.find((i) => i.categoryId === key);
    return Number(planItem?.amount) || 0;
  };
  const getItemTotalBudget = (key) => {
    if (!totalPlan) return 0;
    const planItem = totalPlan.items?.find((i) => i.categoryId === key);
    return Number(planItem?.amount) || 0;
  };
  const getItemPastExecuted = (key) => {
    return pastMonthRecords.reduce((sum, er) => {
      const it = isGeneral
        ? er.items.find((i) => i.name === key)
        : er.items.find((i) => i.categoryId === key);
      return sum + (Number(it?.amount) || 0);
    }, 0);
  };

  // 전체 연도 예산 합계
  const yearBudgetTotal = yearPlan?.items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
  const totalBudgetTotal = totalPlan?.items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
  const pastExecutedTotal = pastMonthRecords.reduce(
    (sum, er) => sum + er.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0
  );
  const isYearOverBudget = yearBudgetTotal > 0 && (pastExecutedTotal + total) > yearBudgetTotal;
  const isTotalOverBudget = totalBudgetTotal > 0 && (pastExecutedTotal + total) > totalBudgetTotal;

  const handleFileAdd = (fileInfo) => {
    setUploadedFiles((prev) => [...prev, { ...fileInfo, id: generateId(), categoryId }]);
  };

  const handleFileRemove = (idx) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = (status) => {
    const savedRecord = {
      id: record?.id || generateId(),
      companyId,
      year: record?.year || year,
      month,
      items,
      status: status || 'draft',
      createdAt: record?.createdAt || new Date().toISOString().slice(0, 10),
    };

    const newEvidences = uploadedFiles.map((f) => ({
      companyId,
      year: record?.year || year,
      month,
      categoryId: f.categoryId === 'all' ? 'all' : f.categoryId,
      fileName: f.fileName,
      fileSize: f.fileSize,
      uploadedAt: new Date().toISOString().slice(0, 10),
    }));

    onSave(savedRecord, newEvidences);
  };

  // 증빙 항목 옵션 (전체 업로드 포함)
  const evidenceCategoryOptions = [
    { value: 'all', label: '전체 업로드' },
    ...BUDGET_CATEGORIES.map((c) => ({ value: c.id, label: `${c.code}. ${c.shortName}` })),
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`${year}년 ${month}월 집행실적 ${isNew ? '등록' : '편집'}`}
      size="xl"
    >
      <div className="space-y-4">
        {isNew && (
          <CompanySelect
            value={companyId}
            onChange={handleCompanyChange}
            companies={companies}
            label="회사 선택"
          />
        )}

        {/* 예산 요약 헤더 */}
        {yearBudgetTotal > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 bg-gray-50 rounded-lg px-4 py-2.5 text-xs">
            {!isGeneral && totalBudgetTotal > 0 && (
              <span className="text-gray-500">
                전체예산 <strong className="text-gray-700">{formatCurrency(totalBudgetTotal)}원</strong>
              </span>
            )}
            <span className="text-gray-500">
              {year}년 예산 <strong className="text-gray-700">{formatCurrency(yearBudgetTotal)}원</strong>
            </span>
            <span className="text-gray-500">
              타월집행 <strong className="text-gray-700">{formatCurrency(pastExecutedTotal)}원</strong>
            </span>
            <span className="text-gray-500">
              이번 입력 <strong className="text-primary">{formatCurrency(total)}원</strong>
            </span>
            <span className={`font-medium ${isYearOverBudget ? 'text-red-500' : 'text-emerald-600'}`}>
              잔액 {formatCurrency(yearBudgetTotal - pastExecutedTotal - total)}원
            </span>
          </div>
        )}

        {(() => {
          const showTotalCol = !isGeneral && totalBudgetTotal > 0;
          const showBudgetCols = yearBudgetTotal > 0;
          // footer의 "합계" 레이블이 차지할 colSpan
          const footerLabelSpan = isGeneral
            ? 1 + (showBudgetCols ? 2 : 0)
            : 1 + (showTotalCol ? 1 : 0) + (showBudgetCols ? 2 : 0) + 1; // +1 = 상세

          const thCls = 'px-3 py-2 text-right text-xs font-semibold text-gray-500 whitespace-nowrap';
          const numCls = (over) => `px-3 py-2 text-right text-xs tabular-nums whitespace-nowrap ${over ? 'text-red-500 font-semibold' : 'text-gray-500'}`;

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">항목</th>
                    {showTotalCol && <th className={thCls}>전체예산</th>}
                    {showBudgetCols && <th className={thCls}>{year}년 예산</th>}
                    {showBudgetCols && <th className={thCls}>잔액</th>}
                    {!isGeneral && (
                      <th className="px-2 py-2 text-center font-semibold text-gray-600 w-20 text-xs leading-tight">
                        <span>상세입력</span>
                        <span className="block text-[9px] text-primary font-normal">↕ 집행액 반영</span>
                      </th>
                    )}
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 w-40">집행액(원)</th>
                    {isGeneral && <th className="w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {isGeneral ? (
                    items.map((item, idx) => {
                      const yBudget = getItemYearBudget(item.name);
                      const pastExec = getItemPastExecuted(item.name);
                      const itemAmt = Number(item.amount) || 0;
                      const itemOver = yBudget > 0 && (pastExec + itemAmt) > yBudget;
                      const remaining = yBudget - pastExec - itemAmt;
                      return (
                        <tr key={idx} className={`border-b border-gray-50 ${itemOver ? 'bg-red-50/30' : ''}`}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemNameChange(idx, e.target.value)}
                              placeholder="항목명"
                              className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          {showBudgetCols && <td className={thCls}>{yBudget > 0 ? formatCurrency(yBudget) : <span className="text-gray-300">-</span>}</td>}
                          {showBudgetCols && <td className={numCls(itemOver)}>{yBudget > 0 ? formatCurrency(remaining) : <span className="text-gray-300">-</span>}</td>}
                          <td className="px-3 py-2">
                            <CurrencyInput value={item.amount} onChange={(val) => handleAmountChange(item.name, val)} />
                          </td>
                          <td className="px-1 py-2 text-center">
                            <button onClick={() => handleRemoveItem(idx)} className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    items.map((item) => {
                      const cat = BUDGET_CATEGORIES.find((c) => c.id === item.categoryId);
                      const detailCount = item.details?.length || 0;
                      const evCount = item.evidences?.length || 0;
                      const yBudget = getItemYearBudget(item.categoryId);
                      const tBudget = getItemTotalBudget(item.categoryId);
                      const pastExec = getItemPastExecuted(item.categoryId);
                      const itemAmt = Number(item.amount) || 0;
                      const itemOver = yBudget > 0 && (pastExec + itemAmt) > yBudget;
                      const remaining = yBudget - pastExec - itemAmt;
                      return (
                        <tr key={item.categoryId} className={`border-b border-gray-50 ${itemOver ? 'bg-red-50/30' : ''}`}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {detailCount > 0 && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{detailCount}건</span>
                              )}
                              {evCount > 0 && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                                  <Paperclip size={8} />{evCount}
                                </span>
                              )}
                              <span className="text-xs">{cat?.shortName}</span>
                            </div>
                          </td>
                          {showTotalCol && <td className={thCls}>{tBudget > 0 ? formatCurrency(tBudget) : <span className="text-gray-300">-</span>}</td>}
                          {showBudgetCols && <td className={thCls}>{yBudget > 0 ? formatCurrency(yBudget) : <span className="text-gray-300">-</span>}</td>}
                          {showBudgetCols && <td className={numCls(itemOver)}>{yBudget > 0 ? formatCurrency(remaining) : <span className="text-gray-300">-</span>}</td>}
                          <td className="px-1 py-2 text-center">
                            {(() => {
                              const detailSum = item.details?.reduce((s, d) => s + (Number(d.amount) || 0), 0) || 0;
                              const hasDetails = (item.details?.length || 0) > 0;
                              return (
                                <button
                                  onClick={() => setDetailModalOpen(item.categoryId)}
                                  className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-md transition-colors w-full ${
                                    hasDetails
                                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                      : 'bg-gray-100 text-gray-400 hover:bg-primary/10 hover:text-primary'
                                  }`}
                                  title="상세내역 입력 (저장 시 집행액에 반영)"
                                >
                                  <List size={12} />
                                  <span className="text-[9px] font-medium">상세입력</span>
                                  {hasDetails && (
                                    <span className="text-[9px] tabular-nums font-bold leading-tight">
                                      {formatCurrency(detailSum)}
                                    </span>
                                  )}
                                </button>
                              );
                            })()}
                          </td>
                          <td className="px-3 py-2">
                            <CurrencyInput value={item.amount} onChange={(val) => handleAmountChange(item.categoryId, val)} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-primary-light font-bold">
                    <td className="px-3 py-2.5" colSpan={footerLabelSpan}>
                      {isGeneral ? (
                        <button onClick={handleAddItem} className="text-xs text-primary hover:underline">
                          + 항목 추가
                        </button>
                      ) : '합계'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-primary tabular-nums">{formatCurrency(total)}원</td>
                    {isGeneral && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })()}

        {/* 증빙 첨부 */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Paperclip size={16} className="text-gray-500" />
            <h4 className="text-sm font-extrabold text-gray-700">증빙자료 첨부</h4>
          </div>
          <div className="mb-3">
            <Select
              value={categoryId}
              onChange={setCategoryId}
              label="증빙 항목"
              options={evidenceCategoryOptions}
            />
          </div>
          <FileUpload
            files={uploadedFiles}
            onAdd={handleFileAdd}
            onRemove={handleFileRemove}
          />
        </div>

        {/* 예산 초과 알림 */}
        {(isYearOverBudget || isTotalOverBudget) && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-lg">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {isYearOverBudget && (
                <p><strong>{year}년 예산 초과</strong> — 예산 {formatCurrency(yearBudgetTotal)}원 대비 집행 예정 {formatCurrency(pastExecutedTotal + total)}원 (초과 {formatCurrency(pastExecutedTotal + total - yearBudgetTotal)}원)</p>
              )}
              {isTotalOverBudget && (
                <p><strong>전체기간 예산 초과</strong> — 예산 {formatCurrency(totalBudgetTotal)}원 대비 집행 예정 {formatCurrency(pastExecutedTotal + total)}원 (초과 {formatCurrency(pastExecutedTotal + total - totalBudgetTotal)}원)</p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button icon={Save} onClick={() => handleSave('draft')}>저장</Button>
        </div>
      </div>

      {/* 상세내역 입력 모달 */}
      {detailModalOpen && (
        <DetailEntryModal
          year={record?.year || year}
          month={month}
          items={items}
          initialCategory={detailModalOpen}
          companyId={companyId}
          budgetPlans={data?.budgetPlans || []}
          executionRecords={data?.executionRecords || []}
          onSave={(updatedItems) => {
            setItems(updatedItems);
            setDetailModalOpen(null);
          }}
          onClose={() => setDetailModalOpen(null)}
        />
      )}
    </Modal>
  );
}

/* ─── 증빙파일 목록 모달 ─── */
function EvidenceListModal({ evidences, companies, selectedPeriod, selectedYear, selectedCompanyId, onRemove, onClose }) {
  const [companyFilter, setCompanyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;

  const filtered = evidences.filter((ev) => {
    if (selectedPeriod === 'yearly' && ev.year !== selectedYear) return false;
    if (selectedCompanyId !== 'all' && ev.companyId !== selectedCompanyId) return false;
    if (companyFilter !== 'all' && ev.companyId !== companyFilter) return false;
    if (categoryFilter !== 'all' && ev.categoryId !== categoryFilter) return false;
    if (monthFilter !== 'all' && ev.month !== Number(monthFilter)) return false;
    return true;
  });

  const getCompany = (id) => companies.find((c) => c.id === id);
  const getCompanyName = (id) => getCompany(id)?.name || '';
  const getCategoryName = (id) => {
    if (id === 'all') return '전체';
    return BUDGET_CATEGORIES.find((c) => c.id === id)?.shortName || '';
  };

  const totalSize = filtered.reduce((s, ev) => s + (ev.fileSize || 0), 0);

  const columns = [
    {
      key: 'month',
      label: '월',
      width: '60px',
      align: 'center',
      render: (v, row) => selectedPeriod === 'total' ? `${row.year}.${v}월` : `${v}월`,
    },
    {
      key: 'companyId',
      label: '회사',
      render: (v) => (
        <div className="flex items-center gap-2">
          {getCompany(v) && <CompanyLogo company={getCompany(v)} size="xs" />}
          <span className="text-sm">{getCompanyName(v).replace(/\(주\)/g, '').trim()}</span>
        </div>
      ),
    },
    {
      key: 'categoryId',
      label: '항목',
      render: (v) => <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{getCategoryName(v)}</span>,
    },
    {
      key: 'fileName',
      label: '파일명',
      render: (v) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-red-400 flex-shrink-0" />
          <span className="text-sm truncate max-w-[180px]">{v}</span>
        </div>
      ),
    },
    {
      key: 'fileSize',
      label: '크기',
      align: 'right',
      render: (v) => <span className="text-xs text-gray-500">{formatFileSize(v)}</span>,
    },
    {
      key: 'uploadedAt',
      label: '업로드일',
      align: 'center',
      render: (v) => <span className="text-xs text-gray-500">{formatDate(v)}</span>,
    },
    {
      key: 'id',
      label: '',
      width: '70px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); alert('다운로드 기능은 실제 파일 서버 연동 시 활성화됩니다.'); }}
            className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500"
            title="다운로드"
          >
            <Download size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(row.id); }}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
            title="삭제"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Modal isOpen onClose={onClose} title={`${periodLabel} 증빙파일 목록`} size="xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            value={companyFilter}
            onChange={setCompanyFilter}
            label="협력사"
            options={[
              { value: 'all', label: '전체' },
              ...companies.map((c) => ({ value: c.id, label: c.name.replace(/\(주\)/g, '').trim() })),
            ]}
          />
          <Select
            value={monthFilter}
            onChange={setMonthFilter}
            label="월"
            options={[
              { value: 'all', label: '전체' },
              ...MONTHS.map((m, i) => ({ value: i + 1, label: m })),
            ]}
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            label="항목"
            options={[
              { value: 'all', label: '전체' },
              ...BUDGET_CATEGORIES.map((c) => ({ value: c.id, label: c.shortName })),
            ]}
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>총 <strong className="text-gray-800">{filtered.length}</strong>건</span>
          <span>·</span>
          <span>업체 <strong className="text-gray-800">{new Set(filtered.map((e) => e.companyId)).size}</strong>개사</span>
          <span>·</span>
          <span>용량 <strong className="text-gray-800">{formatFileSize(totalSize)}</strong></span>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          <Table columns={columns} data={filtered} emptyMessage="등록된 증빙자료가 없습니다." />
        </div>
      </div>
    </Modal>
  );
}
