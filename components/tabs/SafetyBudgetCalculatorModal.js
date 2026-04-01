'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { formatCurrency } from '@/lib/utils';
import { Calculator, CheckCircle2 } from 'lucide-react';

// 공사종류별 요율표 (고용노동부 고시 기준)
const SITE_TYPES = [
  {
    id: 'general_a',
    name: '일반건설공사(갑)',
    brackets: [
      { label: '5억 미만', max: 500000000, rate: 2.93, baseAmount: 0 },
      { label: '5억~50억 미만', max: 5000000000, rate: 1.86, baseAmount: 5349000 },
      { label: '50억 이상', max: Infinity, rate: 1.97, baseAmount: 0 },
    ],
  },
  {
    id: 'general_b',
    name: '일반건설공사(을)',
    brackets: [
      { label: '5억 미만', max: 500000000, rate: 3.09, baseAmount: 0 },
      { label: '5억~50억 미만', max: 5000000000, rate: 1.99, baseAmount: 5499000 },
      { label: '50억 이상', max: Infinity, rate: 2.10, baseAmount: 0 },
    ],
  },
  {
    id: 'heavy',
    name: '중건설공사',
    brackets: [
      { label: '5억 미만', max: 500000000, rate: 3.43, baseAmount: 0 },
      { label: '5억~50억 미만', max: 5000000000, rate: 2.35, baseAmount: 5400000 },
      { label: '50억 이상', max: Infinity, rate: 2.44, baseAmount: 0 },
    ],
  },
  {
    id: 'railway',
    name: '철도·궤도신설공사',
    brackets: [
      { label: '5억 미만', max: 500000000, rate: 2.45, baseAmount: 0 },
      { label: '5억~50억 미만', max: 5000000000, rate: 1.57, baseAmount: 4411000 },
      { label: '50억 이상', max: Infinity, rate: 1.66, baseAmount: 0 },
    ],
  },
  {
    id: 'special',
    name: '특수건설공사',
    brackets: [
      { label: '5억 미만', max: 500000000, rate: 1.85, baseAmount: 0 },
      { label: '5억~50억 미만', max: 5000000000, rate: 1.20, baseAmount: 3250000 },
      { label: '50억 이상', max: Infinity, rate: 1.27, baseAmount: 0 },
    ],
  },
];

function getApplicableBracket(siteTypeId, targetAmount) {
  const type = SITE_TYPES.find((t) => t.id === siteTypeId);
  if (!type) return null;
  return type.brackets.find((b) => targetAmount < b.max) || type.brackets[type.brackets.length - 1];
}

