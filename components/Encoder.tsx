import React, { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
import {
  Lock,
  Download,
  FileText,
  Files,
  File as FileIcon,
  AlertTriangle,
  Upload,
  Eye,
  EyeOff,
  RotateCcw,
  RefreshCw,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Zap,
  Shield,
  Copy,
  Check,
  ClipboardPaste,
  Key,
  Music,
  Share2,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  encodeImage,
  buildGhostVault,
  buildGhostFile,
  calculateCapacity,
  generatePassphrase,
  calcEntropy,
  readImageFile,
  calcSha256,
  getScaledDimensions,
  downloadZip,
  type CapacityDensity,
} from '../services/stegaEngine';
import {
  encryptWithPublicKey,
  getStoredContacts,
  getStoredKeyring,
  type ContactPublicKey,
} from '../services/asymmetricCrypto';
import {
  parseWavHeader,
  calculateAudioCapacity,
  encodeWavAudio,
  type WavHeaderInfo,
} from '../services/audioStegaEngine';
import { soundFx } from '../services/soundFx';

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

function EntropyBar({ pass }: { pass: string }) {
  const { t } = useLanguage();
  const bits = calcEntropy(pass);
  const level = bits === 0 ? 'none' : bits < 50 ? 'weak' : bits < 90 ? 'medium' : 'strong';
  const pct = Math.min(100, (bits / 128) * 100);
  const colors = { none: 'transparent', weak: '#f87171', medium: '#fbbf24', strong: '#34d399' };
  const labels = {
    none: '',
    weak: t.encoder.entropy_weak || 'Weak',
    medium: t.encoder.entropy_medium || 'Medium',
    strong: t.encoder.entropy_strong || 'Strong'
  };

  if (!pass) return null;

  return (
    <div className="space-y-1.5 mt-2 animate-fade-in">
      <div className="flex justify-between items-center text-xs">
        <span className="font-mono text-slate-300 text-[11px] font-bold">
          {t.encoder.entropy_label || 'Entropy Rating'}
        </span>
        <span
          className="font-mono font-bold text-xs"
          style={{ color: colors[level] }}
        >
          {labels[level]} ({Math.round(bits)} bits)
        </span>
      </div>
      <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/15">
        <div
          className="h-full rounded-full transition-all duration-300 shadow-sm"
          style={{
            width: `${pct}%`,
            background: level === 'strong'
              ? 'linear-gradient(90deg, #10b981, #06b6d4)'
              : level === 'medium'
              ? 'linear-gradient(90deg, #f59e0b, #eab308)'
              : 'linear-gradient(90deg, #ef4444, #f43f5e)',
          }}
        />
      </div>
    </div>
  );
}

interface CarrierImageInfo {
  src: string;
  name: string;
  w: number;
  h: number;
  size: number;
}

interface CarrierAudioInfo {
  buffer: ArrayBuffer;
  name: string;
  size: number;
  durationSec: number;
  capacity: number;
  sampleRate: number;
  channels: number;
  previewUrl: string;
}

interface EncoderProps {
  onOpenGuide?: () => void;
  onOpenKeyring?: () => void;
}

export default function Encoder({ onOpenGuide, onOpenKeyring }: EncoderProps) {
  const { t } = useLanguage();

  // Carrier Media Type
  const [carrierType, setCarrierType] = useState<'image' | 'audio'>('image');

  // Image Carrier State
  const [carrier, setCarrier] = useState<CarrierImageInfo | null>(null);
  const [carrierDrag, setCarrierDrag] = useState(false);
  const [density, setDensity] = useState<CapacityDensity>('lsb6');
  const [maxDimension] = useState<number>(0);

  // Audio Carrier State
  const [audioCarrier, setAudioCarrier] = useState<CarrierAudioInfo | null>(null);
  const [audioDrag, setAudioDrag] = useState(false);

  // Payload Type & Data
  const [mode, setMode] = useState<'text' | 'files'>('text');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<{ name: string; data: Uint8Array }[]>([]);
  const [filesDrag, setFilesDrag] = useState(false);

  // Cryptographic Security Mode
  const [secMode, setSecMode] = useState<'passphrase' | 'asymmetric'>('passphrase');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Asymmetric Recipient Mode
  const [contacts, setContacts] = useState<ContactPublicKey[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [customPublicArmor, setCustomPublicArmor] = useState<string>('');

  // Processing & Results
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; status: string } | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'image' | 'audio'>('image');
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [resultHash, setResultHash] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);

  const carrierInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [result]);

  useEffect(() => {
    setContacts(getStoredContacts());
  }, []);

  useEffect(() => {
    return () => {
      if (result && result.startsWith('blob:')) {
        URL.revokeObjectURL(result);
      }
      if (carrier?.src && carrier.src.startsWith('blob:')) {
        URL.revokeObjectURL(carrier.src);
      }
      if (audioCarrier?.previewUrl && audioCarrier.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioCarrier.previewUrl);
      }
    };
  }, [result, carrier, audioCarrier]);

  const loadCarrier = useCallback(async (file: File) => {
    soundFx.playClick();
    try {
      if (carrier?.src && carrier.src.startsWith('blob:')) {
        URL.revokeObjectURL(carrier.src);
      }
      const { src, w, h } = await readImageFile(file);
      setCarrier({
        src,
        name: file.name || 'clipboard-image.png',
        w,
        h,
        size: file.size,
      });
      setResult(null);
      setResultFile(null);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to parse image data. Please select a valid PNG, JPG, WebP, or BMP image.');
      soundFx.playError();
    }
  }, [carrier]);

  const loadAudioCarrier = useCallback(async (file: File) => {
    soundFx.playClick();
    try {
      if (audioCarrier?.previewUrl && audioCarrier.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioCarrier.previewUrl);
      }
      const buffer = await file.arrayBuffer();
      const { header } = parseWavHeader(buffer);
      const cap = calculateAudioCapacity(buffer, 2);
      const durationSec = header.totalSamples / header.sampleRate / header.numChannels;
      const previewUrl = URL.createObjectURL(file);

      setAudioCarrier({
        buffer,
        name: file.name || 'audio-carrier.wav',
        size: file.size,
        durationSec,
        capacity: cap,
        sampleRate: header.sampleRate,
        channels: header.numChannels,
        previewUrl,
      });
      setResult(null);
      setResultFile(null);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to parse WAV audio. Ensure you select an uncompressed 16-bit PCM .wav file.');
      soundFx.playError();
    }
  }, [audioCarrier]);

  /** 1-Click Interactive 30-Second Test Drive Generator */
  const handleQuickTestDrive = useCallback(async () => {
    soundFx.playClick();
    setCarrierType('image');
    setMode('text');
    setText('QuietSend Enclave Verification — This secret message is imperceptibly hidden inside this carrier photo using AES-GCM-256 (600k PBKDF2 iterations).');
    setPass('enclave-demo-2026');
    setConfirmPass('enclave-demo-2026');
    setError('');

    // Generate lightweight synthetic 800x600 dark tech canvas carrier
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    // Draw rich gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, '#0a1128');
    grad.addColorStop(0.5, '#001f54');
    grad.addColorStop(1, '#034078');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Draw geometric visual accents
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(400, 300, 150, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(50, 50, 700, 500);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'quietsend-sample-cover.png', { type: 'image/png' });
        loadCarrier(file);
      }
    }, 'image/png');
  }, [loadCarrier]);

  // Direct Clipboard (Ctrl + V) Image Ingestion
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const item = e.clipboardData.files[0];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          setCarrierType('image');
          loadCarrier(item);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadCarrier]);

  const onCarrierDrop = (e: DragEvent) => {
    e.preventDefault();
    setCarrierDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      if (f.name.toLowerCase().endsWith('.wav') || f.type.includes('audio')) {
        setCarrierType('audio');
        loadAudioCarrier(f);
      } else {
        loadCarrier(f);
      }
    }
  };

  const onCarrierChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      loadCarrier(f);
      e.target.value = '';
    }
  };

  const onAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      loadAudioCarrier(f);
      e.target.value = '';
    }
  };

  const clearCarrier = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    if (carrier?.src && carrier.src.startsWith('blob:')) {
      URL.revokeObjectURL(carrier.src);
    }
    setCarrier(null);
    setResult(null);
    setResultFile(null);
    setError('');
  };

  const clearAudioCarrier = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    if (audioCarrier?.previewUrl && audioCarrier.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioCarrier.previewUrl);
    }
    setAudioCarrier(null);
    setResult(null);
    setResultFile(null);
    setError('');
  };

  const loadSecretFiles = (fl: FileList) => {
    soundFx.playClick();
    Array.from(fl).forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        setFiles((prev) => [...prev, { name: f.name, data }]);
      };
      reader.readAsArrayBuffer(f);
    });
  };

  const onFilesDrop = (e: DragEvent) => {
    e.preventDefault();
    setFilesDrag(false);
    if (e.dataTransfer.files.length) loadSecretFiles(e.dataTransfer.files);
  };

  const onFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      loadSecretFiles(e.target.files);
      e.target.value = '';
    }
  };

  const payloadBytes = useCallback((): number => {
    if (mode === 'text') return new TextEncoder().encode(text).length;
    return files.reduce((s, f) => s + f.data.length + f.name.length + 8, files.length ? 15 : 0);
  }, [mode, text, files]);

  const scaledDim = carrier ? getScaledDimensions(carrier.w, carrier.h, maxDimension) : { w: 0, h: 0 };
  const currentCap = carrierType === 'image'
    ? (carrier ? calculateCapacity(scaledDim.w, scaledDim.h, density) : 0)
    : (audioCarrier ? audioCarrier.capacity : 0);

  const isOverCapacity = currentCap > 0 ? payloadBytes() > currentCap : false;
  const usedPct = currentCap > 0 ? Math.min(100, (payloadBytes() / currentCap) * 100) : 0;

  const handleGeneratePass = () => {
    soundFx.playClick();
    setPass(generatePassphrase());
  };

  const handleDownloadZip = async () => {
    if (!result) return;
    soundFx.playClick();
    await downloadZip(result, 'quietsend-document.zip');
  };

  const encode = async () => {
    if (carrierType === 'image' && !carrier) {
      setError('Please select a cover image first.');
      return;
    }
    if (carrierType === 'audio' && !audioCarrier) {
      setError('Please select a cover WAV audio file first.');
      return;
    }
    if (isOverCapacity) {
      setError('Payload exceeds carrier capacity. Switch to Max Capacity density or select a larger carrier.');
      return;
    }

    if (secMode === 'passphrase' && pass.trim().length > 0 && pass !== confirmPass) {
      setError('Passphrase confirmation does not match. Please verify your password to prevent accidental typo lockouts.');
      soundFx.playError();
      return;
    }

    // Determine recipient armor if in asymmetric mode
    let targetPublicArmor = '';
    if (secMode === 'asymmetric') {
      if (selectedContactId) {
        const contact = contacts.find((c) => c.id === selectedContactId);
        if (contact) targetPublicArmor = contact.publicKeyArmor;
      }
      if (!targetPublicArmor && customPublicArmor.trim()) {
        targetPublicArmor = customPublicArmor.trim();
      }
      if (!targetPublicArmor) {
        // Fallback: check if local identity exists
        const keyring = getStoredKeyring();
        if (keyring.length > 0) {
          targetPublicArmor = keyring[0].publicKeyArmor;
        } else {
          setError('Please select a contact public key or paste an armored public key block.');
          return;
        }
      }
    }

    setLoading(true);
    setProgress({ pct: 5, status: 'Initializing cryptographic pipeline...' });
    setError('');
    setResult(null);
    setResultFile(null);
    setResultHash('');
    soundFx.playScan();

    try {
      let rawPayload: Uint8Array;
      if (mode === 'text') {
        rawPayload = new TextEncoder().encode(text);
      } else if (files.length === 1) {
        rawPayload = buildGhostFile(files[0].name, files[0].data);
      } else {
        rawPayload = buildGhostVault(files);
      }

      const hash = await calcSha256(rawPayload);
      setResultHash(hash);

      // Handle Asymmetric vs Symmetric encryption
      let finalPayload = rawPayload;
      if (secMode === 'asymmetric') {
        setProgress({ pct: 20, status: 'Deriving ECDH P-256 ephemeral keys...' });
        finalPayload = await encryptWithPublicKey(rawPayload, targetPublicArmor);
      }

      if (carrierType === 'audio' && audioCarrier) {
        setResultType('audio');
        // If symmetric password provided and not asymmetric
        if (secMode === 'passphrase' && pass.trim()) {
          // Encrypt payload with AES-GCM-256 before audio embedding
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const pwBytes = new TextEncoder().encode(pass);
          const keyMaterial = await crypto.subtle.importKey('raw', pwBytes, 'PBKDF2', false, ['deriveKey']);
          const key = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
          );
          const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, rawPayload);
          const wire = new Uint8Array(16 + 12 + ct.byteLength);
          wire.set(salt, 0);
          wire.set(iv, 16);
          wire.set(new Uint8Array(ct), 28);
          finalPayload = wire;
        }

        const audioBlob = await encodeWavAudio(
          audioCarrier.buffer,
          finalPayload,
          2,
          (pct, status) => setProgress({ pct, status })
        );
        const url = URL.createObjectURL(audioBlob);
        setResult(url);
        setResultFile(new File([audioBlob], 'quietsend-audio.wav', { type: 'audio/wav' }));
      } else if (carrier) {
        setResultType('image');
        const url = await encodeImage(
          carrier.src,
          finalPayload,
          secMode === 'passphrase' ? (pass.trim() || undefined) : undefined,
          density,
          maxDimension,
          (pct, status) => setProgress({ pct, status })
        );
        setResult(url);

        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          setResultFile(new File([blob], 'quietsend-document.png', { type: 'image/png' }));
        } catch {
          // ignore
        }
      }

      soundFx.playSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Encoding failed.');
      soundFx.playError();
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const copyHash = () => {
    if (!resultHash) return;
    soundFx.playClick();
    navigator.clipboard.writeText(resultHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="glass-3d-blue p-6 sm:p-8 space-y-6">
        {/* Header Title & Spec */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.1]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-pill-3d text-cyan-300 text-[11px] font-mono font-bold mb-2">
              <Lock size={12} className="text-cyan-400" />
              <span>AES-256-GCM · {secMode === 'asymmetric' ? 'ECDH P-256 Public Key' : 'PBKDF2 (600k)'} · {carrierType === 'audio' ? 'WAV Audio LSB' : 'LSB-6 Stealth'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              {t.encoder.title || 'Embed Encrypted Payload'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-medium">
              {t.encoder.desc || 'Conceal secret messages or files inside cover images or audio tracks with authenticated encryption.'}
            </p>
          </div>

          {(carrier || audioCarrier) && (
            <div className="p-4 rounded-xl glass-3d min-w-[220px] space-y-2 border-cyan-400/30">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-300 font-bold uppercase">{t.encoder.capacity || 'Carrier Capacity'}</span>
                <span className={`font-black ${isOverCapacity ? 'text-red-400' : 'text-cyan-400'}`}>
                  {usedPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverCapacity
                      ? 'bg-gradient-to-r from-red-500 to-pink-500'
                      : usedPct > 80
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                      : 'bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, usedPct)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{fmtBytes(payloadBytes())}</span>
                <span>Max {fmtBytes(currentCap)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Interactive Test-Drive Tour Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 via-cyan-950/40 to-indigo-950/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>30-Second Interactive Test Drive</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/30 text-cyan-200 border border-cyan-400/30">1-Click Demo</span>
              </p>
              <p className="text-[11px] text-slate-300">Test how data is imperceptibly hidden inside digital photos without configuring files.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickTestDrive}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-md"
          >
            Launch Test Drive
          </button>
        </div>

        {/* Carrier Medium Selector (Image vs Audio) */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-black/50 border border-white/10">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setCarrierType('image');
              setResult(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              carrierType === 'image'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon size={15} />
            <span>Image Carrier (PNG / TIFF / WebP)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setCarrierType('audio');
              setResult(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              carrierType === 'audio'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music size={15} />
            <span>Audio Carrier (16-bit PCM WAV)</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Step 1 — Carrier Selection Dropzone */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                <span className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  1
                </span>
                <span>{carrierType === 'image' ? (t.encoder.step1 || 'Cover Photo Ingestion') : 'Cover Audio Ingestion'}</span>
              </div>
              {carrierType === 'image' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  <ClipboardPaste size={12} />
                  <span>Ctrl + V to paste image</span>
                </span>
              )}
            </div>

            {/* Hidden Native File Inputs */}
            <input
              ref={carrierInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff,image/tif,.tif,.tiff,.zip"
              className="hidden"
              onChange={onCarrierChange}
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/wav,audio/x-wav,.wav"
              className="hidden"
              onChange={onAudioChange}
            />

            {/* Image Carrier Dropzone */}
            {carrierType === 'image' && (
              carrier ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl glass-3d flex flex-col sm:flex-row items-center justify-between gap-4 border-cyan-400/40">
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <img
                        src={carrier.src}
                        alt="Carrier Preview"
                        className="w-16 h-16 rounded-lg object-cover border border-white/20 shrink-0 bg-black"
                      />
                      <div className="truncate text-xs font-mono space-y-1">
                        <p className="font-bold text-white truncate max-w-[240px] sm:max-w-xs">{carrier.name}</p>
                        <p className="text-[11px] text-cyan-300">{carrier.w} × {carrier.h} px · {fmtBytes(carrier.size)}</p>
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Shield size={10} /> EXIF & GPS Scrubbed
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Lossless RGBA Canvas
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => carrierInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Change Cover
                      </button>
                      <button
                        type="button"
                        onClick={clearCarrier}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Carrier Provenance Security Notice */}
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-[11px] text-amber-200/90 leading-relaxed">
                    <AlertTriangle size={14} className="shrink-0 text-amber-400 mt-0.5" />
                    <span>
                      <strong className="text-amber-300">Carrier Provenance Notice:</strong> Use private, unposted photos. Publicly accessible stock photos enable differential pixel comparison (<code className="text-amber-200">I_stego - I_orig</code>) that immediately proves a payload exists.
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`dropzone-3d p-8 text-center transition-all ${carrierDrag ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setCarrierDrag(true); }}
                  onDragLeave={() => setCarrierDrag(false)}
                  onDrop={onCarrierDrop}
                  onClick={() => carrierInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-md">
                      <ImageIcon size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Drop your cover image here, or click to browse</p>
                      <p className="text-xs text-slate-400">Supports PNG, JPG, WebP, BMP, and TIFF (Converted Losslessly)</p>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Audio Carrier Dropzone */}
            {carrierType === 'audio' && (
              audioCarrier ? (
                <div className="p-4 rounded-xl glass-3d flex flex-col sm:flex-row items-center justify-between gap-4 border-purple-400/40">
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-14 h-14 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                      <Music size={24} />
                    </div>
                    <div className="truncate text-xs font-mono space-y-1">
                      <p className="font-bold text-white truncate max-w-[240px] sm:max-w-xs">{audioCarrier.name}</p>
                      <p className="text-[11px] text-purple-300">
                        {audioCarrier.sampleRate.toLocaleString()} Hz · {audioCarrier.durationSec.toFixed(1)}s · {fmtBytes(audioCarrier.size)}
                      </p>
                      <audio src={audioCarrier.previewUrl} controls className="h-6 mt-1 w-48 max-w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Change Audio
                    </button>
                    <button
                      type="button"
                      onClick={clearAudioCarrier}
                      className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                      title="Remove audio"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`dropzone-3d p-8 text-center transition-all ${audioDrag ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setAudioDrag(true); }}
                  onDragLeave={() => setAudioDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setAudioDrag(false);
                    const f = e.dataTransfer.files[0];
                    if (f) loadAudioCarrier(f);
                  }}
                  onClick={() => audioInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-400 shadow-md">
                      <Music size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Drop your WAV audio track here, or click to browse</p>
                      <p className="text-xs text-slate-400">Supports standard 16-bit PCM uncompressed WAV audio</p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Step 2 — Payload Configuration (Text vs Files) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                <span className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  2
                </span>
                <span>{t.encoder.step2 || 'Secret Payload Formulation'}</span>
              </div>

              <div className="flex gap-1.5 p-1 rounded-lg bg-black/50 border border-white/10">
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setMode('text'); }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    mode === 'text' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText size={13} />
                  <span>Text Note</span>
                </button>
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setMode('files'); }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    mode === 'files' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Files size={13} />
                  <span>GhostVault (Files)</span>
                </button>
              </div>
            </div>

            {mode === 'text' ? (
              <textarea
                placeholder="Enter confidential message to encrypt and conceal..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="w-full p-4 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
              />
            ) : (
              <div className="space-y-3">
                <input
                  ref={filesInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={onFilesChange}
                />
                <div
                  className={`dropzone-3d p-6 text-center transition-all ${filesDrag ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setFilesDrag(true); }}
                  onDragLeave={() => setFilesDrag(false)}
                  onDrop={onFilesDrop}
                  onClick={() => filesInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Files className="text-cyan-400" size={20} />
                    <p className="text-xs font-bold text-white">Drop secret files to pack into GhostVault, or browse</p>
                    <p className="text-[11px] text-slate-400">Supports all extensions (.pdf, .zip, .mp3, .exe, .docx, .png)</p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono"
                      >
                        <span className="text-white truncate max-w-xs">{f.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-300 font-semibold">{fmtBytes(f.data.length)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              setFiles((prev) => prev.filter((_, idx) => idx !== i));
                            }}
                            className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3 — Cryptographic Mode (Symmetric vs Asymmetric) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                <span className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  3
                </span>
                <span>Cryptographic Protocol Selection</span>
              </div>

              {onOpenKeyring && (
                <button
                  type="button"
                  onClick={onOpenKeyring}
                  className="flex items-center gap-1 text-[11px] font-bold text-purple-300 hover:text-purple-200 transition-colors cursor-pointer"
                >
                  <Key size={12} />
                  <span>Keyring Studio</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-black/50 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSecMode('passphrase');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  secMode === 'passphrase'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Lock size={13} />
                <span>Passphrase / Honey-Vault</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSecMode('asymmetric');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  secMode === 'asymmetric'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Key size={13} />
                <span>Recipient Public Key (ECDH)</span>
              </button>
            </div>

            {secMode === 'passphrase' ? (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter strong encryption password (optional, leave blank for plaintext stealth)..."
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="w-full px-4 py-2.5 pr-24 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={handleGeneratePass}
                      className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 transition-colors cursor-pointer"
                      title="Generate High-Entropy Passphrase"
                    >
                      <Sparkles size={14} />
                    </button>
                  </div>
                </div>

                {/* Password Confirmation Field */}
                {pass.length > 0 && (
                  <div className="space-y-1 animate-fade-in">
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Confirm passphrase to prevent accidental typos..."
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className={`w-full px-4 py-2.5 pr-24 rounded-xl bg-black/60 border text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors font-mono ${
                          confirmPass.length === 0
                            ? 'border-white/15 focus:border-cyan-400'
                            : confirmPass === pass
                            ? 'border-emerald-500/60 focus:border-emerald-400'
                            : 'border-red-500/60 focus:border-red-400'
                        }`}
                      />
                      {confirmPass.length > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold">
                          {confirmPass === pass ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={13} /> Matches
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1">
                              <X size={13} /> Mismatch
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <EntropyBar pass={pass} />

                {/* Zero-Knowledge & Strength Guidance Notice */}
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1 text-[11px] leading-relaxed">
                  <p className="text-slate-300 flex items-center gap-1.5 font-medium">
                    <span className="text-amber-400">⚠️</span>
                    <strong>Zero-Knowledge Irrecoverability:</strong> No master recovery key exists. If you lose this password, your payload is permanently unrecoverable.
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    <strong className="text-slate-300">Security Tip:</strong> 600,000 PBKDF2 iterations protect high-entropy passphrases from GPU cracking, but cannot protect simple dictionary words. Use the generator button for maximum security.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-purple-300 flex items-center justify-between">
                    <span>Select Recipient Public Key:</span>
                    {onOpenKeyring && (
                      <button
                        type="button"
                        onClick={onOpenKeyring}
                        className="text-[10px] text-cyan-300 hover:underline cursor-pointer"
                      >
                        + Add New Contact
                      </button>
                    )}
                  </label>

                  {contacts.length > 0 ? (
                    <select
                      value={selectedContactId}
                      onChange={(e) => {
                        setSelectedContactId(e.target.value);
                        setCustomPublicArmor('');
                      }}
                      className="w-full p-2.5 rounded-lg bg-black/70 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="">Select Stored Contact ({contacts.length} available)...</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Fingerprint: {c.fingerprint})
                        </option>
                      ))}
                    </select>
                  ) : null}

                  <textarea
                    placeholder="Or paste -----BEGIN QUIETSEND PUBLIC KEY----- Armor Block..."
                    value={customPublicArmor}
                    onChange={(e) => {
                      setCustomPublicArmor(e.target.value);
                      setSelectedContactId('');
                    }}
                    rows={3}
                    className="w-full p-2.5 rounded-lg bg-black/70 border border-white/15 text-[11px] font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={encode}
            disabled={loading}
            className="w-full py-3.5 rounded-xl btn-3d-blue text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                <span>{progress?.status || 'Processing Steganographic Container...'}</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Generate Encrypted {carrierType === 'image' ? 'Stego Image' : 'Stego Audio'}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Result Output Card */}
      {result && (
        <section ref={resultRef} className="glass-3d-blue p-6 sm:p-8 space-y-6 border-cyan-400/50 animate-fade-in scroll-mt-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 size={18} />
              <h3 className="text-base text-white">Lossless Container Ready for Dispatch</h3>
            </div>
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all cursor-pointer"
              >
                <Share2 size={13} />
                <span>Messenger Bypass Guide</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {resultType === 'image' ? (
              <div className="relative rounded-xl overflow-hidden border border-cyan-400/30 bg-black/60 flex items-center justify-center p-2">
                <img src={result} alt="Stego Output" className="max-h-64 object-contain rounded-lg" />
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-purple-400/30 bg-black/60 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
                  <Music size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Stego Audio Synthesized</p>
                  <p className="text-xs text-slate-400">16-bit PCM Audio Container</p>
                </div>
                <audio src={result} controls className="w-full max-w-xs" />
              </div>
            )}

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Payload SHA-256 Fingerprint (Integrity Hash · Not a Password)</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-cyan-300 font-bold truncate">{resultHash}</span>
                  <button
                    type="button"
                    onClick={copyHash}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
                    title="Copy Checksum"
                  >
                    {copiedHash ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Critical Sharing & Compression Warning */}
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-200 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-300">
                  <AlertTriangle size={13} className="shrink-0 text-red-400" />
                  <span>Important Sharing Warning</span>
                </div>
                <p className="text-[10px] text-red-200/90">
                  Standard photo sharing on WhatsApp, Signal & Discord silently reapplies lossy JPEG compression and <strong>destroys the hidden payload</strong>. Always dispatch using <strong>"Send as Document / File"</strong> or download the <strong>.ZIP</strong> package below.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                {resultType === 'image' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      className="w-full py-3.5 rounded-xl btn-3d-blue text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                    >
                      <Files size={16} />
                      <span>Download Secure Package (.ZIP) [Safe for WhatsApp/Signal]</span>
                    </button>

                    <a
                      href={result}
                      download="quietsend-document.png"
                      onClick={() => soundFx.playClick()}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Download Raw Stego Image (.PNG) [Direct AirDrop/Uncompressed]</span>
                    </a>
                  </>
                ) : (
                  <a
                    href={result}
                    download="quietsend-audio.wav"
                    onClick={() => soundFx.playClick()}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Download size={15} />
                    <span>Download Stego Audio (.WAV)</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
