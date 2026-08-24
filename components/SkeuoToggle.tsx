import React from 'react';
import { soundFx } from '../services/soundFx';

interface SkeuoToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  badge?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function SkeuoToggle({
  checked,
  onChange,
  label,
  description,
  badge,
  icon,
  className = '',
  disabled = false,
}: SkeuoToggleProps) {
  const toggle = () => {
    if (disabled) return;
    soundFx.playSlide();
    onChange(!checked);
  };

  return (
    <div
      onClick={toggle}
      className={`card-inset p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-all group ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#121620]'
      } ${className}`}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <div className="flex items-center gap-2.5">
        {icon && <span className={checked ? 'text-[#52b788]' : 'text-[#718096]'}>{icon}</span>}
        <div>
          <div className="flex items-center gap-2">
            {label && <span className="text-xs font-bold text-white block">{label}</span>}
            {badge && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#1c222e] border border-black/40 text-[#a0aec0]">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-[11px] text-[#718096] mt-0.5">{description}</p>}
        </div>
      </div>

      {/* 3D Physical Sliding Switch Track */}
      <div
        className={`relative h-6 w-11 shrink-0 rounded-full border border-black/70 p-0.5 transition-colors duration-250 ease-out shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.06)] ${
          checked ? 'bg-[#1e4a34]' : 'bg-[#0a0d13]'
        }`}
      >
        {/* Sliding Mechanical Convex Knob */}
        <div
          className={`h-4.5 w-4.5 rounded-full border border-black/50 transition-transform duration-250 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[0_2px_4px_rgba(0,0,0,0.6)] ${
            checked
              ? 'translate-x-5 bg-gradient-to-b from-[#74c69d] to-[#40916c] border-t-white/40'
              : 'translate-x-0 bg-gradient-to-b from-[#3a4454] to-[#202734] border-t-white/20'
          }`}
        />
      </div>
    </div>
  );
}
