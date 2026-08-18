import React, { useEffect } from 'react';
import { TranslationState } from '../types';
import { X, Loader2, AlertCircle } from 'lucide-react';

interface TranslationModalProps {
  translation: TranslationState;
  onClose: () => void;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({
  translation,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!translation.isOpen) return null;

  return (
    <div
      id="translation-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    >
      <div
        id="translation-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8F3E9] border border-[#D6CDBA] rounded-sm shadow-xl max-w-2xl w-full flex flex-col overflow-hidden text-[#2D2926]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0D8C8] bg-[#FAF6EE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#A68A64] rounded-full" />
            <h4 className="text-[10px] font-bold tracking-widest text-[#A68A64] uppercase">
              Hinglish Translation
            </h4>
          </div>
          <button
            id="btn-close-translation"
            onClick={onClose}
            className="p-1 rounded text-[#8C8375] hover:text-[#2D2926] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Side by side content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {translation.loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#8C8375]">
              <Loader2 className="w-5 h-5 animate-spin text-[#A68A64]" />
              <p className="text-xs font-serif italic">Translating to natural Indian Hinglish...</p>
            </div>
          ) : translation.error ? (
            <div className="p-4 rounded bg-[#FBEBEB] border border-[#F0C2C2] text-[#8C2E2E] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#8C2E2E] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1 uppercase tracking-wider text-[10px]">Translation Error</p>
                <p className="text-[#682424]">{translation.error}</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#F2ECD9] border border-[#D6CDBA] rounded-sm p-6 shadow-xs flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ORIGINAL ENGLISH */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#8C8375] uppercase tracking-tighter">
                    Original
                  </p>
                  <p className="text-[13px] leading-relaxed text-[#5D5447] italic font-serif select-text">
                    "{translation.original}"
                  </p>
                </div>

                {/* HINGLISH */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#8C8375] uppercase tracking-tighter flex items-center justify-between">
                    <span>Hinglish</span>
                    <span className="text-[9px] lowercase font-normal text-[#A68A64]">
                      Natural Indian meaning
                    </span>
                  </p>
                  <p className="text-[13px] leading-relaxed text-[#2D2926] font-medium select-text">
                    "{translation.hinglish}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E0D8C8] bg-[#FAF6EE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-[#FAF4EA] bg-[#A68A64] hover:bg-[#947854] rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
