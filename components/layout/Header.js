'use client';
import { Menu } from 'lucide-react';
import { useBudget } from '@/lib/store';
import Logo from '@/components/ui/Logo';

export default function Header({ onMenuToggle }) {
  const { data } = useBudget();

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-400">
            {data?.project?.name || ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 pl-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            관
          </div>
          <span className="text-sm font-medium text-gray-700">관리자</span>
        </div>
      </div>
    </header>
  );
}
