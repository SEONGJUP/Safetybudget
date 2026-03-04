'use client';
import { useState, useCallback } from 'react';
import { CATEGORY_FIELDS, createEmptyRow, applyAutoCalc } from '@/lib/categoryFields';
import CurrencyInput from '@/components/ui/CurrencyInput';
import Button from '@/components/ui/Button';
import { Plus, Trash2, Copy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CategoryDetailTable({ categoryId, details, onChange, etcAmount = 0 }) {
  const config = CATEGORY_FIELDS[categoryId];
  if (!config) return null;

  const { fields, autoCalcRules } = config;

  // 그룹 헤더 계산
  const groups = [];
  let currentGroup = null;
  fields.forEach((f) => {
    if (f.group && f.group !== currentGroup) {
      currentGroup = f.group;
      groups.push({ group: f.group, colspan: fields.filter((ff) => ff.group === f.group).length });
    } else if (!f.group) {
      currentGroup = null;
    }
  });
  const hasGroups = groups.length > 0;

  const handleCellChange = useCallback((rowIdx, fieldKey, value) => {
    const updated = details.map((row, i) => {
      if (i !== rowIdx) return row;
      const newRow = { ...row, [fieldKey]: value };
      return autoCalcRules ? applyAutoCalc(categoryId, newRow) : newRow;
    });
    onChange(updated);
  }, [details, onChange, categoryId, autoCalcRules]);

  const handleAddRow = useCallback(() => {
    onChange([...details, createEmptyRow(categoryId)]);
  }, [details, onChange, categoryId]);

  const handleDuplicateRow = useCallback((idx) => {
    const source = details[idx];
    const dup = { ...source, _id: Math.random().toString(36).slice(2, 10) };
    const updated = [...details];
    updated.splice(idx + 1, 0, dup);
    onChange(updated);
  }, [details, onChange]);

  const handleDeleteRow = useCallback((idx) => {
    onChange(details.filter((_, i) => i !== idx));
  }, [details, onChange]);

  // 합계 행 계산
  const amountFields = fields.filter((f) => f.isAmount || f.computed);
  const totals = {};
  fields.forEach((f) => {
    if (f.type === 'currency' || f.type === 'number') {
      totals[f.key] = details.reduce((sum, row) => sum + (Number(row[f.key]) || 0), 0);
    }
  });

  return (
    <div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* 그룹 헤더 행 */}
            {hasGroups && (
              <tr className="border-b border-gray-200 bg-gray-100">
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-500 w-10">No</th>
                {fields.map((f, idx) => {
                  // 그룹의 첫 필드만 colspan으로 표시
                  if (f.group) {
                    const isFirst = fields.findIndex((ff) => ff.group === f.group) === idx;
                    if (!isFirst) return null;
                    const span = fields.filter((ff) => ff.group === f.group).length;
                    return (
                      <th
                        key={`gh-${f.group}`}
                        colSpan={span}
                        className="px-2 py-1.5 text-center text-xs font-bold text-gray-700 border-l border-gray-200"
                      >
                        {f.group}
                      </th>
                    );
                  }
                  return (
                    <th key={`gh-${f.key}`} rowSpan={2} className="px-2 py-1.5 text-center text-xs font-semibold text-gray-600" style={{ minWidth: f.width }}>
                      {f.label}
                    </th>
                  );
                })}
                <th rowSpan={2} className="px-2 py-1.5 text-center text-xs font-semibold text-gray-500 w-16">관리</th>
              </tr>
            )}
            {/* 필드 라벨 행 */}
            <tr className="border-b border-gray-200 bg-gray-50">
              {!hasGroups && (
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 w-10">No</th>
              )}
              {fields.map((f) => {
                // 그룹이 없는 필드는 이미 rowSpan으로 처리
                if (hasGroups && !f.group) return null;
                return (
                  <th
                    key={f.key}
                    className={`px-2 py-2 text-xs font-semibold text-gray-600 ${f.type === 'currency' || f.type === 'number' ? 'text-right' : 'text-center'} ${hasGroups && f.group ? 'border-l border-gray-200' : ''}`}
                    style={{ minWidth: f.width }}
                  >
                    {hasGroups ? f.label : f.label}
                  </th>
                );
              })}
              {!hasGroups && (
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 w-16">관리</th>
              )}
            </tr>
          </thead>
          <tbody>
            {details.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 2} className="px-4 py-8 text-center text-gray-400 text-sm">
                  등록된 내역이 없습니다. 아래 [+ 행 추가] 버튼을 눌러 추가하세요.
                </td>
              </tr>
            ) : (
              details.map((row, rowIdx) => (
                <tr key={row._id || rowIdx} className="border-b border-gray-100 hover:bg-blue-50/30">
                  <td className="px-2 py-1.5 text-center text-xs text-gray-400">{rowIdx + 1}</td>
                  {fields.map((f) => (
                    <td key={f.key} className={`px-1 py-1 ${f.group ? 'border-l border-gray-100' : ''}`}>
                      {f.computed ? (
                        <div className="px-2 py-1.5 text-right text-xs tabular-nums font-medium text-gray-700 bg-gray-50 rounded">
                          {formatCurrency(Number(row[f.key]) || 0)}
                        </div>
                      ) : f.type === 'currency' ? (
                        <CurrencyInput
                          value={row[f.key] || 0}
                          onChange={(val) => handleCellChange(rowIdx, f.key, val)}
                          className="text-xs"
                        />
                      ) : f.type === 'number' ? (
                        <input
                          type="number"
                          value={row[f.key] || ''}
                          onChange={(e) => handleCellChange(rowIdx, f.key, e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs text-right border border-gray-200 rounded focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                        />
                      ) : f.type === 'date' ? (
                        <input
                          type="date"
                          value={row[f.key] || ''}
                          onChange={(e) => handleCellChange(rowIdx, f.key, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={row[f.key] || ''}
                          onChange={(e) => handleCellChange(rowIdx, f.key, e.target.value)}
                          placeholder={f.label}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => handleDuplicateRow(rowIdx)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="복사"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteRow(rowIdx)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        title="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {(details.length > 0 || etcAmount > 0) && (
            <tfoot>
              {/* 기타 행: 집계금액 - 상세합계 차액 */}
              {etcAmount > 0 && (
                <tr className="border-t border-amber-200 bg-amber-50/50">
                  <td className="px-2 py-1.5 text-center text-xs text-amber-600 font-medium">기타</td>
                  {fields.map((f) => (
                    <td key={f.key} className={`px-2 py-1.5 text-right text-xs tabular-nums ${f.group ? 'border-l border-gray-100' : ''}`}>
                      {f.isAmount ? (
                        <span className="text-amber-600 font-semibold">{formatCurrency(etcAmount)}</span>
                      ) : ''}
                    </td>
                  ))}
                  <td></td>
                </tr>
              )}
              <tr className="bg-primary-light/50 font-bold border-t-2 border-gray-200">
                <td className="px-2 py-2 text-center text-xs text-gray-600">합계</td>
                {fields.map((f) => (
                  <td key={f.key} className={`px-2 py-2 text-right text-xs tabular-nums ${f.group ? 'border-l border-gray-100' : ''}`}>
                    {(f.type === 'currency' || f.type === 'number') ? (
                      <span className={f.isAmount ? 'text-primary font-extrabold' : 'text-gray-700'}>
                        {f.isAmount
                          ? formatCurrency((totals[f.key] || 0) + etcAmount)
                          : f.type === 'currency' ? formatCurrency(totals[f.key] || 0) : (totals[f.key] || 0)
                        }
                      </span>
                    ) : ''}
                  </td>
                ))}
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="mt-2 flex justify-start">
        <Button size="sm" variant="outline" icon={Plus} onClick={handleAddRow}>
          행 추가
        </Button>
      </div>
    </div>
  );
}
