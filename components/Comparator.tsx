import React, { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
import {
  SlidersHorizontal,
  Layers,
  AlertTriangle,
  X,
  Upload,
  Image as ImageIcon,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { compareImages, getBitPlane, readImageFile } from '../services/stegaEngine';
import { useRevocableUrl } from '../hooks/useRevocableUrl';
import { soundFx } from '../services/soundFx';

interface ImageSlot {
  src: string;
  name: string;
  file?: File;
}

function ImgDropZone({
  label,
  slot,
  onLoad,
  onClear,
  badgeText,
}: {
  label: string;
  slot: ImageSlot | null;
  onLoad: (file: File, src: string, name: string) => void;
  onClear: () => void;
  badgeText: string;
}) {
  const { t } = useLanguage();
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  const load = async (file: File) => {
    soundFx.playClick();
    setError('');
    try {
      const { src } = await readImageFile(file);
      onLoad(file, src, file.name);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'This image could not be opened.');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) load(f);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      load(f);
      e.target.value = '';
    }
  };

  return (
    <div
      role={slot ? undefined : 'button'}
      tabIndex={slot ? undefined : 0}
      aria-label={`Upload image for ${label}`}
      className={`dropzone group p-5 text-center transition-all ${
        drag ? 'drag-over' : slot ? 'border-solid border-black/60 bg-[#0d1016]' : 'cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onKeyDown={(e) => {
        if (!slot && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          ref.current?.click();
        }
      }}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*,image/png,image/jpeg,image/webp,image/bmp,image/tiff,image/tif,.tif,.tiff"
        className="hidden"
        onChange={onChange}
      />

      {error && <p role="alert" className="mb-3 text-sm text-[#e57373]">{error}</p>}
      {slot ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-black/60 bg-[#090c12] h-40 flex items-center justify-center shadow-inner">
            <img src={slot.src} alt={label} className="w-full h-full object-contain" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playClick();
                onClear();
              }}
              className="absolute top-2 right-2 h-7 w-7 rounded bg-[#1c222e] hover:bg-[#e57373] text-white flex items-center justify-center transition-all cursor-pointer border border-black/50 shadow-sm"
              title="Remove image"
              aria-label={`Remove ${slot.name}`}
            >
              <X size={13} />
            </button>
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#141a24] border border-black/50 text-[10px] font-mono font-bold text-[#52b788] shadow-inner">
              {badgeText}
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <p data-no-translate className="text-xs font-mono font-bold truncate max-w-[180px] text-white">
              {slot.name}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                ref.current?.click();
              }}
              className="text-[11px] font-mono text-[#a0aec0] hover:text-white underline cursor-pointer"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div className="py-4 space-y-2.5">
          <div className="h-10 w-10 mx-auto rounded-lg border border-black/60 border-t-white/15 bg-gradient-to-b from-[#252c3b] to-[#171c26] flex items-center justify-center text-[#a0aec0] shadow-sm">
            <ImageIcon size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase font-mono">{label}</p>
            <p className="text-[11px] text-[#718096] font-mono mt-0.5">
              Drag & drop image or click to browse
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              ref.current?.click();
            }}
            className="btn btn-secondary !py-1.5 !px-3 !text-xs cursor-pointer font-bold"
          >
            <Upload size={12} />
            <span>Select Image</span>
          </button>
        </div>
      )}
    </div>
  );
}

function SplitSlider({ origSrc, heatSrc }: { origSrc: string; heatSrc: string }) {
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - left) / width) * 100));
    setSplit(pos);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX);
    const stop = () => setDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
  }, [dragging, onMove]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden select-none border border-black/70 bg-[#090c12] shadow-inner"
      style={{ userSelect: 'none', height: 340 }}
      onMouseMove={(e) => {
        if (!dragging) return;
        onMove(e.clientX);
      }}
    >
      <img src={origSrc} alt="original" className="absolute inset-0 w-full h-full object-contain bg-[#090c12]" />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${split}%`, borderRight: '2px solid rgba(224, 169, 109, 0.8)' }}
      >
        <img
          src={heatSrc}
          alt="heatmap"
          className="absolute inset-0 w-full h-full object-contain bg-[#090c12]"
          style={{ width: `${10000 / Math.max(split, 0.001)}%`, maxWidth: 'none' }}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{ left: `calc(${split}% - 1px)` }}
      >
        <div className="h-full w-[2px] bg-[#e0a96d]" />
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Split comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(split)}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center cursor-ew-resize transition-transform hover:scale-105 active:scale-95 shadow-md focus-visible:ring-2 focus-visible:ring-[#e0a96d] outline-none"
        style={{
          left: `${split}%`,
          width: 34,
          height: 34,
          borderRadius: 999,
          background: 'linear-gradient(180deg, #e0a96d 0%, #ad7235 100%)',
          border: '1px solid rgba(0, 0, 0, 0.6)',
          borderTop: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.6)',
          zIndex: 10,
        }}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            setSplit((s) => Math.max(0, s - (e.shiftKey ? 10 : 2)));
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            setSplit((s) => Math.min(100, s + (e.shiftKey ? 10 : 2)));
          } else if (e.key === 'Home') {
            e.preventDefault();
            setSplit(0);
          } else if (e.key === 'End') {
            e.preventDefault();
            setSplit(100);
          }
        }}
      >
        <span className="text-[#1f1105] text-xs font-bold font-mono">⇔</span>
      </div>

      <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#10141d]/90 rounded border border-black/50 text-[10px] font-mono font-bold text-[#a0aec0]">
        ORIGINAL COVER
      </div>
      <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#10141d]/90 rounded border border-black/50 text-[10px] font-mono font-bold text-[#e0a96d]">
        DIFFERENCE HEATMAP
      </div>
    </div>
  );
}

