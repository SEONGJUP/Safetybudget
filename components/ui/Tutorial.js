'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const STEPS = [
  {
    target: null,
    title: '산업안전보건관리비 시스템',
    desc: '건설현장의 산업안전보건관리비를 체계적으로 관리하는 시스템입니다.\n주요 기능을 단계별로 안내해 드리겠습니다.',
    pos: 'center',
  },
  {
    target: '[data-tutorial="period"]',
    title: '기간 선택',
    desc: '\'전체기간\'은 사업 전체 예산을, \'년도별\'은 특정 연도의 예산을 조회합니다.\n건설업은 전체기간 기준으로 예산을 편성합니다.',
    pos: 'bottom',
  },
  {
    target: '[data-tutorial="tabs"]',
    title: '메뉴 탭',
    desc: '4개의 탭으로 예산의 편성부터 집행, 분석까지 관리합니다.\n각 탭을 클릭하면 해당 기능 화면으로 전환됩니다.',
    pos: 'bottom',
  },
  {
    target: '[data-tutorial="tab-overview"]',
    title: '예산총괄',
    desc: '전체 예산·집행·잔여 현황을 한눈에 파악합니다.\n관계사별 비교 차트와 항목별 집행률을 제공합니다.',
    pos: 'bottom',
  },
  {
    target: '[data-tutorial="tab-plan"]',
    title: '예산수립',
    desc: '관계사별로 법정 9개 항목에 맞춰 예산을 편성합니다.\n회사 카드를 클릭하면 예산 편집 화면이 열립니다.',
    pos: 'bottom',
  },
  {
    target: '[data-tutorial="tab-execution"]',
    title: '집행실적',
    desc: '월별 집행실적을 등록하고 관리합니다.\n12개 월 버튼으로 해당 월 상세내역을 확인하고,\n회사 카드 클릭으로 실적을 입력합니다.',
    pos: 'bottom',
  },
  {
    target: '[data-tutorial="tab-statistics"]',
    title: '통계분석',
    desc: '월별 추이, 년도별 비교, 항목별·관계사별 분석 등\n다양한 차트와 통계 데이터를 확인할 수 있습니다.',
    pos: 'bottom',
  },
  {
    target: '[data-tutorial="help"]',
    title: '도움말',
    desc: '언제든 이 버튼을 누르면\n안내를 다시 볼 수 있습니다.',
    pos: 'left',
  },
  {
    target: null,
    title: '안내 완료!',
    desc: '이제 시스템을 자유롭게 사용해 보세요.\n궁금한 점은 도움말 버튼을 활용하세요.',
    pos: 'center',
  },
];

export default function Tutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [fading, setFading] = useState(false);

  const current = STEPS[step];

  const measure = useCallback(() => {
    if (current.target) {
      const el = document.querySelector(current.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({
          top: r.top - 8,
          left: r.left - 8,
          width: r.width + 16,
          height: r.height + 16,
        });
        return;
      }
    }
    setRect(null);
  }, [current.target]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  const go = (dir) => {
    const next = step + dir;
    if (next < 0) return;
    if (next >= STEPS.length) { onComplete(); return; }
    setFading(true);
    setTimeout(() => {
      setStep(next);
      setFading(false);
    }, 150);
  };

  const tooltipStyle = () => {
    if (!rect || current.pos === 'center') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const gap = 16;
    if (current.pos === 'bottom') {
      return {
        top: `${rect.top + rect.height + gap}px`,
        left: `${Math.max(16, Math.min(rect.left + rect.width / 2, window.innerWidth - 200))}px`,
        transform: 'translateX(-50%)',
      };
    }
    if (current.pos === 'top') {
      return {
        bottom: `${window.innerHeight - rect.top + gap}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      };
    }
    if (current.pos === 'left') {
      return {
        top: `${rect.top + rect.height / 2}px`,
        right: `${window.innerWidth - rect.left + gap}px`,
        transform: 'translateY(-50%)',
      };
    }
    // right
    return {
      top: `${rect.top + rect.height / 2}px`,
      left: `${rect.left + rect.width + gap}px`,
      transform: 'translateY(-50%)',
    };
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      {!rect && <div className="absolute inset-0 bg-black/50" onClick={onComplete} />}

      {/* Spotlight hole */}
      {rect && (
        <div
          className="absolute rounded-xl transition-all duration-300 ease-out pointer-events-none"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            border: '2px solid rgba(0,183,175,0.6)',
          }}
        />
      )}

      {/* Clickable backdrop (outside spotlight) for dismiss */}
      {rect && (
        <div
          className="absolute inset-0"
          style={{ zIndex: -1 }}
          onClick={onComplete}
        />
      )}

      {/* Tooltip */}
      <div
        className={`fixed z-[10000] bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-[90vw] sm:w-96 transition-all duration-150 ${
          fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        style={tooltipStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient bar */}
        <div className="h-1 bg-gradient-to-r from-primary to-teal-400 rounded-t-2xl" />

        <div className="p-5">
          {/* Progress dots */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-5 h-1.5 bg-primary'
                      : i < step
                      ? 'w-1.5 h-1.5 bg-primary/40'
                      : 'w-1.5 h-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-400 tabular-nums">{step + 1}/{STEPS.length}</span>
          </div>

          {/* Icon + Title */}
          <div className="flex items-center gap-2 mb-2">
            {step === 0 && <Sparkles size={18} className="text-primary" />}
            <h3 className="text-base font-bold text-gray-900">{current.title}</h3>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-5">
            {current.desc}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={onComplete}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              건너뛰기
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={() => go(-1)}
                  className="flex items-center gap-0.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeft size={14} />
                  이전
                </button>
              )}
              <button
                onClick={() => go(1)}
                className="flex items-center gap-0.5 px-4 py-1.5 text-sm text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors font-medium"
              >
                {step < STEPS.length - 1 ? (
                  <>다음 <ChevronRight size={14} /></>
                ) : (
                  '시작하기'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
