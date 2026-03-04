'use client';
import { useState, useRef, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';
import { ChevronDown } from 'lucide-react';

export default function CompanySelect({ value, onChange, companies, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = companies.find((c) => c.id === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 text-left"
        >
          {selected ? (
            <>
              <CompanyLogo company={selected} size="xs" />
              <span className="flex-1 truncate">
                <span className="text-[10px] text-gray-400 mr-1">
                  {selected.type === 'primary' ? '[원]' : '[협]'}
                </span>
                {selected.name}
              </span>
            </>
          ) : (
            <span className="flex-1 text-gray-400">회사를 선택하세요</span>
          )}
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto">
            {companies.map((comp) => (
              <button
                key={comp.id}
                type="button"
                onClick={() => {
                  onChange(comp.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-primary-light/40 transition-colors ${
                  value === comp.id ? 'bg-primary-light/60 text-primary font-medium' : 'text-gray-700'
                }`}
              >
                <CompanyLogo company={comp} size="sm" />
                <div className="flex-1 text-left min-w-0">
                  <p className="truncate">{comp.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {comp.type === 'primary' ? '원도급사' : '협력사'}
                    {comp.budgetRatio ? ` · ${comp.budgetRatio}%` : ''}
                  </p>
                </div>
                {value === comp.id && (
                  <span className="text-primary text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
