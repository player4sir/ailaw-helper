import React from 'react';
import { BarChart3, FileText, BookOpen, MessageSquare } from 'lucide-react'; // 新增 MessageSquare 图标

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'analysis',
      name: '案件分析',
      icon: BarChart3,
      description: '智能分析案件胜败点'
    },
    {
      id: 'documents',
      name: '文书生成',
      icon: FileText,
      description: '生成起诉书、应诉书等'
    },
    {
      id: 'laws',
      name: '法条查询',
      icon: BookOpen,
      description: '查询最新法律法规'
    },
    {
      id: 'consult',
      name: '法律咨询',
      icon: MessageSquare,
      description: '向AI咨询法律问题'
    }
  ]; // 新增“法律咨询”Tab

  return (
    <>
      {/* 桌面端导航 */}
      <nav className="bg-white border-b border-gray-200 hidden sm:block">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div>{tab.name}</div>
                    <div className="text-xs text-gray-400">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 移动端底部导航 */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;