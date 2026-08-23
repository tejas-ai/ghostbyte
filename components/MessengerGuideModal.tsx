import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  FileArchive,
  CheckCircle2,
  Share2,
  Smartphone,
  Send,
  Zap,
  ArrowRight,
  Info,
  Lock,
} from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface MessengerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MessengerTab = 'whatsapp' | 'telegram' | 'signal' | 'discord' | 'email';

export default function MessengerGuideModal({ isOpen, onClose }: MessengerGuideModalProps) {
  const [activeMessenger, setActiveMessenger] = useState<MessengerTab>('whatsapp');
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => closeButtonRef.current?.focus(), 50);
  }, [isOpen]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { soundFx.playClick(); onClose(); return; }
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const messengers = [
    { id: 'whatsapp' as const, name: 'WhatsApp', icon: '💬', color: 'text-emerald-400 border-emerald-500/30' },
    { id: 'telegram' as const, name: 'Telegram', icon: '✈️', color: 'text-cyan-400 border-cyan-500/30' },
    { id: 'signal' as const, name: 'Signal', icon: '🔒', color: 'text-blue-400 border-blue-500/30' },
    { id: 'discord' as const, name: 'Discord', icon: '🎮', color: 'text-indigo-400 border-indigo-500/30' },
    { id: 'email' as const, name: 'Email / AirDrop', icon: '✉️', color: 'text-purple-400 border-purple-500/30' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={() => { soundFx.playClick(); onClose(); }}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
      <div
        className="relative w-full max-w-2xl bg-[#090d16] border border-cyan-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Share2 size={18} />
            </div>
            <div>
              <h3 id="guide-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Stealth Messenger Dispatch Guide</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Zero-Loss Protocol
                </span>
              </h3>
              <p className="text-xs text-slate-400">How to send steganographic images without compression corruption.</p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={() => { soundFx.playClick(); onClose(); }}
            aria-label="Close messenger guide"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* The Compression Danger Alert */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
            <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-200">The Social Media Compression Trap:</p>
              <p className="text-slate-300 leading-relaxed">
                When you share a photo as standard <span className="font-bold text-white">"Gallery / Photo"</span> mode, platforms like WhatsApp, Facebook, or Instagram automatically transcode it to lossy JPEG, destroying hidden pixel data.
              </p>
              <p className="text-emerald-300 font-semibold pt-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Always dispatch stego files as <strong>"Document"</strong> or download as a <strong>1-Click .ZIP</strong> archive.
              </p>
            </div>
          </div>

          {/* Messenger Selector Tabs */}
          <div className="flex gap-2 p-1.5 rounded-xl bg-black/50 border border-white/10 overflow-x-auto">
            {messengers.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveMessenger(m.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeMessenger === m.id
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.name}</span>
              </button>
            ))}
          </div>

          {/* Platform Specific Step Instructions */}
          <div className="p-5 rounded-xl bg-black/40 border border-white/10 space-y-4">
            {activeMessenger === 'whatsapp' && (
              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-emerald-400 flex items-center gap-2">
                    <span>💬 WhatsApp Dispatch Instructions</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                    Recommended: 1-Click ZIP
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <p className="text-slate-300"><strong className="text-white">Click "Download as Document (.ZIP)"</strong> in QuietSend after encoding. This generates a lossless container that WhatsApp will never compress.</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <p className="text-slate-300">In WhatsApp chat, tap the <strong>Attachment (+) / Paperclip icon</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <p className="text-slate-300">Select <strong>"Document"</strong> (NOT "Photos & Videos") and attach the downloaded file.</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                    <p className="text-slate-300">The recipient simply saves the file and drops it into QuietSend Decoder.</p>
                  </div>
                </div>
              </div>
            )}

            {activeMessenger === 'telegram' && (
              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-cyan-400 flex items-center gap-2">
                    <span>✈️ Telegram Dispatch Instructions</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
                    Send as File
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <p className="text-slate-300">Download the PNG image or ZIP container from QuietSend.</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <p className="text-slate-300">In Telegram, click the <strong>Paperclip icon</strong> and choose <strong>"File"</strong> (or <em>"Send without compression"</em>).</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <p className="text-slate-300">Telegram will preserve 100% of the lossless pixel bitstream.</p>
                  </div>
                </div>
              </div>
            )}

            {activeMessenger === 'signal' && (
              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-blue-400 flex items-center gap-2">
                    <span>🔒 Signal Private Messenger Instructions</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">
                    High Quality / File
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/30 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <p className="text-slate-300">In Signal chat, tap the <strong>+ icon</strong> and choose <strong>"File"</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/30 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <p className="text-slate-300">Select the QuietSend `.png` or `.zip` file from your device storage.</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/30 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <p className="text-slate-300">Signal end-to-end encrypts the file without re-compressing pixel channels.</p>
                  </div>
                </div>
              </div>
            )}

            {activeMessenger === 'discord' && (
              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-indigo-400 flex items-center gap-2">
                    <span>🎮 Discord Attachment Instructions</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                    ZIP Recommended
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <p className="text-slate-300">Download the <strong>.ZIP</strong> document file from QuietSend.</p>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <p className="text-slate-300">Upload as regular attachment in DM or private server channel.</p>
                  </div>
                </div>
              </div>
            )}

            {activeMessenger === 'email' && (
              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-purple-400 flex items-center gap-2">
                    <span>✉️ Email / AirDrop / Cloud Drive</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300">
                    Direct Attachment
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5">
                    <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <p className="text-slate-300">Standard email attachments (Gmail, ProtonMail, Outlook) and Apple AirDrop preserve 100% of lossless PNG pixel data without alterations.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock size={14} className="text-cyan-400" />
            <span>QuietSend Client-Side Steganographic Engine</span>
          </div>
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-600/30 cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
