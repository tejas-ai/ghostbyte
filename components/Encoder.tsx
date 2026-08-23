import React, { useState, useRef, useCallback, useEffect, useMemo, type DragEvent, type ChangeEvent } from 'react';
import {
  Lock,
  Unlock,
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
  encodeHoneyVault,
  encryptPayload,
  buildGhostVault,
  buildGhostFile,
  calculateCapacity,
  dualVaultCapacity,
  generatePassphrase,
  calcEntropy,
  readImageFile,
  calcSha256,
  getScaledDimensions,
  downloadZip,
  DEFAULT_DENSITY,
  PASSPHRASE_BITS,
  AES_OVERHEAD_BYTES,
  type CapacityDensity,
} from '../services/stegaEngine';
import { useRevocableUrl } from '../hooks/useRevocableUrl';
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
  // Calibrated against what 600k PBKDF2 iterations actually buy: below 40 bits
  // is reachable by an offline attacker, 60+ is not. The old thresholds wanted
  // 90 bits for "strong", which no memorable passphrase reaches and which the
  // per-character scoring only ever produced by overcounting word phrases.
  const level = bits === 0 ? 'none' : bits < 40 ? 'weak' : bits < 60 ? 'medium' : 'strong';
  const pct = Math.min(100, (bits / 80) * 100);
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

/**
 * Embedding densities offered to the user, with the distortion each actually
 * produces measured across the region the payload covers.
 *
 * These PSNR figures are the real ones. The default used to be LSB-6 (~20 dB,
 * visible corruption that any bit-plane view exposes at a glance) while the
 * interface claimed the output was "indistinguishable from sensor ISO noise
 * (PSNR > 45 dB)". LSB-1 and LSB-2 are the densities that actually meet that
 * description; the higher two are capacity opt-ins and are labelled as such.
 */
