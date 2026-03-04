'use client';
import { useState, useCallback } from 'react';

function formatWithCommas(num) {
  if (!num && num !== 0) return '';
  return Number(num).toLocaleString('ko-KR');
}

function parseNumber(str) {
  if (!str) return 0;
  return Number(str.replace(/,/g, '')) || 0;
}

export default function CurrencyInput({ value, onChange, placeholder = '0', className }) {
  const [focused, setFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(value ? formatWithCommas(value) : '');

  const handleFocus = () => {
    setFocused(true);
    setDisplayValue(value ? String(value) : '');
  };

  const handleBlur = () => {
    setFocused(false);
    setDisplayValue(value ? formatWithCommas(value) : '');
  };

  const handleChange = useCallback((e) => {
    const raw = e.target.value;
    if (focused) {
      // 포커스 상태에서는 숫자만 허용
      const cleaned = raw.replace(/[^0-9]/g, '');
      setDisplayValue(cleaned);
      onChange(Number(cleaned) || 0);
    } else {
      const num = parseNumber(raw);
      setDisplayValue(formatWithCommas(num));
      onChange(num);
    }
  }, [focused, onChange]);

  // value가 외부에서 변경될 때 동기화
  const shown = focused ? displayValue : (value ? formatWithCommas(value) : '');

  return (
    <input
      type="text"
      inputMode="numeric"
      value={shown}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className || "w-full px-2 py-1.5 text-right text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"}
    />
  );
}
