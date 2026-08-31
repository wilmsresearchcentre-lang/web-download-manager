import React, { useState } from 'react';
import { DownloadTask } from '../types';
import { CheckCircle2, Play, Download, X, FolderOpen, HardDrive, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { formatBytes, downloadFileToDisk } from '../utils/downloadEngine';

interface IdmCompleteModalProps {
  task: DownloadTask | null;
  onClose: () => void;
  onPreview: (task: DownloadTask) => void;
}

export const IdmCompleteModal: React.FC<IdmCompleteModalProps> = ({
  task,
  onClose,
  onPreview
}) => {
  const [isSaving, setIsSaving] = useState(false);
  if (!task) return null;

  const handleDownloadFile = async () => {
    setIsSaving(true);
    try {
      await downloadFileToDisk(task.url, task.filename);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlay = () => {
    onClose();
    onPreview(task);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a]/75 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-cyan-500/40 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Top Glowing Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <span>Download Completed</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono">100% OK</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Internet Download Manager Turbo Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* File Card Info */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
            <div className="text-xs font-bold text-white break-all leading-snug">
              {task.filename}
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">File Size</span>
                <span className="font-mono font-semibold text-cyan-300">
                  {formatBytes(task.totalSize)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Average Speed</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {(task.peakSpeed / 1048576).toFixed(1)} MB/s
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sockets Used</span>
                <span className="font-mono text-slate-300">
                  {task.threadCount || 8} Multi-Stream Sockets
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Saved & Verified
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleDownloadFile}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 border border-white/20 flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Save / Download to Computer (Downloads folder)</span>
            </button>

            {(task.category === 'video' || task.category === 'audio') && (
              <button
                onClick={handlePlay}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 active:scale-98 text-cyan-200 border border-white/15 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span>Open / Play in Web Player</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
