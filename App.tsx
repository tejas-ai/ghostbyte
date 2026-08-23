import { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import Navigation from './components/Navigation';
import Encoder from './components/Encoder';
import Decoder from './components/Decoder';
import Comparator from './components/Comparator';
import Settings from './components/Settings';
import EnclaveSidebar from './components/EnclaveSidebar';
import KeyringModal from './components/KeyringModal';
import MessengerGuideModal from './components/MessengerGuideModal';
import type { TabId } from './types';

function AppInner() {
  const [tab, setTab] = useState<TabId>('encoder');
  const [keyringOpen, setKeyringOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#06080e] text-[#f8fafc] flex flex-col relative selection:bg-blue-600/30 selection:text-blue-100">
      <div className="relative flex flex-col min-h-screen z-10">
        <Navigation
          active={tab}
          onTab={setTab}
          onOpenKeyring={() => setKeyringOpen(true)}
          onOpenGuide={() => setGuideOpen(true)}
        />

        {/* 100% Full-Screen Expansive Studio Layout (Main Workbench + Enclave Live Telemetry) */}
        <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Primary Workbench Column (8 cols on large screen) */}
            <main className="lg:col-span-8 space-y-6">
              {tab === 'encoder' && <Encoder onOpenGuide={() => setGuideOpen(true)} onOpenKeyring={() => setKeyringOpen(true)} />}
              {tab === 'decoder' && <Decoder onOpenKeyring={() => setKeyringOpen(true)} />}
              {(tab === 'forensics' || (tab as string) === 'comparator') && <Comparator />}
              {tab === 'settings' && <Settings hackerMode={false} onOpenKeyring={() => setKeyringOpen(true)} onOpenGuide={() => setGuideOpen(true)} />}
            </main>

            {/* Live Cryptographic Enclave Telemetry Column (4 cols on large screen) */}
            <div className="lg:col-span-4 w-full">
              <EnclaveSidebar currentTab={tab} onOpenKeyring={() => setKeyringOpen(true)} onOpenGuide={() => setGuideOpen(true)} />
            </div>
          </div>
        </div>

        {/* Keyring Studio Modal */}
        <KeyringModal isOpen={keyringOpen} onClose={() => setKeyringOpen(false)} />

        {/* Messenger Stealth Dispatcher Guide Modal */}
        <MessengerGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
