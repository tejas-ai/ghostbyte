import React, { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  Files,
  Image as ImageIcon,
  Lock,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  encodeImage,
  buildGhostFile,
  buildGhostVault,
  calculateCapacity,
  readImageFile,
  generatePassphrase,
  calcEntropy,
  downloadZip,
  getScaledDimensions,
  DEFAULT_DENSITY,
  AES_OVERHEAD_BYTES,
} from '../services/stegaEngine';
import { useRevocableUrl } from '../hooks/useRevocableUrl';
import { useLanguage } from '../contexts/LanguageContext';
import { soundFx } from '../services/soundFx';
import PayloadFootprint from './PayloadFootprint';
import SkeuoSegmentedControl from './SkeuoSegmentedControl';

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

interface Photo {
  src: string;
  name: string;
  w: number;
  h: number;
  size: number;
}

export default function SimpleHide({ onSwitchToPro }: { onSwitchToPro?: () => void }) {
  const { t } = useLanguage();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [drag, setDrag] = useState(false);

  const [kind, setKind] = useState<'message' | 'files'>('message');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<{ name: string; data: Uint8Array }[]>([]);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [acknowledgedNoPassword, setAcknowledgedNoPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const photoInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const trackPhotoUrl = useRevocableUrl();
  const trackResultUrl = useRevocableUrl();

  const loadPhoto = useCallback(async (file: File) => {
    soundFx.playClick();
    setError('');
    if (file.size > 50 * 1024 * 1024) {
      setError(`Carrier image size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 50 MB safety limit.`);
      soundFx.playError();
      return;
    }
    try {
      const { src, w, h } = await readImageFile(file);
      trackPhotoUrl(src);
      setPhoto({ src, name: file.name || 'photo.png', w, h, size: file.size });
      trackResultUrl(null);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.simple_hide.invalid_image);
      soundFx.playError();
    }
  }, [trackPhotoUrl, trackResultUrl, t]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = e.clipboardData?.files?.[0];
      if (f?.type.startsWith('image/')) {
        e.preventDefault();
        loadPhoto(f);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadPhoto]);

  useEffect(() => {
    if (result) {
      const id = setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
      return () => clearTimeout(id);
    }
  }, [result]);

  const addFiles = (list: FileList) => {
    soundFx.playClick();
    const MAX_FILE_SIZE = 30 * 1024 * 1024;
    const MAX_TOTAL = 50 * 1024 * 1024;
    let currentTotal = files.reduce((acc, f) => acc + f.data.length, 0);

    Array.from(list).forEach((f) => {
      if (f.size > MAX_FILE_SIZE) {
        setError(`File "${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 30 MB per-file limit.`);
        soundFx.playError();
        return;
      }
      if (currentTotal + f.size > MAX_TOTAL) {
        setError('Total secret files size would exceed the 50 MB archive limit.');
        soundFx.playError();
        return;
      }
      currentTotal += f.size;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFiles((prev) => [...prev, { name: f.name, data: new Uint8Array(ev.target!.result as ArrayBuffer) }]);
      };
      reader.onerror = () => {
        setError(`Failed to read file "${f.name}". Please re-select the file.`);
        soundFx.playError();
      };
      reader.readAsArrayBuffer(f);
    });
  };

  const secretBytes = useMemo(() => {
    const te = new TextEncoder();
    let framed = 0;
    if (kind === 'message') framed = te.encode(message).length;
    else if (files.length === 1) framed = 18 + te.encode(files[0].name).length + files[0].data.length;
    else if (files.length > 1) framed = files.reduce((s, f) => s + 8 + te.encode(f.name).length + f.data.length, 15);
    return framed > 0 ? framed + (password.trim() ? AES_OVERHEAD_BYTES : 0) : 0;
  }, [kind, message, files, password]);

  const capacity = photo ? calculateCapacity(photo.w, photo.h, DEFAULT_DENSITY) : 0;
  const overCapacity = capacity > 0 && secretBytes > capacity;

  const hasSecret = kind === 'message' ? message.trim().length > 0 : files.length > 0;
  const passwordBits = Math.round(calcEntropy(password));
  const passwordReady = password.trim().length > 0 || acknowledgedNoPassword;
  const canHide = !!photo && hasSecret && passwordReady && !overCapacity && !busy;

  const generate = () => {
    soundFx.playSparkle();
    const next = generatePassphrase();
    setPassword(next);
    setShowPassword(true);
    setAcknowledgedNoPassword(false);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      soundFx.playClick();
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      setError(t.simple_hide.clipboard_error);
    }
  };

  const hide = async () => {
    if (!photo || !canHide) return;
    setBusy(true);
    setError('');
    setStatus(t.simple_hide.button_busy);
    trackResultUrl(null);
    setResult(null);
    soundFx.playScan();

    try {
      const te = new TextEncoder();
      let payload: Uint8Array;
      if (kind === 'message') payload = te.encode(message);
      else if (files.length === 1) payload = buildGhostFile(files[0].name, files[0].data);
      else payload = buildGhostVault(files);

      const url = await encodeImage(
        photo.src,
        payload,
        password.trim() || undefined,
        DEFAULT_DENSITY,
        0,
        (_pct, s) => setStatus(s),
      );
      trackResultUrl(url);
      setResult(url);
      soundFx.playSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while concealing your secret.');
      soundFx.playError();
    } finally {
      setBusy(false);
      setStatus('');
    }
  };

  const reset = () => {
    soundFx.playClick();
    trackResultUrl(null);
    setResult(null);
    setMessage('');
    setFiles([]);
    setPassword('');
    setAcknowledgedNoPassword(false);
  };

  const stepState = (done: boolean, active: boolean) =>
    done ? 'step-done' : active ? 'step-active' : '';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 animate-fade-in">
      {/* ── Step 1: Physical Carrier Plate ────────────────────────────────── */}
      <section
        className={`card p-5 sm:p-6 transition-all ${stepState(!!photo, !photo)}`}
      >
        <header className="mb-4 flex items-center gap-3">
          <span className="step-num">1</span>
          <div>
            <h2 className="display-sm text-[#f7fafc]">{t.simple_hide.step1_title}</h2>
            <p className="text-xs text-[#a0aec0]">
              {t.simple_hide.step1_desc}
            </p>
          </div>
        </header>

        <input
          ref={photoInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff,.tif,.tiff"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) { loadPhoto(f); e.target.value = ''; }
          }}
        />

        {photo ? (
          <div className="space-y-3 animate-fade-in">
            <div className="card-inset flex items-center gap-3.5 p-3">
              <img
                src={photo.src}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover border border-black/60 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{photo.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[#a0aec0]">
                  <span className="rounded bg-[#1c222e] border border-black/40 px-1.5 py-0.5 shadow-inner">
                    {photo.w}×{photo.h}
                  </span>
                  <span>·</span>
                  <span>{fmtBytes(photo.size)}</span>
                  <span>·</span>
                  <span className="font-bold text-[#52b788]">room for {fmtBytes(capacity)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => photoInput.current?.click()}
                className="btn btn-secondary !px-3 !py-1.5 !text-xs cursor-pointer"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  trackPhotoUrl(null);
                  setPhoto(null);
                  trackResultUrl(null);
                  setResult(null);
                }}
                className="btn btn-ghost !p-2 text-[#a0aec0] hover:text-[#e57373]"
                aria-label="Remove photo"
              >
                <X size={16} />
              </button>
            </div>

            <div className="card-inset flex items-start gap-2.5 p-3 text-[11px] leading-relaxed text-[#a0aec0]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#e0a96d]" />
              <span>
                <strong className="text-white">OpSec:</strong> {t.simple_hide.opsec_note}
              </span>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            aria-label={t.simple_hide.dropzone_title}
            className={`dropzone group p-7 text-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 ${drag ? 'drag-over' : ''}`}
            onDragOver={(e: DragEvent) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) loadPhoto(f);
            }}
            onClick={() => photoInput.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                photoInput.current?.click();
              }
            }}
          >
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#a0aec0] shadow-[0_2px_5px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]">
                <ImageIcon size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {t.simple_hide.dropzone_title}
                </p>
                <p className="mt-0.5 text-xs text-[#718096] font-mono">
                  {t.simple_hide.dropzone_hint}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Step 2: Physical Payload Well ─────────────────────────────────── */}
      <section
        className={`card p-5 transition-all sm:p-6 ${stepState(
          hasSecret,
          !!photo && !hasSecret
        )} ${photo ? '' : 'pointer-events-none opacity-40'}`}
        aria-disabled={!photo}
        inert={!photo ? true : undefined}
      >
        <header className="mb-4 flex items-center gap-3">
          <span className="step-num">2</span>
          <div className="flex-1">
            <h2 className="display-sm text-[#f7fafc]">
              {t.simple_hide.step2_title}
            </h2>
            <p className="text-xs text-[#a0aec0]">
              {t.simple_hide.step2_desc}
            </p>
          </div>
        </header>

        {/* Physical Sliding Segmented Rocker Tabs */}
        <div className="mb-3">
          <SkeuoSegmentedControl
            ariaLabel="Payload Type"
            options={[
              { id: 'message', label: t.simple_hide.tab_message, icon: <FileText size={14} />, activeColor: 'green' },
              { id: 'files', label: t.simple_hide.tab_files, icon: <Files size={14} />, activeColor: 'green' },
            ]}
            value={kind}
            onChange={(val) => setKind(val)}
          />
        </div>

        {kind === 'message' ? (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={t.simple_hide.message_placeholder}
            className="field resize-none leading-relaxed"
          />
        ) : (
          <div className="space-y-2">
            <input
              ref={fileInput}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  addFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload payload files or drop documents here"
              className="dropzone p-5 text-center cursor-pointer border-dashed focus-visible:ring-2 focus-visible:ring-emerald-400"
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInput.current?.click();
                }
              }}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onDrop={(e: DragEvent) => {
                e.preventDefault();
                if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
              }}
            >
              <Files size={18} className="mx-auto mb-1 text-[#64b5f6]" />
              <p className="text-xs font-bold text-white">
                {t.simple_hide.files_dropzone_title}
              </p>
              <p className="text-[11px] text-[#718096]">
                {t.simple_hide.files_dropzone_hint}
              </p>
            </div>

            {files.map((f, i) => (
              <div
                key={`${f.name}-${f.data.length}-${i}`}
                className="card-inset flex items-center justify-between gap-2 p-2.5 text-xs animate-fade-in"
              >
                <span className="truncate font-semibold text-white">{f.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="mono text-[#64b5f6]">{fmtBytes(f.data.length)}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((p) => p.filter((_, x) => x !== i))}
                    className="btn btn-ghost !p-1 text-[#718096] hover:text-[#e57373]"
                    aria-label={`Remove ${f.name}`}
                  >
                    <X size={13} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        {photo && hasSecret && (
          <div className="mt-3.5">
            <PayloadFootprint
              src={photo.src}
              width={getScaledDimensions(photo.w, photo.h, 0).w}
              height={getScaledDimensions(photo.w, photo.h, 0).h}
              payloadBytes={secretBytes}
              density={DEFAULT_DENSITY}
            />
          </div>
        )}

        {overCapacity && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-black/60 border-t-red-400/30 bg-[#2d1616] p-3 text-[12px] leading-relaxed text-[#fca5a5] shadow-[var(--shadow-raised-sm)] animate-shake" role="alert">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#e57373]" />
            <span>
              Payload size (<strong>{fmtBytes(secretBytes)}</strong>) exceeds carrier room (<strong>{fmtBytes(capacity)}</strong>). Select a larger photo or{' '}
              <button
                type="button"
                onClick={onSwitchToPro}
                className="font-bold underline underline-offset-2 text-[#64b5f6] hover:text-white cursor-pointer"
              >
                open Pro Workbench
              </button>{' '}
              for higher density.
            </span>
          </div>
        )}
      </section>

      {/* ── Step 3: Physical Passphrase Terminal ───────────────────────────── */}
      <section
        className={`card p-5 transition-all sm:p-6 ${stepState(
          passwordReady,
          hasSecret && !passwordReady
        )} ${hasSecret ? '' : 'pointer-events-none opacity-40'}`}
        aria-disabled={!hasSecret}
        inert={!hasSecret ? true : undefined}
      >
        <header className="mb-4 flex items-center gap-3">
          <span className="step-num">3</span>
          <div>
            <h2 className="display-sm text-[#f7fafc]">
              {t.simple_hide.step3_title}
            </h2>
            <p className="text-xs text-[#a0aec0]">
              {t.simple_hide.step3_desc}
            </p>
          </div>
        </header>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAcknowledgedNoPassword(false);
                }}
                placeholder={t.simple_hide.password_placeholder}
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
            <button
              type="button"
              onClick={generate}
              className="btn btn-secondary shrink-0 !px-3 cursor-pointer"
            >
              <Sparkles size={14} className="text-[#e0a96d]" />
              <span className="hidden sm:inline">{t.simple_hide.generate_btn}</span>
            </button>
          </div>

          {password && (
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-[#718096]">Entropy:</span>
                <span
                  className="font-bold"
                  style={{
                    color:
                      passwordBits >= 60
                        ? '#52b788'
                        : passwordBits >= 40
                        ? '#e0a96d'
                        : '#e57373',
                  }}
                >
                  {passwordBits >= 60
                    ? t.encoder?.entropy_strong || 'Strong'
                    : passwordBits >= 40
                    ? t.encoder?.entropy_medium || 'Moderate'
                    : t.encoder?.entropy_weak || 'Weak'}
                </span>
                <span className="text-[#718096]">({passwordBits} bits)</span>
              </div>
              <button
                type="button"
                onClick={copyPassword}
                className="btn btn-ghost !px-2.5 !py-1 !text-[11px] font-mono text-[#a0aec0] hover:text-white cursor-pointer"
              >
                {copiedPassword ? (
                  <Check size={12} className="text-[#52b788]" />
                ) : (
                  <Copy size={12} />
                )}
                <span>{copiedPassword ? t.simple_hide.copied_btn : t.simple_hide.copy_btn}</span>
              </button>
            </div>
          )}

          {password ? (
            <div className="card-inset flex items-start gap-2.5 p-3 text-[11px] leading-relaxed text-[#a0aec0]">
              <Lock size={14} className="mt-0.5 shrink-0 text-[#52b788]" />
              <span>
                <strong className="text-white">Zero-Knowledge:</strong> {t.simple_hide.zero_knowledge_note}
              </span>
            </div>
          ) : (
            <label
              className="card-inset flex cursor-pointer items-start gap-3 p-3 text-[12px] leading-relaxed text-[#e0a96d]"
            >
              <input
                type="checkbox"
                checked={acknowledgedNoPassword}
                onChange={(e) => setAcknowledgedNoPassword(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#e0a96d] cursor-pointer"
              />
              <span>
                {t.simple_hide.no_password_warning}
              </span>
            </label>
          )}
        </div>
      </section>

      {error && (
        <div className="animate-shake flex items-start gap-2.5 rounded-xl border border-black/60 border-t-red-400/30 bg-[#2d1616] p-3.5 text-[13px] leading-relaxed text-[#fee2e2] shadow-[var(--shadow-raised-sm)]" role="alert" aria-live="polite">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#e57373]" />
          <span>{error}</span>
        </div>
      )}

      {/* Physical Main Push Action Button */}
      <button
        type="button"
        onClick={hide}
        disabled={!canHide}
        className="btn-primary w-full !py-3.5 !text-base cursor-pointer"
      >
        {busy ? (
          <span className="flex items-center justify-center gap-2" role="status" aria-live="polite">
            <RefreshCw size={17} className="animate-spin" />
            <span>{status || t.simple_hide.button_busy}</span>
          </span>
        ) : (
          <>
            <Lock size={17} />
            <span>{t.simple_hide.button_hide}</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>

      {/* ── Result: Physical Output Module ─────────────────────────────────── */}
      {result && photo && (
        <section
          ref={resultRef}
          className="card animate-rise scroll-mt-6 p-5 sm:p-6"
        >
          <header className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/60 border-t-white/30 bg-gradient-to-b from-[#52b788] to-[#388a62] text-[#071a10] shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
              <Check size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="display-sm text-[#f7fafc]">{t.simple_hide.export_ready_title}</h2>
              <p className="text-xs text-[#a0aec0]">
                {t.simple_hide.export_ready_desc}
              </p>
            </div>
          </header>

          <div className="card-inset mb-4 overflow-hidden p-2">
            <img
              src={result}
              alt="Steganographic carrier output"
              className="max-h-72 w-full object-contain rounded"
            />
          </div>

          <div className="card-inset mb-4 p-3.5 text-[12px] leading-relaxed text-[#a0aec0]">
            <p className="mb-1 font-bold text-[#e0a96d] flex items-center gap-1.5">
              <AlertTriangle size={14} />
              {t.simple_hide.zip_note_title}
            </p>
            <p>
              {t.simple_hide.zip_note_desc}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => downloadZip(result, 'quietsend-carrier.zip')}
              className="btn-primary w-full !py-3 cursor-pointer"
            >
              <Download size={16} />
              <span>{t.simple_hide.download_zip}</span>
            </button>
            <a
              href={result}
              download="quietsend-carrier.png"
              onClick={() => soundFx.playClick()}
              className="btn btn-secondary w-full !py-2.5 cursor-pointer text-xs font-bold"
            >
              <Download size={15} />
              <span>{t.simple_hide.download_png}</span>
            </a>
            <button
              type="button"
              onClick={reset}
              className="btn btn-ghost w-full !text-xs text-[#718096] hover:text-white cursor-pointer"
            >
              {t.simple_hide.reset_btn}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