const DENSITY_CHOICES: { id: CapacityDensity; label: string; psnr: string; note: string }[] = [
  {
    id: 'lsb1',
    label: 'Maximum stealth',
    psnr: '~51 dB',
    note: 'One bit per channel. Sits below the sensor noise of any real photograph and survives statistical inspection. Smallest capacity.',
  },
  {
    id: 'lsb2',
    label: 'Balanced',
    psnr: '~44 dB',
    note: 'Two bits per channel. Still inside a typical camera noise floor, with four times the room of maximum stealth. Recommended default.',
  },
  {
    id: 'lsb4',
    label: 'High capacity',
    psnr: '~32 dB',
    note: 'Four bits per channel. Detectable by bit-plane analysis and faintly visible in flat areas such as skies. Use when the payload will not otherwise fit.',
  },
  {
    id: 'lsb6',
    label: 'Maximum capacity',
    psnr: '~20 dB',
    note: 'Six bits per channel. Visibly degrades the carrier and is trivially detectable. Only for cases where nobody is inspecting the image.',
  },
];

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
  const [density, setDensity] = useState<CapacityDensity>(DEFAULT_DENSITY);
  const maxDimension = 0; // downscaling is not yet exposed in the UI

  // Blob URL ownership. Each slot revokes its own URL only when replaced.
  const trackCarrierUrl = useRevocableUrl();
  const trackAudioUrl = useRevocableUrl();
  const trackResultUrl = useRevocableUrl();

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

  // Deniable dual-vault: a decoy payload under a second passphrase.
  const [dualVault, setDualVault] = useState(false);
  const [decoyPass, setDecoyPass] = useState('');
  const [decoyText, setDecoyText] = useState('');

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

  const loadCarrier = useCallback(async (file: File) => {
    soundFx.playClick();
    try {
      const { src, w, h } = await readImageFile(file);
      trackCarrierUrl(src);
      setCarrier({
        src,
        name: file.name || 'clipboard-image.png',
        w,
        h,
        size: file.size,
      });
      trackResultUrl(null);
      setResult(null);
      setResultFile(null);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to parse image data. Please select a valid PNG, JPG, WebP, or BMP image.');
      soundFx.playError();
    }
  }, [trackCarrierUrl, trackResultUrl]);

  const loadAudioCarrier = useCallback(async (file: File) => {
    soundFx.playClick();
    try {
      const buffer = await file.arrayBuffer();
      const { header } = parseWavHeader(buffer);
      const cap = calculateAudioCapacity(buffer, 2);
      const durationSec = header.totalSamples / header.sampleRate / header.numChannels;
      const previewUrl = URL.createObjectURL(file);
      trackAudioUrl(previewUrl);

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
      trackResultUrl(null);
      setResult(null);
      setResultFile(null);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to parse WAV audio. Ensure you select an uncompressed 16-bit PCM .wav file.');
      soundFx.playError();
    }
  }, [trackAudioUrl, trackResultUrl]);

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
    trackCarrierUrl(null);
    trackResultUrl(null);
    setCarrier(null);
    setResult(null);
    setResultFile(null);
    setError('');
  };

  const clearAudioCarrier = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    trackAudioUrl(null);
    trackResultUrl(null);
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

  /**
   * Bytes the payload will actually occupy once framed and encrypted.
   *
   * Counts UTF-8 name lengths rather than UTF-16 code units, and includes the
   * 44 bytes AES-GCM adds (16 salt + 12 IV + 16 tag). Without both, a payload
   * just under capacity passed this check and then failed inside encodeImage
   * with "Payload exceeds carrier capacity" while the meter still read under
   * 100%. Memoised because it re-encodes the whole message and is read three
   * times per render.
   */
  const payloadBytes = useMemo((): number => {
    const te = new TextEncoder();
    let framed: number;
    if (mode === 'text') {
      framed = te.encode(text).length;
    } else if (files.length === 1) {
      framed = 10 + 4 + te.encode(files[0].name).length + 4 + files[0].data.length;
    } else if (files.length > 1) {
      framed = files.reduce((s, f) => s + 4 + te.encode(f.name).length + 4 + f.data.length, 15);
    } else {
      framed = 0;
    }

    if (framed === 0) return 0;
    const encrypting = secMode === 'asymmetric' || (secMode === 'passphrase' && pass.trim().length > 0);
    return framed + (encrypting ? AES_OVERHEAD_BYTES : 0);
  }, [mode, text, files, secMode, pass]);

  const scaledDim = carrier ? getScaledDimensions(carrier.w, carrier.h, maxDimension) : { w: 0, h: 0 };
  const rawCap = carrierType === 'image'
    ? (carrier ? calculateCapacity(scaledDim.w, scaledDim.h, density) : 0)
    : (audioCarrier ? audioCarrier.capacity : 0);

  // A dual vault splits the carrier in half and pays block overhead in each.
  const currentCap = dualVault && carrierType === 'image' ? dualVaultCapacity(rawCap) : rawCap;

  const decoyBytes = dualVault ? new TextEncoder().encode(decoyText).length + AES_OVERHEAD_BYTES : 0;
  const largestPayload = Math.max(payloadBytes, decoyBytes);

  const isOverCapacity = currentCap > 0 ? largestPayload > currentCap : false;
  const usedPct = currentCap > 0 ? Math.min(100, (largestPayload / currentCap) * 100) : 0;

  /** True when the user will get a plaintext container: no passphrase, no recipient key. */
  const isPlaintext = secMode === 'passphrase' && pass.trim().length === 0;

  const handleGeneratePass = () => {
    soundFx.playClick();
    const generated = generatePassphrase();
    setPass(generated);
    setConfirmPass(generated);
    setShowPass(true);
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
      setError('Payload exceeds carrier capacity. Raise the density, shorten the payload, or use a larger carrier.');
      return;
    }

    if (secMode === 'passphrase' && pass.trim().length > 0 && pass !== confirmPass) {
      setError('Passphrase confirmation does not match. Verify it to prevent a typo locking you out of your own payload.');
      soundFx.playError();
      return;
    }

    if (dualVault) {
      if (carrierType !== 'image') {
        setError('The decoy vault is only available for image carriers.');
        soundFx.playError();
        return;
      }
      if (!pass.trim()) {
        setError('A decoy vault needs a real passphrase to hide behind. Set one first.');
        soundFx.playError();
        return;
      }
      if (!decoyPass.trim()) {
        setError('Set a decoy passphrase. This is the one you would hand over under pressure.');
        soundFx.playError();
        return;
      }
      if (decoyPass.trim() === pass.trim()) {
        setError('The decoy passphrase must differ from the real one, or the decoy gives no cover.');
        soundFx.playError();
        return;
      }
      if (!decoyText.trim()) {
        setError('Write a decoy message. An empty decoy is not believable to someone who just made you unlock it.');
        soundFx.playError();
        return;
      }
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

      // Build the final payload (asymmetric or passphrase-wrapped).
      let finalPayload = rawPayload;
      if (secMode === 'asymmetric') {
        setProgress({ pct: 20, status: 'Deriving ECDH P-256 ephemeral keys...' });
        finalPayload = await encryptWithPublicKey(rawPayload, targetPublicArmor);
      }

      // Hash the *final encrypted payload* for the integrity display.
      // Hashing the plaintext (rawPayload) would commit the message contents
      // to anyone who receives the hash — a deniability-breaking side channel.
      const hash = await calcSha256(finalPayload);
      setResultHash(hash);

      if (carrierType === 'audio' && audioCarrier) {
        setResultType('audio');
        // Seal through the engine's own wrapper rather than re-implementing the
        // [salt][iv][ct] wire format inline, which had drifted into three copies.
        if (secMode === 'passphrase' && pass.trim()) {
          setProgress({ pct: 20, status: 'Deriving authenticated cryptographic keys...' });
          finalPayload = await encryptPayload(rawPayload, pass.trim());
        }

        const audioBlob = await encodeWavAudio(
          audioCarrier.buffer,
          finalPayload,
          2,
          (pct, status) => setProgress({ pct, status })
        );
        const url = URL.createObjectURL(audioBlob);
        trackResultUrl(url);
        setResult(url);
        setResultFile(new File([audioBlob], 'quietsend-audio.wav', { type: 'audio/wav' }));
      } else if (carrier) {
        setResultType('image');

        const url = dualVault
          ? await encodeHoneyVault(
              carrier.src,
              rawPayload,
              pass.trim(),
              new TextEncoder().encode(decoyText),
              decoyPass.trim(),
              density,
              maxDimension,
              (pct, status) => setProgress({ pct, status }),
            )
          : await encodeImage(
              carrier.src,
              finalPayload,
              secMode === 'passphrase' ? (pass.trim() || undefined) : undefined,
              density,
              maxDimension,
              (pct, status) => setProgress({ pct, status }),
            );

        trackResultUrl(url);
        setResult(url);

        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          setResultFile(new File([blob], 'quietsend-document.png', { type: 'image/png' }));
        } catch {
          // The preview and download link both work from the blob URL directly;
          // only the File wrapper is unavailable.
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
            {/* Reports the pipeline that will actually run, including when that
                pipeline is "no encryption at all". */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-md glass-pill-3d text-[11px] font-mono font-bold mb-2 ${
                isPlaintext ? 'text-amber-300' : 'text-cyan-300'
              }`}
            >
              {isPlaintext ? <Unlock size={12} className="text-amber-400" /> : <Lock size={12} className="text-cyan-400" />}
              <span>
                {isPlaintext
                  ? 'No encryption'
                  : secMode === 'asymmetric'
                  ? 'ECDH P-256 · HKDF · AES-GCM-256'
                  : 'AES-GCM-256 · PBKDF2 (600k)'}
                {' · '}
                {carrierType === 'audio'
                  ? 'WAV audio LSB-2'
                  : (DENSITY_CHOICES.find((d) => d.id === density)?.label ?? density)}
                {dualVault && carrierType === 'image' ? ' · Dual vault' : ''}
              </span>
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
                <span>{fmtBytes(largestPayload)}</span>
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
                  role="button"
                  tabIndex={0}
                  aria-label="Upload cover image"
                  className={`dropzone-3d p-8 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${carrierDrag ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setCarrierDrag(true); }}
                  onDragLeave={() => setCarrierDrag(false)}
                  onDrop={onCarrierDrop}
                  onClick={() => carrierInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      carrierInputRef.current?.click();
                    }
                  }}
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
                  role="button"
                  tabIndex={0}
                  aria-label="Upload cover WAV audio"
                  className={`dropzone-3d p-8 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 ${audioDrag ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setAudioDrag(true); }}
                  onDragLeave={() => setAudioDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setAudioDrag(false);
                    const f = e.dataTransfer.files[0];
                    if (f) loadAudioCarrier(f);
                  }}
                  onClick={() => audioInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      audioInputRef.current?.click();
                    }
                  }}
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
            {/* Embedding density — the trade between how much fits and how visible it is. */}
            {carrierType === 'image' && carrier && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 font-mono uppercase tracking-wide">
                    Embedding density
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {DENSITY_CHOICES.find((d) => d.id === density)?.psnr} in the covered region
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {DENSITY_CHOICES.map((choice) => {
                    const active = density === choice.id;
                    const cap = carrier ? calculateCapacity(scaledDim.w, scaledDim.h, choice.id) : 0;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => { soundFx.playClick(); setDensity(choice.id); }}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-cyan-600/20 border-cyan-400/60 shadow-md'
                            : 'bg-black/40 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <span className={`block text-[11px] font-bold ${active ? 'text-cyan-200' : 'text-slate-300'}`}>
                          {choice.label}
                        </span>
                        <span className="block text-[9px] font-mono text-slate-500 mt-0.5">
                          {fmtBytes(dualVault ? dualVaultCapacity(cap) : cap)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {DENSITY_CHOICES.find((d) => d.id === density)?.note}
                </p>
              </div>
            )}
          </div>

          {/* Step 2 — Payload Configuration (Text vs Files) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                <span className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  2
                </span>
                <span>Secret Payload Payload Type</span>
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
                  role="button"
                  tabIndex={0}
                  aria-label="Upload payload files for GhostVault"
                  className={`dropzone-3d p-6 text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${filesDrag ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setFilesDrag(true); }}
                  onDragLeave={() => setFilesDrag(false)}
                  onDrop={onFilesDrop}
                  onClick={() => filesInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      filesInputRef.current?.click();
                    }
                  }}
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

                {/* Plaintext state — no passphrase means no encryption at all. */}
                {isPlaintext ? (
                  <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-start gap-2.5 text-[11px] leading-relaxed">
                    <AlertTriangle size={15} className="shrink-0 text-amber-400 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-300">This payload will not be encrypted</p>
                      <p className="text-amber-200/90">
                        With no passphrase, your message is hidden but readable by anyone who extracts it.
                        Enter a passphrase above, or use the generator, to encrypt it with AES-GCM-256.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1 text-[11px] leading-relaxed">
                    <p className="text-slate-300 flex items-center gap-1.5 font-medium">
                      <span className="text-amber-400">⚠️</span>
                      <strong>No recovery key exists.</strong> Lose this passphrase and the payload is gone permanently.
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      600,000 PBKDF2 iterations slow down GPU cracking, but they cannot rescue a guessable
                      passphrase. The generator produces {PASSPHRASE_BITS} bits from a 256-word list.
                    </p>
                  </div>
                )}

                {/* Deniable dual vault */}
                <div className="rounded-lg bg-black/40 border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { soundFx.playClick(); setDualVault(!dualVault); }}
                    className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Shield size={14} className={dualVault ? 'text-emerald-400' : 'text-slate-500'} />
                      <span className="text-[11px] font-bold text-white">Add a decoy vault</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 text-slate-300 border border-white/10">
                        Plausible deniability
                      </span>
                    </span>
                    <span
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${dualVault ? 'bg-emerald-500' : 'bg-white/15'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${dualVault ? 'left-[18px]' : 'left-0.5'}`}
                      />
                    </span>
                  </button>

                  {dualVault && (
                    <div className="p-3 pt-0 space-y-2.5 animate-fade-in">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        The carrier holds two separate vaults. Your real passphrase opens the real payload;
                        the decoy passphrase opens the decoy. Neither reveals the other, and nothing in the
                        image shows which one you gave.
                      </p>

                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Decoy passphrase — the one you would hand over"
                        value={decoyPass}
                        onChange={(e) => setDecoyPass(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg bg-black/70 border text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors font-mono ${
                          decoyPass && decoyPass === pass ? 'border-red-500/60' : 'border-white/15 focus:border-emerald-400'
                        }`}
                      />
                      {decoyPass && decoyPass === pass && (
                        <p className="text-[10px] text-red-400 font-semibold">
                          The decoy passphrase must differ from the real one.
                        </p>
                      )}

                      <textarea
                        placeholder="Decoy message — make it plausible enough to satisfy whoever asked"
                        value={decoyText}
                        onChange={(e) => setDecoyText(e.target.value)}
                        rows={2}
                        className="w-full p-2.5 rounded-lg bg-black/70 border border-white/15 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
                      />

                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Each vault gets half the carrier, so capacity per vault is
                        {' '}{fmtBytes(currentCap)} at this density.
                      </p>
                    </div>
                  )}
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
                <span>{isPlaintext ? "Generate" : "Generate Encrypted"} {carrierType === "image" ? "Stego Image" : "Stego Audio"}</span>
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
                <span className="text-slate-400 text-[10px] uppercase font-bold">Encrypted Output SHA-256 — Share this to verify file integrity</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-cyan-300 font-bold truncate">{resultHash}</span>
                  <button
                    type="button"
                    onClick={copyHash}
                    aria-label="Copy integrity hash"
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
