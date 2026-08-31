import React, { useState } from 'react';
import { DownloadTask } from '../types';
import { 
  formatBytes, 
  formatSpeed, 
  formatEta 
} from '../utils/downloadEngine';
import { SegmentVisualizer } from './SegmentVisualizer';
import { 
  Play, 
  Pause, 
  RotateCw, 
  Trash2, 
  Download, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Video, 
  Music, 
  FileArchive, 
  FileText, 
  FileCode, 
  Image, 
  File, 
  Copy, 
  Check, 
  Sparkles,
  AlertCircle,
  Cpu
} from 'lucide-react';

interface DownloadItemRowProps {
  task: DownloadTask;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRestart: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (task: DownloadTask) => void;
  onSaveToDisk: (task: DownloadTask) => void;
}

export const DownloadItemRow: React.FC<DownloadItemRowProps> = ({
  task,
  onPause,
  onResume,
  onRestart,
  onDelete,
  onPreview,
  onSaveToDisk
}) => {
  const [showSegments, setShowSegments] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const getCategoryIcon = () => {
    switch (task.category) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-400" />;
      case 'compressed':
        return <FileArchive className="w-5 h-5 text-amber-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-indigo-400" />;
      case 'software':
        return <FileCode className="w-5 h-5 text-rose-400" />;
      case 'image':
        return <Image className="w-5 h-5 text-pink-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'downloading':
        return (
          <span className="bg-blue-600/30 text-cyan-300 border border-blue-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Downloading
          </span>
        );
      case 'completed':
        return (
          <span className="bg-emerald-600/30 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Completed
          </span>
        );
      case 'paused':
        return (
          <span className="bg-amber-600/30 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Paused
          </span>
        );
      case 'error':
        return (
          <span className="bg-rose-600/30 text-rose-300 border border-rose-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return (
          <span className="bg-white/10 text-slate-300 border border-white/15 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {task.status}
          </span>
        );
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(task.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const remainingBytes = Math.max(0, (task.totalSize || 0) - task.downloadedBytes);
  const etaSeconds = task.speed > 0 ? remainingBytes / task.speed : 0;

  return (
    <div className="backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* File icon and title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
            {getCategoryIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white text-xs sm:text-sm truncate" title={task.filename}>
                {task.filename}
              </h4>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
              <span className="font-mono text-slate-300">
                {formatBytes(task.downloadedBytes)} of {formatBytes(task.totalSize || task.downloadedBytes)}
              </span>
              <span>•</span>
              <span className="text-cyan-300 font-mono font-medium">
                {task.status === 'downloading' ? formatSpeed(task.speed) : task.status === 'completed' ? 'Finished' : 'Idle'}
              </span>
              <span>•</span>
              <span>
                {task.status === 'downloading' 
                  ? `ETA: ${formatEta(etaSeconds)} (${formatBytes(remainingBytes)} left)` 
                  : task.status === 'completed'
                    ? '100% Downloaded'
                    : 'Paused'}
              </span>
              {task.videoQuality && (
                <>
                  <span>•</span>
                  <span className="bg-white/10 border border-white/10 text-cyan-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium">
                    {task.videoQuality}
                  </span>
                </>
              )}
              {task.saveDirectory && (
                <>
                  <span>•</span>
                  <span className="text-slate-400 font-mono text-[10px] truncate max-w-[180px]" title={`Save directory: ${task.saveDirectory}`}>
                    📁 {task.saveDirectory}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action button controls */}
        <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
          {/* Segment visualizer expand toggle */}
          <button
            onClick={() => setShowSegments(!showSegments)}
            title="Toggle IDM Connection Sockets Visualizer"
            className={`px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5 border transition-all ${
              showSegments
                ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{task.segments.length} Sockets</span>
            {showSegments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Pause / Resume */}
          {task.status === 'downloading' && (
            <button
              onClick={() => onPause(task.id)}
              title="Pause Download"
              className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 rounded-full transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}

          {task.status === 'paused' && (
            <button
              onClick={() => onResume(task.id)}
              title="Resume Download"
              className="p-2 bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-blue-400/40 rounded-full transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          {/* Preview playable video/audio */}
          {(task.category === 'video' || task.category === 'audio') && (
            <button
              onClick={() => onPreview(task)}
              title="Preview / Play Stream"
              className="p-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 rounded-full transition-colors"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          {/* Save file to disk */}
          <button
            onClick={() => onSaveToDisk(task)}
            title="Save / Download File to Computer"
            className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 rounded-full transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Copy URL */}
          <button
            onClick={handleCopyLink}
            title="Copy Direct Link"
            className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 rounded-full transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Restart */}
          <button
            onClick={() => onRestart(task.id)}
            title="Restart Download"
            className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 rounded-full transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(task.id)}
            title="Delete from Manager"
            className="p-2 bg-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-400/30 rounded-full transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Download Progress Bar */}
      <div className="mt-3.5 space-y-1.5">
        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              task.status === 'completed'
                ? 'bg-emerald-400 shadow-[0_0_12px_#10b981]'
                : task.status === 'paused'
                  ? 'bg-amber-400'
                  : task.status === 'error'
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-400 shadow-[0_0_14px_#38bdf8]'
            }`}
            style={{ width: `${Math.min(100, task.progress)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-0.5">
          <span>Sockets Active: {task.segments.filter(s => s.status === 'active').length} of {task.segments.length}</span>
          <span className="font-bold text-cyan-300">{task.progress.toFixed(1)}%</span>
        </div>
      </div>

      {/* Expandable IDM Multi-Socket Visualizer */}
      {showSegments && (
        <SegmentVisualizer
          segments={task.segments}
          totalSize={task.totalSize || task.downloadedBytes}
          overallSpeed={task.speed}
          filename={task.filename}
        />
      )}
    </div>
  );
};
