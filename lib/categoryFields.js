// 카테고리별 상세 입력 필드 정의
// 모든 카테고리는 동일한 테이블 렌더러(CategoryDetailTable)로 처리됨

export const CATEGORY_FIELDS = {
  // 1. 안전·보건관리자 임금 등
  C01: {
    label: '안전·보건관리자 임금 등',
    fields: [
      { key: 'category', label: '구분', type: 'text', width: '100px' },
      { key: 'department', label: '소속', type: 'text', width: '100px' },
      { key: 'name', label: '성명', type: 'text', width: '80px' },
      { key: 'appointDate', label: '선임일', type: 'date', width: '130px' },
      { key: 'amount', label: '지급금액', type: 'currency', width: '130px', isAmount: true },
      { key: 'payDate', label: '지급일', type: 'date', width: '130px' },
      { key: 'payDetail', label: '지급내역', type: 'text', width: '140px' },
      { key: 'note', label: '비고', type: 'text', width: '120px' },
    ],
  },

  // 2. 안전시설비 등
  C02: {
    label: '안전시설비 등',
    fields: [
      { key: 'category', label: '구분', type: 'text', width: '120px' },
      { key: 'useDate', label: '사용일', type: 'date', width: '130px' },
      { key: 'unit', label: '단위', type: 'text', width: '60px' },
      { key: 'quantity', label: '수량', type: 'number', width: '70px' },
      { key: 'laborCost', label: '노무비', type: 'currency', width: '110px', group: '단가' },
      { key: 'materialCost', label: '자재비', type: 'currency', width: '110px', group: '단가' },
      { key: 'unitCostTotal', label: '계', type: 'currency', width: '110px', group: '단가', computed: true },
      { key: 'amount', label: '사용금액', type: 'currency', width: '130px', isAmount: true, computed: true },
      { key: 'payDetail', label: '지급내역', type: 'text', width: '140px' },
      { key: 'note', label: '비고', type: 'text', width: '120px' },
    ],
    autoCalcRules: [
      { target: 'unitCostTotal', formula: (row) => (Number(row.laborCost) || 0) + (Number(row.materialCost) || 0) },
      { target: 'amount', formula: (row) => ((Number(row.laborCost) || 0) + (Number(row.materialCost) || 0)) * (Number(row.quantity) || 0) },
    ],
  },

  // 3. 보호구 등
  C03: {
    label: '보호구 등',
    fields: [
      { key: 'category', label: '구분', type: 'text', width: '120px' },
      { key: 'planPrice', label: '단가', type: 'currency', width: '100px', group: '계획' },
      { key: 'planQty', label: '수량', type: 'number', width: '70px', group: '계획' },
      { key: 'planAmount', label: '금액', type: 'currency', width: '110px', group: '계획', computed: true },
      { key: 'useDate', label: '사용일', type: 'date', width: '130px' },
      { key: 'actualPrice', label: '단가', type: 'currency', width: '100px', group: '소요비용' },
      { key: 'actualQty', label: '수량', type: 'number', width: '70px', group: '소요비용' },
      { key: 'amount', label: '금액', type: 'currency', width: '110px', group: '소요비용', isAmount: true, computed: true },
      { key: 'payDetail', label: '지급내역', type: 'text', width: '140px' },
      { key: 'note', label: '비고', type: 'text', width: '120px' },
    ],
    autoCalcRules: [
      { target: 'planAmount', formula: (row) => (Number(row.planPrice) || 0) * (Number(row.planQty) || 0) },
      { target: 'amount', formula: (row) => (Number(row.actualPrice) || 0) * (Number(row.actualQty) || 0) },
    ],
  },

  // 4. 안전보건진단비 등
  C04: {
    label: '안전보건진단비 등',
    fields: [
      { key: 'category', label: '구분', type: 'text', width: '120px' },
      { key: 'inspector', label: '진단기관(검사기관)', type: 'text', width: '160px' },
      { key: 'useDate', label: '사용일', type: 'date', width: '130px' },
      { key: 'amount', label: '소요비용', type: 'currency', width: '130px', isAmount: true },
      { key: 'payDetail', label: '지급내역', type: 'text', width: '140px' },
      { key: 'note', label: '비고', type: 'text', width: '120px' },
    ],
  },

  // 5. 안전보건교육비 등
  C05: {
    label: '안전보건교육비 등',
    fields: [
      { key: 'subject', label: '교육과목', type: 'text', width: '160px' },
      { key: 'organizer', label: '교육주관', type: 'text', width: '120px' },
      { key: 'eduDate', label: '교육일', type: 'date', width: '130px' },
      { key: 'attendees', label: '참가인원', type: 'number', width: '80px' },
      { key: 'amount', label: '소요경비', type: 'currency', width: '130px', isAmount: true },
      { key: 'note', label: '비고', type: 'text', width: '120px' },
    ],
  },

  // 6. 근로자 건강장해예방비 등
  C06: {
    label: '근로자 건강장해예방비 등',
    fields: [
      { key: 'category', label: '구분', type: 'text', width: '120px' },
      { key: 'useDate', label: '사용일', type: 'date', width: '130px' },
      { key: 'hospital', label: '진단병원', type: 'text', width: '140px' },
      { key: 'attendees', label: '참가인원', type: 'number', width: '80px' },
      { key: 'amount', label: '소요경비', type: 'currency', width: '130px', isAmount: true },
      { key: 'note', label: '비고', type: 'text', width: '120px' },
    ],
  },

  // 7. 건설재해예방전문지도기관 기술지도비
  C07: {
    label: '기술지도비',
    fields: [
      { key: 'guidanceItem', label: '지도항목', type: 'text', width: '160px' },
      { key: 'guidanceOrg', label: '지도기관', type: 'text', width: '140px' },
      { key: 'inspDate', label: '점검일', type: 'date', width: '130px' },
      { key: 'amount', label: '소요경비', type: 'currency', width: '130px', isAmount: true },
      { key: 'note', label: '비고', type: 'text', width: '120px' },
    ],
  },

  // 8. 본사 전담조직 근로자 임금 등
  C08: {
    label: '본사 전담조직 근로자 임금 등',
    sections: [
      { key: 'orgInfo', type: 'single', label: '조직 현황' },
      { key: 'details', type: 'repeating', label: '사용 내역' },
    ],
    fields: [
      { key: 'category', label: '구분', type: 'text', width: '100px' },
      { key: 'department', label: '소속', type: 'text', width: '100px' },
      { key: 'position', label: '직책', type: 'text', width: '80px' },
      { key: 'name', label: '성명', type: 'text', width: '80px' },
      { key: 'appointDate', label: '보직일', type: 'date', width: '130px' },
      { key: 'amount', label: '지급액', type: 'currency', width: '130px', isAmount: true },
      { key: 'payDate', label: '지급일', type: 'date', width: '130px' },
      { key: 'note', label: '비고', type: 'text', width: '120px' },
    ],
  },

  // 9. 위험성평가 등에 따른 소요비용
  C09: {
    label: '위험성평가 소요비용',
    fields: [
      { key: 'itemName', label: '품목명', type: 'text', width: '120px' },
      { key: 'riskAssessDate', label: '위험성평가등', type: 'date', width: '120px', group: '결정일' },
      { key: 'consultDate', label: '노사협의등', type: 'date', width: '120px', group: '결정일' },
      { key: 'planPrice', label: '단가', type: 'currency', width: '100px', group: '계획' },
      { key: 'planQty', label: '수량', type: 'number', width: '70px', group: '계획' },
      { key: 'planAmount', label: '금액', type: 'currency', width: '110px', group: '계획', computed: true },
      { key: 'useDate', label: '사용일', type: 'date', width: '130px' },
      { key: 'actualPrice', label: '단가', type: 'currency', width: '100px', group: '소요비용' },
      { key: 'actualQty', label: '수량', type: 'number', width: '70px', group: '소요비용' },
      { key: 'amount', label: '금액', type: 'currency', width: '110px', group: '소요비용', isAmount: true, computed: true },
      { key: 'payDetail', label: '지급내역', type: 'text', width: '140px' },
      { key: 'note', label: '비고', type: 'text', width: '120px' },
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
