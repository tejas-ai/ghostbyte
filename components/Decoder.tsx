import React, { useState, useEffect, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import {
  Unlock,
  Key,
  Download,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Music,
  FileText,
  Package,
  X,
  ClipboardPaste,
  CheckCircle2,
  Inbox,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  decodeImage,
  downloadBlob,
  readImageFile,
  decodePayload,
  calcSha256,
  type DecodeResult,
  type EmbeddedFile,
} from '../services/stegaEngine';
import { decodeWavAudio, parseWavHeader } from '../services/audioStegaEngine';
import {
  getStoredKeyring,
  type KeyPairInfo,
} from '../services/asymmetricCrypto';
import { useRevocableUrl } from '../hooks/useRevocableUrl';
import { soundFx } from '../services/soundFx';
import SkeuoSegmentedControl from './SkeuoSegmentedControl';

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function FileChip({ name, data }: { name: string; data: Uint8Array }) {
  return (
    <div className="card-inset flex items-center justify-between gap-3 p-3 animate-fade-in">
      <div className="flex items-center gap-2.5 truncate">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-black/50 bg-[#1e2533] text-[#64b5f6]">
          <FileText size={15} />
        </div>
        <div className="truncate text-xs font-mono">
          <p className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{name}</p>
          <p className="text-[11px] text-[#718096]">{fmtBytes(data.length)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          soundFx.playClick();
          downloadBlob(data, name);
        }}
        className="btn btn-secondary shrink-0 !px-3 !py-1.5 !text-xs cursor-pointer"
      >
        <Download size={13} />
        <span>Save</span>
      </button>
    </div>
  );
}

interface DecoderProps {
  onOpenKeyring?: () => void;
  active?: boolean;
}

export default function Decoder({ onOpenKeyring, active = true }: DecoderProps) {
  const { t } = useLanguage();

  const [carrierKind, setCarrierKind] = useState<'image' | 'audio'>('image');
  const [stegoSrc, setStegoSrc] = useState<string | null>(null);
  const trackStegoUrl = useRevocableUrl();
  const [stegoName, setStegoName] = useState<string>('');
  const [audioBuffer, setAudioBuffer] = useState<ArrayBuffer | null>(null);

  const [decryptMethod, setDecryptMethod] = useState<'passphrase' | 'keyring'>('passphrase');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [keyring, setKeyring] = useState<KeyPairInfo[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; status: string } | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [carrierHash, setCarrierHash] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);

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
    const refreshKeyring = () => {
      const keys = getStoredKeyring();
      setKeyring(keys);
      setSelectedKeyId((current) => keys.some((key) => key.id === current) ? current : (keys[0]?.id ?? ''));
    };
    window.addEventListener('quietsend:keyring-updated', refreshKeyring);
    return () => window.removeEventListener('quietsend:keyring-updated', refreshKeyring);
  }, []);

  const loadStegoFile = useCallback(
    async (file: File) => {
      soundFx.playClick();
      setError('');
      setResult(null);
      setAuthenticated(false);

      const isAudio = file.name.toLowerCase().endsWith('.wav') || file.type.includes('audio');
      if (isAudio && file.size > 100 * 1024 * 1024) {
        setError(`Carrier audio size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 100 MB safety limit.`);
        soundFx.playError();
        return;
      }

      try {
        const fileBuffer = await file.arrayBuffer();
        const hash = await calcSha256(new Uint8Array(fileBuffer));
        setCarrierHash(hash);

        if (isAudio) {
          parseWavHeader(fileBuffer);
          const url = URL.createObjectURL(file);
          trackStegoUrl(url);
          setCarrierKind('audio');
          setAudioBuffer(fileBuffer);
          setStegoName(file.name);
          setStegoSrc(url);
        } else {
          const { src } = await readImageFile(file);
          trackStegoUrl(src);
          setCarrierKind('image');
          setAudioBuffer(null);
          setStegoSrc(src);
          setStegoName(file.name || 'carrier.png');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to parse carrier file.');
        soundFx.playError();
      }
    },
    [trackStegoUrl]
  );

  useEffect(() => {
    if (!active) return;
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
  }, [active, loadStegoFile]);

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
    trackStegoUrl(null);
    setStegoSrc(null);
    setAudioBuffer(null);
    setStegoName('');
    setResult(null);
    setCarrierHash('');
    setError('');
  };

  const copyCarrierHash = () => {
    if (!carrierHash) return;
    soundFx.playClick();
    navigator.clipboard.writeText(carrierHash).then(() => {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    });
  };

  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const decode = async () => {
    if (!stegoSrc && !audioBuffer) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);
    setProgress({ pct: 5, status: 'Initializing bitstream demultiplexer…' });
    setError('');
    setResult(null);
    setAuthenticated(false);
    soundFx.playScan();

    try {
      const secretParam = decryptMethod === 'passphrase' ? pass.trim() || undefined : undefined;
      const selectedKey = keyring.find((key) => key.id === selectedKeyId) ?? keyring[0];
      const privateKeys = decryptMethod === 'keyring' && selectedKey ? [selectedKey.privateKeyArmor] : [];
      let extractedResult: DecodeResult;

      if (carrierKind === 'audio' && audioBuffer) {
        setProgress({ pct: 30, status: 'Probing 16-bit PCM WAV bitplanes…' });
        const rawPayload = await decodeWavAudio(audioBuffer, 2, (pct, status) =>
          setProgress({ pct, status })
        );

        if (controller.signal.aborted) throw new Error('Extraction cancelled by user.');

        extractedResult = await decodePayload(rawPayload, secretParam,
          (pct, status) => setProgress({ pct, status }), controller.signal, privateKeys);
      } else if (stegoSrc) {
        extractedResult = await decodeImage(
          stegoSrc,
          secretParam,
          (pct, status) => setProgress({ pct, status }),
          controller.signal,
          privateKeys,
        );
      } else {
        throw new Error('No carrier media loaded.');
      }

      if (controller.signal.aborted) throw new Error('Extraction cancelled by user.');
      setResult(extractedResult);
      setAuthenticated(Boolean(extractedResult.authenticated));
      soundFx.playSuccess();
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : 'Extraction failed. Ensure this carrier contains a QuietSend payload and that your password/key is correct.'
      );
      soundFx.playError();
    } finally {
      setLoading(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  const copyText = (content: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => setError('Could not copy to clipboard. Select and copy the text manually.'));
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
    <div className="space-y-4 animate-fade-in">
      <section className="card p-5 sm:p-6 space-y-4">
        {/* Header Spec */}
        <div className="pb-4 border-b border-black/60 border-b-white/5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141a24] text-[#a0aec0] border border-black/50 border-t-white/10 mb-2 shadow-inner">
            <span className="led-dot bg-[#64b5f6] shadow-[0_0_4px_#64b5f6]" />
            <span>LSB Spatial Demultiplexer & WAV Bitplane Extractor</span>
          </div>
          <h2 className="display-md text-[#f7fafc]">
            Extract & Decrypt Payload
          </h2>
          <p className="text-xs text-[#a0aec0] mt-1 max-w-xl">
            Recover hidden files or confidential messages embedded inside a steganographic image or audio track.
          </p>
        </div>

        <div className="space-y-4">
          {/* Step 1 — Carrier Ingestion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a0aec0] font-mono">
                <span className="step-num step-num-blue">1</span>
                <span>Stego Carrier Ingestion (Image or Audio)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#718096] bg-[#0d1016] px-2 py-0.5 rounded border border-black/60 shadow-inner">
                <ClipboardPaste size={11} />
                <span>Drop or Ctrl + V</span>
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,image/png,image/jpeg,image/webp,image/bmp,image/tiff,.tif,.tiff,.zip,audio/wav,.wav"
              className="hidden"
              onChange={onInputChange}
            />

            {stegoSrc || audioBuffer ? (
              <div className="space-y-2 animate-fade-in">
                <div className="card-inset flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-l-2 border-l-[#64b5f6]">
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    {stegoSrc ? (
                      <img
                        src={stegoSrc}
                        alt="Stego carrier"
                        className="h-14 w-14 shrink-0 rounded-lg object-cover border border-black/60 shadow-md"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-black/60 bg-[#1e2533] text-[#64b5f6]">
                        <Music size={20} />
                      </div>
                    )}
                    <div className="truncate text-xs font-mono">
                      <p data-no-translate className="font-bold text-white truncate max-w-xs">{stegoName}</p>
                      <p className="text-[11px] text-[#64b5f6] font-bold">
                        {carrierKind === 'image' ? 'Image Carrier Loaded' : '16-bit PCM WAV Audio Loaded'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary !px-3 !py-1.5 !text-xs cursor-pointer"
                    >
                      Change File
                    </button>
                    <button
                      type="button"
                      onClick={clearStego}
                      className="btn btn-ghost !p-2 text-[#718096] hover:text-[#e57373]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {carrierHash && (
                  <div className="card-inset flex items-center justify-between gap-2 p-2.5 text-xs font-mono">
                    <span className="text-[#718096] truncate">Carrier SHA-256: {carrierHash}</span>
                    <button
                      type="button"
                      onClick={copyCarrierHash}
                      className="btn btn-ghost !p-1 text-[#a0aec0] hover:text-white"
                      title="Copy Carrier SHA-256 Digest"
                    >
                      {copiedHash ? <Check size={12} className="text-[#52b788]" /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                aria-label="Drop carrier image or audio here, or click to browse"
                className={`dropzone group p-7 text-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="flex flex-col items-center gap-2.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] text-[#a0aec0] shadow-sm">
                    <Inbox size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Drop carrier image (.png, .zip) or audio (.wav) here</p>
                    <p className="mt-0.5 text-xs text-[#718096] font-mono">
                      QuietSend auto-detects LSB-1 through LSB-6 and PCM audio bitstreams
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2 — Decryption Authorization */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a0aec0] font-mono">
                <span className="step-num step-num-blue">2</span>
                <span>Decryption Authorization</span>
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
                { id: 'passphrase', label: 'Passphrase / Duress Code', icon: <Unlock size={13} />, activeColor: 'blue' },
                { id: 'keyring', label: 'My Keyring Private Key', icon: <Key size={13} />, activeColor: 'purple' },
              ]}
              value={decryptMethod}
              onChange={(val) => setDecryptMethod(val)}
            />

            {decryptMethod === 'passphrase' ? (
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Leave empty if no passphrase was set…"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') decode();
                    }}
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
                <p className="text-[11px] text-[#718096]">
                  Supports standard passphrases, dual-vault decoy passcodes, and plaintext auto-fallback.
                </p>
              </div>
            ) : (
              <div className="card-inset p-3 space-y-2">
                <label className="text-xs font-bold text-[#b39ddb] font-mono">
                  Select Local Identity Keypair:
                </label>
                {keyring.length > 0 ? (
                  <select
                    value={selectedKeyId}
                    onChange={(e) => setSelectedKeyId(e.target.value)}
                    className="field text-xs"
                  >
                    {keyring.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.fingerprint})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-[#718096]">
                    No keyring identity found. Open Keyring Studio to generate one.
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="animate-shake flex items-start gap-2.5 rounded-xl border border-black/60 border-t-red-400/30 bg-[#2d1616] p-3.5 text-[13px] leading-relaxed text-[#fee2e2] shadow-[var(--shadow-raised-sm)]" role="alert" aria-live="polite">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#e57373]" />
              <span>{error}</span>
            </div>
          )}

          {/* Physical Push Action Button in Electric Azure with Cancel support */}
          {loading ? (
            <div className="flex gap-2 w-full">
              <button
                type="button"
                disabled
                className="btn-azure flex-1 !py-3.5 !text-sm sm:!text-base cursor-not-allowed opacity-90"
              >
                <span className="flex items-center justify-center gap-2" role="status" aria-live="polite">
                  <RefreshCw className="animate-spin shrink-0" size={17} />
                  <span className="truncate">{progress?.status || 'Decrypting Payload…'}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  abortControllerRef.current?.abort();
                }}
                className="btn btn-secondary !px-4 !py-3.5 !text-xs font-bold text-red-400 hover:text-red-300 hover:border-red-400/40 cursor-pointer shrink-0"
                aria-label="Cancel decryption"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={decode}
              disabled={!stegoSrc && !audioBuffer}
              className="btn-azure w-full !py-3.5 !text-base cursor-pointer"
            >
              <Unlock size={17} />
              <span>Extract & Decrypt Secret Payload</span>
            </button>
          )}

          {/* Decoded Results Section */}
          {result && (
            <div ref={resultRef} className="card animate-rise p-5 sm:p-6 space-y-4 scroll-mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/60 border-b-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/60 border-t-white/30 bg-gradient-to-b from-[#52b788] to-[#388a62] text-[#071a10] shadow-sm shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-sans font-bold text-white flex items-center gap-2">
                      <span>
                        {result.isDecoy
                          ? 'Honey-Vault Decoy Payload Unlocked'
                          : 'Secret Payload Extracted Successfully'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#718096]">
                      {authenticated
                        ? decryptMethod === 'keyring'
                          ? 'Decrypted with recipient private key. Does not prove sender identity.'
                          : 'Payload decrypted and integrity-verified with AES-GCM-256.'
                        : 'Payload extracted without encryption or authentication.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {result.isDecoy && (
                    <span className="rounded bg-[#282117] border border-[#e0a96d]/40 px-2 py-0.5 font-mono text-[9px] font-bold text-[#e0a96d]">
                      DECOY VAULT
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setResult(null);
                      setAuthenticated(false);
                    }}
                    className="btn btn-ghost !p-1 text-[#a0aec0] hover:text-[#e57373]"
                    aria-label="Close extracted payload"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {decryptMethod === 'keyring' && (
                <div className="card-inset flex items-start gap-2.5 p-3 text-[11px] leading-relaxed text-[#a0aec0]">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#e0a96d]" />
                  <span>
                    <strong className="text-white">Sender Attribution Notice:</strong> This payload was encrypted to your public key and its ciphertext integrity is verified by AES-GCM, but QuietSend asymmetric envelopes do <em>not</em> contain a digital signature. Anyone holding your public key can generate an envelope.
                  </span>
                </div>
              )}

              {result.type === 'text' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#a0aec0] font-mono">
                      Extracted Message ({result.content.length} characters)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(result.content)}
                      className="btn btn-secondary !py-1.5 !px-3 !text-xs cursor-pointer font-bold"
                    >
                      {copied ? <Check size={13} className="text-[#52b788]" /> : <Copy size={13} />}
                      <span>{copied ? 'Copied!' : 'Copy Secret Message'}</span>
                    </button>
                  </div>

                  <div className="card-inset p-4 text-xs sm:text-sm text-white font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto select-all">
                    {result.content ? <span data-no-translate>{result.content}</span> : <span className="text-[#718096] italic">(Empty message)</span>}
                  </div>
                </div>
              )}

              {result.type === 'file' && (
                <div className="space-y-2">
                  <span className="text-xs text-[#a0aec0] font-bold font-mono">
                    Extracted GhostFile Container:
                  </span>
                  <FileChip name={result.name} data={result.data} />
                </div>
              )}

              {result.type === 'vault' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#a0aec0] font-bold font-mono">
                      Extracted GhostVault ({result.files.length} items):
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadAllVaultFiles(result.files)}
                      className="btn btn-secondary !py-1.5 !px-3 !text-xs cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download All Files</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {result.files.map((f, i) => (
                      <FileChip key={`${f.name}-${f.data.length}-${i}`} name={f.name} data={f.data} />
                    ))}
                  </div>
                </div>
              )}

              {result.type === 'binary' && (
                <div className="space-y-3">
                  <div className="card-inset p-3.5 text-xs text-[#a0aec0] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[#e0a96d]">
                      <Unlock size={15} />
                      <span>Unrecognized Binary Stream ({result.data.length} Bytes)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      These bytes may be encrypted, damaged, or from an unsupported format. Enter a password only if the sender used one; otherwise use the original lossless carrier.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadBlob(result.data, 'quietsend-payload.bin')}
                    className="btn btn-secondary w-full !text-xs cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Save Raw Binary Stream ({fmtBytes(result.data.length)})</span>
                  </button>
                </div>
              )}

              {carrierHash && (
                <div className="card-inset flex items-center justify-between gap-2 p-2.5 text-xs font-mono">
                  <span className="text-[#718096] truncate">Carrier SHA-256 Digest: {carrierHash}</span>
                  <button
                    type="button"
                    onClick={copyCarrierHash}
                    className="btn btn-ghost !p-1 text-[#a0aec0] hover:text-white"
                    title="Copy Carrier SHA-256 Digest"
                  >
                    {copiedHash ? <Check size={12} className="text-[#52b788]" /> : <Copy size={12} />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
