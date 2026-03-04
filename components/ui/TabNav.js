'use client';
import {
  LayoutDashboard,
  Calculator,
  ClipboardList,
  FileText,
  Upload,
  BarChart3,
} from 'lucide-react';

const ICONS = {
  LayoutDashboard,
  Calculator,
  ClipboardList,
  FileText,
  Upload,
  BarChart3,
};

export default function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-gray-200 bg-white" data-tutorial="tabs">
      <nav className="flex overflow-x-auto tab-scroll px-2 sm:px-4 -mb-px" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = ICONS[tab.icon];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tutorial={`tab-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors duration-150
                ${
                  isActive
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
        })}
      </nav>
    </div>
  );
}
