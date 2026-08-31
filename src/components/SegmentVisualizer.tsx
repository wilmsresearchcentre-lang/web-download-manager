import React from 'react';
import { DownloadSegment } from '../types';
import { formatBytes, formatSpeed } from '../utils/downloadEngine';
import { Layers, Zap, Cpu } from 'lucide-react';

interface SegmentVisualizerProps {
  segments: DownloadSegment[];
  totalSize: number;
  overallSpeed: number;
  filename: string;
}

export const SegmentVisualizer: React.FC<SegmentVisualizerProps> = ({
  segments,
  totalSize,
  overallSpeed,
  filename
}) => {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 mt-3 space-y-3 font-mono text-xs text-slate-300 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-semibold text-white">
            IDM Dynamic Multi-Stream Socket Engine
          </span>
          <span className="bg-white/10 text-cyan-300 border border-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {segments.length} Parallel Sockets
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <span>Speed: <strong className="text-cyan-300">{formatSpeed(overallSpeed)}</strong></span>
          <span>Total: <strong className="text-white">{formatBytes(totalSize)}</strong></span>
        </div>
      </div>

      {/* Aggregate segmented bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-400 font-sans">
          <span>Parallel Segment Distribution:</span>
          <span className="font-mono text-cyan-300">Allocation: {formatBytes(totalSize / Math.max(1, segments.length))} / thread</span>
        </div>
        <div className="h-3.5 w-full bg-white/5 rounded-lg overflow-hidden flex gap-[2px] p-[2px] border border-white/10">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className="h-full relative overflow-hidden transition-all duration-300 rounded-[2px]"
              style={{
                width: `${100 / segments.length}%`,
                background: seg.progress >= 100 
                  ? '#10b981' 
                  : seg.status === 'active' 
                    ? '#2563eb' 
                    : 'rgba(255,255,255,0.08)'
              }}
              title={`Connection #${seg.id}: ${seg.progress.toFixed(1)}%`}
            >
              {seg.status === 'active' && seg.progress < 100 && (
                <div 
                  className="h-full bg-cyan-400 transition-all duration-200 opacity-90 shadow-[0_0_10px_#38bdf8]"
                  style={{ width: `${seg.progress}%` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detailed connection rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
        {segments.map((seg) => {
          const isComplete = seg.progress >= 100;
          const isActive = seg.status === 'active' && !isComplete;

          return (
            <div 
              key={seg.id}
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                isComplete 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : isActive
                    ? 'bg-white/10 border-cyan-400/40 text-cyan-200 shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="font-bold flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-400' : isActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
                  Socket #{seg.id}
                </span>
                <span className="font-semibold font-mono">{seg.progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mb-1.5 border border-white/10">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isComplete 
                      ? 'bg-emerald-400' 
                      : isActive 
                        ? 'bg-gradient-to-r from-blue-400 to-cyan-400 shadow-[0_0_8px_#38bdf8]' 
                        : 'bg-white/20'
                  }`}
                  style={{ width: `${Math.min(100, seg.progress)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>{formatBytes(seg.currentByte - seg.startByte)}</span>
                <span className="text-cyan-300 font-medium">{formatSpeed(seg.speed)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
