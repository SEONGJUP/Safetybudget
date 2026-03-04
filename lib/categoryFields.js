// 카테고리별 상세 입력 필드 정의
// 모든 카테고리는 동일한 테이블 렌더러(CategoryDetailTable)로 처리됨

export const CATEGORY_FIELDS = {
  C01: {
    label: '인건비·수당',
    fields: [
      { key: 'name', label: '성명', type: 'text', width: '100px' },
      { key: 'department', label: '소속', type: 'text', width: '120px' },
      { key: 'position', label: '직종(직위)', type: 'text', width: '100px' },
      { key: 'startDate', label: '근무시작', type: 'date', width: '130px' },
      { key: 'endDate', label: '근무종료', type: 'date', width: '130px' },
      { key: 'amount', label: '지급액', type: 'currency', width: '140px', isAmount: true },
    ],
  },

  C02: {
    label: '안전시설비',
    fields: [
      { key: 'itemName', label: '품명', type: 'text', width: '140px' },
      { key: 'spec', label: '규격', type: 'text', width: '100px' },
      { key: 'unit', label: '단위', type: 'text', width: '60px' },
      { key: 'quantity', label: '수량', type: 'number', width: '70px' },
      { key: 'laborCost', label: '노무비', type: 'currency', width: '120px', group: '단가' },
      { key: 'materialCost', label: '자재비', type: 'currency', width: '120px', group: '단가' },
      { key: 'unitCostTotal', label: '계', type: 'currency', width: '120px', group: '단가', computed: true },
      { key: 'amount', label: '사용금액', type: 'currency', width: '140px', isAmount: true, computed: true },
    ],
    autoCalcRules: [
      { target: 'unitCostTotal', formula: (row) => (Number(row.laborCost) || 0) + (Number(row.materialCost) || 0) },
      { target: 'amount', formula: (row) => ((Number(row.laborCost) || 0) + (Number(row.materialCost) || 0)) * (Number(row.quantity) || 0) },
    ],
  },

  C03: {
    label: '보호구·장구',
    fields: [
      { key: 'itemName', label: '품명', type: 'text', width: '140px' },
      { key: 'spec', label: '규격', type: 'text', width: '100px' },
      { key: 'unit', label: '단위', type: 'text', width: '60px' },
      { key: 'planPrice', label: '단가', type: 'currency', width: '110px', group: '계획' },
      { key: 'planQty', label: '수량', type: 'number', width: '70px', group: '계획' },
      { key: 'planAmount', label: '금액', type: 'currency', width: '120px', group: '계획', computed: true },
      { key: 'actualPrice', label: '단가', type: 'currency', width: '110px', group: '소요비용' },
      { key: 'actualQty', label: '수량', type: 'number', width: '70px', group: '소요비용' },
      { key: 'amount', label: '금액', type: 'currency', width: '120px', group: '소요비용', isAmount: true, computed: true },
    ],
    autoCalcRules: [
      { target: 'planAmount', formula: (row) => (Number(row.planPrice) || 0) * (Number(row.planQty) || 0) },
      { target: 'amount', formula: (row) => (Number(row.actualPrice) || 0) * (Number(row.actualQty) || 0) },
    ],
  },

  C04: {
    label: '안전진단비',
    fields: [
      { key: 'itemName', label: '항목', type: 'text', width: '160px' },
      { key: 'content', label: '내용', type: 'text', width: '240px' },
      { key: 'amount', label: '금액', type: 'currency', width: '140px', isAmount: true },
    ],
  },

  C05: {
    label: '교육·행사비',
    fields: [
      { key: 'eventName', label: '교육/행사명', type: 'text', width: '200px' },
      { key: 'eventDate', label: '일자', type: 'date', width: '130px' },
      { key: 'attendees', label: '참석인원', type: 'number', width: '80px' },
      { key: 'amount', label: '금액', type: 'currency', width: '140px', isAmount: true },
    ],
  },

  C06: {
    label: '건강관리비',
    fields: [
      { key: 'itemName', label: '항목', type: 'text', width: '160px' },
      { key: 'content', label: '내용', type: 'text', width: '200px' },
      { key: 'targetCount', label: '대상인원', type: 'number', width: '80px' },
      { key: 'amount', label: '금액', type: 'currency', width: '140px', isAmount: true },
    ],
  },

  C07: {
    label: '기술지도비',
    fields: [
      { key: 'orgName', label: '지도기관', type: 'text', width: '200px' },
      { key: 'period', label: '기간', type: 'text', width: '160px' },
      { key: 'amount', label: '금액', type: 'currency', width: '140px', isAmount: true },
    ],
  },

  C08: {
    label: '본사사용비',
    sections: [
      { key: 'orgInfo', type: 'single', label: '조직현황' },
      { key: 'details', type: 'repeating', label: '사용내역' },
    ],
    fields: [
      { key: 'itemName', label: '항목', type: 'text', width: '160px' },
      { key: 'content', label: '내용', type: 'text', width: '240px' },
      { key: 'amount', label: '금액', type: 'currency', width: '140px', isAmount: true },
    ],
  },

  C09: {
    label: '위험성평가',
    fields: [
      { key: 'itemName', label: '항목', type: 'text', width: '140px' },
      { key: 'spec', label: '규격', type: 'text', width: '100px' },
      { key: 'unit', label: '단위', type: 'text', width: '60px' },
      { key: 'planPrice', label: '단가', type: 'currency', width: '110px', group: '계획' },
      { key: 'planQty', label: '수량', type: 'number', width: '70px', group: '계획' },
      { key: 'planAmount', label: '금액', type: 'currency', width: '120px', group: '계획', computed: true },
      { key: 'actualPrice', label: '단가', type: 'currency', width: '110px', group: '소요비용' },
      { key: 'actualQty', label: '수량', type: 'number', width: '70px', group: '소요비용' },
      { key: 'amount', label: '금액', type: 'currency', width: '120px', group: '소요비용', isAmount: true, computed: true },
    ],
    autoCalcRules: [
      { target: 'planAmount', formula: (row) => (Number(row.planPrice) || 0) * (Number(row.planQty) || 0) },
      { target: 'amount', formula: (row) => (Number(row.actualPrice) || 0) * (Number(row.actualQty) || 0) },
    ],
  },
};

