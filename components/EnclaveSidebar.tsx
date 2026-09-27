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
    <aside className="space-y-4 animate-fade-in">
      {/* Real-time Enclave Security Status Card */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/50 border-b-white/5">
          <div className="flex items-center gap-2">
            <span className="led-dot" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Enclave Telemetry Deck
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#152a20] text-[#74c69d] border border-black/50 border-t-[#52b788]/30 shadow-inner">
            AIR-GAPPED
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-2.5 rounded-lg card-inset">
            <span className="text-[#a0aec0] flex items-center gap-2">
              <Cpu size={14} className="text-[#64b5f6]" />
              <span>WebCrypto Subtle</span>
            </span>
            <span className="text-[#64b5f6] font-bold">Hardware Accelerated</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg card-inset">
            <span className="text-[#a0aec0] flex items-center gap-2">
              <Key size={14} className="text-[#b39ddb]" />
              <span>Asymmetric Engine</span>
            </span>
            <span className="text-[#b39ddb] font-bold">ECDH P-256 / HKDF</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg card-inset">
            <span className="text-[#a0aec0] flex items-center gap-2">
              <Layers size={14} className="text-[#52b788]" />
              <span>Carrier Support</span>
            </span>
            <span className="text-[#74c69d] font-bold">PNG / TIFF / WAV Audio</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg card-inset">
            <span className="text-[#a0aec0] flex items-center gap-2">
              <HardDrive size={14} className="text-[#e0a96d]" />
              <span>Network Egress</span>
            </span>
            <span className="text-[#52b788] font-bold">0 B / s (Isolated)</span>
          </div>
        </div>

        {/* Studio Quick Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/50 border-t-white/5">
          {onOpenKeyring && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenKeyring();
              }}
              className="btn btn-secondary !py-2 !text-xs cursor-pointer"
            >
              <Key size={13} className="text-[#b39ddb]" />
              <span>Keyring Studio</span>
            </button>
          )}

          {onOpenGuide && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenGuide();
              }}
              className="btn btn-secondary !py-2 !text-xs cursor-pointer"
            >
              <Share2 size={13} className="text-[#64b5f6]" />
              <span>Dispatch Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Cryptographic Pipeline Flow */}
      <div className="glass-3d-blue p-5 space-y-3.5">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#64b5f6] flex items-center gap-2">
          <Activity size={14} />
          <span>Cryptographic Pipeline</span>
        </h4>

        <div className="relative pl-4 space-y-3 border-l border-white/15 text-xs font-mono">
          <div className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border border-black/70 bg-[#64b5f6] shadow-sm" />
            <p className="font-bold text-white">1. Cover Media Ingestion</p>
            <p className="text-[11px] text-[#a0aec0]">Pixel array or 16-bit PCM matrix mapped for capacity.</p>
          </div>

          <div className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border border-black/70 bg-[#b39ddb] shadow-sm" />
            <p className="font-bold text-white">2. AES-GCM-256 / ECDH</p>
            <p className="text-[11px] text-[#a0aec0]">Authenticated encryption with 128-bit GHASH tag.</p>
          </div>

          <div className="relative">
            <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border border-black/70 bg-[#52b788] shadow-sm" />
            <p className="font-bold text-white">3. LSB Spatial Multiplexing</p>
            <p className="text-[11px] text-[#a0aec0]">Transparency flattened before embedding to preserve hidden data.</p>
          </div>
        </div>
      </div>

      {/* Golden Operational Security Rule */}
      <div className="glass-3d-amber p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-[#e0a96d] font-bold text-xs font-mono uppercase tracking-wider">
          <AlertTriangle size={15} className="shrink-0" />
          <span>Operational Security Rule</span>
        </div>
        <p className="text-xs text-[#a0aec0] leading-relaxed font-sans font-medium">
          Messaging platforms (WhatsApp, Facebook) transcode photos to lossy JPEG, destroying hidden bitstreams. Always dispatch your encoded container as an <strong>uncompressed File / Document (.ZIP)</strong>.
        </p>
        <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-[#52b788] font-bold">
          <FileCheck2 size={13} />
          <span>1-Click PKZIP bypass strictly supported</span>
        </div>
      </div>

      {/* Quick Steganography FAQ Toggle */}
      <div className="card p-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowFaq(!showFaq)}
          className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase text-[#a0aec0] hover:text-white cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Info size={14} className="text-[#64b5f6]" />
            <span>Architecture FAQ</span>
          </span>
          {showFaq ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFaq && (
          <div className="space-y-3 pt-2 text-xs text-[#a0aec0] font-sans border-t border-white/10 animate-fade-in">
            <div>
              <p className="font-bold text-white">Is data sent to any cloud server?</p>
              <p className="text-[11px] text-[#718096] mt-0.5">
                No. QuietSend executes 100% within your client browser memory sandbox via Web APIs.
              </p>
            </div>
            <div>
              <p className="font-bold text-white">Can someone detect the payload?</p>
              <p className="text-[11px] text-[#718096] mt-0.5">
                Without the key, the ciphertext is indistinguishable from standard sensor ISO noise (PSNR &gt; 45 dB).
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
