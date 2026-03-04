'use client';
import { useState, useCallback } from 'react';
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
  const [activeCat, setActiveCat] = useState(initialCategory || BUDGET_CATEGORIES[0]?.id);

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

  // 현재 탭 데이터
  const catData = allDetails[activeCat] || { details: [] };
  const currentItem = items.find((i) => i.categoryId === activeCat);
  const currentDetailSum = calcDetailsTotal(activeCat, catData.details || []);
  const currentItemAmount = Number(currentItem?.amount) || 0;
  const etcAmount = Math.max(0, currentItemAmount - currentDetailSum);
  const currentEvidences = categoryEvidences[activeCat] || [];
  const activeCatInfo = BUDGET_CATEGORIES.find((c) => c.id === activeCat);

  return (
    <Modal isOpen onClose={onClose} title={`사용내역 (${year}년 ${String(month).padStart(2, '0')}월)`} size="full" depth={2}>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* 탭 네비게이션 */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4">
          <div className="flex gap-0 overflow-x-auto">
            {BUDGET_CATEGORIES.map((cat) => {
              const cd = allDetails[cat.id];
              const count = cd?.details?.length || 0;
              const evCount = (categoryEvidences[cat.id] || []).length;
              const isActive = activeCat === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={`font-mono text-[10px] ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {cat.code}
                  </span>
                  <span className="hidden sm:inline">{cat.shortName}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                  {evCount > 0 && (
                    <span className="text-[10px] px-1 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center gap-0.5">
                      <Paperclip size={7} />{evCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 카테고리 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* 카테고리 타이틀 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {activeCatInfo?.code}
            </span>
            <h3 className="text-sm font-bold text-gray-800">
              {activeCatInfo?.name}
            </h3>
            {currentItemAmount > 0 && (
              <span className="text-xs text-gray-400 ml-auto">
                집계금액: <strong className="text-gray-700">{formatCurrency(currentItemAmount)}원</strong>
              </span>
            )}
          </div>

          {/* C08: 조직현황 폼 */}
          {activeCat === 'C08' && (
            <C08OrgInfoForm
              orgInfo={catData.orgInfo}
              onChange={handleOrgInfoChange}
            />
          )}

          {/* 상세 내역 테이블 */}
          <CategoryDetailTable
            categoryId={activeCat}
            details={catData.details || []}
            onChange={(newDetails) => handleDetailsChange(activeCat, newDetails)}
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
              onAdd={(fileInfo) => handleEvidenceAdd(activeCat, fileInfo)}
              onRemove={(idx) => handleEvidenceRemove(activeCat, idx)}
            />
          </div>

          {/* 카테고리별 합계 */}
          <CategorySummaryFooter
            categoryId={activeCat}
            currentDetails={catData.details || []}
            currentMonthAmount={currentItemAmount}
            budgetPlans={budgetPlans}
            executionRecords={executionRecords}
            companyId={companyId}
            year={year}
            month={month}
          />
        </div>

        {/* 하단: 전체 합계 + 버튼 */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          <div className="px-4 py-2 flex items-center justify-between bg-primary-light/20 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-600">전체 합계</span>
            <div className="flex items-center gap-5">
              <span className="text-xs text-gray-500">
                상세내역 <strong className="text-gray-700">{formatCurrency(detailGrandTotal)}</strong>원
              </span>
              <span className="text-sm font-extrabold text-primary tabular-nums">
                집계 {formatCurrency(grandTotal)}<span className="text-xs text-gray-400 ml-0.5">원</span>
              </span>
            </div>
          </div>
          <div className="px-4 py-3 flex justify-end gap-2">
            <Button variant="secondary" icon={X} onClick={onClose}>닫기</Button>
            <Button icon={Save} onClick={handleSave}>상세내역 저장</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
