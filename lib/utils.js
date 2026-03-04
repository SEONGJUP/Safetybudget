// 금액 포맷 (원 단위, 천 단위 콤마)
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '0';
  return Number(amount).toLocaleString('ko-KR');
}

// 금액 포맷 (만원 단위)
export function formatManwon(amount) {
  if (!amount) return '0';
  return Math.round(amount / 10000).toLocaleString('ko-KR');
}

// 금액 포맷 (천원 단위)
export function formatThousand(amount) {
  if (!amount || isNaN(amount)) return '0';
  return Math.round(Number(amount) / 1000).toLocaleString('ko-KR');
}

// 퍼센트 포맷
export function formatPercent(value, digits = 1) {
  if (value == null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(digits)}%`;
}

// 날짜 포맷
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// 집행률 계산
export function calcExecutionRate(executed, budget) {
  if (!budget || budget === 0) return 0;
  return (executed / budget) * 100;
}

// 카테고리별 합계 계산
export function sumByCategory(items, categoryId) {
  return items
    .filter((item) => item.categoryId === categoryId)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

// 전체 합계
export function sumAll(items) {
  return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

// 파일 크기 포맷
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

// 고유 ID 생성
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// 상태 색상
export function getStatusColor(status) {
  const colors = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-amber-50 text-amber-700',
    reviewing: 'bg-blue-50 text-blue-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  };
  return colors[status] || colors.draft;
}

// 상태 라벨
export function getStatusLabel(status) {
  const labels = {
    draft: '작성중',
    submitted: '검토요청',
    reviewing: '검토중',
    approved: '승인',
    rejected: '반려',
  };
  return labels[status] || '작성중';
}

// 현재 연월
export function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// 클래스 병합 유틸
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
