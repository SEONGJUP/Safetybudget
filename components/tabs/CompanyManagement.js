'use client';
import { useState } from 'react';
import { useBudget } from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CompanyLogo from '@/components/ui/CompanyLogo';
import { generateId } from '@/lib/utils';
import { Plus, Edit3, Trash2, Building2, Search, Phone, MapPin, Hash } from 'lucide-react';

export default function CompanyManagement() {
  const { data, addRegistryCompany, updateRegistryCompany, removeRegistryCompany } = useBudget();
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null); // null | 'new' | company object

  if (!data) return null;
  const registry = data.companyRegistry || [];

  const filtered = registry.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.bizNo || '').includes(search) ||
    (c.representative || '').includes(search)
  );

  const handleSave = (form) => {
    if (editTarget === 'new') {
      addRegistryCompany(form);
    } else {
      updateRegistryCompany(editTarget.id, form);
    }
    setEditTarget(null);
  };

  const handleDelete = (id) => {
    if (confirm('회사를 목록에서 삭제하시겠습니까?')) {
      removeRegistryCompany(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-500">
          <Building2 size={16} className="text-primary" />
          <span className="text-sm">
            전체 <strong className="text-gray-900">{registry.length}</strong>개사 등록됨
          </span>
        </div>
        <Button icon={Plus} size="sm" onClick={() => setEditTarget('new')}>
          회사 추가
        </Button>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="회사명, 사업자번호, 대표자 검색"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* 회사 목록 */}
      <Card noPad>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {search ? '검색 결과가 없습니다.' : '등록된 회사가 없습니다.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((comp) => (
              <div key={comp.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                <CompanyLogo company={comp} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm">{comp.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      comp.type === 'primary'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {comp.type === 'primary' ? '원도급사' : '협력사'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                    {comp.bizNo && (
                      <span className="flex items-center gap-1">
                        <Hash size={11} />
                        {comp.bizNo}
                      </span>
                    )}
                    {comp.representative && (
                      <span>{comp.representative}</span>
                    )}
                    {comp.contact && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} />
                        {comp.contact}
                      </span>
                    )}
                    {comp.address && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {comp.address}
                      </span>
                    )}
                  </div>
                  {comp.note && <p className="text-xs text-gray-400 mt-0.5 italic">{comp.note}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" icon={Edit3} onClick={() => setEditTarget(comp)}>
                    수정
                  </Button>
                  <button
                    onClick={() => handleDelete(comp.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 추가/수정 모달 */}
      {editTarget !== null && (
        <CompanyFormModal
          company={editTarget === 'new' ? null : editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

function CompanyFormModal({ company, onSave, onClose }) {
  const isNew = !company;
  const [form, setForm] = useState({
    name: company?.name || '',
    bizNo: company?.bizNo || '',
    type: company?.type || 'sub',
    representative: company?.representative || '',
    contact: company?.contact || '',
    address: company?.address || '',
    note: company?.note || '',
  });

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <Modal isOpen onClose={onClose} title={isNew ? '회사 추가' : '회사 정보 수정'} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">회사명 *</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="예) 주식회사 ○○건설"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">사업자번호</label>
            <input
              type="text"
              value={form.bizNo}
              onChange={set('bizNo')}
              placeholder="000-00-00000"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">구분</label>
            <select
              value={form.type}
              onChange={set('type')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="sub">협력사</option>
              <option value="primary">원도급사</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">대표자</label>
            <input
              type="text"
              value={form.representative}
              onChange={set('representative')}
              placeholder="대표자명"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">연락처</label>
            <input
              type="text"
              value={form.contact}
              onChange={set('contact')}
              placeholder="전화번호"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">주소</label>
            <input
              type="text"
              value={form.address}
              onChange={set('address')}
              placeholder="사업장 주소"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">비고</label>
            <input
              type="text"
              value={form.note}
              onChange={set('note')}
              placeholder="추가 메모"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button
            disabled={!form.name.trim()}
            onClick={() => onSave(form)}
          >
            {isNew ? '추가' : '저장'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
