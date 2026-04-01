import { BUDGET_CATEGORIES } from './constants';

// 프로젝트 정보
export const PROJECT = {
  id: 'proj-001',
  name: '○○지구 도시개발사업 기반시설공사',
  contractNo: '2024-건설-0042',
  startDate: '2024-03-01',
  endDate: '2026-12-31',
  totalContractAmount: 15000000000,   // 150억
  safetyBudgetRate: 2.93,             // 안전관리비 요율
  totalSafetyBudget: 439500000,       // 4억 3,950만원
  siteCategory: 'construction',       // 'construction' | 'general'
  totalRevenue: 0,                    // 일반사업장용 총 매출액
  // 안전관리비 계상 계산기 데이터
  siteType: 'general_a',              // 공사 종류 ID
  siteName: '○○지구 도시개발 현장',    // 사업장 구분
  contractDate: '2024-03-01',         // 공사 계약일
  calcA: 8000000000,  // ⓐ 재료비(관급별도)
  calcB: 500000000,   // ⓑ 관급재료비
  calcC: 5000000000,  // ⓒ 직접 노무비
  calcD: 1500000000,  // ⓓ 기타 비용
  calcE: 1.86,        // ⓔ 적용 요율 (%)
  calcF: 5349000,     // ⓕ 기초액
  calculatedSafetyBudget: 439500000,  // 계산된 안전관리비
};

// 회사 목록
export const COMPANIES = [
  {
    id: 'comp-primary',
    name: '주식회사 알스퀘어디자인',
    type: 'primary',
    representative: '김세림',
    contact: '02-1234-5678',
    budgetRatio: 40,
  },
  {
    id: 'comp-sub1',
    name: '(주)한길토건',
    type: 'sub',
    representative: '이한길',
    contact: '031-987-6543',
    budgetRatio: 25,
  },
  {
    id: 'comp-sub2',
    name: '(주)미래안전',
    type: 'sub',
    representative: '박미래',
    contact: '032-555-1234',
    budgetRatio: 20,
  },
  {
    id: 'comp-sub3',
    name: '대한전기(주)',
    type: 'sub',
    representative: '최대한',
    contact: '02-777-8888',
    budgetRatio: 15,
  },
];

// 카테고리별 예산 배분 비율 (기본 템플릿)
const CATEGORY_RATIOS = {
  C01: 0.18,
  C02: 0.22,
  C03: 0.09,
  C04: 0.07,
  C05: 0.09,
  C06: 0.06,
  C07: 0.09,
  C08: 0.08,
  C09: 0.12,
};

// 전체기간 예산수립 생성
function generateTotalBudgetPlan(company, totalBudget) {
  const companyBudget = Math.round(totalBudget * (company.budgetRatio / 100));
  return {
    id: `bp-total-${company.id}`,
    companyId: company.id,
    period: 'total',
    year: null,
    items: BUDGET_CATEGORIES.map((cat) => ({
      categoryId: cat.id,
      amount: Math.round(companyBudget * (CATEGORY_RATIOS[cat.id] || 0.1)),
      note: '',
    })),
    status: 'approved',
    totalAmount: companyBudget,
    createdAt: '2024-02-15',
    approvedAt: '2024-02-20',
  };
}

// 년도별 예산수립 생성
function generateYearlyBudgetPlan(company, totalBudget, year, yearRatio) {
  const yearBudget = Math.round(totalBudget * (company.budgetRatio / 100) * yearRatio);
  return {
    id: `bp-${year}-${company.id}`,
    companyId: company.id,
    period: 'yearly',
    year,
    items: BUDGET_CATEGORIES.map((cat) => ({
      categoryId: cat.id,
      amount: Math.round(yearBudget * (CATEGORY_RATIOS[cat.id] || 0.1)),
      note: '',
    })),
    status: year <= 2025 ? 'approved' : 'draft',
    totalAmount: yearBudget,
    createdAt: `${year}-01-10`,
    approvedAt: year <= 2025 ? `${year}-01-20` : null,
  };
}

