import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { soundFx } from '../services/soundFx';

export interface SkeuoOption<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  activeColor?: 'green' | 'blue' | 'purple' | 'slate' | 'amber';
}

interface SkeuoSegmentedControlProps<T extends string> {
  options: SkeuoOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  role?: 'radiogroup' | 'tablist';
}

export default function SkeuoSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
  ariaLabel,
  role = 'radiogroup',
}: SkeuoSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.id === value)
  );
  const activeOpt = options[activeIndex] || options[0];
  const color = activeOpt?.activeColor || 'green';

  const [sliderRect, setSliderRect] = useState<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const updateSlider = () => {
    const activeBtn = buttonRefs.current[activeIndex];
    if (activeBtn && containerRef.current) {
      setSliderRect({
        left: activeBtn.offsetLeft,
        top: activeBtn.offsetTop,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight,
      });
    }
  };

  useLayoutEffect(() => {
    updateSlider();
  }, [activeIndex, value, options]);

  useEffect(() => {
    updateSlider();
    const handleResize = () => updateSlider();
    window.addEventListener('resize', handleResize);

    const ro = new ResizeObserver(() => {
      updateSlider();
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, [activeIndex, value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (activeIndex + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (activeIndex - 1 + options.length) % options.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = options.length - 1;
    }

    if (nextIndex !== -1 && nextIndex !== activeIndex) {
      const nextOpt = options[nextIndex];
      soundFx.playSlide();
      onChange(nextOpt.id);
      buttonRefs.current[nextIndex]?.focus();
    }
  };

  const colorStyles = {
    green:
      'bg-gradient-to-b from-[#52b788] to-[#388a62] border border-black/40 border-t-white/30 border-b-black/60 shadow-[0_2px_5px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.3)]',
    blue:
      'bg-gradient-to-b from-[#64b5f6] to-[#2b77c5] border border-black/40 border-t-white/35 border-b-black/60 shadow-[0_2px_5px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.35)]',
    purple:
      'bg-gradient-to-b from-[#b39ddb] to-[#7c63b8] border border-black/40 border-t-white/30 border-b-black/60 shadow-[0_2px_5px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.3)]',
    slate:
      'bg-gradient-to-b from-[#2f3747] to-[#1c222e] border border-black/40 border-t-white/20 border-b-black/60 shadow-[0_2px_5px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18)]',
    amber:
      'bg-gradient-to-b from-[#e0a96d] to-[#ad7235] border border-black/40 border-t-white/30 border-b-black/60 shadow-[0_2px_5px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.3)]',
  };

  const padY = size === 'sm' ? 'py-1' : 'py-1.5 sm:py-2';
  const fontSize = size === 'sm' ? 'text-[10px] font-mono' : 'text-xs';

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center p-1 rounded-xl bg-[#0d1016] border border-black/70 border-b-white/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.06)] select-none ${className}`}
      role={role}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {/* Dynamic 100% Precise Physical Sliding Thumb */}
      {sliderRect.width > 0 && (
        <div
          className={`absolute rounded-lg transition-all duration-250 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-none ${colorStyles[color]}`}
          style={{
            transform: `translate3d(${sliderRect.left}px, ${sliderRect.top}px, 0)`,
            width: `${sliderRect.width}px`,
            height: `${sliderRect.height}px`,
            top: 0,
            left: 0,
          }}
        />
      )}

      {/* Option Buttons with Roving Tabindex */}
      {options.map((opt, idx) => {
        const isActive = idx === activeIndex;
        const itemRole = role === 'tablist' ? 'tab' : 'radio';
        return (
          <button
            key={opt.id}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            role={itemRole}
            aria-checked={role === 'radiogroup' ? isActive : undefined}
            aria-selected={role === 'tablist' ? isActive : undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => {
              if (opt.id !== value) {
                soundFx.playSlide();
                onChange(opt.id);
              }
            }}
            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 ${padY} px-3 rounded-lg ${fontSize} font-bold transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0d1016] ${
              isActive
                ? color === 'green'
                  ? 'text-[#071a10] font-extrabold'
                  : color === 'blue'
                  ? 'text-[#06182a] font-extrabold'
                  : color === 'purple'
                  ? 'text-[#120a21] font-extrabold'
                  : color === 'amber'
                  ? 'text-[#1f1105] font-extrabold'
                  : 'text-white font-extrabold'
                : 'text-[#a0aec0] hover:text-white'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
