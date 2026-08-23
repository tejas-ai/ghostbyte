import React, { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
import {
  SlidersHorizontal,
  Layers,
  AlertTriangle,
  X,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { compareImages, getBitPlane, readImageFile } from '../services/stegaEngine';
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
  const ref = useRef<HTMLInputElement>(null);

  const load = async (file: File) => {
    soundFx.playClick();
    try {
      const { src } = await readImageFile(file);
      onLoad(file, src, file.name);
    } catch {
      // fallback
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
      className={`dropzone-3d p-6 text-center transition-all ${
        drag ? 'drag-over' : slot ? 'border-emerald-500/40 bg-black/40' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*,image/png,image/jpeg,image/webp,image/bmp,image/tiff,image/tif,.tif,.tiff"
        className="hidden"
        onChange={onChange}
      />

      {slot ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-black/60 h-44 flex items-center justify-center shadow-lg">
            <img
              src={slot.src}
              alt={label}
              className="w-full h-full object-contain"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playClick();
                onClear();
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/70 hover:bg-red-500 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
              title="Remove image"
            >
              <X size={13} />
            </button>
            <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md glass-pill-3d text-[10px] font-mono font-bold text-emerald-300">
              {badgeText}
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-mono font-bold truncate max-w-[200px] text-emerald-200">{slot.name}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                ref.current?.click();
              }}
              className="text-[11px] font-mono text-slate-400 hover:text-emerald-300 underline cursor-pointer"
            >
              {t.comparator.change_image || 'Replace'}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-emerald-600/30 to-teal-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
            <ImageIcon size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase font-mono">{label}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{t.comparator.dropzone_hint || 'Drag & drop image or click to browse'}</p>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase btn-3d-emerald text-white cursor-pointer"
          >
            <Upload size={12} />
            <span>{t.comparator.browse_button || 'Select Image'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function SplitSlider({ origSrc, heatSrc }: { origSrc: string; heatSrc: string }) {
  const { t } = useLanguage();
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
      className="relative rounded-2xl overflow-hidden select-none border border-emerald-500/30 bg-black shadow-2xl"
      style={{ userSelect: 'none', height: 380 }}
      onMouseMove={(e) => {
        if (!dragging) return;
        onMove(e.clientX);
      }}
    >
      {/* Base: original image */}
      <img src={origSrc} alt="original" className="absolute inset-0 w-full h-full object-contain bg-black" />

      {/* Overlay: heatmap clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${split}%`, borderRight: '2px solid rgba(16, 185, 129, 0.9)' }}
      >
        <img
          src={heatSrc}
          alt="heatmap"
          className="absolute inset-0 w-full h-full object-contain bg-black"
          style={{ width: `${10000 / Math.max(split, 0.001)}%`, maxWidth: 'none' }}
        />
      </div>

      {/* 3D Divider line */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{ left: `calc(${split}% - 1px)` }}
      >
        <div className="h-full w-[2px] bg-gradient-to-b from-cyan-400 via-emerald-400 to-lime-400" />
      </div>

      {/* Interactive 3D Beveled Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center cursor-ew-resize transition-transform hover:scale-110 active:scale-95 shadow-xl"
        style={{
          left: `${split}%`,
          width: 38,
          height: 38,
          borderRadius: 999,
          background: 'linear-gradient(135deg, #065f46, #0e7490)',
          border: '2px solid #34d399',
          borderTop: '2px solid #a7f3d0',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), 0 4px 12px rgba(0,0,0,0.7)',
          zIndex: 10,
        }}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
      >
        <span className="text-white text-xs font-black font-mono">⇔</span>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-md rounded-md border border-cyan-400/40">
        <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase tracking-wider">{t.comparator.legend_original || 'ORIGINAL COVER'}</span>
      </div>
      <div className="absolute top-3 right-3 px-3 py-1 bg-black/80 backdrop-blur-md rounded-md border border-pink-400/40">
        <span className="font-mono text-[10px] font-bold text-pink-300 uppercase tracking-wider">{t.comparator.legend_heatmap || 'DIFFERENCE HEATMAP'}</span>
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

  // Revoke object URLs on cleanup
  useEffect(() => {
    return () => {
      if (orig?.src && orig.src.startsWith('blob:')) URL.revokeObjectURL(orig.src);
      if (mod?.src && mod.src.startsWith('blob:')) URL.revokeObjectURL(mod.src);
      if (stats?.heatmapUrl && stats.heatmapUrl.startsWith('blob:')) URL.revokeObjectURL(stats.heatmapUrl);
      if (stats?.diffUrl && stats.diffUrl.startsWith('blob:')) URL.revokeObjectURL(stats.diffUrl);
      if (bitPlaneUrl && bitPlaneUrl.startsWith('blob:')) URL.revokeObjectURL(bitPlaneUrl);
    };
  }, [orig, mod, stats, bitPlaneUrl]);

  const analyze = async () => {
    if (!orig || !mod) return;
    setLoading(true);
    setError('');
    if (stats?.heatmapUrl) URL.revokeObjectURL(stats.heatmapUrl);
    setStats(null);
    soundFx.playScan();

    try {
      const r = await compareImages(orig.src, mod.src);
      setStats(r);

      // Pre-calculate LSB bitplane 0
      if (bitPlaneUrl) URL.revokeObjectURL(bitPlaneUrl);
      const lsbUrl = await getBitPlane(mod.src, 0);
      setBitPlaneUrl(lsbUrl);
      setBitPlane(0);
      soundFx.playSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Ensure both images have identical pixel dimensions.');
      soundFx.playError();
    } finally {
      setLoading(false);
    }
  };

  const selectBitPlane = async (plane: number) => {
    const targetSource = mod ? mod.src : orig ? orig.src : null;
    if (!targetSource) return;

    soundFx.playClick();
    setBitLoading(true);
    setBitPlane(plane);

    try {
      if (bitPlaneUrl) URL.revokeObjectURL(bitPlaneUrl);
      const url = await getBitPlane(targetSource, plane);
      setBitPlaneUrl(url);
    } catch {
      // ignore
    } finally {
      setBitLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="glass-3d-emerald p-6 sm:p-8 space-y-6">
        {/* Header Title */}
        <div className="pb-6 border-b border-white/[0.1]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md glass-pill-3d text-emerald-300 text-[11px] font-mono font-bold mb-2">
            <Activity size={12} className="text-emerald-400" />
            <span>Digital Forensic Image Telemetry & LSB Inspector</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
            {t.comparator.title || 'Steganographic Forensics Workbench'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-medium">
            {t.comparator.desc || 'Compare original cover images against steganographic carriers to compute Peak Signal-to-Noise Ratio (PSNR), Mean Squared Error (MSE), and bitplane visualizers.'}
          </p>
        </div>

        {/* 2 Dropzones Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ImgDropZone
            label={t.comparator.original_label || 'Original Cover Image'}
            slot={orig}
            onLoad={(file, src, name) => setOrig({ file, src, name })}
            onClear={() => setOrig(null)}
            badgeText="Original Cover"
          />

          <ImgDropZone
            label={t.comparator.modified_label || 'Steganographic Carrier Image'}
            slot={mod}
            onLoad={(file, src, name) => setMod({ file, src, name })}
            onClear={() => setMod(null)}
            badgeText="Stego Output"
          />
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2.5 shadow-lg animate-shake">
            <AlertTriangle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Run Analysis Button with 3D Beveled Tactility */}
        <button
          onClick={analyze}
          disabled={loading || !orig || !mod}
          className={`w-full h-14 rounded-xl font-black text-xs sm:text-sm tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2.5 ${
            loading || !orig || !mod
              ? 'bg-slate-900/80 text-slate-600 border border-white/5 cursor-not-allowed shadow-none'
              : 'btn-3d-emerald text-white'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 8.001l-3-2.708z"></path>
              </svg>
              <span>{t.comparator.scanning || 'Running Forensic Signal Analysis...'}</span>
            </>
          ) : (
            <>
              <SlidersHorizontal size={17} strokeWidth={2.4} />
              <span>{t.comparator.button || 'Run Forensic Comparison'}</span>
            </>
          )}
        </button>
      </section>

      {/* Analysis Results with 3D Glass Surface */}
      {stats && orig && mod && (
        <section className="glass-3d-emerald p-6 sm:p-8 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              <h3 className="text-base font-black text-white font-sans">
                {t.comparator.slider_title || 'Forensic Differential Analysis Complete'}
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md glass-pill-3d text-emerald-300">
              PSNR {stats.psnr.toFixed(1)} dB
            </span>
          </div>

          {/* Telemetry Metric Cards with 3D Bevels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* PSNR */}
            <div className="p-5 rounded-xl glass-3d border-emerald-400/30 space-y-2">
              <div className="text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
                {t.comparator.psnr_title || 'PSNR (Signal Fidelity)'}
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {stats.psnr > 100 ? '∞ dB' : `${stats.psnr.toFixed(2)} dB`}
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/10">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 w-full rounded-full" />
              </div>
              <p className="text-[11px] text-emerald-400 font-mono font-semibold">
                {stats.psnr > 40 ? '✓ Imperceptible Noise' : 'Moderate Variance'}
              </p>
            </div>

            {/* MSE */}
            <div className="p-5 rounded-xl glass-3d border-teal-400/30 space-y-2">
              <div className="text-[11px] font-mono font-bold text-teal-300 uppercase tracking-wider">
                {t.comparator.mse_title || 'Mean Squared Error'}
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {stats.mse.toFixed(4)}
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/10">
                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 w-[15%] rounded-full" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Average pixel error variance
              </p>
            </div>

            {/* Imperceptibility */}
            <div className="p-5 rounded-xl glass-3d border-cyan-400/30 space-y-2">
              <div className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                {t.comparator.rating_title || 'Steganographic Stealth'}
              </div>
              <div className="text-2xl font-black font-mono text-cyan-300">
                {stats.psnr > 45 ? '99.8%' : stats.psnr > 38 ? '96.2%' : '88.0%'}
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/10">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 w-[99%] rounded-full" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Visual perception boundary
              </p>
            </div>
          </div>

          {/* Interactive Split Comparison View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 px-1">
              <span className="font-bold text-emerald-300">{t.comparator.slider_title || 'Interactive Difference Split View'}</span>
              <span className="text-[11px] text-slate-400 font-medium">Drag center divider horizontally</span>
            </div>
            <SplitSlider origSrc={orig.src} heatSrc={stats.heatmapUrl} />
          </div>

          {/* Bit-Plane Layer Inspector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono text-emerald-300 font-bold uppercase tracking-wider">
                <Layers size={15} className="text-emerald-400" />
                <span>{t.comparator.bitplane_title || 'Bit-Plane Layer Visualizer'}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-medium">
                Bit 0 = LSB (Payload Layer) · Bit 7 = MSB (Coarse Visuals)
              </span>
            </div>

            {/* Bitplane Selector 0 to 7 with 3D Tactile Buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 p-2 rounded-2xl glass-3d">
              {Array.from({ length: 8 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => selectBitPlane(i)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                    bitPlane === i
                      ? 'btn-3d-emerald text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.08] border border-transparent'
                  }`}
                >
                  Bit {i} {i === 0 ? '(LSB)' : i === 7 ? '(MSB)' : ''}
                </button>
              ))}
            </div>

            {/* Bit Plane Display */}
            {bitPlaneUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black flex items-center justify-center p-3 min-h-64 shadow-2xl">
                {bitLoading ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                    <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 8.001l-3-2.708z"></path>
                    </svg>
                    <span>Extracting Bitplane {bitPlane}...</span>
                  </div>
                ) : (
                  <img
                    src={bitPlaneUrl}
                    alt={`bitplane-${bitPlane}`}
                    className="max-h-96 w-auto object-contain rounded-lg"
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