// 월별 집행실적 생성 (2024~2025 완료된 월)
function generateExecutionRecords(company, totalBudget) {
  const records = [];
  const companyBudget = totalBudget * (company.budgetRatio / 100);

  // 2024년 (3월~12월)
  for (let m = 3; m <= 12; m++) {
    const monthBudget = (companyBudget * 0.35) / 10;
    records.push({
      id: `exec-2024-${m}-${company.id}`,
      companyId: company.id,
      year: 2024,
      month: m,
      items: BUDGET_CATEGORIES.map((cat) => ({
        categoryId: cat.id,
        amount: Math.round(monthBudget * (CATEGORY_RATIOS[cat.id] || 0.1) * (0.7 + Math.random() * 0.5)),
        note: '',
      })),
      status: 'approved',
      createdAt: `2024-${String(m + 1).padStart(2, '0')}-05`,
    });
  }

  // 2025년 (1월~12월)
  for (let m = 1; m <= 12; m++) {
    const monthBudget = (companyBudget * 0.40) / 12;
    records.push({
      id: `exec-2025-${m}-${company.id}`,
      companyId: company.id,
      year: 2025,
      month: m,
      items: BUDGET_CATEGORIES.map((cat) => ({
        categoryId: cat.id,
        amount: Math.round(monthBudget * (CATEGORY_RATIOS[cat.id] || 0.1) * (0.7 + Math.random() * 0.5)),
        note: '',
      })),
      status: 'approved',
      createdAt: `2025-${String(m < 12 ? m + 1 : m).padStart(2, '0')}-05`,
    });
  }

  // 2026년 (1월 완료, 2월 작성중)
  for (let m = 1; m <= 2; m++) {
    const monthBudget = (companyBudget * 0.25) / 12;
    records.push({
      id: `exec-2026-${m}-${company.id}`,
      companyId: company.id,
      year: 2026,
      month: m,
      items: BUDGET_CATEGORIES.map((cat) => ({
        categoryId: cat.id,
        amount: Math.round(monthBudget * (CATEGORY_RATIOS[cat.id] || 0.1) * (0.6 + Math.random() * 0.6)),
        note: '',
      })),
      status: m === 1 ? 'approved' : 'draft',
      createdAt: `2026-0${m}-05`,
    });
  }

  return records;
}

// 증빙자료 생성
function generateEvidences(company) {
  const names = [
    '안전관리자_급여명세서',
    '안전시설_설치_영수증',
    '보호구_구매_세금계산서',
    '안전진단_용역비_청구서',
    '안전교육_수료증',
    '건강검진_비용_영수증',
    '기술지도_계약서',
    '안전관리_회의록',
  ];
  const evidences = [];
  for (let m = 1; m <= 12; m++) {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < count; j++) {
      const catIdx = Math.floor(Math.random() * 8);
      evidences.push({
        id: `ev-2025-${m}-${company.id}-${j}`,
        companyId: company.id,
        year: 2025,
        month: m,
        categoryId: BUDGET_CATEGORIES[catIdx].id,
        fileName: `${names[catIdx]}_2025${String(m).padStart(2, '0')}.pdf`,
        fileSize: Math.round(200000 + Math.random() * 3000000),
        uploadedAt: `2025-${String(m).padStart(2, '0')}-${String(10 + Math.floor(Math.random() * 15)).padStart(2, '0')}`,
      });
    }
  }
  return evidences;
}

