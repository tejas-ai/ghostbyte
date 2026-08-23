import React, { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
import {
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  Upload,
  RotateCcw,
  Copy,
  Check,
  FileText,
  File as FileIcon,
  Package,
  Sparkles,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  X,
  ClipboardPaste,
  Music,
  Key,
  ShieldCheck,
  Share2,
  Lock,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  decodeImage,
  downloadBlob,
  readImageFile,
  calcSha256,
  unpackPayload,
  type DecodeResult,
  type EmbeddedFile,
} from '../services/stegaEngine';
import {
  getStoredKeyring,
  isAsymmetricPayload,
  decryptWithPrivateKey,
  type KeyPairInfo,
} from '../services/asymmetricCrypto';
import {
  parseWavHeader,
  decodeWavAudio,
} from '../services/audioStegaEngine';
import { soundFx } from '../services/soundFx';

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

function FileChip({ name, data }: { name: string; data: Uint8Array }) {
  const [hash, setHash] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    calcSha256(data).then(setHash);
  }, [data]);

  const copyHash = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl glass-3d text-xs font-mono gap-2">
      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
        <FileIcon size={15} className="text-pink-400 shrink-0" />
        <div className="truncate min-w-0">
          <span className="truncate text-white font-bold block">{name}</span>
          {hash && (
            <span className="text-[10px] text-slate-400 font-mono truncate block">
              SHA-256: {hash.slice(0, 16)}...
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-pink-300 font-semibold">{fmtBytes(data.length)}</span>
        {hash && (
          <button
            type="button"
            onClick={copyHash}
            title="Copy SHA-256 Hash"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            downloadBlob(data, name);
          }}
          className="px-3 py-1.5 rounded-lg btn-3d-purple text-white flex items-center gap-1 cursor-pointer font-bold"
        >
          <Download size={12} />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}

interface DecoderProps {
  onOpenKeyring?: () => void;
}

export default function Decoder({ onOpenKeyring }: DecoderProps) {
  const { t } = useLanguage();

  // Stego Carrier State (Image or Audio)
  const [carrierKind, setCarrierKind] = useState<'image' | 'audio'>('image');
  const [stegoSrc, setStegoSrc] = useState<string | null>(null);
  const [stegoName, setStegoName] = useState<string>('');
  const [audioBuffer, setAudioBuffer] = useState<ArrayBuffer | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Decryption Mode: 'passphrase' vs 'keyring'
  const [decryptMethod, setDecryptMethod] = useState<'passphrase' | 'keyring'>('passphrase');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [keyring, setKeyring] = useState<KeyPairInfo[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');

  // Processing & Results
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; status: string } | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [textHash, setTextHash] = useState<string>('');

  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [result]);

  useEffect(() => {
    const keys = getStoredKeyring();
    setKeyring(keys);
    if (keys.length > 0) {
      setSelectedKeyId(keys[0].id);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (stegoSrc && stegoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(stegoSrc);
      }
    };
  }, [stegoSrc]);

  const loadStegoFile = useCallback(async (file: File) => {
    soundFx.playClick();
    setError('');
    setResult(null);
    setTextHash('');

    if (file.name.toLowerCase().endsWith('.wav') || file.type.includes('audio')) {
      // Audio carrier
      try {
        const buf = await file.arrayBuffer();
        parseWavHeader(buf); // validate
        setCarrierKind('audio');
        setAudioBuffer(buf);
        setStegoName(file.name);
        setStegoSrc(URL.createObjectURL(file));
      } catch (err: any) {
        setError(err?.message || 'Invalid WAV audio file.');
        soundFx.playError();
      }
    } else {
      // Image carrier
      try {
        if (stegoSrc && stegoSrc.startsWith('blob:')) {
          URL.revokeObjectURL(stegoSrc);
        }
        const { src } = await readImageFile(file);
        setCarrierKind('image');
        setAudioBuffer(null);
        setStegoSrc(src);
        setStegoName(file.name || 'clipboard-stego.png');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to parse image file. Please select a valid PNG, JPG, WebP, or BMP image.');
        soundFx.playError();
      }
    }
  }, [stegoSrc]);

  // Direct Clipboard (Ctrl + V) Ingestion
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const item = e.clipboardData.files[0];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          loadStegoFile(item);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadStegoFile]);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) loadStegoFile(f);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      loadStegoFile(f);
      e.target.value = '';
    }
  };

  const clearStego = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    if (stegoSrc && stegoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(stegoSrc);
    }
    setStegoSrc(null);
    setAudioBuffer(null);
    setStegoName('');
    setResult(null);
    setTextHash('');
    setError('');
  };

  const decode = async () => {
    if (!stegoSrc && !audioBuffer) return;
    setLoading(true);
    setProgress({ pct: 5, status: 'Initializing bitstream analyzer...' });
    setError('');
    setResult(null);
    setTextHash('');
    soundFx.playScan();

    try {
      // Determine decryption secret / private key
      let secretParam = pass.trim() || undefined;
      if (decryptMethod === 'keyring') {
        const key = keyring.find((k) => k.id === selectedKeyId) || keyring[0];
        if (key) {
          secretParam = key.privateKeyArmor;
        }
      }

      if (carrierKind === 'audio' && audioBuffer) {
        setProgress({ pct: 30, status: 'Scanning 16-bit PCM audio samples...' });
        const rawExtracted = await decodeWavAudio(audioBuffer, 2, (pct, status) => setProgress({ pct, status }));

        let finalData = rawExtracted;
        if (isAsymmetricPayload(rawExtracted)) {
          if (!secretParam) {
            throw new Error('This audio file is asymmetrically encrypted. Please select your Keyring Identity to unlock.');
          }
          finalData = await decryptWithPrivateKey(rawExtracted, secretParam);
        } else if (secretParam) {
          // If symmetric AES encrypted wire: [salt:16][iv:12][ct]
          if (rawExtracted.length > 28) {
            const salt = new Uint8Array(rawExtracted.subarray(0, 16));
            const iv = new Uint8Array(rawExtracted.subarray(16, 28));
            const ct = new Uint8Array(rawExtracted.subarray(28));
            const pwBytes = new TextEncoder().encode(secretParam);
            const keyMaterial = await crypto.subtle.importKey('raw', pwBytes, 'PBKDF2', false, ['deriveKey']);
            const key = await crypto.subtle.deriveKey(
              { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
              keyMaterial,
              { name: 'AES-GCM', length: 256 },
              false,
              ['decrypt']
            );
            const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
            finalData = new Uint8Array(pt);
          }
        }

        const unpacked = unpackPayload(finalData);
        setResult(unpacked);
        if (unpacked.type === 'text') {
          const hash = await calcSha256(new TextEncoder().encode(unpacked.content));
          setTextHash(hash);
        }
      } else if (stegoSrc) {
        const decodedResult = await decodeImage(
          stegoSrc,
          secretParam,
          (pct, status) => setProgress({ pct, status })
        );
        setResult(decodedResult);
        if (decodedResult.type === 'text') {
          const hash = await calcSha256(new TextEncoder().encode(decodedResult.content));
          setTextHash(hash);
        }
      }

      soundFx.playSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Extraction failed. Ensure this carrier contains a QuietSend payload and that your password/key is correct.');
      soundFx.playError();
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const copyText = (content: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadAllVaultFiles = async (vaultFiles: EmbeddedFile[]) => {
    soundFx.playClick();
    for (let i = 0; i < vaultFiles.length; i++) {
      const f = vaultFiles[i];
      downloadBlob(f.data, f.name);
      await new Promise((res) => setTimeout(res, 250));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="glass-3d-purple p-6 sm:p-8 space-y-6">
        {/* Header Title */}
        <div className="pb-6 border-b border-white/[0.1]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-pill-3d text-pink-300 text-[11px] font-mono font-bold mb-2">
            <Unlock size={12} className="text-pink-400" />
            <span>LSB-4 / LSB-6 & WAV Audio Bitstream Extractor</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
            {t.decoder.title || 'Extract & Decrypt Payload'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-medium">
            {t.decoder.desc || 'Recover hidden files or confidential messages embedded inside a steganographic image or audio track.'}
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 — Stego Carrier Ingestion */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-400 font-mono">
                <span className="w-5 h-5 rounded bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  1
                </span>
                <span>Stego Carrier Ingestion (Image or Audio)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-pink-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                <ClipboardPaste size={12} />
                <span>Drop image / audio or Ctrl+V</span>
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,image/png,image/jpeg,image/webp,image/bmp,image/tiff,.tif,.tiff,.zip,audio/wav,.wav"
              className="hidden"
              onChange={onInputChange}
            />

            {stegoSrc ? (
              <div className="p-4 rounded-xl glass-3d flex flex-col sm:flex-row items-center justify-between gap-4 border-pink-400/40">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  {carrierKind === 'image' ? (
                    <img
                      src={stegoSrc}
                      alt="Stego Carrier"
                      className="w-16 h-16 rounded-lg object-cover border border-white/20 shrink-0 bg-black"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                      <Music size={24} />
                    </div>
                  )}
                  <div className="truncate text-xs font-mono space-y-1">
                    <p className="font-bold text-white truncate max-w-[240px] sm:max-w-xs">{stegoName}</p>
                    <p className="text-[11px] text-pink-300">
                      {carrierKind === 'image' ? 'Image Carrier Ready for Extraction' : '16-bit PCM WAV Audio Ready'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Change File
                  </button>
                  <button
                    type="button"
                    onClick={clearStego}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                    title="Remove carrier"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`dropzone-3d p-8 text-center transition-all ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-pink-400 shadow-md">
                    <Upload size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Drop carrier image (.png, .zip) or audio (.wav) here</p>
                    <p className="text-xs text-slate-400">QuietSend auto-detects LSB-4, LSB-6, and PCM audio payloads</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2 — Decryption Credentials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-400 font-mono">
                <span className="w-5 h-5 rounded bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  2
                </span>
                <span>Decryption Authorization</span>
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
                  setDecryptMethod('passphrase');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  decryptMethod === 'passphrase'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Unlock size={13} />
                <span>Passphrase / Duress Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setDecryptMethod('keyring');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  decryptMethod === 'keyring'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Key size={13} />
                <span>My Keyring Private Key</span>
              </button>
            </div>

            {decryptMethod === 'passphrase' ? (
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Leave this field completely BLANK if no password was set..."
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="w-full px-4 py-2.5 pr-20 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-400 transition-colors font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {pass.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPass('')}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] font-mono bg-white/10 px-1.5 py-0.5"
                        title="Clear field"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  💡 <strong className="text-slate-300">Tip:</strong> If you created this image without a password, leave this box <strong>completely empty</strong>. Do not paste the SHA-256 fingerprint hash here.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <label className="text-[11px] font-bold text-purple-300">Select Local Identity Keypair:</label>
                {keyring.length > 0 ? (
                  <select
                    value={selectedKeyId}
                    onChange={(e) => setSelectedKeyId(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-black/70 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    {keyring.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} (Fingerprint: {k.fingerprint})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-400">No keyring identity found. Open Keyring Studio to generate one.</p>
                )}
              </div>
            )}
          </div>

          {/* Action Trigger */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={decode}
            disabled={loading || (!stegoSrc && !audioBuffer)}
            className="w-full py-3.5 rounded-xl btn-3d-purple text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RotateCcw className="animate-spin" size={16} />
                <span>{progress?.status || 'Decrypting Payload...'}</span>
              </>
            ) : (
              <>
                <Unlock size={16} />
                <span>Extract & Decrypt Secret Payload</span>
              </>
            )}
          </button>

          {/* Decoded Results Section — Rendered Inline for Instant Visibility */}
          {result && (
            <div
              ref={resultRef}
              className="mt-6 p-5 sm:p-6 rounded-2xl bg-[#080d1a]/95 border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] space-y-5 animate-fade-in"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>{result.isDecoy ? 'Honey-Vault Decoy Payload Unlocked' : 'Secret Payload Extracted Successfully'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        DECRYPTED
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Payload verified with authenticated cryptographic integrity.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {result.isDecoy && (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      PLAUSIBLE DENIABILITY DECOY
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setResult(null);
                      setTextHash('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {result.type === 'text' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-mono font-bold flex items-center gap-1.5">
                      <span>Decrypted Message Content:</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({result.content.length} characters)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(result.content)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      {copied ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy Secret Text'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-black/90 border border-emerald-500/30 text-xs sm:text-sm text-slate-100 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto select-all shadow-inner">
                    {result.content || <span className="text-slate-500 italic">(Empty text message payload)</span>}
                  </div>

                  {textHash && (
                    <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-[10px] text-slate-400 font-mono flex items-center justify-between gap-2">
                      <span>SHA-256 Checksum:</span>
                      <span className="text-emerald-300 truncate">{textHash}</span>
                    </div>
                  )}
                </div>
              )}

              {result.type === 'file' && (
                <div className="space-y-3">
                  <span className="text-xs text-slate-300 font-bold">Extracted GhostFile Container:</span>
                  <FileChip name={result.name} data={result.data} />
                </div>
              )}

              {result.type === 'vault' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-bold">
                      Extracted GhostVault Multi-File Archive ({result.files.length} items):
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadAllVaultFiles(result.files)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                    >
                      <Download size={13} />
                      <span>Download All Files</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {result.files.map((f, i) => (
                      <FileChip key={i} name={f.name} data={f.data} />
                    ))}
                  </div>
                </div>
              )}

              {result.type === 'binary' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-3">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <Lock size={16} />
                      <span>Encrypted Secret Payload Detected ({result.data.length} Bytes)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-100/90">
                      This photo contains an <strong>encrypted secret payload</strong>. If you set a password during encoding, enter it below to decrypt and reveal your secret text:
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="relative w-full">
                        <input
                          type={showPass ? 'text' : 'password'}
                          placeholder="Enter your decryption password..."
                          value={pass}
                          onChange={(e) => setPass(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') decode();
                          }}
                          className="w-full px-3 py-2 pr-10 rounded-lg bg-black/80 border border-white/20 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={decode}
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Unlock size={14} />
                        <span>Decrypt Secret Text</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10 text-xs font-mono">
                    <span className="text-slate-300">Raw Binary Stream:</span>
                    <button
                      type="button"
                      onClick={() => downloadBlob(result.data, 'quietsend-payload.bin')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer text-xs"
                    >
                      <Download size={12} />
                      <span>Download Raw Stream ({result.data.length} B)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
