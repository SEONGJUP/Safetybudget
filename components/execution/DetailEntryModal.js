'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { BUDGET_CATEGORIES } from '@/lib/constants';
import { CATEGORY_FIELDS, calcDetailsTotal } from '@/lib/categoryFields';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FileUpload from '@/components/ui/FileUpload';
import CategoryDetailTable from './CategoryDetailTable';
import C08OrgInfoForm from './C08OrgInfoForm';
import CategorySummaryFooter from './CategorySummaryFooter';
import { formatCurrency, generateId } from '@/lib/utils';
import { Save, X, Paperclip } from 'lucide-react';

export default function DetailEntryModal({
  year,
  month,
  items,
  initialCategory,
  companyId,
  budgetPlans,
  executionRecords,
  onSave,
  onClose,
}) {
  const sectionRefs = useRef({});

  // items에서 details/orgInfo 초기화
  const [allDetails, setAllDetails] = useState(() => {
    const map = {};
    BUDGET_CATEGORIES.forEach((cat) => {
      const item = items.find((i) => i.categoryId === cat.id);
      map[cat.id] = {
        details: item?.details || [],
        orgInfo: cat.id === 'C08' ? (item?.orgInfo || null) : undefined,
      };
    });
    return map;
  });

  // 카테고리별 증빙파일 상태
  const [categoryEvidences, setCategoryEvidences] = useState(() => {
    const map = {};
    BUDGET_CATEGORIES.forEach((cat) => {
      const item = items.find((i) => i.categoryId === cat.id);
      map[cat.id] = item?.evidences || [];
    });
    return map;
  });

  // 초기 카테고리로 스크롤
  useEffect(() => {
    if (initialCategory && sectionRefs.current[initialCategory]) {
      setTimeout(() => {
        sectionRefs.current[initialCategory]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [initialCategory]);

  const handleDetailsChange = useCallback((catId, newDetails) => {
    setAllDetails((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], details: newDetails },
    }));
  }, []);

  const handleOrgInfoChange = useCallback((orgInfo) => {
    setAllDetails((prev) => ({
      ...prev,
      C08: { ...prev.C08, orgInfo },
    }));
  }, []);

  const handleEvidenceAdd = useCallback((catId, fileInfo) => {
    setCategoryEvidences((prev) => ({
      ...prev,
      [catId]: [...(prev[catId] || []), { ...fileInfo, id: generateId(), categoryId: catId }],
    }));
  }, []);

  const handleEvidenceRemove = useCallback((catId, idx) => {
    setCategoryEvidences((prev) => ({
      ...prev,
      [catId]: (prev[catId] || []).filter((_, i) => i !== idx),
    }));
  }, []);

  const handleSave = () => {
    const updatedItems = items.map((item) => {
      const catData = allDetails[item.categoryId];
      const detailSum = calcDetailsTotal(item.categoryId, catData?.details || []);
      const newAmount = Math.max(Number(item.amount) || 0, detailSum);
      return {
        ...item,
        amount: newAmount,
        details: catData?.details || [],
        orgInfo: item.categoryId === 'C08' ? catData?.orgInfo : item.orgInfo,
        evidences: categoryEvidences[item.categoryId] || [],
      };
    });
    onSave(updatedItems);
  };

  // 전체 합계 계산
  const grandTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const detailGrandTotal = BUDGET_CATEGORIES.reduce((sum, cat) => {
    const catData = allDetails[cat.id];
    return sum + calcDetailsTotal(cat.id, catData?.details || []);
  }, 0);

  return (
    <Modal isOpen onClose={onClose} title={`사용내역 (${year}년 ${String(month).padStart(2, '0')}월)`} size="full" depth={2}>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
          {BUDGET_CATEGORIES.map((cat) => {
            const config = CATEGORY_FIELDS[cat.id];
            if (!config) return null;

            const catData = allDetails[cat.id] || { details: [] };
            const currentItem = items.find((i) => i.categoryId === cat.id);
            const currentDetailSum = calcDetailsTotal(cat.id, catData.details || []);
            const currentItemAmount = Number(currentItem?.amount) || 0;
            const etcAmount = Math.max(0, currentItemAmount - currentDetailSum);
            const currentEvidences = categoryEvidences[cat.id] || [];
            const detailCount = catData.details?.length || 0;

            return (
              <div
                key={cat.id}
                ref={(el) => { sectionRefs.current[cat.id] = el; }}
                className="border border-gray-200 rounded-xl p-4"
              >
                {/* 카테고리 타이틀 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {cat.code}
                  </span>
                  <h3 className="text-sm font-bold text-gray-800">
                    {cat.name}
                  </h3>
                  {detailCount > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                      {detailCount}건
                    </span>
                  )}
                  {currentEvidences.length > 0 && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      <Paperclip size={8} />{currentEvidences.length}
                    </span>
                  )}
                  {currentItemAmount > 0 && (
                    <span className="text-xs text-gray-400 ml-auto">
                      집계금액: <strong className="text-gray-700">{formatCurrency(currentItemAmount)}원</strong>
                    </span>
                  )}
                </div>

                {/* C08: 조직현황 폼 */}
                {cat.id === 'C08' && (
                  <C08OrgInfoForm
                    orgInfo={catData.orgInfo}
                    onChange={handleOrgInfoChange}
                  />
                )}

                {/* 상세 내역 테이블 */}
                <CategoryDetailTable
                  categoryId={cat.id}
                  details={catData.details || []}
                  onChange={(newDetails) => handleDetailsChange(cat.id, newDetails)}
                  etcAmount={etcAmount}
                />

                {/* 증빙자료 첨부 */}
                <div className="border border-gray-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip size={14} className="text-gray-500" />
                    <h4 className="text-xs font-bold text-gray-700">증빙자료</h4>
                    {currentEvidences.length > 0 && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                        {currentEvidences.length}건
                      </span>
                    )}
                  </div>
                  <FileUpload
                    files={currentEvidences}
                    onAdd={(fileInfo) => handleEvidenceAdd(cat.id, fileInfo)}
                    onRemove={(idx) => handleEvidenceRemove(cat.id, idx)}
                  />
                </div>

                {/* 하단 합계 */}
                <CategorySummaryFooter
                  categoryId={cat.id}
                  currentDetails={catData.details || []}
                  currentMonthAmount={currentItemAmount}
                  budgetPlans={budgetPlans}
                  executionRecords={executionRecords}
                  companyId={companyId}
                  year={year}
                  month={month}
                />
              </div>
            );
          })}

          {/* 전체 합계 */}
          <div className="border-2 border-primary/30 rounded-xl p-4 bg-primary-light/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-800">전체 합계</h3>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">상세내역 합계</p>
                  <p className="text-sm font-bold text-gray-700 tabular-nums">
                    {formatCurrency(detailGrandTotal)}<span className="text-[10px] text-gray-400 ml-0.5">원</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">집계금액 합계</p>
                  <p className="text-lg font-extrabold text-primary tabular-nums">
                    {formatCurrency(grandTotal)}<span className="text-xs text-gray-400 ml-0.5">원</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 flex justify-end gap-2 bg-white">
          <Button variant="secondary" icon={X} onClick={onClose}>닫기</Button>
          <Button icon={Save} onClick={handleSave}>상세내역 저장</Button>
        </div>
      </div>
    </Modal>
  );
}
