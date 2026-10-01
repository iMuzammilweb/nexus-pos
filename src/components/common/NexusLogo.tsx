import React from 'react';

interface NexusLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'brand';
  showSubtitle?: boolean;
  tagline?: string;
  className?: string;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  size = 'md',
  variant = 'brand',
  showSubtitle = true,
  tagline = 'SMART • SIMPLE • POWERFUL',
  className = '',
}) => {
  const sizeMap = {
    sm: {
      icon: 'w-7 h-7',
      svgSize: 28,
      title: 'text-base font-black',
      tagline: 'text-[7.5px] tracking-[0.14em]',
      badge: 'text-[8px] px-1 py-0.2',
      gap: 'gap-2',
    },
    md: {
      icon: 'w-9 h-9',
      svgSize: 36,
      title: 'text-lg font-black',
      tagline: 'text-[9px] tracking-[0.18em]',
      badge: 'text-[9px] px-1.5 py-0.5',
      gap: 'gap-2.5',
    },
    lg: {
      icon: 'w-11 h-11',
      svgSize: 44,
      title: 'text-2xl font-black',
      tagline: 'text-[10.5px] tracking-[0.2em]',
      badge: 'text-[10px] px-2 py-0.5',
      gap: 'gap-3',
    },
    xl: {
      icon: 'w-14 h-14',
      svgSize: 56,
      title: 'text-3xl font-black',
      tagline: 'text-xs tracking-[0.22em]',
      badge: 'text-xs px-2.5 py-1',
      gap: 'gap-3.5',
    },
  }[size];

  const isLight = variant === 'light';

  return (
    <div className={`flex items-center ${sizeMap.gap} select-none ${className}`}>
      {/* Stylized Modern NEXUS POS Emblem SVG */}
      <div
        className={`${sizeMap.icon} shrink-0 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-sm transition-transform duration-200 hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #0284C7 100%)',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
        }}
      >
        <svg
          width="75%"
          height="75%"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle POS Grid / Terminal Screen background lines */}
          <rect
            x="4"
            y="6"
            width="40"
            height="36"
            rx="8"
            fill="white"
            fillOpacity="0.08"
            stroke="white"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />

          {/* Receipt / POS Slot line */}
          <path
            d="M14 11H34"
            stroke="white"
            strokeOpacity="0.6"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Bold Futuristic Stylized 'N' */}
          <path
            d="M14 36V17L25 31V17M34 17V36L25 24"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glow Pulse Accent at the apex */}
          <circle cx="34" cy="17" r="2.5" fill="#38BDF8" />
          <circle cx="14" cy="36" r="2.5" fill="#60A5FA" />
        </svg>
      </div>

      {/* Brand Typography & Tagline */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-2">
          <span
            className={`${sizeMap.title} tracking-tight ${
              isLight ? 'text-white' : 'text-[#0F172A]'
            }`}
          >
            NEXUS <span className="text-blue-600 font-black">POS</span>
          </span>
          <span
            className={`${sizeMap.badge} font-extrabold uppercase rounded-md ${
              isLight
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            PRO
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`${sizeMap.tagline} font-bold uppercase mt-0.5 ${
              isLight ? 'text-blue-200' : 'text-[#64748B]'
            }`}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};
