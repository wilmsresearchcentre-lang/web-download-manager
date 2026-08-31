import React from 'react';
import { formatSpeed } from '../utils/downloadEngine';
import { 
  Download, 
  Plus, 
  Layers, 
  Sparkles, 
  Activity, 
  Chrome, 
  Tv, 
  Wifi,
  Bookmark
} from 'lucide-react';

interface NavbarProps {
  totalSpeed: number;
  activeCount: number;
  onOpenAddModal: () => void;
  onOpenBatchModal: () => void;
  onOpenExtensionModal: () => void;
  onScrollToSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalSpeed,
  activeCount,
  onOpenAddModal,
  onOpenBatchModal,
  onOpenExtensionModal,
  onScrollToSimulator
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/5 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 border border-white/20 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Web <span className="text-blue-400">IDM</span>
              </span>
              <span className="bg-blue-500/20 text-cyan-300 border border-blue-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                TURBO v3.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multi-Thread Web Download Manager & Media Stream Sniffer
            </p>
          </div>
        </div>

        {/* Live Bandwidth Speed Indicator */}
        <div className="hidden md:flex items-center gap-3 backdrop-blur-md bg-white/5 border border-white/10 px-4 py-2 rounded-full font-mono text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full ${activeCount > 0 ? 'bg-cyan-400 animate-ping opacity-75' : 'bg-slate-500'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeCount > 0 ? 'bg-cyan-400' : 'bg-slate-500'}`} />
            </span>
            <span className="text-slate-400 text-[11px]">Bandwidth:</span>
            <span className="font-bold text-cyan-300 text-sm">{formatSpeed(totalSpeed)}</span>
          </div>
          <span className="text-white/20">|</span>
          <span className="text-slate-400 text-[11px]">
            {activeCount} Active Stream{activeCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* YouTube Floating Simulator Button */}
          <button
            onClick={onScrollToSimulator}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 rounded-full text-xs font-semibold transition-all"
          >
            <Tv className="w-3.5 h-3.5 text-red-400" />
            <span>YouTube Popup Demo</span>
          </button>

          {/* Browser Extension Modal Button */}
          <button
            onClick={onOpenExtensionModal}
            className="flex items-center gap-1.5 px-3.5 py-2 backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/15 text-cyan-300 rounded-full text-xs font-bold transition-all shadow-sm"
          >
            <Chrome className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Browser Extension</span>
            <span className="sm:hidden">Extension</span>
          </button>

          {/* Batch URL Importer */}
          <button
            onClick={onOpenBatchModal}
            className="p-2 sm:px-3.5 sm:py-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Batch Downloader"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Batch</span>
          </button>

          {/* Add URL Primary Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-600/30 border border-white/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add URL</span>
          </button>
        </div>
      </div>
    </header>
  );
};
