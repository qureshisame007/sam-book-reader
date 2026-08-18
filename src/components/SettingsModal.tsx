import React, { useEffect } from 'react';
import { ReaderSettings, ReadingTheme } from '../types';
import { X, Type, Palette } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: ReaderSettings) => void;
  onClose: () => void;
  onOpenDownload?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
  onOpenDownload,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fontSizes = [14, 16, 18, 20, 22, 24];

  const themes: { id: ReadingTheme; name: string; previewBg: string; previewText: string; desc: string }[] = [
    {
      id: 'natural',
      name: 'Natural Paper',
      previewBg: 'bg-[#F8F3E9]',
      previewText: 'text-[#2D2926]',
      desc: 'Warm cream paper with charcoal ink',
    },
    {
      id: 'old',
      name: 'Old Book',
      previewBg: 'bg-[#EFE7D3]',
      previewText: 'text-[#33251A]',
      desc: 'Vintage aged parchment with sepia ink',
    },
    {
      id: 'dark',
      name: 'Dark',
      previewBg: 'bg-[#1A1A1A]',
      previewText: 'text-[#E5DDD0]',
      desc: 'Minimal dark tone for night reading',
    },
  ];

  return (
    <div
      id="settings-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div
        id="settings-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8F3E9] border border-[#D6CDBA] rounded-sm shadow-xl max-w-md w-full overflow-hidden text-[#2D2926]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0D8C8] bg-[#FAF6EE] flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-[#8C8375] uppercase">
            Reading Settings
          </span>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1 rounded text-[#8C8375] hover:text-[#2D2926] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Font Size Option */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold text-[#8C8375] uppercase tracking-wider flex items-center gap-2">
                <Type className="w-3.5 h-3.5 text-[#A68A64]" />
                Typography Scale
              </label>
              <span className="text-xs font-mono font-medium text-[#5D5447]">{settings.fontSize}px</span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size}
                  id={`btn-font-${size}`}
                  onClick={() => onUpdateSettings({ ...settings, fontSize: size })}
                  className={`py-2 rounded text-xs font-serif transition-all cursor-pointer ${
                    settings.fontSize === size
                      ? 'bg-[#A68A64] text-white font-bold shadow-xs'
                      : 'bg-[#EAE2D2] hover:bg-[#E0D8C8] text-[#5D5447]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Appearance / Theme */}
          <div>
            <label className="text-[10px] font-bold text-[#8C8375] uppercase tracking-wider flex items-center gap-2 mb-3">
              <Palette className="w-3.5 h-3.5 text-[#A68A64]" />
              Paper Palette
            </label>

            <div className="space-y-2.5">
              {themes.map((t) => {
                const isSelected = settings.theme === t.id;
                return (
                  <div
                    key={t.id}
                    id={`theme-option-${t.id}`}
                    onClick={() => onUpdateSettings({ ...settings, theme: t.id })}
                    className={`p-3 rounded border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#A68A64] bg-[#FAF6EE] shadow-xs'
                        : 'border-[#D6CDBA] bg-[#F2ECD9]/50 hover:bg-[#FAF6EE]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Theme preview swatch */}
                      <div
                        className={`w-8 h-8 rounded border border-black/10 ${t.previewBg} ${t.previewText} flex items-center justify-center font-serif text-xs font-bold shadow-2xs`}
                      >
                        Aa
                      </div>
                      <div>
                        <div
                          className={`text-xs font-serif font-bold ${
                            isSelected ? 'text-[#2D2926]' : 'text-[#5D5447]'
                          }`}
                        >
                          {t.name}
                        </div>
                        <div className="text-[10px] text-[#8C8375]">{t.desc}</div>
                      </div>
                    </div>

                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#A68A64] bg-[#A68A64]'
                          : 'border-[#B8ADA0] bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E0D8C8] bg-[#FAF6EE] flex items-center justify-between">
          {onOpenDownload ? (
            <button
              onClick={() => {
                onClose();
                onOpenDownload();
              }}
              className="text-[10px] font-bold tracking-wider uppercase text-[#A68A64] hover:text-[#947854] cursor-pointer"
            >
              Export Windows .exe
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-[#FAF4EA] bg-[#A68A64] hover:bg-[#947854] rounded transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