export default function Comparator() {
  const { t } = useLanguage();
  const [orig, setOrig] = useState<ImageSlot | null>(null);
  const [mod, setMod] = useState<ImageSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ mse: number; psnr: number; diffUrl: string; heatmapUrl: string } | null>(null);
  const [bitPlane, setBitPlane] = useState<number | null>(0);
  const [bitPlaneUrl, setBitPlaneUrl] = useState<string | null>(null);
  const [bitLoading, setBitLoading] = useState(false);
  const analysisRevision = useRef(0);
  const bitRevision = useRef(0);

  const trackOrigUrl = useRevocableUrl();
  const trackModUrl = useRevocableUrl();
  const trackDiffUrl = useRevocableUrl();
  const trackHeatmapUrl = useRevocableUrl();
  const trackBitPlaneUrl = useRevocableUrl();

  const clearAnalysis = () => {
    analysisRevision.current++;
    bitRevision.current++;
    setLoading(false);
    setBitLoading(false);
    trackDiffUrl(null);
    trackHeatmapUrl(null);
    trackBitPlaneUrl(null);
    setStats(null);
    setBitPlaneUrl(null);
    setBitPlane(null);
    setError('');
  };

  const analyze = async () => {
    if (!orig || !mod) return;
    const revision = ++analysisRevision.current;
    const planeRevision = ++bitRevision.current;
    soundFx.playScan();
    setLoading(true);
    setError('');
    setStats(null);
    setBitPlaneUrl(null);

    try {
      const res = await compareImages(orig.src, mod.src);
      if (revision !== analysisRevision.current) {
        URL.revokeObjectURL(res.diffUrl);
        URL.revokeObjectURL(res.heatmapUrl);
        return;
      }
      trackDiffUrl(res.diffUrl);
      trackHeatmapUrl(res.heatmapUrl);
      setStats(res);
      soundFx.playSuccess();

      const bp = await getBitPlane(mod.src, 0);
      if (revision !== analysisRevision.current || planeRevision !== bitRevision.current) {
        URL.revokeObjectURL(bp);
        return;
      }
      trackBitPlaneUrl(bp);
      setBitPlaneUrl(bp);
      setBitPlane(0);
    } catch (e: unknown) {
      if (revision !== analysisRevision.current) return;
      setError(e instanceof Error ? e.message : 'Comparison failed.');
      soundFx.playError();
    } finally {
      if (revision === analysisRevision.current) setLoading(false);
    }
  };

  const selectBitPlane = async (bit: number) => {
    if (!mod) return;
    const revision = ++bitRevision.current;
    soundFx.playClick();
    setBitLoading(true);
    setBitPlane(bit);
    try {
      const bp = await getBitPlane(mod.src, bit);
      if (revision !== bitRevision.current) {
        URL.revokeObjectURL(bp);
        return;
      }
      trackBitPlaneUrl(bp);
      setBitPlaneUrl(bp);
    } catch {
      if (revision === bitRevision.current) setError('Failed to extract bitplane.');
    } finally {
      if (revision === bitRevision.current) setBitLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <section className="card p-5 sm:p-6 space-y-4">
        {/* Header Title */}
        <div className="pb-4 border-b border-black/60 border-b-white/5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#261d14] text-[#e0a96d] border border-black/50 border-t-[#e0a96d]/20 mb-2 shadow-inner">
            <Activity size={12} className="text-[#e0a96d]" />
            <span>Digital Forensic Image Telemetry & LSB Inspector</span>
          </div>
          <h2 className="display-md text-[#f7fafc]">
            Steganographic Forensics Workbench
          </h2>
          <p className="text-xs text-[#a0aec0] mt-1 max-w-xl">
            Compare original cover images against steganographic carriers to compute Peak Signal-to-Noise Ratio (PSNR), Mean Squared Error (MSE), and bitplane visualizers.
          </p>
        </div>

        {/* 2 Dropzones Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImgDropZone
            label="Original Cover Image"
            slot={orig}
            onLoad={(file, src, name) => {
              clearAnalysis();
              trackOrigUrl(src);
              setOrig({ file, src, name });
            }}
            onClear={() => {
              clearAnalysis();
              trackOrigUrl(null);
              setOrig(null);
            }}
            badgeText="Original Cover"
          />

          <ImgDropZone
            label="Steganographic Carrier Image"
            slot={mod}
            onLoad={(file, src, name) => {
              clearAnalysis();
              trackModUrl(src);
              setMod({ file, src, name });
            }}
            onClear={() => {
              clearAnalysis();
              trackModUrl(null);
              setMod(null);
            }}
            badgeText="Stego Output"
          />
        </div>

        {error && (
          <div className="animate-shake flex items-start gap-2.5 rounded-xl border border-black/60 border-t-red-400/30 bg-[#2d1616] p-3.5 text-[13px] leading-relaxed text-[#fee2e2] shadow-[var(--shadow-raised-sm)]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#e57373]" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button in Warm Amber */}
        <button
          onClick={analyze}
          disabled={loading || !orig || !mod}
          className="btn-amber w-full !py-3.5 !text-base cursor-pointer"
        >
          {loading ? (
            <span>Running Forensic Signal Analysis…</span>
          ) : (
            <>
              <SlidersHorizontal size={16} />
              <span>Run Forensic Comparison</span>
            </>
          )}
        </button>
      </section>

      {/* Analysis Results */}
      {stats && orig && mod && (
        <section className="card p-5 sm:p-6 space-y-4 animate-fade-in border-l-2 border-l-[#e0a96d]">
          <div className="flex items-center justify-between pb-3 border-b border-black/60 border-b-white/5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#e0a96d]" />
              <h3 className="text-sm font-sans font-bold text-white">
                Forensic Differential Analysis Complete
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#e0a96d]">
              PSNR {stats.psnr.toFixed(1)} dB
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card-inset p-3.5 space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-[#a0aec0] uppercase tracking-wider">
                PSNR (Signal Fidelity)
              </div>
              <div className="text-xl font-black font-mono text-white">
                {stats.psnr > 100 ? '∞ dB' : `${stats.psnr.toFixed(2)} dB`}
              </div>
              <p className="text-[10px] text-[#e0a96d] font-mono font-semibold">
                {stats.psnr > 40 ? '✓ Imperceptible Noise' : 'Moderate Variance'}
              </p>
            </div>

            <div className="card-inset p-3.5 space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-[#a0aec0] uppercase tracking-wider">
                Mean Squared Error
              </div>
              <div className="text-xl font-black font-mono text-white">
                {stats.mse.toFixed(4)}
              </div>
              <p className="text-[10px] text-[#718096] font-mono">
                Average pixel variance
              </p>
            </div>

            <div className="card-inset p-3.5 space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-[#a0aec0] uppercase tracking-wider">
                Stealth Rating
              </div>
              <div className="text-xl font-black font-mono text-[#64b5f6]">
                {stats.psnr > 45 ? '99.8%' : stats.psnr > 38 ? '96.2%' : '88.0%'}
              </div>
              <p className="text-[10px] text-[#718096] font-mono">
                Visual boundary fidelity
              </p>
            </div>
          </div>

          {/* Interactive Split View */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-[#a0aec0]">
              <span className="font-bold text-white">Interactive Difference Split View</span>
              <span className="text-[11px] text-[#718096]">Drag center divider horizontally</span>
            </div>
            <SplitSlider origSrc={orig.src} heatSrc={stats.heatmapUrl} />
          </div>

          {/* Bit-Plane Layer Inspector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider">
                <Layers size={14} className="text-[#e0a96d]" />
                <span>Bit-Plane Layer Visualizer</span>
              </div>
              <span className="text-[10px] text-[#718096]">
                Bit 0 = LSB (Payload) · Bit 7 = MSB (Coarse)
              </span>
            </div>

            {/* Bitplane Buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 rocker-well !p-1.5">
              {Array.from({ length: 8 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectBitPlane(i)}
                  className={`rocker-btn !py-2 !px-1 text-center font-mono ${
                    bitPlane === i
                      ? '!bg-gradient-to-b !from-[#e0a96d] !to-[#ad7235] !text-[#1f1105] !font-extrabold !border-black/40 !border-t-white/40 !shadow-[0_2px_5px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.3)]'
                      : ''
                  }`}
                >
                  Bit {i} {i === 0 ? '(LSB)' : i === 7 ? '(MSB)' : ''}
                </button>
              ))}
            </div>

            {bitPlaneUrl && (
              <div className="relative rounded-xl overflow-hidden border border-black/70 bg-[#090c12] flex items-center justify-center p-3 min-h-60 shadow-inner">
                {bitLoading ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-[#a0aec0]">
                    <span>Extracting Bitplane {bitPlane}…</span>
                  </div>
                ) : (
                  <img
                    src={bitPlaneUrl}
                    alt={`bitplane-${bitPlane}`}
                    className="max-h-80 w-auto object-contain rounded"
                  />
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
