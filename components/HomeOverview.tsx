import React from 'react';
import {
  Key,
  Cpu,
  Layers,
  Lock,
  Unlock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ToolType } from '../types';
import { soundFx } from '../services/soundFx';

interface HomeOverviewProps {
  onNavigate: (tab: ToolType) => void;
}

const HomeOverview: React.FC<HomeOverviewProps> = ({ onNavigate }) => {
  const handleNav = (tab: ToolType) => {
    soundFx.playClick();
    onNavigate(tab);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner with 3D Glass Pill */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill-3d text-cyan-300 text-xs font-mono font-bold">
          <ShieldCheck size={14} className="text-cyan-400" />
          <span>Local Client-Side Cryptographic Enclave</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans">
          Steganography <span className="text-gradient-harsh-blue">Engineered for Stealth</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
          Conceal confidential files, credentials, and encrypted records inside standard images without perceptible loss. 100% computed inside your browser memory sandbox.
        </p>
      </div>

      {/* 3 Technical Architecture Cards with 3D Glassmorphism & Harsh Multi-Stop Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Encryption Standard */}
        <div className="glass-3d-blue p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider font-bold">Cipher Standard</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
              <Lock size={16} strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              AES-GCM-256
            </div>
            <p className="text-xs text-slate-300 mt-1 font-sans">
              Authenticated encryption with 128-bit integrity tag.
            </p>
          </div>
          <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/10">
            <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 w-full rounded-full" />
          </div>
        </div>

        {/* Card 2: Key Derivation Function */}
        <div className="glass-3d-purple p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-pink-300 uppercase tracking-wider font-bold">Key Derivation</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
              <Cpu size={16} strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              PBKDF2 (600k)
            </div>
            <p className="text-xs text-slate-300 mt-1 font-sans">
              600,000 HMAC-SHA256 rounds for brute-force resistance.
            </p>
          </div>
          <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/10">
            <div className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-fuchsia-400 w-[90%] rounded-full" />
          </div>
        </div>

        {/* Card 3: Steganography Engine */}
        <div className="glass-3d-emerald p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-300 uppercase tracking-wider font-bold">Spatial Encoding</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.5)]">
              <Layers size={16} strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              LSB-4 Multiplex
            </div>
            <p className="text-xs text-slate-300 mt-1 font-sans">
              Low-impact pixel bitplane distribution with high capacity.
            </p>
          </div>
          <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/10">
            <div className="h-full bg-gradient-to-r from-emerald-600 via-teal-400 to-lime-400 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* 2 Primary Action Cards with 3D Glass Depth & Harsh Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
        {/* Action 1: Encoder */}
        <div
          onClick={() => handleNav(ToolType.ENCODER)}
          className="group relative p-8 glass-3d-blue hover:scale-[1.015] transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 overflow-hidden"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_6px_16px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform">
              <Lock size={26} strokeWidth={2.4} />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 group-hover:text-white group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-500 transition-all shadow-md">
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
              Encode & Conceal Payload
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono font-medium">
              Inject encrypted text or multi-file archives inside carrier images with authenticated LSB-4 multiplexing.
            </p>
          </div>
        </div>

        {/* Action 2: Decoder */}
        <div
          onClick={() => handleNav(ToolType.DECODER)}
          className="group relative p-8 glass-3d-purple hover:scale-[1.015] transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 overflow-hidden"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-fuchsia-600 text-white flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_6px_16px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform">
              <Unlock size={26} strokeWidth={2.4} />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-pink-300 group-hover:text-white group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-500 transition-all shadow-md">
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-black text-white group-hover:text-pink-300 transition-colors">
              Extract & Decrypt Payload
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono font-medium">
              Scan carrier images to recover and decrypt embedded text vaults or multi-file archives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeOverview;
