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
import SkeuoSegmentedControl from './SkeuoSegmentedControl';

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
    { id: 'whatsapp' as const, label: 'WhatsApp', icon: '💬', activeColor: 'green' as const },
    { id: 'telegram' as const, label: 'Telegram', icon: '✈️', activeColor: 'green' as const },
    { id: 'signal' as const, label: 'Signal', icon: '🔒', activeColor: 'green' as const },
    { id: 'discord' as const, label: 'Discord', icon: '🎮', activeColor: 'purple' as const },
    { id: 'email' as const, label: 'Email / AirDrop', icon: '✉️', activeColor: 'slate' as const },
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
          className="relative w-full max-w-2xl bg-[#161b25] border border-black/70 border-t-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/60 border-b-white/5 bg-[#1a202c]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/60 border-t-white/20 bg-[#252c3b] text-[#64b5f6] shadow-md">
                <Share2 size={17} />
              </div>
              <div>
                <h3 id="guide-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                  <span>Stealth Messenger Dispatch Guide</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1c222e] border border-black/50 border-t-white/10 text-[#a0aec0] shadow-inner">
                    Zero-Loss Protocol
                  </span>
                </h3>
                <p className="text-xs text-[#718096]">How to send steganographic images without compression corruption.</p>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              onClick={() => { soundFx.playClick(); onClose(); }}
              aria-label="Close messenger guide"
              className="btn btn-secondary !p-1.5 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* The Compression Danger Alert */}
            <div className="card-inset p-4 flex items-start gap-3.5 border-l-2 border-l-[#e0a96d]">
              <AlertTriangle className="text-[#e0a96d] shrink-0 mt-0.5" size={18} />
              <div className="text-xs space-y-1.5">
                <p className="font-bold text-[#f7fafc]">The Social Media Compression Trap:</p>
                <p className="text-[#a0aec0] leading-relaxed">
                  When you share a photo in standard <span className="font-bold text-white">"Gallery / Photo"</span> mode, platforms like WhatsApp, Facebook, or Instagram automatically transcode it to lossy JPEG, destroying hidden pixel data.
                </p>
                <p className="text-[#52b788] font-semibold pt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#52b788]" />
                  Always dispatch stego files as <strong>"Document"</strong> or download as a <strong>1-Click .ZIP</strong> archive.
                </p>
              </div>
            </div>

            {/* Smooth Sliding Messenger Selector Tabs */}
            <SkeuoSegmentedControl
              options={messengers}
              value={activeMessenger}
              onChange={(val) => setActiveMessenger(val as MessengerTab)}
            />

            {/* Platform Specific Step Instructions */}
            <div className="card p-5 space-y-4">
              {activeMessenger === 'whatsapp' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-black/50 border-b-white/5">
                    <span className="font-bold text-[#52b788] flex items-center gap-2">
                      <span>💬 WhatsApp Dispatch Instructions</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#14261c] text-[#74c69d] border border-black/40 shadow-inner">
                      Recommended: 1-Click ZIP
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">1</span>
                      <p className="text-[#a0aec0]"><strong className="text-white">Click "Download as Document (.ZIP)"</strong> in QuietSend after encoding. This generates a lossless container that WhatsApp will never compress.</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">2</span>
                      <p className="text-[#a0aec0]">In WhatsApp chat, tap the <strong>Attachment (+) / Paperclip icon</strong>.</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">3</span>
                      <p className="text-[#a0aec0]">Select <strong>"Document"</strong> (NOT "Photos & Videos") and attach the downloaded file.</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">4</span>
                      <p className="text-[#a0aec0]">The recipient simply saves the file and drops it into QuietSend Decoder.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeMessenger === 'telegram' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-black/50 border-b-white/5">
                    <span className="font-bold text-[#64b5f6] flex items-center gap-2">
                      <span>✈️ Telegram Dispatch Instructions</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#172535] text-[#90cdf4] border border-black/40 shadow-inner">
                      Send as File
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">1</span>
                      <p className="text-[#a0aec0]">Download the PNG image or ZIP container from QuietSend.</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">2</span>
                      <p className="text-[#a0aec0]">In Telegram, click the <strong>Paperclip icon</strong> and choose <strong>"File"</strong> (or <em>"Send without compression"</em>).</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">3</span>
                      <p className="text-[#a0aec0]">Telegram will preserve 100% of the lossless pixel bitstream.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeMessenger === 'signal' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-black/50 border-b-white/5">
                    <span className="font-bold text-[#64b5f6] flex items-center gap-2">
                      <span>🔒 Signal Private Messenger Instructions</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#172535] text-[#90cdf4] border border-black/40 shadow-inner">
                      High Quality / File
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">1</span>
                      <p className="text-[#a0aec0]">In Signal chat, tap the <strong>+ icon</strong> and choose <strong>"File"</strong>.</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">2</span>
                      <p className="text-[#a0aec0]">Select the QuietSend `.png` or `.zip` file from your device storage.</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">3</span>
                      <p className="text-[#a0aec0]">Signal end-to-end encrypts the file without re-compressing pixel channels.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeMessenger === 'discord' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-black/50 border-b-white/5">
                    <span className="font-bold text-[#b39ddb] flex items-center gap-2">
                      <span>🎮 Discord Attachment Instructions</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#241c2d] text-[#d6bcfa] border border-black/40 shadow-inner">
                      ZIP Recommended
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">1</span>
                      <p className="text-[#a0aec0]">Download the <strong>.ZIP</strong> document file from QuietSend.</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">2</span>
                      <p className="text-[#a0aec0]">Upload as regular attachment in DM or private server channel.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeMessenger === 'email' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-black/50 border-b-white/5">
                    <span className="font-bold text-[#a0aec0] flex items-center gap-2">
                      <span>✉️ Email / AirDrop / Cloud Drive</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1c222e] text-[#cbd5e0] border border-black/40 shadow-inner">
                      Direct Attachment
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-lg card-inset">
                      <span className="step-num shrink-0">1</span>
                      <p className="text-[#a0aec0]">Standard email attachments (Gmail, ProtonMail, Outlook) and Apple AirDrop preserve 100% of lossless PNG pixel data without alterations.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-black/60 border-t-white/5 bg-[#121620] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#718096]">
              <Lock size={13} className="text-[#52b788]" />
              <span>QuietSend Client-Side Steganographic Engine</span>
            </div>
            <button
              onClick={() => { soundFx.playClick(); onClose(); }}
              className="btn-primary !px-5 !py-2 !text-xs cursor-pointer"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
