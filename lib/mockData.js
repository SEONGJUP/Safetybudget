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
};

// 회사 목록
export const COMPANIES = [
  {
    id: 'comp-primary',
    name: '(주)세림건설',
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

  return {
    project: PROJECT,
    companies: COMPANIES,
    budgetPlans,
    executionRecords,
    monthlyReports,
    evidences,
  };
}
