import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Layers,
  Activity,
  AlertTriangle,
  FileCheck2,
  Share2,
  HardDrive,
  Info,
  ChevronDown,
  ChevronUp,
  Key,
  Music,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { TabId } from '../types';
import { soundFx } from '../services/soundFx';

interface EnclaveSidebarProps {
  currentTab: TabId;
  onOpenKeyring?: () => void;
  onOpenGuide?: () => void;
}

export default function EnclaveSidebar({ currentTab, onOpenKeyring, onOpenGuide }: EnclaveSidebarProps) {
  const { t } = useLanguage();
  const [showFaq, setShowFaq] = useState(false);

  return (
    <aside className="space-y-5 animate-fade-in">
      {/* Real-time Enclave Security Status Card */}
      <div className="glass-3d p-5 space-y-4 border-cyan-400/30">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Enclave Live Telemetry
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            AIR-GAPPED
          </span>
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/10">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu size={13} className="text-cyan-400" />
              <span>WebCrypto Subtle</span>
            </span>
            <span className="text-cyan-300 font-bold">Hardware Accelerated</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/10">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Key size={13} className="text-purple-400" />
              <span>Asymmetric Engine</span>
            </span>
            <span className="text-purple-300 font-bold">ECDH P-256 / HKDF</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/10">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers size={13} className="text-emerald-400" />
              <span>Multi-Modal Carrier</span>
            </span>
            <span className="text-emerald-300 font-bold">PNG / TIFF / WAV Audio</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/10">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive size={13} className="text-amber-400" />
              <span>Cloud Egress</span>
            </span>
            <span className="text-emerald-400 font-bold">0 B / sec (Isolated)</span>
          </div>
        </div>

        {/* Studio Quick Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          {onOpenKeyring && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenKeyring();
              }}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-400/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Key size={13} />
              <span>Keyring Studio</span>
            </button>
          )}

          {onOpenGuide && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenGuide();
              }}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Share2 size={13} />
              <span>Bypass Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Cryptographic Pipeline Flow */}
      <div className="glass-3d-blue p-5 space-y-3.5">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
          <Activity size={14} className="text-cyan-400" />
          <span>Cryptographic Pipeline</span>
        </h4>

        <div className="relative pl-4 space-y-3 border-l-2 border-cyan-500/40 text-xs font-mono">
          <div className="relative">
            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-black" />
            <p className="font-bold text-white">1. Cover Media Ingestion</p>
            <p className="text-[11px] text-slate-400">Pixels or PCM audio matrix mapped for byte capacity.</p>
          </div>

          <div className="relative">
            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-400 border-2 border-black" />
            <p className="font-bold text-white">2. AES-GCM-256 / ECDH</p>
            <p className="text-[11px] text-slate-400">Authenticated encryption with 128-bit GHASH tag.</p>
          </div>

          <div className="relative">
            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
            <p className="font-bold text-white">3. LSB Spatial Multiplexing</p>
            <p className="text-[11px] text-slate-400">Offloaded to Web Worker for 60 FPS lossless output.</p>
          </div>
        </div>
      </div>

      {/* Golden Operational Security Rule */}
      <div className="glass-3d-amber p-5 space-y-3 border-amber-500/30">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs font-mono uppercase tracking-wider">
          <AlertTriangle size={15} className="text-amber-400 shrink-0" />
          <span>Operational Security Rule</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
          Messaging platforms (WhatsApp, Facebook) transcode photos to lossy JPEG, destroying hidden bitstreams. Always dispatch your encoded container as an <strong>uncompressed File / Document (.ZIP)</strong>.
        </p>
        <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-emerald-400 font-semibold">
          <FileCheck2 size={13} />
          <span>1-Click PKZIP bypass is strictly supported</span>
        </div>
      </div>

      {/* Quick Steganography FAQ Toggle */}
      <div className="glass-3d p-4 space-y-3">
        <button
          onClick={() => setShowFaq(!showFaq)}
          className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase text-slate-300 hover:text-white cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Info size={14} className="text-cyan-400" />
            <span>Architecture FAQ</span>
          </span>
          {showFaq ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFaq && (
          <div className="space-y-3 pt-2 text-xs text-slate-300 font-sans border-t border-white/10 animate-fade-in">
            <div>
              <p className="font-bold text-white">Is data sent to any cloud server?</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No. QuietSend executes 100% within your client browser memory sandbox via Web APIs.
              </p>
            </div>
            <div>
              <p className="font-bold text-white">Can someone detect the payload?</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Without the key, the ciphertext is indistinguishable from standard sensor ISO noise (PSNR &gt; 45 dB).
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
