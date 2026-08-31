import React, { useState } from 'react';
import { DownloadCategory } from '../types';
import { extractFilenameFromUrl, detectCategory, sanitizeWebUrl, isSafeWebUrl } from '../utils/downloadEngine';
import { X, Layers, ListPlus, Check } from 'lucide-react';

interface BatchDownloadModalProps {
  onClose: () => void;
  onAddBatch: (items: Array<{
    url: string;
    filename: string;
    category: DownloadCategory;
    totalSize: number;
    threadCount: number;
  }>) => void;
}

export const BatchDownloadModal: React.FC<BatchDownloadModalProps> = ({
  onClose,
  onAddBatch
}) => {
  const [linksText, setLinksText] = useState('');
  const [threadCount, setThreadCount] = useState(8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = linksText
      .split('\n')
      .map(l => l.trim())
      .filter(l => isSafeWebUrl(l));

    if (lines.length === 0) return;

    const items = lines.map((rawUrl, idx) => {
      const url = sanitizeWebUrl(rawUrl);
      const filename = extractFilenameFromUrl(url, `batch_file_${idx + 1}`);
      const category = detectCategory(filename);
      return {
        url,
        filename,
        category,
        totalSize: 35000000,
        threadCount
      };
    });

    onAddBatch(items);
    onClose();
  };

  const detectedCount = linksText
    .split('\n')
    .filter(l => isSafeWebUrl(l.trim())).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a]/70 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0f172a]/95 border border-white/20 w-full max-w-xl rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 border border-white/20 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Batch URL Downloader
              </h3>
              <p className="text-xs text-slate-400">
                Paste multiple links (one per line) to queue all downloads simultaneously
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">
                Direct URLs List:
              </label>
              <span className="text-cyan-300 font-mono font-bold">
                {detectedCount} valid link{detectedCount === 1 ? '' : 's'} detected
              </span>
            </div>
            <textarea
              rows={6}
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              placeholder="https://example.com/video1.mp4&#10;https://example.com/audio1.mp3&#10;https://example.com/archive.zip"
              className="w-full bg-black/40 border border-white/15 rounded-xl p-3.5 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between backdrop-blur-xl bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs">
            <span className="text-slate-300 font-medium">Sockets Per File:</span>
            <div className="flex gap-2">
              {[4, 8, 16].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setThreadCount(num)}
                  className={`px-3 py-1 rounded-lg font-mono font-bold border transition-colors ${
                    threadCount === num
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {num}T
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-full text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={detectedCount === 0}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold shadow-lg shadow-purple-600/30 border border-white/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <ListPlus className="w-4 h-4" />
              Queue {detectedCount || 0} Downloads
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
