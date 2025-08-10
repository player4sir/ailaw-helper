import React from 'react';

import { Link } from 'react-router-dom';
import { Scale, FileText, BookOpen, MessageSquare } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void; // 保留以兼容现有调用方（App.tsx）
}

// {{ AURA: Modify - 重构导航栏为更简洁美观的设计，加入图标与更好的响应式与可访问性 }}
const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs: Array<{
    id: 'analysis' | 'documents' | 'laws' | 'consult';
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
  }> = [
    { id: 'analysis', name: '案件分析', description: '智能分析案件胜败点', icon: Scale },
    { id: 'documents', name: '文书生成', description: '生成起诉书、应诉书等', icon: FileText },
    { id: 'laws', name: '法条查询', description: '查询最新法律法规', icon: BookOpen },
    { id: 'consult', name: '法律咨询', description: '向AI咨询法律问题', icon: MessageSquare },
  ];

  return (
    <>
      {/* 桌面端导航（置顶、毛玻璃、细边框） */}
      <nav
        className="hidden sm:block sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200"
        aria-label="主导航"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-stretch gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.id}
                  to={`/${tab.id}`}
                  onClick={() => setActiveTab?.(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={
                    `group relative inline-flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium outline-none transition-colors
                     focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1
                     ${isActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'}`
                  }
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <div className="flex flex-col">
                    <span className="tracking-wide">{tab.name}</span>
                    <span className="hidden md:block text-[11px] text-slate-400 mt-0.5">{tab.description}</span>
                  </div>
                  {/* 活动态指示条 */}
                  <span
                    className={`absolute -bottom-[1px] left-2 right-2 h-0.5 rounded-full transition-all duration-300 ${
                      isActive ? 'bg-blue-600 opacity-100' : 'bg-transparent opacity-0 group-hover:bg-slate-300 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 移动端底部导航（带安全区） */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-t border-gray-200 z-50 pb-safe-bottom safe-area-pb"
        aria-label="底部导航"
      >
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={`/${tab.id}`}
                onClick={() => setActiveTab?.(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 transition-colors ${
                  isActive ? 'text-blue-700 bg-blue-50/70' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-[11px] font-medium tracking-wide mt-0.5">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;