export default function SafetyBudgetCalculatorModal({ project, onSave, onClose }) {
  const [form, setForm] = useState({
    siteName: project?.siteName || '',
    totalContractAmount: project?.totalContractAmount || 0,
    contractDate: project?.contractDate || '',
    siteType: project?.siteType || 'general_a',
    calcA: project?.calcA || 0,
    calcB: project?.calcB || 0,
    calcC: project?.calcC || 0,
    calcD: project?.calcD || 0,
    calcE: project?.calcE || 2.93,
    calcF: project?.calcF || 0,
  });

  // 대상액 (a+b+c)
  const targetAmount = (Number(form.calcA) || 0) + (Number(form.calcB) || 0) + (Number(form.calcC) || 0);

  // 대상액 구분 자동 계산
  const bracket = getApplicableBracket(form.siteType, targetAmount);
  const bracketLabel = bracket?.label || '-';

  // 공사종류 변경 시 요율/기초액 자동 업데이트
  useEffect(() => {
    if (!bracket) return;
    setForm((prev) => ({
      ...prev,
      calcE: bracket.rate,
      calcF: bracket.baseAmount,
    }));
  }, [form.siteType, targetAmount]);

  const e = Number(form.calcE) || 0;
  const f = Number(form.calcF) || 0;
  const a = Number(form.calcA) || 0;
  const b = Number(form.calcB) || 0;
  const c = Number(form.calcC) || 0;

  // 가. ((a+b+c)×e%)+f
  const resultA = Math.round((a + b + c) * (e / 100) + f);
  // 나. [(a+c)×e%+f]×1.2
  const resultB = Math.round(((a + c) * (e / 100) + f) * 1.2);
  // 계산된 안전관리비 (더 작은 금액)
  const calculated = Math.min(resultA, resultB);

  const handleSave = () => {
    onSave({
      siteName: form.siteName,
      totalContractAmount: form.totalContractAmount,
      contractDate: form.contractDate,
      siteType: form.siteType,
      calcA: a,
      calcB: b,
      calcC: c,
      calcD: Number(form.calcD) || 0,
      calcE: e,
      calcF: f,
      calculatedSafetyBudget: calculated,
    });
  };

  const siteTypeName = SITE_TYPES.find((t) => t.id === form.siteType)?.name || '';

  return (
    <Modal isOpen onClose={onClose} title="안전보건관리비 계상 (계산기)" size="xl">
      <div className="space-y-5">
        {/* 사업장 기본정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">사업장 구분</label>
            <input
              type="text"
              value={form.siteName}
              onChange={(e) => setForm((p) => ({ ...p, siteName: e.target.value }))}
              placeholder="현장명 또는 사업장명"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">공사 계약일</label>
            <input
              type="date"
              value={form.contractDate}
              onChange={(e) => setForm((p) => ({ ...p, contractDate: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">총 공사금액 (VAT포함, 원)</label>
            <CurrencyInput
              value={form.totalContractAmount}
              onChange={(v) => setForm((p) => ({ ...p, totalContractAmount: v }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">공사 종류</label>
            <select
              value={form.siteType}
              onChange={(e) => setForm((p) => ({ ...p, siteType: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              {SITE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 계산 입력값 */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100">
            <p className="text-xs font-semibold text-blue-700">건설업 산업안전보건관리비 계산 및 사용기준</p>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { key: 'calcA', label: 'ⓐ 재료비', sublabel: '(관급별도, 원)', editable: true },
              { key: 'calcB', label: 'ⓑ 관급재료비', sublabel: '(원)', editable: true },
              { key: 'calcC', label: 'ⓒ 직접 노무비', sublabel: '(원)', editable: true },
              { key: 'calcD', label: 'ⓓ 기타 비용', sublabel: '(원)', editable: true },
            ].map(({ key, label, sublabel, editable }) => (
              <div key={key} className="flex items-center gap-4 px-4 py-3">
                <div className="w-40 shrink-0">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{sublabel}</p>
                </div>
                <div className="flex-1">
                  {editable ? (
                    <CurrencyInput
                      value={form[key]}
                      onChange={(v) => setForm((p) => ({ ...p, [key]: v }))}
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-900 text-right">{formatCurrency(form[key])}</p>
                  )}
                </div>
              </div>
            ))}

            {/* 구분선 */}
            <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-4">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold text-gray-600">ⓔ 적용 요율 (%)</p>
              </div>
              <div className="flex-1 flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={form.calcE}
                  onChange={(e) => setForm((p) => ({ ...p, calcE: e.target.value }))}
                  className="w-28 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-right"
                />
                <span className="text-xs text-gray-400">{siteTypeName} 기준</span>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-4">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold text-gray-600">ⓕ 기초액 (원)</p>
                <p className="text-[10px] text-gray-400">대상액 5~50억 미만인 경우에 한함</p>
              </div>
              <div className="flex-1">
                <CurrencyInput
                  value={form.calcF}
                  onChange={(v) => setForm((p) => ({ ...p, calcF: v }))}
                />
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-4">
              <div className="w-40 shrink-0">
                <p className="text-xs font-semibold text-gray-600">대상액 구분</p>
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                  {bracketLabel} (대상액: {formatCurrency(targetAmount)}원)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 계산 결과 */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100">
            <p className="text-xs font-semibold text-amber-700">계산 결과</p>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">가. ((ⓐ+ⓑ+ⓒ)×ⓔ)+ⓕ</p>
                <p className="text-xs text-gray-400">&quot;가&quot; 적용 시 산업안전보건관리비</p>
              </div>
              <p className="text-base font-bold text-gray-900 tabular-nums">{formatCurrency(resultA)}원</p>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">나. [(ⓐ+ⓒ)×ⓔ+ⓕ]×1.2</p>
                <p className="text-xs text-gray-400">&quot;나&quot; 적용 시 산업안전보건관리비</p>
              </div>
              <p className="text-base font-bold text-gray-900 tabular-nums">{formatCurrency(resultB)}원</p>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50">
              <div>
                <p className="text-xs text-gray-500">※ &quot;가&quot;와 &quot;나&quot; 중 더 작은 금액이 산업안전보건관리비로 계상됨</p>
                <p className="text-sm font-bold text-emerald-700 mt-1">계산된 안전보건관리비</p>
              </div>
              <p className="text-xl font-extrabold text-emerald-700 tabular-nums">{formatCurrency(calculated)}원</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button icon={CheckCircle2} onClick={handleSave}>
            이 금액으로 예산 확정
          </Button>
        </div>
      </div>
    </Modal>
  );
}
