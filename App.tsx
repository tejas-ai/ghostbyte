import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ModeProvider, useMode } from './contexts/ModeContext';
import Navigation from './components/Navigation';
import SimpleHide from './components/SimpleHide';
import SimpleReveal from './components/SimpleReveal';
import Encoder from './components/Encoder';
import Decoder from './components/Decoder';
import Comparator from './components/Comparator';
import Settings from './components/Settings';
import EnclaveSidebar from './components/EnclaveSidebar';
import KeyringModal from './components/KeyringModal';
import MessengerGuideModal from './components/MessengerGuideModal';
import ErrorBoundary from './components/ErrorBoundary';
import { ShieldCheck, Lock } from 'lucide-react';
import type { TabId } from './types';

function AppInner() {
  const [tab, setTab] = useState<TabId>('encoder');
  const [keyringOpen, setKeyringOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const { isPro, setMode } = useMode();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isPro && tab !== 'encoder' && tab !== 'decoder' && tab !== 'settings') {
      setTab('encoder');
    }
  }, [isPro, tab]);

  const openKeyring = () => setKeyringOpen(true);
  const openGuide = () => setGuideOpen(true);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#101319]">
      <Navigation
        active={tab}
        onTab={setTab}
        onOpenKeyring={openKeyring}
        onOpenGuide={openGuide}
      />

      <main className="relative z-10 flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Simple Mode Hardware Deck Header */}
        {!isPro && tab === 'encoder' && (
          <div className="mx-auto mb-6 max-w-2xl text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#222836] to-[#161a23] px-3 py-1 text-xs font-mono font-bold text-[#a0aec0] shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <span className="led-dot" />
              <span>{t.simple_hide?.tagline || 'Client-Side Hardware Memory Sandbox'}</span>
            </div>
            <h1 className="display-lg mt-3 text-[#f7fafc]">
              {t.simple_hide?.title || 'Hide Secret Messages & Files in Photos'}
            </h1>
            <p className="mt-1.5 text-xs text-[#a0aec0] font-sans max-w-lg mx-auto leading-relaxed">
              {t.simple_hide?.desc || 'Secured with AES-GCM-256 authenticated encryption. Runs 100% locally in your browser with zero server uploads.'}
            </p>
          </div>
        )}

        {!isPro && tab === 'decoder' && (
          <div className="mx-auto mb-6 max-w-2xl text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#222836] to-[#161a23] px-3 py-1 text-xs font-mono font-bold text-[#a0aec0] shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <span className="led-dot bg-[#64b5f6] shadow-[0_0_4px_#64b5f6]" />
              <span>{t.simple_reveal?.tagline || 'In-Memory Payload Extraction'}</span>
            </div>
            <h1 className="display-lg mt-3 text-[#f7fafc]">
              {t.simple_reveal?.title || 'Extract Secret Payloads from Media'}
            </h1>
            <p className="mt-1.5 text-xs text-[#a0aec0] font-sans max-w-lg mx-auto leading-relaxed">
              {t.simple_reveal?.desc || 'Open and verify confidential messages or files from photos and WAV audio.'}
            </p>
          </div>
        )}

        {isPro ? (
          /* Pro: Multi-module workbench with live telemetry deck */
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-5 lg:grid-cols-12 animate-fade-in">
            <div className="space-y-5 lg:col-span-8">
              {tab === 'encoder' && <Encoder onOpenGuide={openGuide} onOpenKeyring={openKeyring} />}
              {tab === 'decoder' && <Decoder onOpenKeyring={openKeyring} />}
              {(tab === 'forensics' || tab === 'comparator') && <Comparator />}
              {tab === 'settings' && <Settings onOpenKeyring={openKeyring} onOpenGuide={openGuide} />}
            </div>
            <aside className="w-full lg:col-span-4 sticky top-20">
              <EnclaveSidebar currentTab={tab} onOpenKeyring={openKeyring} onOpenGuide={openGuide} />
            </aside>
          </div>
        ) : (
          /* Simple: Centered focused console */
          <div className="mx-auto max-w-2xl">
            {tab === 'encoder' && <SimpleHide onSwitchToPro={() => setMode('pro')} />}
            {tab === 'decoder' && <SimpleReveal />}
            {tab === 'settings' && <Settings onOpenKeyring={openKeyring} onOpenGuide={openGuide} />}
            {(tab === 'forensics' || tab === 'comparator') && (
              <SimpleHide onSwitchToPro={() => setMode('pro')} />
            )}
          </div>
        )}
      </main>

      <KeyringModal isOpen={keyringOpen} onClose={() => setKeyringOpen(false)} />
      <MessengerGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ModeProvider>
          <AppInner />
        </ModeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
