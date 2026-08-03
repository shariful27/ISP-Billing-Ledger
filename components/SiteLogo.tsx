import React from 'react';
import { SiteSettings } from '../types.ts';

interface SiteLogoProps {
  settings: SiteSettings;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  lightMode?: boolean;
}

export const SiteLogo: React.FC<SiteLogoProps> = ({
  settings,
  size = 'md',
  showTagline = true,
  lightMode = false
}) => {
  const { siteName, siteTagline, logoPreset, logoUrl } = settings;

  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg text-sm',
    md: 'w-10 h-10 rounded-xl text-base',
    lg: 'w-16 h-16 rounded-[24px] text-2xl'
  };

  const svgSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-9 h-9'
  };

  const renderIcon = () => {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={siteName}
          className={`${iconSizes[size]} object-contain bg-white p-1 border border-slate-200 shadow-sm`}
        />
      );
    }

    let svgPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />; // Default zap

    if (logoPreset === 'wifi') {
      svgPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />;
    } else if (logoPreset === 'globe') {
      svgPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />;
    } else if (logoPreset === 'network') {
      svgPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />;
    } else if (logoPreset === 'shield') {
      svgPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
    } else if (logoPreset === 'rocket') {
      svgPath = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 010 12.728" />;
    }

    return (
      <div className={`${iconSizes[size]} bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20`}>
        <svg className={svgSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {svgPath}
        </svg>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3">
      {renderIcon()}
      <div>
        <span className={`font-black tracking-tight leading-none block truncate ${
          size === 'lg' ? 'text-xl sm:text-3xl' : size === 'sm' ? 'text-xs sm:text-base' : 'text-base sm:text-xl'
        } ${lightMode ? 'text-slate-900' : 'text-white'}`}>
          {siteName || 'ISP লেজার প্রো'}
        </span>
        {showTagline && siteTagline && (
          <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.08em] mt-0.5 hidden sm:block ${
            lightMode ? 'text-slate-400' : 'text-blue-300'
          }`}>
            {siteTagline}
          </p>
        )}
      </div>
    </div>
  );
};
