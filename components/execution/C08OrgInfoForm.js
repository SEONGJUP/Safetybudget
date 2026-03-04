'use client';
import CurrencyInput from '@/components/ui/CurrencyInput';

export default function C08OrgInfoForm({ orgInfo, onChange }) {
  const info = orgInfo || {
    ranking: '',
    orgName: '',
    position: '',
    headcount: 0,
    totalBudget: 0,
    hqBudget: 0,
  };

  const handleChange = (key, value) => {
    onChange({ ...info, [key]: value });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 mb-4">
      <h4 className="text-sm font-bold text-gray-700 mb-3">조직현황</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">시공능력평가순위</label>
          <input
            type="text"
            value={info.ranking}
            onChange={(e) => handleChange('ranking', e.target.value)}
            placeholder="예: 50위"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">조직명</label>
          <input
            type="text"
            value={info.orgName}
            onChange={(e) => handleChange('orgName', e.target.value)}
            placeholder="예: 안전보건팀"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">직책</label>
          <input
            type="text"
            value={info.position}
            onChange={(e) => handleChange('position', e.target.value)}
            placeholder="예: 팀장"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">인원수</label>
          <input
            type="number"
            value={info.headcount || ''}
            onChange={(e) => handleChange('headcount', e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="0"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-right"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">계상총액</label>
          <CurrencyInput
            value={info.totalBudget || 0}
            onChange={(val) => handleChange('totalBudget', val)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">본사계상액</label>
          <CurrencyInput
            value={info.hqBudget || 0}
            onChange={(val) => handleChange('hqBudget', val)}
          />
        </div>
      </div>
    </div>
  );
}