// 빈 행 생성 헬퍼
export function createEmptyRow(categoryId) {
  const config = CATEGORY_FIELDS[categoryId];
  if (!config) return {};
  const row = { _id: Math.random().toString(36).slice(2, 10) };
  config.fields.forEach((f) => {
    if (f.type === 'currency' || f.type === 'number') {
      row[f.key] = 0;
    } else {
      row[f.key] = '';
    }
  });
  return row;
}

// 자동계산 적용 헬퍼
export function applyAutoCalc(categoryId, row) {
  const config = CATEGORY_FIELDS[categoryId];
  if (!config?.autoCalcRules) return row;
  const updated = { ...row };
  config.autoCalcRules.forEach((rule) => {
    updated[rule.target] = rule.formula(updated);
  });
  return updated;
}

// 합산 대상(isAmount) 필드의 합계 계산
export function calcDetailsTotal(categoryId, details) {
  const config = CATEGORY_FIELDS[categoryId];
  if (!config || !details?.length) return 0;
  const amountField = config.fields.find((f) => f.isAmount);
  if (!amountField) return 0;
  return details.reduce((sum, row) => sum + (Number(row[amountField.key]) || 0), 0);
}

// C08 빈 orgInfo 생성
export function createEmptyOrgInfo() {
  return {
    ranking: '',
    orgName: '',
    position: '',
    headcount: 0,
    totalBudget: 0,
    hqBudget: 0,
  };
}
