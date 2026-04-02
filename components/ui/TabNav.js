'use client';
import {
  LayoutDashboard,
  Calculator,
  ClipboardList,
  FileText,
  Upload,
  BarChart3,
  Building2,
  Code2,
} from 'lucide-react';

const ICONS = {
  LayoutDashboard,
  Calculator,
  ClipboardList,
  FileText,
  Upload,
  BarChart3,
  Building2,
  Code2,
};

function TabButton({ tab, isActive, onChange }) {
  const Icon = ICONS[tab.icon];
  return (
    <button
      key={tab.id}
      data-tutorial={`tab-${tab.id}`}
      onClick={() => onChange(tab.id)}
      className={`
        flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap
        border-b-2 transition-colors duration-150
        ${isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {Icon && <Icon size={16} />}
      <span className="hidden sm:inline">{tab.label}</span>
      <span className="sm:hidden text-xs">{tab.label}</span>
    </button>
  );
}

export default function TabNav({ tabs, asideTabs = [], activeTab, onChange, maxWidth }) {
  return (
    <div className="border-b border-gray-200 bg-white" data-tutorial="tabs">
      <nav
        className="flex -mb-px mx-auto"
        style={maxWidth ? { maxWidth } : {}}
        aria-label="Tabs"
      >
        {/* 좌측: 주요 서비스 탭 */}
        <div className="flex overflow-x-auto tab-scroll px-2 sm:px-4 flex-1">
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onChange={onChange} />
          ))}
        </div>

        {/* 우측: 보조 탭 (회사관리, 개발가이드 등) */}
        {asideTabs.length > 0 && (
          <div className="flex items-stretch px-2 sm:px-4 border-l border-gray-100 shrink-0">
            {asideTabs.map((tab) => (
              <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onChange={onChange} />
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}