// 월별 보고서 생성
function generateMonthlyReports() {
  const reports = [];
  // 2025년 보고서
  for (let m = 1; m <= 12; m++) {
    reports.push({
      id: `rpt-2025-${m}`,
      year: 2025,
      month: m,
      status: 'approved',
      submittedAt: `2025-${String(m < 12 ? m + 1 : m).padStart(2, '0')}-05`,
      approvedAt: `2025-${String(m < 12 ? m + 1 : m).padStart(2, '0')}-08`,
      approver: '김세림 (대표)',
      note: '',
    });
  }
  // 2026년 1월
  reports.push({
    id: 'rpt-2026-1',
    year: 2026,
    month: 1,
    status: 'approved',
    submittedAt: '2026-02-03',
    approvedAt: '2026-02-05',
    approver: '김세림 (대표)',
    note: '',
  });
  // 2026년 2월 (작성중)
  reports.push({
    id: 'rpt-2026-2',
    year: 2026,
    month: 2,
    status: 'draft',
    submittedAt: null,
    approvedAt: null,
    approver: null,
    note: '',
  });
  return reports;
}

// 일반사업장 회사 목록
export const GENERAL_COMPANIES = [
  { id: 'gen-primary', name: '주식회사 알스퀘어디자인', type: 'primary', representative: '김세림', contact: '02-1234-5678', budgetRatio: 100 },
  { id: 'gen-sub1', name: '(주)청소서비스파트너', type: 'sub', representative: '이청소', contact: '02-2222-3333', budgetRatio: 0, includedInPrimary: false },
  { id: 'gen-sub2', name: '(주)시설관리전문', type: 'sub', representative: '박시설', contact: '031-444-5555', budgetRatio: 0, includedInPrimary: false },
];

// 일반사업장 예산 항목 생성
const GENERAL_ITEMS_PRIMARY = [
  { id: 'gi1', name: '안전관리자 인건비', amount: 2400000, note: '안전관리자 1명' },
  { id: 'gi2', name: '안전교육비', amount: 600000, note: '정기·특별 교육' },
  { id: 'gi3', name: '보호구 구입비', amount: 360000, note: '안전모, 안전화 등' },
  { id: 'gi4', name: '건강검진비', amount: 480000, note: '일반·특수 건강검진' },
  { id: 'gi5', name: '위험성평가 비용', amount: 300000, note: '' },
  { id: 'gi6', name: '안전시설물 설치비', amount: 200000, note: '' },
];
const GENERAL_ITEMS_SUB1 = [
  { id: 'gs1-1', name: '안전교육비', amount: 150000, note: '' },
  { id: 'gs1-2', name: '보호구 구입비', amount: 120000, note: '' },
];
const GENERAL_ITEMS_SUB2 = [
  { id: 'gs2-1', name: '안전교육비', amount: 100000, note: '' },
  { id: 'gs2-2', name: '건강검진비', amount: 180000, note: '' },
  { id: 'gs2-3', name: '보호구 구입비', amount: 80000, note: '' },
];

function generateGeneralBudgetPlan(companyId, year, items) {
  return {
    id: `gen-bp-${year}-${companyId}`,
    companyId,
    period: 'yearly',
    year,
    items: items.map(i => ({ ...i, id: i.id + '-' + year })),
    totalAmount: items.reduce((s, i) => s + i.amount, 0),
    createdAt: `${year}-01-10`,
  };
}

function generateGeneralExecutionRecords() {
  const records = [];
  // 2026년 1월 (원도급사)
  records.push({
    id: 'gen-exec-2026-1-primary',
    companyId: 'gen-primary',
    year: 2026,
    month: 1,
    items: [
      { id: 'ge1', name: '안전관리자 인건비', amount: 200000, note: '' },
      { id: 'ge2', name: '안전교육비', amount: 50000, note: '' },
    ],
    totalAmount: 250000,
    createdAt: '2026-02-05',
  });
  // 2026년 2월 (원도급사)
  records.push({
    id: 'gen-exec-2026-2-primary',
    companyId: 'gen-primary',
    year: 2026,
    month: 2,
    items: [
      { id: 'ge3', name: '안전관리자 인건비', amount: 200000, note: '' },
      { id: 'ge4', name: '보호구 구입비', amount: 30000, note: '' },
    ],
    totalAmount: 230000,
    createdAt: '2026-03-05',
  });
  return records;
}

