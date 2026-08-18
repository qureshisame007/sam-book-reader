import React from 'react';
import { BookOpen, Minus, Square, X } from 'lucide-react';

interface TitleBarProps {
  currentBookTitle?: string;
  onBackToLibrary?: () => void;
  isReading?: boolean;
  onOpenDownload?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  currentBookTitle,
  onBackToLibrary,
  isReading = false,
  onOpenDownload,
}) => {
  return (
    <header
      id="app-titlebar"
      className="h-9 w-full bg-[#1A1A1A] border-b border-[#2A2724] flex items-center justify-between px-3.5 text-[#8C8375] select-none text-xs z-50 flex-shrink-0"
    >
      {/* Left: App Identity */}
      <div className="flex items-center gap-2.5">
        <button
          id="titlebar-logo-btn"
          onClick={isReading && onBackToLibrary ? onBackToLibrary : undefined}
          className={`flex items-center gap-2 font-medium tracking-[0.15em] text-[#E0D8C8] transition-colors ${
            isReading ? 'hover:text-[#F8F3E9] cursor-pointer' : 'cursor-default'
          }`}
          title={isReading ? 'Back to Library' : 'BookReader'}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#A68A64]" />
          <span className="font-serif text-[11px] uppercase font-bold tracking-[0.2em] text-[#E0D8C8]">
            BookReader
          </span>
        </button>

        {isReading && currentBookTitle && (
          <>
            <div className="w-px h-3 bg-[#38332E]" />
            <span className="truncate max-w-[280px] sm:max-w-md text-[#A68A64] font-serif text-[11px] tracking-wide">
              {currentBookTitle}
            </span>
          </>
        )}
      </div>

      {/* Right: Windows App Controls Aesthetic */}
      <div className="flex items-center space-x-1">
        {onOpenDownload ? (
          <button
            onClick={onOpenDownload}
            className="flex items-center gap-1 text-[10px] text-[#A68A64] hover:text-[#E0D8C8] mr-3 font-mono tracking-wider cursor-pointer transition-colors bg-[#2A2724] px-2 py-0.5 rounded border border-[#38332E]"
            title="Download BookReader.exe Desktop App"
          >
            <span>Windows .EXE</span>
          </button>
        ) : (
          <div className="flex items-center text-[10px] text-[#736B5E] mr-3 font-mono tracking-wider hidden sm:inline-block">
            Windows App
          </div>
        )}
        <div className="flex items-center space-x-0.5 opacity-80">
          <button
            id="win-btn-minimize"
            aria-label="Minimize"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#2A2724] text-[#8C8375] hover:text-[#E0D8C8] transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            id="win-btn-maximize"
            aria-label="Maximize"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#2A2724] text-[#8C8375] hover:text-[#E0D8C8] transition-colors"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            id="win-btn-close"
            aria-label="Close"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#682424] text-[#8C8375] hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
