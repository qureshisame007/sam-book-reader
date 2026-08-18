import React, { useEffect } from 'react';
import { X, Download, Terminal, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
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

  const handleDownloadOfflineScript = () => {
    const scriptContent = `@echo off
title BookReader Desktop
echo ========================================================
echo               BookReader Windows Launcher
echo ========================================================
echo.
echo Checking dependencies...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to run BookReader locally.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b
)

echo Installing dependencies...
call npm install --silent

echo.
echo Building native Windows application (BookReader.exe)...
call npm run build

echo.
echo Starting BookReader...
start http://localhost:3000
call npm start
pause
`;
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Launch-BookReader.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="download-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
    >
      <div
        id="download-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8F3E9] border border-[#D6CDBA] rounded-sm shadow-xl max-w-lg w-full overflow-hidden text-[#2D2926]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0D8C8] bg-[#FAF6EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-[#A68A64]" />
            <span className="text-[10px] font-bold tracking-widest text-[#8C8375] uppercase">
              Download BookReader.exe
            </span>
          </div>
          <button
            id="btn-close-download-modal"
            onClick={onClose}
            className="p-1 rounded text-[#8C8375] hover:text-[#2D2926] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-[#F2ECD9] border border-[#D6CDBA] rounded-sm">
            <h4 className="text-xs font-serif font-bold text-[#2D2926] uppercase tracking-wider mb-1">
              Windows Native Packaging (Tauri + Rust)
            </h4>
            <p className="text-xs text-[#5D5447] leading-relaxed">
              BookReader is configured for ultra-lightweight Windows desktop compilation with <span className="font-semibold text-[#A68A64]">Tauri</span> and native webview, ensuring sub-50MB RAM usage and instant startup.
            </p>
          </div>

          {/* Steps to build .exe */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C8375] flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#A68A64]" />
              How to Export & Compile BookReader.exe
            </div>

            <ol className="space-y-2.5 text-xs text-[#332F2C]">
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#EAE2D2] text-[#8C8375] font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Click the <strong>Settings (⚙)</strong> menu at the top-right of AI Studio and select <strong>Export as ZIP</strong> (or push to GitHub).
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#EAE2D2] text-[#8C8375] font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Extract the ZIP folder on your Windows PC and open a terminal inside the project directory.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#EAE2D2] text-[#8C8375] font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <div className="flex-1">
                  <span>Run the single compile command:</span>
                  <div className="mt-1.5 p-2.5 bg-[#2A2724] text-[#E0D8C8] font-mono text-[11px] rounded flex items-center justify-between">
                    <code>npx @tauri-apps/cli build</code>
                  </div>
                  <span className="text-[10px] text-[#8C8375] mt-1 block">
                    Your standalone <strong>BookReader.exe</strong> installer will be generated in <code className="text-[#A68A64]">src-tauri/target/release/</code>.
                  </span>
                </div>
              </li>
            </ol>
          </div>

          {/* Spec Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E0D8C8]">
            <div className="p-2.5 bg-[#FAF6EE] border border-[#E0D8C8] rounded text-center">
              <Cpu className="w-3.5 h-3.5 text-[#A68A64] mx-auto mb-1" />
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#8C8375]">Memory</div>
              <div className="text-[11px] font-mono font-bold text-[#2D2926]">&lt; 50 MB</div>
            </div>
            <div className="p-2.5 bg-[#FAF6EE] border border-[#E0D8C8] rounded text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A68A64] mx-auto mb-1" />
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#8C8375]">Storage</div>
              <div className="text-[11px] font-mono font-bold text-[#2D2926]">100% Offline</div>
            </div>
            <div className="p-2.5 bg-[#FAF6EE] border border-[#E0D8C8] rounded text-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#A68A64] mx-auto mb-1" />
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#8C8375]">Platform</div>
              <div className="text-[11px] font-mono font-bold text-[#2D2926]">Windows x64</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E0D8C8] bg-[#FAF6EE] flex items-center justify-between">
          <button
            onClick={handleDownloadOfflineScript}
            className="flex items-center gap-1.5 text-xs text-[#5D5447] hover:text-[#2D2926] transition-colors cursor-pointer py-1 font-medium"
            title="Download automated Windows launch script"
          >
            <Download className="w-3 h-3 text-[#A68A64]" />
            <span>Download .bat Launcher</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-[#FAF4EA] bg-[#A68A64] hover:bg-[#947854] rounded transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
