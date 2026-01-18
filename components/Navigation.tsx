import React from 'react';
import { ToolType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  activeTab: ToolType;
  setActiveTab: (tab: ToolType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: ToolType.ENCODER, name: t.nav.encode, icon: '🔒' },
    { id: ToolType.DECODER, name: t.nav.decode, icon: '🔓' },
    { id: ToolType.COMPARATOR, name: t.nav.compare, icon: '⚖️' },
    { id: ToolType.SETTINGS, name: t.nav.settings, icon: '⚙️' },
  ];

  return (
    <nav className="flex justify-center space-x-2 p-1 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 mb-8 sticky top-4 z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center px-6 py-2.5 rounded-xl transition-all duration-300 font-medium ${activeTab === tab.id
            ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.name}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