// 회사 마스터 목록 (프로젝트와 독립적으로 관리)
export const COMPANY_REGISTRY = [
  { id: 'reg-001', name: '주식회사 알스퀘어디자인', bizNo: '123-45-67890', type: 'primary', representative: '김세림', contact: '02-1234-5678', address: '서울시 강남구', note: '' },
  { id: 'reg-002', name: '(주)한길토건', bizNo: '234-56-78901', type: 'sub', representative: '이한길', contact: '031-987-6543', address: '경기도 수원시', note: '' },
  { id: 'reg-003', name: '(주)미래안전', bizNo: '345-67-89012', type: 'sub', representative: '박미래', contact: '032-555-1234', address: '인천시 남동구', note: '' },
  { id: 'reg-004', name: '대한전기(주)', bizNo: '456-78-90123', type: 'sub', representative: '최대한', contact: '02-777-8888', address: '서울시 구로구', note: '' },
  { id: 'reg-005', name: '(주)삼영건설', bizNo: '567-89-01234', type: 'sub', representative: '정삼영', contact: '051-333-4444', address: '부산시 해운대구', note: '' },
  { id: 'reg-006', name: '현대안전관리(주)', bizNo: '678-90-12345', type: 'sub', representative: '강현대', contact: '02-999-1111', address: '서울시 서초구', note: '' },
  { id: 'reg-007', name: '(주)우리소방', bizNo: '789-01-23456', type: 'sub', representative: '임우리', contact: '042-222-3333', address: '대전시 유성구', note: '' },
  { id: 'reg-008', name: '신한기술(주)', bizNo: '890-12-34567', type: 'sub', representative: '오신한', contact: '053-444-5555', address: '대구시 달서구', note: '' },
];

// 전체 Mock Data 생성
export function createInitialData() {
  const totalBudget = PROJECT.totalSafetyBudget;

  const budgetPlans = [];
  const executionRecords = [];
  const evidences = [];

  COMPANIES.forEach((company) => {
    budgetPlans.push(generateTotalBudgetPlan(company, totalBudget));
    budgetPlans.push(generateYearlyBudgetPlan(company, totalBudget, 2024, 0.35));
    budgetPlans.push(generateYearlyBudgetPlan(company, totalBudget, 2025, 0.40));
    budgetPlans.push(generateYearlyBudgetPlan(company, totalBudget, 2026, 0.25));

    executionRecords.push(...generateExecutionRecords(company, totalBudget));
    evidences.push(...generateEvidences(company));
  });

  const monthlyReports = generateMonthlyReports();

  // 일반사업장 예산 (2025, 2026)
  const generalBudgetPlans = [
    generateGeneralBudgetPlan('gen-primary', 2025, GENERAL_ITEMS_PRIMARY),
    generateGeneralBudgetPlan('gen-sub1', 2025, GENERAL_ITEMS_SUB1),
    generateGeneralBudgetPlan('gen-sub2', 2025, GENERAL_ITEMS_SUB2),
    generateGeneralBudgetPlan('gen-primary', 2026, GENERAL_ITEMS_PRIMARY),
    generateGeneralBudgetPlan('gen-sub1', 2026, GENERAL_ITEMS_SUB1),
    generateGeneralBudgetPlan('gen-sub2', 2026, GENERAL_ITEMS_SUB2),
  ];

  return {
    project: PROJECT,
    // 건설현장 데이터
    companies: COMPANIES,
    budgetPlans,
    executionRecords,
    // 일반사업장 데이터
    generalCompanies: GENERAL_COMPANIES,
    generalBudgetPlans,
    generalExecutionRecords: generateGeneralExecutionRecords(),
    // 공통
    companyRegistry: COMPANY_REGISTRY,
    monthlyReports,
    evidences,
  };
}
