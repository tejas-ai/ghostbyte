import React, { useState, useRef, useEffect } from 'react';
import { compareImages } from '../services/stegaEngine';

const Comparator: React.FC = () => {
  const [original, setOriginal] = useState<File | null>(null);
  const [modified, setModified] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ mse: number; psnr: number; diffUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (original) {
      const url = URL.createObjectURL(original);
      setOriginalUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [original]);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!original || !modified) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const comparison = await compareImages(original, modified);
      setResult(comparison);
    } catch (err: any) {
      setError('Comparison failed. Ensure both files are valid images and have matching dimensions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(Math.max(position, 0), 100));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Visual Integrity Forensic Analysis
          </h2>
          <p className="text-gray-400">
            Scientifically verify the presence of hidden data by comparing the original carrier and the encoded result.
          </p>
        </div>

        <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Original Base File</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setOriginal(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-600/10 file:text-emerald-400 hover:file:bg-emerald-600/20 cursor-pointer bg-gray-800/50 rounded-xl border border-gray-700 p-2"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Modified/Encoded File</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setModified(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-600/10 file:text-emerald-400 hover:file:bg-emerald-600/20 cursor-pointer bg-gray-800/50 rounded-xl border border-gray-700 p-2"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!original || !modified || isProcessing}
            className="md:col-span-2 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Scanning Pixels...</span>
              </>
            ) : (
              <>
                <span>Run Differential Analysis</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 text-sm mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">MSE</p>
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <p className="text-3xl font-mono font-bold text-white mb-1">{result.mse.toFixed(6)}</p>
              <p className="text-xs text-gray-500">Mean Squared Error: Measures the average squared difference between pixel intensities.</p>
            </div>
            <div className="group p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">PSNR</p>
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
              <p className="text-3xl font-mono font-bold text-white mb-1">{result.psnr.toFixed(2)} dB</p>
              <p className="text-xs text-gray-500">Peak Signal-to-Noise Ratio: Higher values mean the noise (hidden data) is less visible.</p>
            </div>
            <div className="group p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Visual Rating</p>
                <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              </div>
              <p className={`text-3xl font-bold mb-1 ${result.psnr > 40 ? 'text-emerald-400' : result.psnr > 30 ? 'text-teal-400' : 'text-amber-400'}`}>
                {result.psnr > 40 ? 'Exceptional' : result.psnr > 30 ? 'High Quality' : 'Noticeable'}
              </p>
              <p className="text-xs text-gray-500">Subjective visibility rating based on psycho-visual standards.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Interactive Forensic Comparison</h3>
              <div className="flex items-center space-x-4 text-xs font-mono text-gray-500">
                <span className="flex items-center"><div className="w-3 h-3 bg-gray-700 mr-2 rounded-sm" /> Original</span>
                <span className="flex items-center"><div className="w-3 h-3 bg-emerald-600 mr-2 rounded-sm" /> Differential Map</span>
              </div>
            </div>

            <div
              ref={sliderContainerRef}
              className="relative aspect-video max-h-[600px] w-full bg-black rounded-[2rem] overflow-hidden border border-gray-800 shadow-2xl cursor-col-resize select-none"
              onMouseMove={handleSliderMove}
              onTouchMove={handleSliderMove}
            >
              {/* Difference Map (Background) */}
              <div className="absolute inset-0">
                <img
                  src={result.diffUrl}
                  alt="Difference Heatmap"
                  className="w-full h-full object-contain bg-gray-950"
                />
                <div className="absolute top-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                  Heatmap (x16 Amp)
                </div>
              </div>

              {/* Original Image (Foreground, Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%`, borderRight: '2px solid rgba(255,255,255,0.3)' }}
              >
                {originalUrl && (
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="w-full h-full object-contain bg-gray-950"
                    style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }}
                  />
                )}
                <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20 uppercase tracking-widest">
                  Original Source
                </div>
              </div>

              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center justify-center"
                style={{ left: `calc(${sliderPos}% - 1px)` }}
              >
                <div className="h-full w-[2px] bg-white/50 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                <div className="absolute w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-emerald-500 transform -translate-x-1/2">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 italic">
              Slide to reveal the hidden modifications. Colors represent the amplified delta in each pixel channel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comparator;
