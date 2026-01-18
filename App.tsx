import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Encoder from './components/Encoder';
import Decoder from './components/Decoder';
import Comparator from './components/Comparator';
import Settings from './components/Settings';
import { ToolType } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ToolType>(ToolType.ENCODER);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20 selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 pt-16 pb-12 text-center px-4">
        <div className="inline-flex items-center space-x-2 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tighter text-gray-900 dark:text-white">{t.app.title}</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          {t.app.tagline.split(' ').map((word, i, arr) =>
            i < arr.length / 2 ? <span key={i}>{word} </span> : null
          )}
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            {t.app.tagline.split(' ').slice(Math.ceil(t.app.tagline.split(' ').length / 2)).join(' ')}
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg md:text-xl font-light leading-relaxed">
          {t.app.description}
        </p>
      </header>

      <main className="relative z-10 px-4">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="transition-all duration-500">
          {activeTab === ToolType.ENCODER && <Encoder />}
          {activeTab === ToolType.DECODER && <Decoder />}
          {activeTab === ToolType.COMPARATOR && <Comparator />}
          {activeTab === ToolType.SETTINGS && <Settings />}
        </div>
      </main>

      <footer className="mt-32 text-center px-4 text-gray-500 text-sm border-t border-gray-200 dark:border-gray-900 pt-12">
        <div className="max-w-4xl mx-auto">
          <p className="mb-4">
            {t.app.footer_desc}
            <br />
            Remember to use lossless formats (like PNG) for sharing encoded files to avoid compression artifacts that destroy hidden data.
          </p>
          <p className="opacity-50 font-mono">
            {t.app.footer_rights}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
