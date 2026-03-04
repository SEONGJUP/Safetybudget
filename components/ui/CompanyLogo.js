'use client';

const LOGO_COLORS = [
  { bg: '#00B7AF', text: '#FFFFFF' },
  { bg: '#3B82F6', text: '#FFFFFF' },
  { bg: '#F59E0B', text: '#FFFFFF' },
  { bg: '#EF4444', text: '#FFFFFF' },
  { bg: '#8B5CF6', text: '#FFFFFF' },
  { bg: '#EC4899', text: '#FFFFFF' },
  { bg: '#10B981', text: '#FFFFFF' },
  { bg: '#6366F1', text: '#FFFFFF' },
];

// 회사명에서 이니셜 추출
function getInitials(name) {
  const cleaned = name.replace(/\(주\)|\(유\)|주식회사/g, '').trim();
  if (cleaned.length <= 2) return cleaned;
  // 한글: 첫 두 글자 / 영문: 첫 글자들
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return words.slice(0, 2).map((w) => w[0]).join('');
  }
  return cleaned.slice(0, 2);
}

// 회사 ID 기반 안정적 색상 인덱스
function getColorIndex(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % LOGO_COLORS.length;
}

export default function CompanyLogo({ company, size = 'md' }) {
  const initials = getInitials(company.name);
  const colorIdx = company.type === 'primary' ? 0 : getColorIndex(company.id);
  const color = LOGO_COLORS[colorIdx];

  const sizes = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
  };

  const isPrimary = company.type === 'primary';

  return (
    <div
      className={`${sizes[size]} rounded-lg flex items-center justify-center font-bold flex-shrink-0 relative`}
      style={{ backgroundColor: color.bg, color: color.text }}
      title={company.name}
    >
      {initials}
      {isPrimary && size !== 'xs' && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-[6px] text-white font-bold">★</span>
        </div>
      )}
    </div>
  );
}
