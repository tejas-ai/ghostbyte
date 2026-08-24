import { useMemo } from 'react';
import { DENSITY_BITS, type CapacityDensity } from '../services/stegaEngine';

/**
 * Shows exactly which part of the photo will carry the hidden data.
 *
 * The engine fills RGB channels in row-major order from the top-left, so a
 * payload always occupies a contiguous band starting at the first row. That
 * makes the footprint drawable exactly rather than approximately, and it turns
 * the single most important safety trade-off into something you can see: a
 * short note in a large photo touches almost nothing, while a payload near
 * capacity rewrites the whole frame and is obvious to anyone who looks.
 *
 * Capacity percentages tell you the same thing numerically, and people ignore
 * them. A band creeping down a photograph they chose is harder to ignore.
 */
export function PayloadFootprint({
  src,
  width,
  height,
  payloadBytes,
  density,
  className = '',
}: {
  src: string;
  width: number;
  height: number;
  payloadBytes: number;
  density: CapacityDensity;
  className?: string;
}) {
  const { coveredPct, coveredPixels, totalPixels } = useMemo(() => {
    const total = Math.max(1, width * height);
    if (payloadBytes <= 0) {
      return { coveredPct: 0, coveredPixels: 0, totalPixels: total };
    }

    const bits = DENSITY_BITS[density];
    // 4-byte length header, then the payload, packed `bits` per RGB channel.
    const chunks = Math.ceil(((4 + payloadBytes) * 8) / bits);
    const pixels = Math.min(total, Math.ceil(chunks / 3));

    return {
      coveredPct: Math.min(100, (pixels / total) * 100),
      coveredPixels: pixels,
      totalPixels: total,
    };
  }, [width, height, payloadBytes, density]);

  const isHeavy = coveredPct > 55;
  const edgeColor = isHeavy ? 'var(--warn)' : 'var(--accent)';

  return (
    <figure className={`m-0 space-y-2 ${className}`}>
      <div
        className="relative overflow-hidden rounded-[10px] border bg-black"
        style={{ borderColor: 'var(--line)', aspectRatio: `${width} / ${height}`, maxHeight: 260 }}
      >
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />

        {coveredPct > 0 && (
          <>
            {/* The band that will actually be rewritten. */}
            <div
              className="absolute inset-x-0 top-0 transition-[height] duration-500"
              style={{
                height: `${coveredPct}%`,
                background: isHeavy
                  ? 'color-mix(in srgb, var(--warn) 26%, transparent)'
                  : 'color-mix(in srgb, var(--accent) 24%, transparent)',
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='90' height='90' filter='url(%23f)' opacity='0.5'/%3E%3C/svg%3E\")",
                backgroundBlendMode: 'overlay',
              }}
              aria-hidden="true"
            />
            {/* The boundary. This is the line people watch move. */}
            <div
              className="absolute inset-x-0 transition-[top] duration-500"
              style={{
                top: `${coveredPct}%`,
                height: 1.5,
                background: edgeColor,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
              }}
              aria-hidden="true"
            />
          </>
        )}

        <figcaption
          className="mono absolute bottom-1.5 left-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ background: 'rgba(0,0,0,0.72)', color: edgeColor }}
        >
          {coveredPct === 0
            ? 'nothing hidden yet'
            : coveredPct < 0.1
            ? 'under 0.1% of pixels touched'
            : `${coveredPct.toFixed(1)}% of pixels touched`}
        </figcaption>
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
        {coveredPct === 0 ? (
          <>The shaded band will show which part of your photo carries the secret.</>
        ) : isHeavy ? (
          <>
            <span style={{ color: 'var(--warn)' }}>This fills most of the photo.</span>{' '}
            A band this large is visible if anyone compares against the original. Use a bigger
            photo, or hide less.
          </>
        ) : (
          <>
            Only the shaded band changes —{' '}
            <span className="mono">{coveredPixels.toLocaleString()}</span> of{' '}
            <span className="mono">{totalPixels.toLocaleString()}</span> pixels. The rest of the
            photo is untouched.
          </>
        )}
      </p>
    </figure>
  );
}

export default PayloadFootprint;
