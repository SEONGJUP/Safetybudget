'use client';
import { useState } from 'react';
import { useBudget } from '@/lib/store';
import { BUDGET_CATEGORIES, MONTHS } from '@/lib/constants';
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
import { Save, Send, Edit3, FileText, Paperclip, Download, Trash2, Eye, Check, X, Printer, List } from 'lucide-react';
import DetailEntryModal from '@/components/execution/DetailEntryModal';

export default function ExecutionRecord() {
  const { data, selectedCompanyId, selectedPeriod, selectedYear, saveExecutionRecord, addEvidence, removeEvidence, updateReportStatus, addReport } = useBudget();
  const [editModal, setEditModal] = useState(null);
  const [monthModal, setMonthModal] = useState(null);
  const [evidenceModal, setEvidenceModal] = useState(false);

  if (!data) return null;

  const { companies, executionRecords, budgetPlans, evidences, monthlyReports } = data;

  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;

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

  // 기간 + 회사 필터
  const filtered = executionRecords.filter((r) => {
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
  const relevantPlans = budgetPlans.filter((bp) => {
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

  // 회사별 집행 통계
  const companyStats = activeCompanies.map((comp) => {
    const compRecords = executionRecords.filter((r) => {
      if (r.companyId !== comp.id) return false;
      if (selectedPeriod === 'yearly' && r.year !== selectedYear) return false;
      return true;
    });
    const executed = compRecords.reduce(
      (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
      0
    );
    const compPlan = budgetPlans.filter((bp) => {
      if (bp.companyId !== comp.id) return false;
      if (selectedPeriod === 'total') return bp.period === 'total';
      return bp.period === 'yearly' && bp.year === selectedYear;
    }).reduce((sum, bp) => sum + bp.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 0);

    return { company: comp, executed, budget: compPlan, rate: calcExecutionRate(executed, compPlan) };
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

      {/* 회사별 집행 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {companyStats.map(({ company, executed, budget, rate }) => (
          <div
            key={company.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              const now = new Date();
              const currentMonth = now.getMonth() + 1;
              const existingRecord = executionRecords.find(
                (r) => r.companyId === company.id && r.year === selectedYear && r.month === currentMonth
              );
              setEditModal({
                month: currentMonth,
                record: existingRecord || null,
                isNew: !existingRecord,
                forCompany: company,
              });
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <CompanyLogo company={company} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{company.name}</p>
                <p className="text-[10px] text-gray-400">
                  {company.type === 'primary' ? '원도급사' : '협력사'}
                </p>
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
                  <div
                    className={`h-1.5 rounded-full ${rate > 100 ? 'bg-red-400' : rate > 80 ? 'bg-amber-400' : 'bg-primary'}`}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold ${rate > 100 ? 'text-red-500' : 'text-primary'}`}>
                  {formatPercent(rate)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 월별 12개 버튼 — 넓으면 한줄 12개, 좁으면 두줄 6개 */}
      <div className="grid grid-cols-6 xl:grid-cols-12 gap-1.5">
        {MONTHS.map((name, idx) => {
          const month = idx + 1;
          const total = monthlyTotals[month] || 0;
          const records = getMonthRecords(month);
          const hasRecords = records.length > 0;
          const allApproved = records.length > 0 && records.every((r) => r.status === 'approved');
          const hasDraft = records.some((r) => r.status === 'draft');
          const report = getMonthReport(month);

          return (
            <div
              key={month}
              className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-between py-2.5 transition-all cursor-pointer hover:shadow-lg hover:scale-[1.03] ${
                hasRecords
                  ? allApproved
                    ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
                    : hasDraft
                    ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                    : 'border-blue-300 bg-blue-50/50 shadow-sm'
                  : 'border-gray-150 bg-white hover:border-primary/40'
              }`}
              onClick={() => setMonthModal({ month, records })}
            >
              <span className={`text-base font-extrabold ${
                hasRecords
                  ? allApproved ? 'text-emerald-600' : hasDraft ? 'text-amber-600' : 'text-blue-600'
                  : 'text-gray-500'
              }`}>{month}월</span>
              <span className={`text-[10px] leading-tight text-center ${total > 0 ? 'text-gray-600 font-semibold' : 'text-gray-300'}`}>
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

      {/* 카테고리별 누적 집행 (단위: 원) */}
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
              {BUDGET_CATEGORIES.map((cat) => {
                const monthAmounts = MONTHS.map((_, mIdx) => {
                  const month = mIdx + 1;
                  return filtered
                    .filter((r) => r.month === month)
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
                    <td className="px-3 py-2 text-right font-bold text-sm tabular-nums">
                      {formatCurrency(catTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-2.5">합계(원)</td>
                {MONTHS.map((_, mIdx) => (
                  <td key={mIdx} className="px-2 py-2.5 text-right text-xs tabular-nums">
                    {monthlyTotals[mIdx + 1] > 0 ? formatCurrency(monthlyTotals[mIdx + 1]) : '-'}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right text-primary tabular-nums">
                  {formatCurrency(yearExecuted)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* 월 상세 보기 모달 (피벗 + 보고서 기능) */}
      {monthModal && (
        <MonthViewModal
          periodLabel={periodLabel}
          month={monthModal.month}
          records={monthModal.records}
          companies={companies}
          executionRecords={executionRecords}
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
              forCompany: companies.find((c) => c.id === companyId) || companies[0],
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
          year={selectedYear}
          month={editModal.month}
          record={editModal.record}
          isNew={editModal.isNew}
          companies={companies}
          selectedCompanyId={editModal.forCompany?.id || (selectedCompanyId !== 'all' ? selectedCompanyId : companies[0]?.id)}
          onSave={(record, newEvidences) => {
            saveExecutionRecord(record);
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
          evidences={evidences}
          companies={companies}
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

/* ─── 월 상세 보기 모달 (피벗 + 보고서 기능) ─── */
function MonthViewModal({ periodLabel, month, records, companies, executionRecords, report, selectedYear, onEdit, onNewRecord, onCreateReport, onSubmitReport, onApproveReport, onRejectReport, onClose }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const recordCompanies = companies.filter((c) => records.some((r) => r.companyId === c.id));
  const noRecordCompanies = companies.filter((c) => !records.some((r) => r.companyId === c.id));

  const matrixData = BUDGET_CATEGORIES.map((cat) => {
    const row = { category: cat };
    let rowTotal = 0;
    recordCompanies.forEach((comp) => {
      const record = records.find((r) => r.companyId === comp.id);
      const item = record?.items.find((i) => i.categoryId === cat.id);
      const amount = item ? Number(item.amount) || 0 : 0;
      row[comp.id] = amount;
      rowTotal += amount;
    });
    row.total = rowTotal;
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
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs">코드</th>
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
                  <tr key={row.category.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-xs text-gray-400">{row.category.code}</td>
                    <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{row.category.shortName}</td>
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
                  <td className="px-3 py-2.5 text-xs" colSpan={2}>합계 (원)</td>
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
                  <Button size="sm" icon={Send} onClick={() => onSubmitReport(report.id)}>
                    검토요청
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
function ExecutionEditModal({ year, month, record, isNew, companies, selectedCompanyId, onSave, onClose }) {
  const { data } = useBudget();
  const initialItems = record
    ? record.items.map((item) => ({ ...item, details: item.details || [], orgInfo: item.orgInfo || null }))
    : BUDGET_CATEGORIES.map((cat) => ({ categoryId: cat.id, amount: 0, note: '', details: [], orgInfo: null }));

  const [items, setItems] = useState(initialItems);
  const [companyId, setCompanyId] = useState(
    record?.companyId || selectedCompanyId || companies[0]?.id
  );
  const [categoryId, setCategoryId] = useState('all');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleAmountChange = (catId, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.categoryId === catId ? { ...item, amount: value } : item
      )
    );
  };

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

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
      size="lg"
    >
      <div className="space-y-4">
        {isNew && (
          <CompanySelect
            value={companyId}
            onChange={setCompanyId}
            companies={companies}
            label="회사 선택"
          />
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2 text-left font-semibold text-gray-600">항목</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600 w-44">집행액(원)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const cat = BUDGET_CATEGORIES.find((c) => c.id === item.categoryId);
              return (
                <tr key={item.categoryId} className="border-b border-gray-50">
                  <td className="px-3 py-2">{cat?.shortName}</td>
                  <td className="px-3 py-2">
                    <CurrencyInput
                      value={item.amount}
                      onChange={(val) => handleAmountChange(item.categoryId, val)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-primary-light font-bold">
              <td className="px-3 py-2.5">합계</td>
              <td className="px-3 py-2.5 text-right text-primary">{formatCurrency(total)}원</td>
            </tr>
          </tfoot>
        </table>

        {/* 상세내역 입력 버튼 */}
        <div className="flex justify-center border-t border-gray-100 pt-3">
          <Button
            variant="outline"
            icon={List}
            onClick={() => setDetailModalOpen(true)}
            className="w-full"
          >
            건별 상세내역 입력
          </Button>
        </div>

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

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button variant="outline" icon={Save} onClick={() => handleSave('draft')}>임시저장</Button>
          <Button icon={Send} onClick={() => handleSave('submitted')}>검토요청</Button>
        </div>
      </div>

      {/* 상세내역 입력 모달 */}
      {detailModalOpen && (
        <DetailEntryModal
          year={record?.year || year}
          month={month}
          items={items}
          companyId={companyId}
          budgetPlans={data?.budgetPlans || []}
          executionRecords={data?.executionRecords || []}
          onSave={(updatedItems) => {
            setItems(updatedItems);
            setDetailModalOpen(false);
          }}
          onClose={() => setDetailModalOpen(false)}
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
