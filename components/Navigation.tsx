import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ToolType, TabId } from '../types';
import { soundFx } from '../services/soundFx';
import { Lock, Unlock, SlidersHorizontal, Settings as SettingsIcon, ShieldCheck, Key, Share2 } from 'lucide-react';

interface NavigationProps {
  active?: TabId;
  onTab?: (t: TabId) => void;
  activeTab?: ToolType;
  setActiveTab?: (tab: ToolType) => void;
  hackerClicks?: number;
  onLogoClick?: () => void;
  hackerMode?: boolean;
  onOpenKeyring?: () => void;
  onOpenGuide?: () => void;
}

const tabs: { id: TabId; labelKey: 'encode' | 'decode' | 'forensics' | 'settings'; icon: React.ReactNode; activeGradient: string; activeBorder: string }[] = [
  {
    id: 'encoder',
    labelKey: 'encode',
    icon: <Lock size={15} strokeWidth={2.4} />,
    activeGradient: 'bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600',
    activeBorder: 'border-cyan-400/50',
  },
  {
    id: 'decoder',
    labelKey: 'decode',
    icon: <Unlock size={15} strokeWidth={2.4} />,
    activeGradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600',
    activeBorder: 'border-pink-400/50',
  },
  {
    id: 'forensics',
    labelKey: 'forensics',
    icon: <SlidersHorizontal size={15} strokeWidth={2.4} />,
    activeGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600',
    activeBorder: 'border-emerald-400/50',
  },
  {
    id: 'settings',
    labelKey: 'settings',
    icon: <SettingsIcon size={15} strokeWidth={2.4} />,
    activeGradient: 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600',
    activeBorder: 'border-amber-400/50',
  },
];

export default function Navigation({
  active,
  onTab,
  activeTab,
  setActiveTab,
  onOpenKeyring,
  onOpenGuide,
}: NavigationProps) {
  const { t } = useLanguage();

  const currentTab = active || activeTab || 'encoder';

  const handleSelectTab = (id: TabId) => {
    soundFx.playClick();
    if (onTab) onTab(id);
    if (setActiveTab) setActiveTab(id as ToolType);
  };

  const getLabel = (key: 'encode' | 'decode' | 'forensics' | 'settings') => {
    switch (key) {
      case 'encode':
        return t.nav.encode || 'Encode';
      case 'decode':
        return t.nav.decode || 'Decode';
      case 'forensics':
        return t.nav.forensics || 'Forensics';
      case 'settings':
        return t.nav.settings || 'Settings';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070a12]/85 backdrop-blur-2xl border-b border-white/[0.12] shadow-xl">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo with 3D Glass Surface & Harsh Gradient Icon */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 p-[1.5px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_10px_rgba(0,0,0,0.5)]">
            <div className="w-full h-full bg-[#0a0d18] rounded-[10px] flex items-center justify-center text-cyan-400">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <div className="text-base font-black tracking-tight font-sans flex items-center gap-2">
              <span className="text-gradient-harsh-blue font-black text-lg">QuietSend</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md glass-pill-3d text-cyan-300">
                v3.0 PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase leading-none">
              Zero-Server Steganography
            </div>
          </div>
        </div>

        {/* Center 3D Segmented Tabs with Harsh Gradient Active Pill */}
        <nav className="flex items-center p-1 rounded-xl bg-black/60 border border-white/[0.1] shadow-inner">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id || (tab.id === 'forensics' && currentTab === 'comparator');
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? `${tab.activeGradient} text-white border-t border-b border-l border-r ${tab.activeBorder} shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_4px_12px_rgba(0,0,0,0.6)] scale-[1.02]`
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{getLabel(tab.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Enclave Status */}
        <div className="flex items-center gap-2">
          {/* Keyring Quick Trigger */}
          {onOpenKeyring && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenKeyring();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-400/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Open Asymmetric Keyring & Enclave Studio"
            >
              <Key size={13} />
              <span className="hidden md:inline">Keyring</span>
            </button>
          )}

          {/* Messenger Stealth Guide Trigger */}
          {onOpenGuide && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenGuide();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Open Stealth Messenger Dispatch Guide"
            >
              <Share2 size={13} />
              <span className="hidden lg:inline">Bypass Guide</span>
            </button>
          )}

          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass-pill-3d text-[11px] font-mono font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            <span>Air-Gapped</span>
          </div>
        </div>
      </div>
    </header>
  );
}
