import React, { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileDown,
  Inbox,
  KeyRound,
  RefreshCw,
  Unlock,
  X,
  FileText,
  Package,
} from 'lucide-react';
import {
  decodeImage,
  downloadBlob,
  readImageFile,
  unpackPayload,
  openContainer,
  type DecodeResult,
} from '../services/stegaEngine';
import { decodeWavAudio, parseWavHeader } from '../services/audioStegaEngine';
import { isAsymmetricPayload, decryptWithPrivateKey, getStoredKeyring } from '../services/asymmetricCrypto';
import { useRevocableUrl } from '../hooks/useRevocableUrl';
import { useLanguage } from '../contexts/LanguageContext';
import { soundFx } from '../services/soundFx';

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

export default function SimpleReveal() {
  const { t } = useLanguage();
  const [src, setSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [audioBuffer, setAudioBuffer] = useState<ArrayBuffer | null>(null);
  const [drag, setDrag] = useState(false);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [hasKeyring, setHasKeyring] = useState(false);
  useEffect(() => {
    setHasKeyring(getStoredKeyring().length > 0);
  }, []);

  const input = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const trackUrl = useRevocableUrl();

  const load = useCallback(
    async (file: File) => {
      soundFx.playClick();
      setError('');
      setResult(null);

      const isAudio = file.name.toLowerCase().endsWith('.wav') || file.type.includes('audio');
      if (isAudio && file.size > 100 * 1024 * 1024) {
        setError(`Carrier audio file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 100 MB safety limit.`);
        soundFx.playError();
        return;
      }
      if (!isAudio && file.size > 50 * 1024 * 1024) {
        setError(`Carrier image size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB safety limit.`);
        soundFx.playError();
        return;
      }

      try {
        if (isAudio) {
          const buf = await file.arrayBuffer();
          parseWavHeader(buf);
          const url = URL.createObjectURL(file);
          trackUrl(url);
          setAudioBuffer(buf);
          setSrc(url);
        } else {
          const { src: url } = await readImageFile(file);
          trackUrl(url);
          setAudioBuffer(null);
          setSrc(url);
        }
        setFileName(file.name || 'received-file');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'That file could not be opened.');
        soundFx.playError();
      }
    },
    [trackUrl]
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = e.clipboardData?.files?.[0];
      if (f?.type.startsWith('image/')) {
        e.preventDefault();
        load(f);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [load]);

  useEffect(() => {
    if (result) {
      const id = setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
      return () => clearTimeout(id);
    }
  }, [result]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const reveal = async () => {
    if (!src && !audioBuffer) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setBusy(true);
    setError('');
    setResult(null);
    setStatus(t.simple_reveal.button_busy);
    soundFx.playScan();

    const secret = password.trim() || undefined;

    try {
      let out: DecodeResult;

      if (audioBuffer) {
        const raw = await decodeWavAudio(audioBuffer, 2, (_p, s) => setStatus(s));
        if (controller.signal.aborted) throw new Error('Extraction cancelled by user.');

        if (isAsymmetricPayload(raw)) {
          const key = getStoredKeyring()[0];
          if (!key) throw new Error('This envelope was locked to an ECDH personal key not present in this browser.');
          out = unpackPayload(await decryptWithPrivateKey(raw, key.privateKeyArmor));
          out.isAsymmetric = true;
        } else if (secret) {
          try {
            out = await openContainer(raw, secret, undefined, controller.signal);
          } catch (err) {
            if (controller.signal.aborted) throw err;
            const plain = unpackPayload(raw);
            if (plain.type === 'binary') throw err;
            out = plain;
          }
        } else {
          out = unpackPayload(raw);
        }
      } else {
        const key = getStoredKeyring()[0];
        const effectiveSecret = secret || (key ? key.privateKeyArmor : undefined);
        out = await decodeImage(src!, effectiveSecret, (_p, s) => setStatus(s), controller.signal);
      }

      setResult(out);
      soundFx.playSuccess();
    } catch (e) {
      if (controller.signal.aborted) {
        setError('Extraction cancelled.');
        soundFx.playClick();
        return;
      }
      const raw = e instanceof Error ? e.message : '';
      if (/passphrase|decrypt|incorrect/i.test(raw)) {
        setError(
          password.trim()
            ? t.simple_reveal.auth_failed
            : t.simple_reveal.encrypted_prompt
        );
      } else if (/no valid|not.*detected|payload/i.test(raw)) {
        setError(
          t.simple_reveal.no_payload
        );
      } else {
        setError(raw || 'Failed to extract payload from carrier.');
      }
      soundFx.playError();
    } finally {
      setBusy(false);
      setStatus('');
      abortControllerRef.current = null;
    }
  };

  const copyText = (content: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const clear = () => {
    soundFx.playClick();
    trackUrl(null);
    setSrc(null);
    setAudioBuffer(null);
    setFileName('');
    setResult(null);
    setError('');
    setPassword('');
  };

  return (
    <div className="space-y-4">
      {/* ── Step 1: Carrier Dropzone ────────────────────────────────────────── */}
      <section className="card p-5 sm:p-6">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="step-num step-num-blue">1</span>
            <div>
              <h2 className="display-sm text-[#f7fafc]">
                {t.simple_reveal.step1_title}
              </h2>
              <p className="text-xs text-[#a0aec0]">
                {t.simple_reveal.step1_desc}
              </p>
            </div>
          </div>
        </header>

        <input
          ref={input}
          type="file"
          accept="image/*,audio/wav,.zip"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) load(f);
            e.target.value = '';
          }}
        />

        {src ? (
          <div className="card-inset flex items-center justify-between gap-3 p-3 animate-fade-in">
            <div className="flex min-w-0 items-center gap-3">
              {audioBuffer ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#162a3d] text-[#64b5f6]">
                  <Inbox size={20} />
                </div>
              ) : (
                <img
                  src={src}
                  alt="Carrier preview"
                  className="h-10 w-10 shrink-0 rounded-lg object-cover border border-black/40"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{fileName}</p>
                <p className="text-[11px] text-[#52b788] font-mono">{t.simple_reveal.carrier_ingested}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="btn btn-secondary !px-3 !py-1.5 !text-xs cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              onClick={clear}
              className="btn btn-ghost !p-2 text-[#a0aec0] hover:text-[#e57373]"
              aria-label="Remove carrier"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            aria-label={t.simple_reveal.dropzone_title}
            className={`dropzone group p-7 text-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 ${drag ? 'drag-over' : ''}`}
            onDragOver={(e: DragEvent) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) load(f);
            }}
            onClick={() => input.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                input.current?.click();
              }
            }}
          >
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#a0aec0] shadow-[0_2px_5px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]">
                <Inbox size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {t.simple_reveal.dropzone_title}
                </p>
                <p className="mt-0.5 text-xs text-[#718096] font-mono">
                  {t.simple_reveal.dropzone_hint}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Step 2: Decryption Key Input ─────────────────────────────────── */}
      <section
        className={`card p-5 transition-all sm:p-6 ${src ? '' : 'pointer-events-none opacity-40'}`}
        aria-disabled={!src}
        inert={!src ? true : undefined}
      >
        <header className="mb-4 flex items-center gap-3">
          <span className="step-num step-num-blue">2</span>
          <div>
            <h2 className="display-sm text-[#f7fafc]">
              {t.simple_reveal.step2_title}
            </h2>
            <p className="text-xs text-[#a0aec0]">
              {t.simple_reveal.step2_desc}
            </p>
          </div>
        </header>

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && src) reveal();
            }}
            placeholder={t.simple_reveal.password_placeholder}
            className="field field-mono pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 btn btn-ghost !p-1.5 text-[#718096] hover:text-white"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {hasKeyring && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-[#b39ddb]">
            <KeyRound size={13} className="text-[#b39ddb]" />
            <span>ECDH Keyring Active: Messages bound to your personal public key will unlock automatically.</span>
          </p>
        )}
      </section>

      {error && (
        <div className="animate-shake flex items-start gap-2.5 rounded-xl border border-black/60 border-t-red-400/30 bg-[#2d1616] p-3.5 text-[13px] leading-relaxed text-[#fee2e2] shadow-[var(--shadow-raised-sm)]" role="alert" aria-live="polite">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#e57373]" />
          <span>{error}</span>
        </div>
      )}

      {/* Physical Main Push Action Button in Electric Azure with Cancel support */}
      {busy ? (
        <div className="flex gap-2 w-full">
          <button
            type="button"
            disabled
            className="btn-azure flex-1 !py-3.5 !text-sm sm:!text-base cursor-not-allowed opacity-90"
          >
            <span className="flex items-center justify-center gap-2" role="status" aria-live="polite">
              <RefreshCw size={17} className="animate-spin shrink-0" />
              <span className="truncate">{status || t.simple_reveal.button_busy}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              abortControllerRef.current?.abort();
            }}
            className="btn btn-secondary !px-4 !py-3.5 !text-xs font-bold text-red-400 hover:text-red-300 hover:border-red-400/40 cursor-pointer shrink-0"
            aria-label="Cancel extraction"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={reveal}
          disabled={!src && !audioBuffer}
          className="btn-azure w-full !py-3.5 !text-base cursor-pointer"
        >
          <Unlock size={17} />
          <span>{t.simple_reveal.button_reveal}</span>
          <ArrowRight size={16} />
        </button>
      )}

      {/* ── Result: Physical Output Console ────────────────────────────────── */}
      {result && (
        <section
          ref={resultRef}
          className="card animate-rise scroll-mt-6 p-5 sm:p-6"
        >
          <header className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/60 border-t-white/30 bg-gradient-to-b from-[#52b788] to-[#388a62] text-[#071a10] shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
              <Check size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="display-sm text-[#f7fafc]">{t.simple_reveal.success_title}</h2>
              {result.isDecoy && (
                <p className="text-[12px] font-bold text-[#e0a96d]">
                  {t.simple_reveal.decoy_badge}
                </p>
              )}
            </div>
          </header>

          {result.isAsymmetric && (
            <div className="card-inset mb-4 flex items-start gap-2.5 p-3.5 text-xs leading-relaxed text-[#cbd5e1]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#e0a96d]" />
              <span>
                <strong className="text-white">Sender Attribution Notice:</strong> This payload was decrypted with your recipient key and its data integrity is verified, but QuietSend asymmetric envelopes do <em>not</em> contain a digital signature. Anyone holding your public key could have created this payload.
              </span>
            </div>
          )}

          {result.type === 'text' && (
            <div className="space-y-3">
              <div
                className="card-inset max-h-80 overflow-y-auto p-3.5 text-sm leading-relaxed text-[#e2e8f0] font-mono"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {result.content || <span className="text-[#718096]">(Empty message)</span>}
              </div>
              <button
                type="button"
                onClick={() => copyText(result.content)}
                className="btn btn-secondary w-full !py-2 cursor-pointer font-bold"
              >
                {copied ? <Check size={14} className="text-[#52b788]" /> : <Copy size={14} />}
                <span>{copied ? t.simple_reveal.copied : t.simple_reveal.copy_message}</span>
              </button>
            </div>
          )}

          {result.type === 'file' && (
            <div className="card-inset flex items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-black/50 bg-[#1f2633] text-[#64b5f6]">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{result.name}</p>
                  <p className="mono text-[11px] text-[#718096]">{fmtBytes(result.data.length)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadBlob(result.data, result.name)}
                className="btn-primary shrink-0 !px-3.5 !py-1.5 !text-xs cursor-pointer"
              >
                <Download size={13} />
                <span>Save File</span>
              </button>
            </div>
          )}

          {result.type === 'vault' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#64b5f6] font-bold">
                <span className="flex items-center gap-2">
                  <Package size={14} />
                  <span>GhostVault Multi-File Archive ({result.files.length} files)</span>
                </span>
                <button
                  type="button"
                  onClick={() => downloadBlob(result.files[0].data, `${result.files.length}-files.zip`)}
                  className="btn btn-secondary !py-1 !px-2.5 !text-xs cursor-pointer font-bold"
                >
                  <Download size={12} />
                  <span>{t.simple_reveal.download_all}</span>
                </button>
              </div>
              {result.files.map((f, i) => (
                <div
                  key={`${f.name}-${f.data.length}-${i}`}
                  className="card-inset flex items-center justify-between gap-3 p-3 animate-fade-in"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{f.name}</p>
                    <p className="mono text-[11px] text-[#718096]">{fmtBytes(f.data.length)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadBlob(f.data, f.name)}
                    className="btn btn-secondary shrink-0 !px-3 !py-1.5 !text-xs cursor-pointer font-bold"
                  >
                    <Download size={13} />
                    <span>Save</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {result.type === 'binary' && (
            <div className="space-y-3">
              <div className="card-inset p-3.5 text-[12px] leading-relaxed text-[#a0aec0]">
                <p className="mb-1 font-bold text-[#e0a96d]">Encrypted Stream Extracted</p>
                <p>Enter the correct password above to decrypt and parse the inner files.</p>
              </div>
              <button
                type="button"
                onClick={() => downloadBlob(result.data, 'locked-payload.bin')}
                className="btn btn-secondary w-full !text-xs cursor-pointer"
              >
                <Download size={14} />
                <span>Save Encrypted Binary Stream ({fmtBytes(result.data.length)})</span>
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
