'use client';
import { useState, useCallback, useMemo } from 'react';
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
  companyId,
  budgetPlans,
  executionRecords,
  onSave,
  onClose,
}) {
  // useDetail=true인 카테고리만 필터
  const detailCategories = useMemo(
    () => BUDGET_CATEGORIES.filter((cat) => items.find((i) => i.categoryId === cat.id)?.useDetail),
    [items]
  );

  const [activeCat, setActiveCat] = useState(detailCategories[0]?.id || 'C01');

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
      if (!item.useDetail) return item;
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

  const currentCatData = allDetails[activeCat] || { details: [] };
  const currentItem = items.find((i) => i.categoryId === activeCat);
  const currentDetailSum = calcDetailsTotal(activeCat, currentCatData.details || []);
  const currentItemAmount = Number(currentItem?.amount) || 0;
  const etcAmount = Math.max(0, currentItemAmount - currentDetailSum);
  const currentEvidences = categoryEvidences[activeCat] || [];

  if (detailCategories.length === 0) {
    return (
      <Modal isOpen onClose={onClose} title="사용내역" size="lg" depth={2}>
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm mb-2">상세관리가 설정된 항목이 없습니다.</p>
          <p className="text-xs">편집 모달에서 각 항목의 [상세] 버튼을 눌러 상세관리를 활성화하세요.</p>
        </div>
        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>닫기</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title={`사용내역 (${year}년 ${String(month).padStart(2, '0')}월)`} size="full" depth={2}>
      <div className="flex h-[calc(100vh-140px)]">
        {/* 좌측 사이드바 */}
        <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <nav className="py-2">
            {detailCategories.map((cat) => {
              const catData = allDetails[cat.id];
              const item = items.find((i) => i.categoryId === cat.id);
              const count = catData?.details?.length || 0;
              const itemAmount = Number(item?.amount) || 0;
              const detailSum = calcDetailsTotal(cat.id, catData?.details || []);
              const etc = Math.max(0, itemAmount - detailSum);
              const evCount = (categoryEvidences[cat.id] || []).length;
              const isActive = activeCat === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <span className={`text-[10px] font-mono ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    {cat.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-primary' : 'text-gray-700'}`}>
                      {cat.shortName}
                    </p>
                    <p className="text-[10px] text-gray-400 tabular-nums truncate">
                      {formatCurrency(itemAmount)}원
                    </p>
                    {etc > 0 && (
                      <p className="text-[10px] text-amber-500 tabular-nums truncate">
                        기타 {formatCurrency(etc)}원
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                    {evCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center gap-0.5">
                        <Paperclip size={8} />{evCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* 전체 합계 */}
          <div className="border-t border-gray-200 px-3 py-3 mt-2">
            <p className="text-[10px] text-gray-400">상세관리 합계</p>
            <p className="text-sm font-bold text-primary tabular-nums">
              {formatCurrency(
                detailCategories.reduce((sum, cat) => {
                  const item = items.find((i) => i.categoryId === cat.id);
                  return sum + (Number(item?.amount) || 0);
                }, 0)
              )}
              <span className="text-[10px] text-gray-400 ml-0.5">원</span>
            </p>
          </div>
        </div>

        {/* 중앙: 상세 내역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {/* 카테고리 타이틀 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {BUDGET_CATEGORIES.find((c) => c.id === activeCat)?.code}
              </span>
              <h3 className="text-sm font-bold text-gray-800">
                {BUDGET_CATEGORIES.find((c) => c.id === activeCat)?.name}
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
                orgInfo={currentCatData.orgInfo}
                onChange={handleOrgInfoChange}
              />
            )}

            {/* 상세 내역 테이블 */}
            <CategoryDetailTable
              categoryId={activeCat}
              details={currentCatData.details || []}
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

            {/* 하단 합계 */}
            <CategorySummaryFooter
              categoryId={activeCat}
              currentDetails={currentCatData.details || []}
              currentMonthAmount={currentItemAmount}
              budgetPlans={budgetPlans}
              executionRecords={executionRecords}
              companyId={companyId}
              year={year}
              month={month}
            />
          </div>

          {/* 하단 버튼 */}
          <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 flex justify-end gap-2 bg-white">
            <Button variant="secondary" icon={X} onClick={onClose}>닫기</Button>
            <Button icon={Save} onClick={handleSave}>상세내역 저장</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
