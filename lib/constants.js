// 산업안전보건관리비 항목 분류 (산업안전보건법 시행규칙 별표)
export const BUDGET_CATEGORIES = [
  {
    id: 'C01',
    code: '01',
    name: '안전·보건관리자 임금 등',
    shortName: '안전·보건관리자 임금 등',
    description: '안전관리자, 보건관리자, 안전보건관리담당자의 인건비 및 업무수당',
  },
  {
    id: 'C02',
    code: '02',
    name: '안전시설비 등',
    shortName: '안전시설비 등',
    description: '안전난간, 추락방호망, 개구부덮개, 안전통로, 사다리, 계단 등 안전시설 설치·해체·유지보수 비용',
  },
  {
    id: 'C03',
    code: '03',
    name: '보호구 등',
    shortName: '보호구 등',
    description: '안전모, 안전대, 안전화, 보안경, 방진마스크 등 개인보호구 구입비',
  },
  {
    id: 'C04',
    code: '04',
    name: '안전보건진단비 등',
    shortName: '안전보건진단비 등',
    description: '정밀안전진단, 안전성 평가 등 사업장 안전진단 비용',
  },
  {
    id: 'C05',
    code: '05',
    name: '안전보건교육비 등',
    shortName: '안전보건교육비 등',
    description: '신규채용자·특별·정기 안전보건교육, 안전보건행사 비용',
  },
  {
    id: 'C06',
    code: '06',
    name: '근로자 건강장해예방비 등',
    shortName: '근로자 건강장해예방비 등',
    description: '건강진단, 작업환경측정, 직업병 예방 등 비용',
  },
  {
    id: 'C07',
    code: '07',
    name: '건설재해예방전문지도기관 기술지도비',
    shortName: '기술지도비',
    description: '건설재해예방 전문지도기관의 기술지도 비용',
  },
  {
    id: 'C08',
    code: '08',
    name: '본사 전담조직 근로자 임금 등',
    shortName: '본사 전담조직 임금 등',
    description: '본사 안전보건 전담조직 운영, 안전보건 관련 연구개발 등 비용',
  },
  {
    id: 'C09',
    code: '09',
    name: '위험성평가 등에 따른 소요비용',
    shortName: '위험성평가 소요비용',
    description: '위험성평가 실시 및 유해·위험요인 개선 비용 (2025년~ 한도 20%)',
  },
];

// 결재 상태
export const APPROVAL_STATUS = {
  DRAFT: { key: 'draft', label: '작성중', color: 'gray' },
  SUBMITTED: { key: 'submitted', label: '검토요청', color: 'warning' },
  REVIEWING: { key: 'reviewing', label: '검토중', color: 'blue' },
  APPROVED: { key: 'approved', label: '승인', color: 'success' },
  REJECTED: { key: 'rejected', label: '반려', color: 'danger' },
};

// 회사 유형
export const COMPANY_TYPES = {
  PRIMARY: { key: 'primary', label: '원도급사' },
  SUB: { key: 'sub', label: '협력사' },
};

// 탭 목록
export const TABS = [
  { id: 'overview', label: '예산총괄', icon: 'LayoutDashboard' },
  { id: 'plan', label: '예산수립', icon: 'Calculator' },
  { id: 'execution', label: '집행실적', icon: 'ClipboardList' },
  { id: 'statistics', label: '통계분석', icon: 'BarChart3' },
];

// 월 이름
export const MONTHS = [
  '1월','2월','3월','4월','5월','6월',
  '7월','8월','9월','10월','11월','12월',
];

// 기본 프로젝트 기간 (년도 목록 생성용)
export const DEFAULT_YEARS = [2024, 2025, 2026, 2027, 2028];
