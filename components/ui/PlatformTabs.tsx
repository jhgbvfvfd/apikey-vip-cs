import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from '../../types';

interface PlatformTabsProps {
  platforms: Platform[];
  selected: string;
  onSelect: (id: string) => void;
}

const PlatformTabs: React.FC<PlatformTabsProps> = ({ platforms, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedPlatform = useMemo(() => {
    if (platforms.length === 0) return undefined;
    return platforms.find(p => p.id === selected) ?? platforms[0];
  }, [platforms, selected]);

  if (!selectedPlatform) return null;

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus:outline-none"
      >
        <span className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-blue-500/80">แพลตฟอร์มที่เลือก</span>
          <span className="mt-0.5 flex items-center gap-2 text-base text-slate-900">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            {selectedPlatform.title}
          </span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-transform">
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto py-2">
            {platforms.map(platform => {
              const isSelected = platform.id === selectedPlatform.id;
              return (
                <button
                  key={platform.id}
                  onClick={() => handleSelect(platform.id)}
                  className={`relative flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                  <span className="flex flex-col">
                    <span className="font-semibold">{platform.title}</span>
                    {platform.description && (
                      <span className="text-xs text-slate-500">{platform.description}</span>
                    )}
                  </span>
                  {isSelected && (
                    <span className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformTabs;
