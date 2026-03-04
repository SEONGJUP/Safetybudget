'use client';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

export default function FileUpload({ files = [], onAdd, onRemove, accept = '.pdf', multiple = true }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        onAdd?.({
          fileName: file.name,
          fileSize: file.size,
          file,
          uploadedAt: new Date().toISOString().slice(0, 10),
        });
      });
    },
    [onAdd]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-primary bg-primary-light/50' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-3 text-gray-400" size={32} />
        <p className="text-sm text-gray-600 font-medium">
          {isDragActive ? 'PDF 파일을 놓으세요' : 'PDF 파일을 드래그하거나 클릭하여 업로드'}
        </p>
        <p className="text-xs text-gray-400 mt-1">여러 파일 동시 업로드 가능</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <div
              key={file.id || idx}
              className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg"
            >
              <FileText size={18} className="text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.fileName}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.fileSize)}</p>
              </div>
              {onRemove && (
                <button
                  onClick={() => onRemove(file.id || idx)}
                  className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
