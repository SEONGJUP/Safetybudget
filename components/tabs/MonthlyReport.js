'use client';
import { useState } from 'react';
import { useBudget } from '@/lib/store';
import { BUDGET_CATEGORIES, MONTHS, DEFAULT_YEARS } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';
import CompanyLogo from '@/components/ui/CompanyLogo';
import { FileText, Send, Check, X, Eye, Printer, CheckCircle2, Clock, AlertTriangle, FileX } from 'lucide-react';

export default function MonthlyReport() {
  const { data, selectedPeriod, selectedYear, updateReportStatus, addReport } = useBudget();
  const [detailModal, setDetailModal] = useState(null);

  if (!data) return null;

  const { companies, executionRecords, monthlyReports } = data;

  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;

  // 기간에 따른 보고서 필터
  const filteredReports = selectedPeriod === 'total'
    ? monthlyReports
    : monthlyReports.filter((r) => r.year === selectedYear);

  // 보고서 통계
  const approvedCount = filteredReports.filter((r) => r.status === 'approved').length;
  const draftCount = filteredReports.filter((r) => r.status === 'draft').length;
  const submittedCount = filteredReports.filter((r) => r.status === 'submitted').length;
  const rejectedCount = filteredReports.filter((r) => r.status === 'rejected').length;
  const totalReportableMonths = selectedPeriod === 'total'
    ? DEFAULT_YEARS.length * 12
    : 12;
  const notCreatedCount = totalReportableMonths - filteredReports.length;

  // 집행액 합계
  const filteredExecRecords = selectedPeriod === 'total'
    ? executionRecords
    : executionRecords.filter((r) => r.year === selectedYear);
  const totalExecutedAmount = filteredExecRecords.reduce(
    (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    0
  );

  // 월별 보고서 목록 (년도별 모드)
  const yearlyReportList = MONTHS.map((name, idx) => {
    const month = idx + 1;
    const report = monthlyReports.find((r) => r.year === selectedYear && r.month === month);
    const monthRecords = executionRecords.filter(
      (r) => r.year === selectedYear && r.month === month
    );
    const totalAmount = monthRecords.reduce(
      (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
      0
    );

    return {
      year: selectedYear,
      month,
      name,
      report,
      totalAmount,
      recordCount: monthRecords.length,
      companyCount: new Set(monthRecords.map((r) => r.companyId)).size,
    };
  });

  // 전체기간 모드: 년도별 요약
  const yearlySummary = DEFAULT_YEARS.map((year) => {
    const yearRpts = monthlyReports.filter((r) => r.year === year);
    const yearExecs = executionRecords.filter((r) => r.year === year);
    const totalAmt = yearExecs.reduce(
      (sum, rec) => sum + rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0),
      0
    );
    return {
      year,
      total: yearRpts.length,
      approved: yearRpts.filter((r) => r.status === 'approved').length,
      submitted: yearRpts.filter((r) => r.status === 'submitted').length,
      draft: yearRpts.filter((r) => r.status === 'draft').length,
      rejected: yearRpts.filter((r) => r.status === 'rejected').length,
      notCreated: 12 - yearRpts.length,
      totalAmount: totalAmt,
    };
  });

  const handleCreateReport = (year, month) => {
    addReport({
      year,
      month,
      status: 'draft',
      submittedAt: null,
      approvedAt: null,
      approver: null,
      note: '',
    });
  };

  const handleSubmit = (reportId) => {
    updateReportStatus(reportId, 'submitted', {
      submittedAt: new Date().toISOString().slice(0, 10),
    });
  };

  const handleApprove = (reportId) => {
    updateReportStatus(reportId, 'approved', {
      approvedAt: new Date().toISOString().slice(0, 10),
      approver: '관리자',
    });
  };

  const handleReject = (reportId) => {
    updateReportStatus(reportId, 'rejected');
  };

  return (
    <div className="space-y-4">
      {/* 보고서 통계 */}
      <div className="flex flex-wrap items-end gap-3 mb-2">
        <div className="flex-1" />
        <div className="text-right">
          <p className="text-xs text-gray-400">{periodLabel} 총 집행액</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(totalExecutedAmount)}원</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-700">{approvedCount}</p>
            <p className="text-[11px] text-emerald-600">승인 완료</p>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-700">{submittedCount}</p>
            <p className="text-[11px] text-amber-600">검토 대기</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{draftCount}</p>
            <p className="text-[11px] text-blue-600">작성 중</p>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
            <p className="text-[11px] text-red-600">반려</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-200 rounded-lg">
            <FileX size={20} className="text-gray-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">{notCreatedCount}</p>
            <p className="text-[11px] text-gray-500">미생성</p>
          </div>
        </div>
      </div>

      {/* 전체기간: 년도별 요약 테이블 */}
      {selectedPeriod === 'total' ? (
        <Card title="년도별 보고서 현황" noPad>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">년도</th>
                  <th className="px-3 py-3 text-center font-semibold text-emerald-600">승인</th>
                  <th className="px-3 py-3 text-center font-semibold text-amber-600">검토대기</th>
                  <th className="px-3 py-3 text-center font-semibold text-blue-600">작성중</th>
                  <th className="px-3 py-3 text-center font-semibold text-red-600">반려</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-500">미생성</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">집행액</th>
                </tr>
              </thead>
              <tbody>
                {yearlySummary.map((row) => (
                  <tr key={row.year} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium">{row.year}년</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-bold ${row.approved > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>{row.approved}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-bold ${row.submitted > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{row.submitted}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-bold ${row.draft > 0 ? 'text-blue-600' : 'text-gray-300'}`}>{row.draft}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-bold ${row.rejected > 0 ? 'text-red-600' : 'text-gray-300'}`}>{row.rejected}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-bold ${row.notCreated > 0 ? 'text-gray-600' : 'text-gray-300'}`}>{row.notCreated}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.totalAmount)}원</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3">합계</td>
                  <td className="px-3 py-3 text-center text-emerald-600">{yearlySummary.reduce((s, r) => s + r.approved, 0)}</td>
                  <td className="px-3 py-3 text-center text-amber-600">{yearlySummary.reduce((s, r) => s + r.submitted, 0)}</td>
                  <td className="px-3 py-3 text-center text-blue-600">{yearlySummary.reduce((s, r) => s + r.draft, 0)}</td>
                  <td className="px-3 py-3 text-center text-red-600">{yearlySummary.reduce((s, r) => s + r.rejected, 0)}</td>
                  <td className="px-3 py-3 text-center text-gray-600">{yearlySummary.reduce((s, r) => s + r.notCreated, 0)}</td>
                  <td className="px-4 py-3 text-right text-primary">{formatCurrency(totalExecutedAmount)}원</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      ) : (
        /* 년도별: 월별 보고서 리스트 */
        <div className="grid grid-cols-1 gap-3">
          {yearlyReportList.map((item) => (
            <div
              key={item.month}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{item.month}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {selectedYear}년 {item.name} 보고서
                      </h3>
                      {item.report && <Badge status={item.report.status} />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>집행액: {formatCurrency(item.totalAmount)}원</span>
                      <span>회사: {item.companyCount}곳</span>
                      <span>실적: {item.recordCount}건</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-16 sm:ml-0">
                  {!item.report ? (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={FileText}
                      onClick={() => handleCreateReport(selectedYear, item.month)}
                      disabled={item.recordCount === 0}
                    >
                      보고서 생성
                    </Button>
                  ) : item.report.status === 'draft' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Eye}
                        onClick={() => setDetailModal(item)}
                      >
                        미리보기
                      </Button>
                      <Button size="sm" icon={Send} onClick={() => handleSubmit(item.report.id)}>
                        검토요청
                      </Button>
                    </>
                  ) : item.report.status === 'submitted' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Eye}
                        onClick={() => setDetailModal(item)}
                      >
                        상세
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        icon={Check}
                        onClick={() => handleApprove(item.report.id)}
                      >
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={X}
                        onClick={() => handleReject(item.report.id)}
                      >
                        반려
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Eye}
                      onClick={() => setDetailModal(item)}
                    >
                      상세보기
                    </Button>
                  )}
                </div>
              </div>

              {item.report && (item.report.status === 'approved' || item.report.status === 'rejected') && (
                <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex gap-4">
                  {item.report.submittedAt && <span>제출: {formatDate(item.report.submittedAt)}</span>}
                  {item.report.approvedAt && <span>승인: {formatDate(item.report.approvedAt)}</span>}
                  {item.report.approver && <span>결재자: {item.report.approver}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 보고서 상세 모달 */}
      {detailModal && (
        <ReportDetailModal
          year={detailModal.year || selectedYear}
          month={detailModal.month}
          report={detailModal.report}
          executionRecords={executionRecords}
          companies={companies}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
}

function ReportDetailModal({ year, month, report, executionRecords, companies, onClose }) {
  const monthRecords = executionRecords.filter(
    (r) => r.year === year && r.month === month
  );

  const getCompany = (id) => companies.find((c) => c.id === id);
  const getCompanyName = (id) => getCompany(id)?.name || '';

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
                      {getCompanyName(rec.companyId).replace(/\(주\)/g, '').trim()}
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
                      <td key={rec.id} className="px-3 py-2 text-right text-xs">
                        {formatCurrency(item?.amount || 0)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(cat.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary-light/50 font-bold border-t-2 border-gray-200">
                <td className="px-3 py-2.5" colSpan={2}>합계</td>
                {monthRecords.map((rec) => {
                  const recTotal = rec.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
                  return (
                    <td key={rec.id} className="px-3 py-2.5 text-right text-xs">
                      {formatCurrency(recTotal)}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-right text-primary">{formatCurrency(grandTotal)}원</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" icon={Printer} onClick={() => window.print()}>
            인쇄
          </Button>
          <Button variant="secondary" onClick={onClose}>닫기</Button>
        </div>
      </div>
    </Modal>
  );
}
