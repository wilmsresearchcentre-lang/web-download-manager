import React from 'react';
import { DownloadCategory, DownloadStatus } from '../types';
import { formatBytes, formatSpeed } from '../utils/downloadEngine';
import { 
  Layers, 
  Video, 
  Music, 
  FileArchive, 
  FileText, 
  FileCode, 
  Image, 
  CheckCircle2, 
  Clock, 
  PauseCircle, 
  Play, 
  Pause, 
  Trash2, 
  Gauge, 
  Sliders, 
  Zap,
  HardDrive,
  Cpu
} from 'lucide-react';

interface CategorySidebarProps {
  activeCategory: DownloadCategory;
  onSelectCategory: (cat: DownloadCategory) => void;
  statusFilter: DownloadStatus | 'all';
  onSelectStatusFilter: (status: DownloadStatus | 'all') => void;
  counts: Record<DownloadCategory, number>;
  statusCounts: {
    downloading: number;
    completed: number;
    paused: number;
    all: number;
  };
  totalDownloadedBytes: number;
  totalSpeed: number;
  onStartAll: () => void;
  onPauseAll: () => void;
  onClearCompleted: () => void;
  speedLimit: number; // 0 = unlimited, otherwise bytes/sec
  onSetSpeedLimit: (limit: number) => void;
  maxConcurrent: number;
  onSetMaxConcurrent: (val: number) => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  activeCategory,
  onSelectCategory,
  statusFilter,
  onSelectStatusFilter,
  counts,
  statusCounts,
  totalDownloadedBytes,
  totalSpeed,
  onStartAll,
  onPauseAll,
  onClearCompleted,
  speedLimit,
  onSetSpeedLimit,
  maxConcurrent,
  onSetMaxConcurrent
}) => {
  const categories: Array<{ id: DownloadCategory; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'All Categories', icon: <Layers className="w-4 h-4 text-cyan-400" /> },
    { id: 'video', label: 'Video (MP4/WEBM)', icon: <Video className="w-4 h-4 text-sky-400" /> },
    { id: 'audio', label: 'Audio (MP3/M4A)', icon: <Music className="w-4 h-4 text-emerald-400" /> },
    { id: 'compressed', label: 'Compressed (ZIP/ISO)', icon: <FileArchive className="w-4 h-4 text-amber-400" /> },
    { id: 'document', label: 'Documents (PDF/DOC)', icon: <FileText className="w-4 h-4 text-indigo-400" /> },
    { id: 'software', label: 'Programs (EXE/APK)', icon: <FileCode className="w-4 h-4 text-rose-400" /> },
    { id: 'image', label: 'Images', icon: <Image className="w-4 h-4 text-pink-400" /> }
  ];

  return (
    <div className="w-full lg:w-64 space-y-5 flex flex-col shrink-0">
      {/* Category Navigation */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
          <span>Categories</span>
          <span className="text-[10px] text-cyan-400 font-mono">IDM Engine</span>
        </div>

        <nav className="space-y-1">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            const count = counts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'backdrop-blur-xl bg-white/15 text-white border border-white/20 shadow-md ring-1 ring-white/10'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {cat.icon}
                  <span>{cat.label}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/10 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Task Status Filters & Global Controls */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
          Download Status
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSelectStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
              statusFilter === 'all'
                ? 'bg-white/20 text-white font-semibold border border-white/20 shadow-sm'
                : 'text-slate-400 hover:bg-white/10'
            }`}
          >
            <span>All Tasks</span>
            <span className="text-[10px] font-mono">{statusCounts.all}</span>
          </button>

          <button
            onClick={() => onSelectStatusFilter('downloading')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
              statusFilter === 'downloading'
                ? 'bg-blue-600/40 text-cyan-300 font-semibold border border-blue-400/50 shadow-sm'
                : 'text-slate-400 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Active
            </span>
            <span className="text-[10px] font-mono">{statusCounts.downloading}</span>
          </button>

          <button
            onClick={() => onSelectStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-600/40 text-emerald-300 font-semibold border border-emerald-400/50 shadow-sm'
                : 'text-slate-400 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Done
            </span>
            <span className="text-[10px] font-mono">{statusCounts.completed}</span>
          </button>

          <button
            onClick={() => onSelectStatusFilter('paused')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
              statusFilter === 'paused'
                ? 'bg-amber-600/40 text-amber-300 font-semibold border border-amber-400/50 shadow-sm'
                : 'text-slate-400 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-1">
              <PauseCircle className="w-3 h-3 text-amber-400" />
              Paused
            </span>
            <span className="text-[10px] font-mono">{statusCounts.paused}</span>
          </button>
        </div>

        {/* Global Batch Controls */}
        <div className="pt-2.5 border-t border-white/10 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onStartAll}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 border border-white/20 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              Start All
            </button>
            <button
              onClick={onPauseAll}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause All
            </button>
          </div>

          <button
            onClick={onClearCompleted}
            className="w-full px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Completed
          </button>
        </div>
      </div>

      {/* Queue Slicing & Speed Limiter */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Queue Config
          </span>
          <span className="text-cyan-400 font-mono">{maxConcurrent} Parallel</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Max Active Downloads:</span>
            <div className="flex gap-1">
              {[1, 2, 4, 8].map((num) => (
                <button
                  key={num}
                  onClick={() => onSetMaxConcurrent(num)}
                  className={`w-6 h-6 rounded-lg text-xs font-mono font-bold transition-colors ${
                    maxConcurrent === num
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Speed Throttle:</span>
              <span className="font-mono text-cyan-300">
                {speedLimit === 0 ? 'Unlimited' : formatSpeed(speedLimit)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => onSetSpeedLimit(0)}
                className={`py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                  speedLimit === 0 ? 'bg-blue-600 text-white border-blue-400 shadow-sm' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                Max Speed
              </button>
              <button
                onClick={() => onSetSpeedLimit(2 * 1024 * 1024)}
                className={`py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                  speedLimit === 2 * 1024 * 1024 ? 'bg-blue-600 text-white border-blue-400 shadow-sm' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                2 MB/s
              </button>
              <button
                onClick={() => onSetSpeedLimit(5 * 1024 * 1024)}
                className={`py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                  speedLimit === 5 * 1024 * 1024 ? 'bg-blue-600 text-white border-blue-400 shadow-sm' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                5 MB/s
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bandwidth & Accelerator Stats */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl space-y-2 text-xs">
        <div className="flex items-center gap-2 text-white font-semibold">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Bandwidth Transferred</span>
        </div>
        <div className="text-xl font-bold font-mono text-white">
          {formatBytes(totalDownloadedBytes)}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
          <span>Acceleration Multiplier:</span>
          <span className="text-emerald-400 font-bold font-mono">5.0x - 8.2x</span>
        </div>
      </div>
    </div>
  );
};
