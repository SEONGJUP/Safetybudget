'use client';
import { useState, useCallback } from 'react';
import { BUDGET_CATEGORIES } from '@/lib/constants';
import { CATEGORY_FIELDS, calcDetailsTotal, createEmptyOrgInfo } from '@/lib/categoryFields';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CategoryDetailTable from './CategoryDetailTable';
import C08OrgInfoForm from './C08OrgInfoForm';
import CategorySummaryFooter from './CategorySummaryFooter';
import { formatCurrency } from '@/lib/utils';
import { Save, X } from 'lucide-react';

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
  const [activeCat, setActiveCat] = useState('C01');

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

  const handleSave = () => {
    // details 합계를 items[].amount에 동기화
    const updatedItems = items.map((item) => {
      const catData = allDetails[item.categoryId];
      if (!catData?.details?.length) return item;
      const total = calcDetailsTotal(item.categoryId, catData.details);
      return {
        ...item,
        amount: total,
        details: catData.details,
        orgInfo: item.categoryId === 'C08' ? catData.orgInfo : item.orgInfo,
      };
    });
    onSave(updatedItems);
  };

  const currentCatData = allDetails[activeCat] || { details: [] };

  return (
    <Modal isOpen onClose={onClose} title={`사용내역 (${year}년 ${String(month).padStart(2, '0')}월)`} size="full" depth={2}>
      <div className="flex h-[calc(100vh-140px)]">
        {/* 좌측 사이드바: 카테고리 네비게이션 */}
        <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <nav className="py-2">
            {BUDGET_CATEGORIES.map((cat) => {
              const catData = allDetails[cat.id];
              const count = catData?.details?.length || 0;
              const total = calcDetailsTotal(cat.id, catData?.details || []);
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
                    {total > 0 && (
                      <p className="text-[10px] text-gray-400 tabular-nums truncate">
                        {formatCurrency(total)}원
                      </p>
                    )}
                  </div>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 전체 합계 */}
          <div className="border-t border-gray-200 px-3 py-3 mt-2">
            <p className="text-[10px] text-gray-400">전체 합계</p>
            <p className="text-sm font-bold text-primary tabular-nums">
              {formatCurrency(
                BUDGET_CATEGORIES.reduce((sum, cat) => {
                  return sum + calcDetailsTotal(cat.id, allDetails[cat.id]?.details || []);
                }, 0)
              )}
              <span className="text-[10px] text-gray-400 ml-0.5">원</span>
            </p>
          </div>
        </div>

        {/* 중앙: 상세 내역 테이블 */}
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
            />

            {/* 하단 합계 */}
            <CategorySummaryFooter
              categoryId={activeCat}
              currentDetails={currentCatData.details || []}
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
