import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Share2,
  SlidersHorizontal,
  Lock,
  Unlock,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useMode } from '../contexts/ModeContext';
import { soundFx } from '../services/soundFx';
import SkeuoSegmentedControl from './SkeuoSegmentedControl';
import type { TabId } from '../types';

interface NavigationProps {
  active: TabId;
  onTab: (t: TabId) => void;
  onOpenKeyring?: () => void;
  onOpenGuide?: () => void;
}

const PRO_TABS: { id: TabId; label: string; icon: React.ReactNode; color: 'green' | 'blue' | 'amber' | 'purple' }[] = [
  { id: 'encoder',   label: 'Hide',     icon: <Lock size={14} strokeWidth={2.2} />, color: 'green' },
  { id: 'decoder',   label: 'Reveal',   icon: <Unlock size={14} strokeWidth={2.2} />, color: 'blue' },
  { id: 'forensics', label: 'Inspect',  icon: <SlidersHorizontal size={14} strokeWidth={2.2} />, color: 'amber' },
  { id: 'settings',  label: 'Settings', icon: <SettingsIcon size={14} strokeWidth={2.2} />, color: 'purple' },
];

const SIMPLE_TABS: { id: TabId; label: string; icon: React.ReactNode; color: 'green' | 'blue' | 'amber' | 'purple' }[] = [
  { id: 'encoder',  label: 'Hide',     icon: <Lock size={14} strokeWidth={2.2} />, color: 'green' },
  { id: 'decoder',  label: 'Reveal',   icon: <Unlock size={14} strokeWidth={2.2} />, color: 'blue' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={14} strokeWidth={2.2} />, color: 'purple' },
];

export default function Navigation({ active, onTab, onOpenKeyring, onOpenGuide }: NavigationProps) {
  const { toggleMode, isPro } = useMode();
  const [isMuted, setIsMuted] = useState(() => soundFx.getMuted());
  const tabs = isPro ? PRO_TABS : SIMPLE_TABS;

  const select = (id: TabId) => {
    soundFx.playClick();
    onTab(id);
  };

  const handleSoundToggle = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/70 bg-[#141822] shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
      {/* Top highlight chamfer */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="mx-auto flex min-h-14 w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:h-14 sm:flex-nowrap sm:gap-3 sm:px-6 sm:py-0">
        {/* Brand: Physical Milled Badge */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/60 border-t-white/20 bg-gradient-to-b from-[#252c3b] to-[#171c26] shadow-[0_2px_5px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]">
            <ShieldCheck size={16} strokeWidth={2.4} className="text-[#52b788]" />
          </div>

          <div className="leading-none">
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-[16px] font-extrabold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                QuietSend
              </span>
              <span className="rounded border border-black/50 border-t-white/10 bg-[#1c222e] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#a0aec0] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
                3.0
              </span>
            </div>
            <div className="eyebrow mt-0.5 hidden text-[9px] text-[#718096] sm:block">
              {isPro ? 'Pro Telemetry Deck' : 'Air-Gapped Privacy'}
            </div>
          </div>
        </div>

        {/* Center: Recessed Sunken Tab Tray with Smooth Sliding Cap with Page Unique Colors */}
        <SkeuoSegmentedControl
          ariaLabel="Main navigation"
          role="radiogroup"
          options={tabs.map((t) => ({
            id: String(t.id),
            label: t.label,
            icon: t.icon,
            activeColor: t.color,
          }))}
          value={
            !isPro && active !== 'encoder' && active !== 'decoder' && active !== 'settings'
              ? 'encoder'
              : active === 'comparator'
              ? 'forensics'
              : String(active)
          }
          onChange={(val) => select(val as TabId)}
          className="order-3 w-full min-w-0 sm:order-none sm:min-w-[340px] sm:w-auto"
        />

        {/* Right Cluster: Mechanical Audio Button, Modals & Rocker Switch */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Physical Audio Toggle */}
          <button
            type="button"
            onClick={handleSoundToggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#242a38] to-[#181d27] text-[#a0aec0] shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] cursor-pointer hover:text-white"
            title={isMuted ? 'Audio feedback muted' : 'Physical audio active'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#52b788]" />}
          </button>

          {isPro && onOpenKeyring && (
            <button
              type="button"
              onClick={() => { soundFx.playClick(); onOpenKeyring(); }}
              className="btn btn-secondary !hidden !h-8 !px-2.5 !py-0 !text-xs cursor-pointer sm:!inline-flex"
              title="ECDH Keyring"
            >
              <Key size={13} />
              <span className="hidden lg:inline">Keyring</span>
            </button>
          )}

          {onOpenGuide && (
            <button
              type="button"
              onClick={() => { soundFx.playClick(); onOpenGuide(); }}
              className="btn btn-secondary !hidden !h-8 !px-2.5 !py-0 !text-xs cursor-pointer sm:!inline-flex"
              title="Dispatch instructions"
            >
              <Share2 size={13} />
              <span className="hidden lg:inline">Dispatch</span>
            </button>
          )}

          {/* Physical 2-Position Hardware Sliding Rocker Switch */}
          <SkeuoSegmentedControl
            ariaLabel="Operational mode"
            role="radiogroup"
            size="sm"
            options={[
              { id: 'simple', label: 'Simple', activeColor: 'slate' },
              { id: 'pro', label: 'Pro', activeColor: 'green' },
            ]}
            value={isPro ? 'pro' : 'simple'}
            onChange={(val) => {
              if ((val === 'pro' && !isPro) || (val === 'simple' && isPro)) {
                toggleMode();
              }
            }}
            className="w-28 sm:w-32"
          />
        </div>
      </div>
    </header>
  );
}
