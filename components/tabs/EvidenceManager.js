'use client';
import { useState } from 'react';
import { useBudget } from '@/lib/store';
import { BUDGET_CATEGORIES, MONTHS } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import FileUpload from '@/components/ui/FileUpload';
import Table from '@/components/ui/Table';
import { formatFileSize, formatDate, generateId } from '@/lib/utils';
import CompanyLogo from '@/components/ui/CompanyLogo';
import CompanySelect from '@/components/ui/CompanySelect';
import { Upload, Trash2, FileText, Filter, Download } from 'lucide-react';

export default function EvidenceManager() {
  const { data, selectedPeriod, selectedYear, selectedCompanyId, addEvidence, removeEvidence } = useBudget();
  const [uploadModal, setUploadModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  if (!data) return null;

  const { companies, evidences } = data;

  const periodLabel = selectedPeriod === 'total' ? '전체기간' : `${selectedYear}년`;

  // 필터링
  const filtered = evidences.filter((ev) => {
    if (selectedPeriod === 'yearly' && ev.year !== selectedYear) return false;
    if (selectedCompanyId !== 'all' && ev.companyId !== selectedCompanyId) return false;
    if (companyFilter !== 'all' && ev.companyId !== companyFilter) return false;
    if (categoryFilter !== 'all' && ev.categoryId !== categoryFilter) return false;
    if (monthFilter !== 'all' && ev.month !== Number(monthFilter)) return false;
    return true;
  });

  // 통계
  const totalFiles = filtered.length;
  const totalSize = filtered.reduce((s, ev) => s + (ev.fileSize || 0), 0);
  const registeredCompanies = new Set(filtered.map((e) => e.companyId)).size;

  const getCompany = (id) => companies.find((c) => c.id === id);
  const getCompanyName = (id) => getCompany(id)?.name || '';
  const getCategoryName = (id) => BUDGET_CATEGORIES.find((c) => c.id === id)?.shortName || '';

  const columns = [
    {
      key: 'month',
      label: '월',
      width: '60px',
      align: 'center',
      render: (v, row) => selectedPeriod === 'total' ? `${row.year}.${v}월` : `${v}월`,
    },
    {
      key: 'companyId',
      label: '회사',
      render: (v) => (
        <div className="flex items-center gap-2">
          {getCompany(v) && <CompanyLogo company={getCompany(v)} size="xs" />}
          <span className="text-sm">{getCompanyName(v).replace(/\(주\)/g, '').trim()}</span>
        </div>
      ),
    },
    {
      key: 'categoryId',
      label: '항목',
      render: (v) => <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{getCategoryName(v)}</span>,
    },
    {
      key: 'fileName',
      label: '파일명',
      render: (v) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-red-400 flex-shrink-0" />
          <span className="text-sm truncate max-w-[200px]">{v}</span>
        </div>
      ),
    },
    {
      key: 'fileSize',
      label: '크기',
      align: 'right',
      render: (v) => <span className="text-xs text-gray-500">{formatFileSize(v)}</span>,
    },
    {
      key: 'uploadedAt',
      label: '업로드일',
      align: 'center',
      render: (v) => <span className="text-xs text-gray-500">{formatDate(v)}</span>,
    },
    {
      key: 'id',
      label: '',
      width: '40px',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeEvidence(row.id);
          }}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 필터 & 액션 바 */}
      <div className="flex flex-wrap items-end gap-3">
        <Select
          value={companyFilter}
          onChange={setCompanyFilter}
          label="협력사"
          options={[
            { value: 'all', label: '전체' },
            ...companies.map((c) => ({
              value: c.id,
              label: c.name.replace(/\(주\)/g, '').trim(),
            })),
          ]}
        />
        <Select
          value={monthFilter}
          onChange={setMonthFilter}
          label="월"
          options={[
            { value: 'all', label: '전체' },
            ...MONTHS.map((m, i) => ({ value: i + 1, label: m })),
          ]}
        />
        <Select
          value={categoryFilter}
          onChange={setCategoryFilter}
          label="항목"
          options={[
            { value: 'all', label: '전체' },
            ...BUDGET_CATEGORIES.map((c) => ({ value: c.id, label: c.shortName })),
          ]}
        />
        <div className="flex-1" />
        <Button icon={Upload} onClick={() => setUploadModal(true)}>
          증빙 업로드
        </Button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary-light rounded-lg p-4 text-center">
          <p className="text-xl font-extrabold text-primary">{registeredCompanies}</p>
          <p className="text-xs text-primary-dark">등록업체 수</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-xl font-extrabold text-blue-700">{totalFiles}</p>
          <p className="text-xs text-blue-600">총 파일 수</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-xl font-extrabold text-purple-700">{formatFileSize(totalSize)}</p>
          <p className="text-xs text-purple-600">총 용량</p>
        </div>
      </div>

      {/* 파일 목록 */}
      <Card title={`${periodLabel} 증빙자료 목록 (${totalFiles}건)`} noPad>
        <Table columns={columns} data={filtered} emptyMessage="등록된 증빙자료가 없습니다." />
      </Card>

      {/* 업로드 모달 */}
      {uploadModal && (
        <UploadModal
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          selectedYear={selectedYear}
          onUpload={(evidence) => {
            addEvidence(evidence);
          }}
          onClose={() => setUploadModal(false)}
        />
      )}
    </div>
  );
}

function UploadModal({ companies, selectedCompanyId, selectedYear, onUpload, onClose }) {
  const [companyId, setCompanyId] = useState(
    selectedCompanyId !== 'all' ? selectedCompanyId : companies[0]?.id
  );
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [categoryId, setCategoryId] = useState(BUDGET_CATEGORIES[0].id);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleAdd = (fileInfo) => {
    setUploadedFiles((prev) => [...prev, { ...fileInfo, id: generateId() }]);
  };

  const handleRemove = (idx) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    uploadedFiles.forEach((file) => {
      onUpload({
        companyId,
        year: selectedYear,
        month: Number(month),
        categoryId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        uploadedAt: new Date().toISOString().slice(0, 10),
      });
    });
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="증빙자료 업로드" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <CompanySelect
            value={companyId}
            onChange={setCompanyId}
            companies={companies}
            label="회사"
          />
          <Select
            value={month}
            onChange={setMonth}
            label="월"
            options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
          />
        </div>
        <Select
          value={categoryId}
          onChange={setCategoryId}
          label="법정 항목"
          options={BUDGET_CATEGORIES.map((c) => ({ value: c.id, label: `${c.code}. ${c.shortName}` }))}
        />

        <FileUpload files={uploadedFiles} onAdd={handleAdd} onRemove={handleRemove} />

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={uploadedFiles.length === 0}>
            {uploadedFiles.length}개 파일 저장
          </Button>
        </div>
      </div>
    </Modal>
  );
}
