import React, { useRef } from 'react';
import { DownloadTask } from '../types';
import { X, Play, Pause, Download, Music, Video, FileText, CheckCircle2 } from 'lucide-react';
import { formatBytes, getProxyDownloadUrl } from '../utils/downloadEngine';

interface MediaPreviewModalProps {
  task: DownloadTask | null;
  onClose: () => void;
  onSaveToDisk: (task: DownloadTask) => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  task,
  onClose,
  onSaveToDisk
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (!task) return null;

  const mediaSource = task.blobUrl || (task.url ? getProxyDownloadUrl(task.url, task.filename, false) : '');

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a]/70 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0f172a]/95 border border-white/20 w-full max-w-3xl rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3 min-w-0">
            {task.category === 'video' ? (
              <div className="w-9 h-9 rounded-xl bg-blue-600 border border-white/20 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                <Video className="w-5 h-5" />
              </div>
            ) : task.category === 'audio' ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-600 border border-white/20 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                <Music className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-purple-600 border border-white/20 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm truncate">
                {task.filename}
              </h3>
              <p className="text-xs text-slate-400">
                {formatBytes(task.totalSize || task.downloadedBytes)} • {task.category.toUpperCase()} • {task.status.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Content Area */}
        <div className="flex-1 bg-black/40 flex items-center justify-center p-6 min-h-[300px]">
          {task.category === 'video' ? (
            <video
              ref={videoRef}
              src={mediaSource}
              controls
              autoPlay
              className="max-h-[55vh] w-auto max-w-full rounded-xl shadow-2xl border border-white/15"
            >
              Your browser does not support the video tag.
            </video>
          ) : task.category === 'audio' ? (
            <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/15 p-6 rounded-2xl flex flex-col items-center gap-4 shadow-xl">
              <div className="w-20 h-20 bg-emerald-600/30 border border-emerald-400/40 rounded-full flex items-center justify-center text-emerald-300 shadow-inner">
                <Music className="w-10 h-10 animate-bounce" />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-white text-sm mb-1">{task.filename}</h4>
                <p className="text-xs text-slate-400">High-Bitrate Direct Audio Stream</p>
              </div>
              <audio
                ref={audioRef}
                src={mediaSource}
                controls
                autoPlay
                className="w-full mt-2"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400 space-y-3">
              <FileText className="w-16 h-16 mx-auto text-slate-500" />
              <p className="text-sm">Preview not available for this binary file type.</p>
              <p className="text-xs text-cyan-300 font-mono">{task.filename}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Ready for local offline playback</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSaveToDisk(task)}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-lg shadow-blue-600/30 border border-white/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Save File to Disk
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 rounded-full text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
