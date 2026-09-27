import React, { useState, useEffect, useRef, useCallback, useMemo, type ChangeEvent, type DragEvent } from 'react';
import {
  Lock,
  Unlock,
  Image as ImageIcon,
  Music,
  Files,
  FileText,
  Download,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Key,
  Shield,
  X,
  ClipboardPaste,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { SimpleHideDraft } from '../types';
import {
  encodeImage,
  encodeHoneyVault,
  buildGhostFile,
  buildGhostVault,
  calculateCapacity,
  dualVaultCapacity,
  readImageFile,
  calcSha256,
  downloadZip,
  generatePassphrase,
  calcEntropy,
  getScaledDimensions,
  DEFAULT_DENSITY,
  PASSPHRASE_BITS,
  AES_OVERHEAD_BYTES,
  encryptPayload,
  sanitizeFilename,
  type CapacityDensity,
} from '../services/stegaEngine';
import { encodeWavAudio, parseWavHeader, calculateAudioCapacity } from '../services/audioStegaEngine';
import {
  encryptWithPublicKey,
  getStoredKeyring,
  getStoredContacts,
  type ContactPublicKey,
} from '../services/asymmetricCrypto';
import { useRevocableUrl } from '../hooks/useRevocableUrl';
import { soundFx } from '../services/soundFx';
import PayloadFootprint from './PayloadFootprint';
import SkeuoSegmentedControl from './SkeuoSegmentedControl';
import SkeuoToggle from './SkeuoToggle';

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function EntropyBar({ pass }: { pass: string }) {
  if (!pass) return null;
  const bits = Math.round(calcEntropy(pass));
  const pct = Math.min(100, (bits / 80) * 100);
  const level = bits >= 60 ? 'strong' : bits >= 40 ? 'medium' : 'weak';
  const labels = { strong: 'High Entropy', medium: 'Moderate', weak: 'Low Entropy' };
  const colors = { strong: '#52b788', medium: '#e0a96d', weak: '#e57373' };

  return (
    <div className="space-y-1.5 pt-1 animate-fade-in">
      <div className="flex justify-between text-[11px] font-mono">
        <span className="text-[#a0aec0]">Passphrase Strength:</span>
        <span className="font-bold" style={{ color: colors[level] }}>
          {labels[level]} ({bits} bits)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#0d1016] p-[1px] border border-black/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
        <div
          className="h-full rounded-full transition-all duration-300 shadow-sm"
          style={{
            width: `${pct}%`,
            background: colors[level],
          }}
        />
      </div>
    </div>
  );
}

const DENSITY_CHOICES: { id: CapacityDensity; label: string; psnr: string; note: string }[] = [
  {
    id: 'lsb1',
    label: 'Maximum stealth',
    psnr: '~51 dB',
    note: 'One bit per channel. Sits below sensor ISO noise floor. Smallest capacity.',
  },
  {
    id: 'lsb2',
    label: 'Balanced',
    psnr: '~44 dB',
    note: 'Two bits per channel. Recommended default with 2x capacity of maximum stealth mode.',
  },
  {
    id: 'lsb4',
    label: 'High capacity',
    psnr: '~32 dB',
    note: 'Four bits per channel. Detectable by bit-plane analysis. Use when payload requires room.',
  },
  {
    id: 'lsb6',
    label: 'Maximum capacity',
    psnr: '~20 dB',
    note: 'Six bits per channel. Maximum room, with potentially visible color changes.',
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
  active?: boolean;
  initialDraft?: SimpleHideDraft | null;
  onDraftConsumed?: () => void;
}

export default function Encoder({ onOpenGuide, onOpenKeyring, active = true, initialDraft, onDraftConsumed }: EncoderProps) {
  const { t } = useLanguage();

  const [carrierType, setCarrierType] = useState<'image' | 'audio'>('image');
  const [carrierDrag, setCarrierDrag] = useState(false);
  const [carrier, setCarrier] = useState<CarrierImageInfo | null>(null);
  const [density, setDensity] = useState<CapacityDensity>(DEFAULT_DENSITY);
  const maxDimension = 0;

  const trackCarrierUrl = useRevocableUrl();
  const trackAudioUrl = useRevocableUrl();
  const trackResultUrl = useRevocableUrl();

  const [audioCarrier, setAudioCarrier] = useState<CarrierAudioInfo | null>(null);
  const [audioDrag, setAudioDrag] = useState(false);

  const [mode, setMode] = useState<'text' | 'files'>('text');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<{ name: string; data: Uint8Array }[]>([]);
  const [pendingFileReads, setPendingFileReads] = useState(0);
  const [filesDrag, setFilesDrag] = useState(false);

  const [secMode, setSecMode] = useState<'passphrase' | 'asymmetric'>('passphrase');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [dualVault, setDualVault] = useState(false);
  const [decoyPass, setDecoyPass] = useState('');
  const [decoyText, setDecoyText] = useState('');

  const [contacts, setContacts] = useState<ContactPublicKey[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [customPublicArmor, setCustomPublicArmor] = useState<string>('');
  const [selfEncryptAcknowledged, setSelfEncryptAcknowledged] = useState(false);

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
  const inputRevision = useRef(0);
  useEffect(() => {
    inputRevision.current++;
    trackResultUrl(null);
    setResult(null);
    setResultFile(null);
    setResultHash('');
    return () => { inputRevision.current++; };
  }, [carrierType, carrier, audioCarrier, density, mode, text, files, secMode, pass,
    dualVault, decoyPass, decoyText, selectedContactId, customPublicArmor, contacts, trackResultUrl]);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [result]);

  useEffect(() => {
    const refreshContacts = () => {
      const stored = getStoredContacts();
      setContacts(stored);
      setSelectedContactId((current) => stored.some((contact) => contact.id === current) ? current : '');
    };
    refreshContacts();
    window.addEventListener('quietsend:keyring-updated', refreshContacts);
    return () => window.removeEventListener('quietsend:keyring-updated', refreshContacts);
  }, []);

  useEffect(() => {
    if (!initialDraft) return;
    let cancelled = false;
    setCarrierType('image');
    setCarrier(null);
    trackCarrierUrl(null);
    setAudioCarrier(null);
    setMode(initialDraft.kind === 'message' ? 'text' : 'files');
    setText(initialDraft.message);
    setDensity(initialDraft.density ?? DEFAULT_DENSITY);
    setFiles(initialDraft.files);
    setSecMode('passphrase');
    setDualVault(false);
    setPass(initialDraft.password);
    setConfirmPass(initialDraft.password);
    trackResultUrl(null);
    setResult(null);
    setResultFile(null);
    setError('');
    // Own a separate URL: replacing the Simple carrier must not revoke Pro's copy.
    void (async () => {
      try {
        if (initialDraft.photo) {
          const response = await fetch(initialDraft.photo.src);
          if (!response.ok) throw new Error('Unable to transfer the selected carrier. Please select it again.');
          const blob = await response.blob();
          if (cancelled) return;
          const src = URL.createObjectURL(blob);
          trackCarrierUrl(src);
          setCarrier({ ...initialDraft.photo, src });
        }
      } catch (error) {
        if (!cancelled) setError(error instanceof Error ? error.message : 'Unable to transfer carrier.');
      } finally {
        if (!cancelled) onDraftConsumed?.();
      }
    })();
    return () => { cancelled = true; };
  }, [initialDraft, onDraftConsumed, trackCarrierUrl, trackResultUrl]);

  const handleGeneratePass = () => {
    soundFx.playSparkle();
    const next = generatePassphrase();
    setPass(next);
    setConfirmPass(next);
    setShowPass(true);
  };

  const loadCarrier = useCallback(
    async (file: File) => {
      soundFx.playClick();
      setError('');
      try {
        const { src, w, h } = await readImageFile(file);
        trackCarrierUrl(src);
        setCarrier({ src, name: file.name || 'cover-photo.png', w, h, size: file.size });
        trackResultUrl(null);
        setResult(null);
        setResultFile(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to parse image file.');
        soundFx.playError();
      }
    },
    [trackCarrierUrl, trackResultUrl]
  );

  const loadAudioCarrier = useCallback(
    async (file: File) => {
      soundFx.playClick();
      setError('');
      if (file.size > 100 * 1024 * 1024) {
        setError(`Carrier audio size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 100 MB safety limit.`);
        soundFx.playError();
        return;
      }
      try {
        const buf = await file.arrayBuffer();
        const { header } = parseWavHeader(buf);
        const cap = calculateAudioCapacity(buf, 2);
        const durationSec = header.sampleRate > 0 ? header.totalSamples / header.sampleRate : 0;
        const url = URL.createObjectURL(file);
        trackAudioUrl(url);
        setAudioCarrier({
          buffer: buf,
          name: file.name || 'audio-track.wav',
          size: file.size,
          durationSec,
          capacity: cap,
          sampleRate: header.sampleRate,
          channels: header.numChannels,
          previewUrl: url,
        });
        trackResultUrl(null);
        setResult(null);
        setResultFile(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to parse 16-bit PCM WAV audio file.');
        soundFx.playError();
      }
    },
    [trackAudioUrl, trackResultUrl]
  );

  const handleQuickTestDrive = useCallback(async () => {
    soundFx.playClick();
    setCarrierType('image');
    setMode('text');
    setText(
      'QuietSend Enclave Verification — This secret payload is concealed inside this carrier photo using authenticated AES-GCM-256 (600k PBKDF2 iterations).'
    );
    setPass('enclave-demo-2026');
    setConfirmPass('enclave-demo-2026');
    setError('');

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, '#1a2230');
    grad.addColorStop(1, '#0e121a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(40, 40, 720, 520);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'demo-cover.png', { type: 'image/png' });
        loadCarrier(file);
      }
    }, 'image/png');
  }, [loadCarrier]);

  useEffect(() => {
    if (!active) return;
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
  }, [active, loadCarrier]);

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

  const loadSecretFiles = (fl: FileList) => {
    soundFx.playClick();
    setError('');
    Array.from(fl).forEach((f) => {
      setPendingFileReads((n) => n + 1);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        setFiles((prev) => [...prev, { name: f.name, data }]);
      };
      reader.onerror = () => {
        setError(`Failed to read file "${f.name}". Please re-select the file.`);
        soundFx.playError();
      };
      reader.onloadend = () => setPendingFileReads((n) => n - 1);
      reader.readAsArrayBuffer(f);
    });
  };

  const onFilesDrop = (e: DragEvent) => {
    e.preventDefault();
    setFilesDrag(false);
    if (e.dataTransfer.files.length) loadSecretFiles(e.dataTransfer.files);
  };

  const scaledDim = useMemo(() => {
    if (!carrier) return { w: 0, h: 0 };
    return getScaledDimensions(carrier.w, carrier.h, maxDimension);
  }, [carrier, maxDimension]);

  const rawSecretBytes = useMemo(() => {
    const te = new TextEncoder();
    if (mode === 'text') return te.encode(text).length;
    if (files.length === 1) return 18 + te.encode(sanitizeFilename(files[0].name)).length + files[0].data.length;
    if (files.length > 1) {
      return files.reduce((s, f) => s + 8 + te.encode(sanitizeFilename(f.name)).length + f.data.length, 15);
    }
    return 0;
  }, [mode, text, files]);

  const isPlaintext = secMode === 'passphrase' && !pass.trim();

  const secretPayloadBytes = useMemo(() => {
    if (rawSecretBytes <= 0) return 0;
    return isPlaintext ? rawSecretBytes : rawSecretBytes + AES_OVERHEAD_BYTES;
  }, [rawSecretBytes, isPlaintext]);

  const decoyPayloadBytes = useMemo(() => {
    if (!dualVault) return 0;
    const len = new TextEncoder().encode(decoyText).length;
    return len > 0 ? len + (decoyPass.trim() ? AES_OVERHEAD_BYTES : 0) : 0;
  }, [dualVault, decoyText, decoyPass]);

  const totalPayloadBytes = secretPayloadBytes + decoyPayloadBytes;
  const largestPayload = Math.max(secretPayloadBytes, decoyPayloadBytes);

  const currentCap = useMemo(() => {
    if (carrierType === 'audio' && audioCarrier) return audioCarrier.capacity;
    if (carrierType === 'image' && carrier) {
      const raw = calculateCapacity(scaledDim.w, scaledDim.h, density);
      return dualVault ? dualVaultCapacity(raw) : raw;
    }
    return 0;
  }, [carrierType, audioCarrier, carrier, scaledDim, density, dualVault]);

  const isOverCapacity = currentCap > 0 && largestPayload > currentCap;
  const usedPct = currentCap > 0 ? Math.min(100, (largestPayload / currentCap) * 100) : 0;

  const encode = async () => {
    if (pendingFileReads > 0) return;
    if (carrierType === 'image' && !carrier) {
      setError('Please select a cover photo.');
      return;
    }
    if (carrierType === 'audio' && !audioCarrier) {
      setError('Please select a 16-bit PCM WAV audio file.');
      return;
    }
    if (mode === 'text' && !text.trim()) {
      setError('Please enter a secret message to conceal.');
      return;
    }
    if (mode === 'files' && files.length === 0) {
      setError('Please add at least one payload file.');
      return;
    }
    if (secMode === 'passphrase' && pass.trim() && confirmPass !== pass) {
      setError('Passphrases do not match. Please verify.');
      return;
    }
    if (isOverCapacity) {
      setError('Payload size exceeds carrier capacity.');
      return;
    }

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
        setError('Please select a contact or paste their recipient public key.');
        return;
      }
    }

    setLoading(true);
    const revision = inputRevision.current;
    const ensureCurrent = (url?: string) => {
      if (revision !== inputRevision.current) {
        if (url) URL.revokeObjectURL(url);
        throw new Error('Your inputs changed during processing. Conceal again to export the updated payload.');
      }
    };
    setProgress({ pct: 5, status: 'Initializing cryptographic pipeline…' });
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

      let finalPayload = rawPayload;
      if (secMode === 'asymmetric') {
        setProgress({ pct: 20, status: 'Deriving ECDH P-256 ephemeral keys…' });
        finalPayload = await encryptWithPublicKey(rawPayload, targetPublicArmor);
      }

      if (carrierType === 'audio' && audioCarrier) {
        setResultType('audio');
        if (secMode === 'passphrase' && pass.trim()) {
          setProgress({ pct: 20, status: 'Deriving cryptographic keys…' });
          finalPayload = await encryptPayload(rawPayload, pass.trim());
        }

        const audioBlob = await encodeWavAudio(
          audioCarrier.buffer,
          finalPayload,
          2,
          (pct, status) => setProgress({ pct, status })
        );
        const url = URL.createObjectURL(audioBlob);
        ensureCurrent(url);
        trackResultUrl(url);
        setResult(url);
        setResultFile(new File([audioBlob], 'quietsend-carrier.wav', { type: 'audio/wav' }));

        const audioBuf = await audioBlob.arrayBuffer();
        const hash = await calcSha256(new Uint8Array(audioBuf));
        ensureCurrent();
        setResultHash(hash);
      } else if (carrier) {
        setResultType('image');
        const url = carrierType === 'image' && secMode === 'passphrase' && dualVault
          ? await encodeHoneyVault(
              carrier.src,
              rawPayload,
              pass.trim(),
              new TextEncoder().encode(decoyText),
              decoyPass.trim(),
              density,
              maxDimension,
              (pct, status) => setProgress({ pct, status })
            )
          : await encodeImage(
              carrier.src,
              finalPayload,
              secMode === 'passphrase' ? pass.trim() || undefined : undefined,
              density,
              maxDimension,
              (pct, status) => setProgress({ pct, status })
            );

        ensureCurrent(url);
        trackResultUrl(url);
        setResult(url);

        try {
          const resp = await fetch(url);
          const blob = await resp.blob();
          ensureCurrent();
          setResultFile(new File([blob], 'quietsend-carrier.png', { type: 'image/png' }));
          const imgBuf = await blob.arrayBuffer();
          const hash = await calcSha256(new Uint8Array(imgBuf));
          ensureCurrent();
          setResultHash(hash);
        } catch {}
      }

      soundFx.playSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Concealing failed.');
      soundFx.playError();
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const copyHash = async () => {
    if (!resultHash) return;
    soundFx.playClick();
    try {
      await navigator.clipboard.writeText(resultHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      setError('Failed to copy SHA-256 hash to clipboard. Please copy manually.');
      soundFx.playError();
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── Studio Hardware Deck Header ───────────────────────────────────── */}
      <section className="card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/60 border-b-white/5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141a24] text-[#a0aec0] border border-black/50 border-t-white/10 mb-2 shadow-inner">
              <span className="led-dot" />
              <span>
                {isPlaintext
                  ? 'Plaintext Stealth'
                  : secMode === 'asymmetric'
                  ? 'ECDH P-256 · AES-GCM-256'
                  : 'AES-GCM-256 (600k PBKDF2)'}
                {' · '}
                {carrierType === 'audio'
                  ? 'WAV audio LSB-2'
                  : (DENSITY_CHOICES.find((d) => d.id === density)?.label ?? density)}
              </span>
            </div>
            <h2 className="display-md text-[#f7fafc]">
              Steganographic Carrier Studio
            </h2>
            <p className="text-xs text-[#a0aec0] mt-1 max-w-xl">
              Conceal confidential messages, documents & multi-file archives imperceptibly inside lossless photo carriers with authenticated AES-GCM-256 encryption.
            </p>
          </div>

          {(carrier || audioCarrier) && (
            <div className="p-3 rounded-lg card-inset min-w-[200px] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#a0aec0] font-bold">Capacity Used</span>
                <span className={`font-bold ${isOverCapacity ? 'text-[#e57373]' : 'text-[#52b788]'}`}>
                  {usedPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#090c12] rounded-full overflow-hidden p-[1px] border border-black/60 shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, usedPct)}%`,
                    background: isOverCapacity ? '#e57373' : usedPct > 80 ? '#e0a96d' : '#52b788',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#718096]">
                <span>{fmtBytes(largestPayload)}</span>
                <span>Max {fmtBytes(currentCap)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Interactive Test Drive Banner */}
        <div className="card-inset flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#242a38] to-[#181d27] text-[#64b5f6] shadow-sm shrink-0">
              <Sparkles size={15} />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>30-Second Interactive Test Drive</span>
                <span className="rounded bg-[#1c222e] border border-black/40 px-1 py-0.2 font-mono text-[9px] text-[#64b5f6]">
                  1-Click Demo
                </span>
              </p>
              <p className="text-[11px] text-[#718096]">
                Test how data is imperceptibly hidden inside digital photos without configuring files.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickTestDrive}
            className="btn btn-secondary w-full sm:w-auto !py-1.5 !px-3 !text-xs cursor-pointer"
          >
            Launch Test Drive
          </button>
        </div>

        {/* Physical 2-Position Carrier Medium Sliding Rocker Selector */}
        <SkeuoSegmentedControl
          options={[
            { id: 'image', label: 'Image Carrier (PNG / TIFF / WebP)', icon: <ImageIcon size={14} />, activeColor: 'green' },
            { id: 'audio', label: 'Audio Carrier (16-bit PCM WAV)', icon: <Music size={14} />, activeColor: 'green' },
          ]}
          value={carrierType}
          onChange={(val) => {
            setCarrierType(val);
            if (val === 'audio') {
              setDualVault(false);
              setDecoyPass('');
              setDecoyText('');
            }
            setResult(null);
          }}
        />

        {/* ── Step 1: Carrier Intake ─────────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a0aec0] font-mono">
              <span className="step-num">1</span>
              <span>{carrierType === 'image' ? 'Select Carrier Image' : 'Select Carrier Audio'}</span>
            </div>
            {carrierType === 'image' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#718096] bg-[#0d1016] px-2 py-0.5 rounded border border-black/60 shadow-inner">
                <ClipboardPaste size={11} />
                <span>Ctrl + V to paste image</span>
              </span>
            )}
          </div>

          <input
            ref={carrierInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff,image/tif,.tif,.tiff,.zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                loadCarrier(f);
                e.target.value = '';
              }
            }}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/wav,audio/x-wav,.wav"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                loadAudioCarrier(f);
                e.target.value = '';
              }
            }}
          />

          {carrierType === 'image' &&
            (carrier ? (
              <div className="space-y-3">
                <div className="card-inset flex flex-col sm:flex-row items-center justify-between gap-3.5 p-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <img
                      src={carrier.src}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover border border-black/60 shadow-md"
                    />
                    <div className="truncate text-xs font-mono space-y-0.5">
                      <p data-no-translate className="font-bold text-white truncate max-w-xs">{carrier.name}</p>
                      <p className="text-[11px] text-[#52b788]">
                        {carrier.w} × {carrier.h} px · {fmtBytes(carrier.size)}
                      </p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="rounded bg-[#1c222e] border border-black/40 px-1.5 py-0.2 text-[9px] text-[#74c69d]">
                          EXIF Scrubbed
                        </span>
                        <span className="rounded bg-[#1c222e] border border-black/40 px-1.5 py-0.2 text-[9px] text-[#a0aec0]">
                          Room: {fmtBytes(currentCap)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => carrierInputRef.current?.click()}
                      className="btn btn-secondary !px-3 !py-1.5 !text-xs cursor-pointer"
                    >
                      Change Cover
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        trackCarrierUrl(null);
                        setCarrier(null);
                        setResult(null);
                      }}
                      className="btn btn-ghost !p-2 text-[#718096] hover:text-[#e57373]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="card-inset flex items-start gap-2.5 p-3 text-[11px] leading-relaxed text-[#a0aec0]">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#e0a96d]" />
                  <span>
                    <strong className="text-white">OpSec Note:</strong> Use a personal camera original. Public stock photos enable differential subtraction (I_stego - I_orig) that immediately proves altered bits exist.
                  </span>
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                aria-label="Drop your cover image here, or click to browse"
                className={`dropzone group p-7 text-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 ${carrierDrag ? 'drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setCarrierDrag(true);
                }}
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
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#a0aec0] shadow-[0_2px_5px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Drop your cover image here, or click to browse</p>
                    <p className="mt-0.5 text-xs text-[#718096] font-mono">
                      Supports PNG, JPG, WebP, BMP, and TIFF (Converted Losslessly)
                    </p>
                    <p className="mt-1 text-xs text-[#718096]">Transparent areas become white in the saved carrier.</p>
                  </div>
                </div>
              </div>
            ))}

          {carrierType === 'audio' &&
            (audioCarrier ? (
              <div className="card-inset flex items-center justify-between gap-3.5 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-black/60 bg-[#1e2533] text-[#64b5f6]">
                    <Music size={20} />
                  </div>
                  <div className="truncate text-xs font-mono">
                    <p className="font-bold text-white truncate max-w-xs">{audioCarrier.name}</p>
                    <p className="text-[11px] text-[#52b788]">
                      {audioCarrier.sampleRate.toLocaleString()} Hz · {audioCarrier.durationSec.toFixed(1)}s · {fmtBytes(audioCarrier.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    trackAudioUrl(null);
                    setAudioCarrier(null);
                    setResult(null);
                  }}
                  className="btn btn-ghost !p-2 text-[#718096] hover:text-[#e57373]"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                aria-label="Drop WAV audio track here, or click to browse"
                className={`dropzone group p-7 text-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 ${audioDrag ? 'drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setAudioDrag(true);
                }}
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
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#64b5f6] shadow-sm">
                    <Music size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Drop WAV audio track here, or click to browse</p>
                    <p className="mt-0.5 text-xs text-[#718096] font-mono">
                      16-bit PCM uncompressed WAV audio
                    </p>
                  </div>
                </div>
              </div>
            ))}

          {/* Embedding Density Selector */}
          {carrierType === 'image' && carrier && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#a0aec0] uppercase tracking-wide">Embedding density</span>
                <span className="text-[#718096]">{DENSITY_CHOICES.find((d) => d.id === density)?.psnr}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DENSITY_CHOICES.map((choice) => {
                  const active = density === choice.id;
                  const cap = carrier ? calculateCapacity(scaledDim.w, scaledDim.h, choice.id) : 0;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setDensity(choice.id);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-black/50 border-t-white/20 bg-gradient-to-b from-[#252c3b] to-[#171c26] shadow-sm'
                          : 'card-inset opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className={`block text-xs font-bold ${active ? 'text-[#52b788]' : 'text-[#a0aec0]'}`}>
                        {choice.label}
                      </span>
                      <span className="block text-[10px] font-mono text-[#718096] mt-0.5">
                        {fmtBytes(dualVault ? dualVaultCapacity(cap) : cap)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Step 2: Payload Selection ──────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a0aec0] font-mono">
              <span className="step-num">2</span>
              <span>Secret Payload Type</span>
            </div>

            <SkeuoSegmentedControl
              size="sm"
              options={[
                { id: 'text', label: 'Text Note', icon: <FileText size={13} />, activeColor: 'green' },
                { id: 'files', label: 'GhostVault (Files)', icon: <Files size={13} />, activeColor: 'green' },
              ]}
              value={mode}
              onChange={(val) => setMode(val)}
              className="w-56 sm:w-64"
            />
          </div>

          {mode === 'text' ? (
            <textarea
              placeholder="Enter confidential message to encrypt and conceal…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="field resize-none leading-relaxed"
            />
          ) : (
            <div className="space-y-2">
              <input
                ref={filesInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    loadSecretFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <div
                role="button"
                tabIndex={0}
                aria-label="Drop secret files to pack into GhostVault, or browse"
                className="dropzone p-5 text-center cursor-pointer border-dashed focus-visible:ring-2 focus-visible:ring-emerald-400"
                onClick={() => filesInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    filesInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onFilesDrop}
              >
                <Files className="mx-auto mb-1 text-[#64b5f6]" size={18} />
                <p className="text-xs font-bold text-white">Drop secret files to pack into GhostVault, or browse</p>
                <p className="text-[11px] text-[#718096]">Supports documents, binaries, PDFs, images, archives</p>
              </div>

              {files.map((f, i) => (
                <div
                  key={`${f.name}-${f.data.length}-${i}`}
                  className="card-inset flex items-center justify-between gap-2 p-2.5 text-xs animate-fade-in"
                >
                  <span data-no-translate className="truncate font-semibold text-white">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[#64b5f6]">{fmtBytes(f.data.length)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setFiles((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      className="btn btn-ghost !p-1 text-[#718096] hover:text-[#e57373]"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {carrier && (mode === 'text' ? text.length > 0 : files.length > 0) && (
            <div className="mt-3">
              <PayloadFootprint
                src={carrier.src}
                width={scaledDim.w}
                height={scaledDim.h}
                payloadBytes={totalPayloadBytes}
                density={density}
              />
            </div>
          )}
        </div>

        {/* ── Step 3: Cryptographic Protocol ─────────────────────────────── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a0aec0] font-mono">
              <span className="step-num">3</span>
              <span>Cryptographic Protocol Selection</span>
            </div>

            {onOpenKeyring && (
              <button
                type="button"
                onClick={onOpenKeyring}
                className="flex items-center gap-1 text-[11px] font-bold text-[#b39ddb] hover:text-white cursor-pointer font-mono"
              >
                <Key size={12} />
                <span>Keyring Studio</span>
              </button>
            )}
          </div>

          <SkeuoSegmentedControl
            options={[
              { id: 'passphrase', label: 'Passphrase / Honey-Vault', icon: <Lock size={13} />, activeColor: 'green' },
              { id: 'asymmetric', label: 'Recipient Public Key (ECDH)', icon: <Key size={13} />, activeColor: 'purple' },
            ]}
            value={secMode}
            onChange={(val) => {
              setSecMode(val);
              if (val === 'asymmetric') {
                setDualVault(false);
                setDecoyPass('');
                setDecoyText('');
              }
            }}
          />

          {secMode === 'passphrase' ? (
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter encryption passphrase (leave empty for plaintext)…"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="field field-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 btn btn-ghost !p-1.5 text-[#718096] hover:text-white"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePass}
                  className="btn btn-secondary shrink-0 !px-3 cursor-pointer"
                  title="Generate High-Entropy Passphrase"
                >
                  <Sparkles size={14} className="text-[#e0a96d]" />
                  <span className="hidden sm:inline">Generate</span>
                </button>
              </div>

              {pass.length > 0 && (
                <div className="space-y-1 animate-fade-in">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Confirm passphrase…"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="field field-mono"
                  />
                  {confirmPass.length > 0 && (
                    <p
                      className={`text-[11px] font-mono font-bold ${
                        confirmPass === pass ? 'text-[#52b788]' : 'text-[#e57373]'
                      }`}
                    >
                      {confirmPass === pass ? '✓ Passphrases Match' : '✗ Passphrases Do Not Match'}
                    </p>
                  )}
                </div>
              )}

              <EntropyBar pass={pass} />

              {isPlaintext ? (
                <div className="card-inset flex items-start gap-2.5 p-3 text-[11px] leading-relaxed text-[#e0a96d]">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-white">This payload will not be encrypted</p>
                    <p>
                      With no passphrase, message is hidden but readable by anyone who extracts it.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Physical Sliding Decoy Vault Switch */}
              {carrierType === 'image' && (
                <SkeuoToggle
                  checked={dualVault}
                  onChange={(checked) => setDualVault(checked)}
                  icon={<Shield size={15} />}
                  label="Add a Plausibly Deniable Decoy Vault"
                  description="Hides two distinct payload layers under separate passphrases in the same carrier."
                  badge="Dual-Vault"
                />
              )}

              {dualVault && carrierType === 'image' && (
                <div className="card-inset p-3 space-y-2 animate-fade-in">
                  <p className="text-[11px] text-[#a0aec0]">
                    Decoy passphrase opens the decoy payload under coercion, leaving the primary payload hidden.
                  </p>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Decoy passphrase…"
                    value={decoyPass}
                    onChange={(e) => setDecoyPass(e.target.value)}
                    className="field field-mono text-xs"
                  />
                  <textarea
                    placeholder="Decoy message…"
                    value={decoyText}
                    onChange={(e) => setDecoyText(e.target.value)}
                    rows={2}
                    className="field text-xs resize-none"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="card-inset space-y-3 p-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#b39ddb] flex items-center justify-between font-mono">
                  <span>Select Recipient Public Key:</span>
                  {onOpenKeyring && (
                    <button
                      type="button"
                      onClick={onOpenKeyring}
                      className="text-[10px] text-[#64b5f6] hover:underline cursor-pointer"
                    >
                      + Add New Contact
                    </button>
                  )}
                </label>

                {contacts.length > 0 && (
                  <select
                    value={selectedContactId}
                    onChange={(e) => {
                      setSelectedContactId(e.target.value);
                      setCustomPublicArmor('');
                      setSelfEncryptAcknowledged(false);
                    }}
                    className="field text-xs"
                  >
                    <option value="">Select Stored Contact ({contacts.length} available)…</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.fingerprint})
                      </option>
                    ))}
                  </select>
                )}

                <textarea
                  placeholder="Or paste -----BEGIN QUIETSEND PUBLIC KEY----- armor block…"
                  value={customPublicArmor}
                  onChange={(e) => {
                    setCustomPublicArmor(e.target.value);
                    setSelectedContactId('');
                    setSelfEncryptAcknowledged(false);
                  }}
                  rows={3}
                  className="field field-mono text-xs resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="animate-shake flex items-start gap-2.5 rounded-xl border border-black/60 border-t-red-400/30 bg-[#2d1616] p-3.5 text-[13px] leading-relaxed text-[#fee2e2] shadow-[var(--shadow-raised-sm)]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#e57373]" />
            <span>{error}</span>
          </div>
        )}

        {/* Physical Action Button */}
        <button
          type="button"
          onClick={encode}
          aria-label={pendingFileReads > 0 ? `Reading ${pendingFileReads} payload file(s)` : undefined}
          disabled={loading || pendingFileReads > 0}
          className="btn-primary w-full !py-3.5 !text-base cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin" size={17} />
              <span>{progress?.status || 'Processing Steganographic Container…'}</span>
            </>
          ) : (
            <>
              <Lock size={17} />
              <span>
                {isPlaintext ? 'Conceal' : 'Conceal & Encrypt'}{' '}
                {carrierType === 'image' ? 'Stego Image' : 'Stego Audio'}
              </span>
            </>
          )}
        </button>
      </section>

      {/* ── Result: Physical Output Module ─────────────────────────────────── */}
      {result && (
        <section ref={resultRef} className="card animate-rise p-5 sm:p-6 space-y-4 scroll-mt-6">
          <div className="flex items-center justify-between pb-3 border-b border-black/60 border-b-white/5">
            <div className="flex items-center gap-2 text-[#52b788] font-bold">
              <CheckCircle2 size={18} />
              <h3 className="text-sm font-sans text-white">Lossless Container Ready for Dispatch</h3>
            </div>
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="btn btn-secondary !py-1 !px-2.5 !text-xs cursor-pointer"
              >
                <Share2 size={12} className="text-[#64b5f6]" />
                <span>Zero-Loss Guide</span>
              </button>
            )}
          </div>

          <div className="card-inset flex justify-center p-3">
            {resultType === 'image' ? (
              <img
                src={result}
                alt="Steganographic Output"
                className="max-h-72 w-full object-contain rounded"
              />
            ) : (
              <div className="text-center py-6">
                <Music size={40} className="mx-auto text-[#64b5f6] mb-2" />
                <p className="font-bold text-white text-sm">WAV Audio Container Encoded</p>
                <audio src={result} controls className="mt-3 mx-auto" />
              </div>
            )}
          </div>

          {resultHash && (
            <div className="card-inset flex items-center justify-between gap-2 p-2.5 text-xs font-mono">
              <span className="text-[#718096] truncate">SHA-256: {resultHash}</span>
              <button
                type="button"
                onClick={copyHash}
                className="btn btn-ghost !p-1 text-[#a0aec0] hover:text-white"
              >
                {copiedHash ? <Check size={12} className="text-[#52b788]" /> : <Copy size={12} />}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {resultType === 'image' && (
              <button
                type="button"
                onClick={() => downloadZip(result, 'quietsend-carrier.zip')}
                className="btn-primary w-full !py-3 cursor-pointer"
              >
                <Download size={16} />
                <span>Download 1-Click PKZIP Package (Recommended)</span>
              </button>
            )}

            {resultFile && (
              <a
                href={result}
                download={resultFile.name}
                onClick={() => soundFx.playClick()}
                className="btn btn-secondary w-full !py-2.5 cursor-pointer text-xs font-bold"
              >
                <Download size={14} />
                <span>Download Lossless File ({resultFile.name})</span>
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
