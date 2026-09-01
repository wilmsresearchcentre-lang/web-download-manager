import React, { useState } from 'react';
import { getExtensionFiles, downloadExtensionZip, getBookmarkletCode } from '../utils/extensionGenerator';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Code2, 
  Bookmark, 
  Terminal, 
  Chrome, 
  ExternalLink,
  FolderArchive,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface ExtensionExportModalProps {
  onClose: () => void;
}

export const ExtensionExportModal: React.FC<ExtensionExportModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'install' | 'files' | 'bookmarklet'>('install');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const appBaseUrl = 'https://web-download-manager-production-18d1.up.railway.app';
  const files = getExtensionFiles(appBaseUrl);
  const selectedFile = files[selectedFileIndex] || files[0];
  const bookmarkletCode = getBookmarkletCode(appBaseUrl);

  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      await downloadExtensionZip(appBaseUrl);
    } catch (err) {
      console.error("Failed to generate zip", err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a]/70 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0f172a]/95 border border-white/20 w-full max-w-4xl rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 border border-white/20 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Web IDM Browser Extension & Video Sniffer
                <span className="text-[10px] bg-white/10 text-cyan-300 border border-white/20 px-2 py-0.5 rounded font-mono font-bold">
                  v3.5 Manifest V3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Integrates direct video stream capture on YouTube, Vimeo, TikTok, Facebook, & HTML5 video players.
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

        {/* Tab Navigation */}
        <div className="px-6 border-b border-white/10 bg-white/5 flex items-center justify-between gap-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('install')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'install'
                  ? 'border-blue-400 text-cyan-300 bg-white/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Chrome className="w-4 h-4" />
              1-Minute Installation Guide
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'files'
                  ? 'border-blue-400 text-cyan-300 bg-white/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Extension Source Code ({files.length} Files)
            </button>
            <button
              onClick={() => setActiveTab('bookmarklet')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'bookmarklet'
                  ? 'border-blue-400 text-cyan-300 bg-white/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Zero-Install Bookmarklet
            </button>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-600/30 border border-white/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <FolderArchive className="w-4 h-4" />
            {isDownloadingZip ? 'Building ZIP...' : 'Download Extension (.ZIP)'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-black/20">
          {activeTab === 'install' && (
            <div className="space-y-6">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-5 flex items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-cyan-400" />
                    Download Ready-To-Load Package
                  </h4>
                  <p className="text-xs text-slate-400">
                    Includes manifest.json, floating video sniffer content scripts, background worker, and icons.
                  </p>
                </div>
                <button
                  onClick={handleDownloadZip}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-md shadow-blue-600/30 border border-white/20 flex items-center gap-2 shrink-0 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Web_IDM_Extension.zip
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-600/40 border border-blue-400/60 flex items-center justify-center font-bold text-cyan-300 text-xs">
                    1
                  </div>
                  <h5 className="font-semibold text-white text-xs">Unzip Files</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Download and extract the <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">.zip</code> into a folder (e.g. <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">Desktop/Web-IDM</code>) on your computer.
                  </p>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-600/40 border border-blue-400/60 flex items-center justify-center font-bold text-cyan-300 text-xs">
                    2
                  </div>
                  <h5 className="font-semibold text-white text-xs">Open Extensions Tab</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    In Chrome, Brave, or Edge, visit <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded font-mono">chrome://extensions</code> and toggle <strong>"Developer mode"</strong> (top-right).
                  </p>
                </div>

                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-600/40 border border-blue-400/60 flex items-center justify-center font-bold text-cyan-300 text-xs">
                    3
                  </div>
                  <h5 className="font-semibold text-white text-xs">Click "Load Unpacked"</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click the <strong>Load unpacked</strong> button on the top-left, select your extracted folder, and start sniffing videos everywhere!
                  </p>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  What happens after installing?
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 pt-1">
                  <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                    <strong className="text-slate-200 block mb-1">▶ On YouTube / Video Sites:</strong>
                    A floating <em>"Download this video"</em> button appears over any active player with quality presets (1080p, 720p, 320kbps MP3).
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                    <strong className="text-slate-200 block mb-1">⚡ 1-Click Multi-Thread Acceleration:</strong>
                    Clicking sends the stream directly to this Web IDM dashboard with 8-16 parallel connection sockets.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[440px]">
              {/* File list sidebar */}
              <div className="md:col-span-1 space-y-1 overflow-y-auto pr-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                  Package Files
                </div>
                {files.map((file, idx) => (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                      selectedFileIndex === idx
                        ? 'bg-white/20 text-cyan-300 border border-white/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{file.name}</span>
                    <span className="text-[9px] uppercase text-slate-500">{file.language}</span>
                  </button>
                ))}
              </div>

              {/* Code viewer */}
              <div className="md:col-span-3 bg-black/40 rounded-xl border border-white/15 flex flex-col overflow-hidden">
                <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-xs font-semibold text-slate-200">{selectedFile.name}</span>
                    <span className="text-[11px] text-slate-400 font-sans">({selectedFile.description})</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded text-xs transition-colors border border-white/10"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="flex-1 overflow-auto p-4 text-[11px] font-mono text-slate-300 leading-relaxed selection:bg-blue-600 selection:text-white">
                  <code>{selectedFile.content}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'bookmarklet' && (
            <div className="space-y-5">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Bookmark className="w-4 h-4 text-cyan-400" />
                  Instant Media Sniffer Bookmarklet (No Extension Required!)
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If you cannot install browser extensions (or are on mobile/work laptop), drag this bookmarklet to your Bookmarks Toolbar. Whenever you are on a video page (YouTube, Vimeo, etc.), click the bookmarklet to instantly import the video into Web IDM!
                </p>

                <div className="p-4 bg-black/40 rounded-xl border border-dashed border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <a
                      href={bookmarkletCode}
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Drag this button to your browser bookmarks bar (Ctrl+Shift+B to show bookmarks)!");
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-600/30 border border-white/20 cursor-grab active:cursor-grabbing inline-flex items-center gap-2 select-none"
                    >
                      <span>⚡ Web IDM Sniffer</span>
                    </a>
                    <span className="text-xs text-slate-400">← Drag this button to your Bookmarks Bar</span>
                  </div>

                  <button
                    onClick={handleCopyBookmarklet}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-full text-xs font-semibold transition-colors border border-white/10"
                  >
                    {copiedBookmarklet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedBookmarklet ? 'Copied to Clipboard!' : 'Copy Javascript Code'}</span>
                  </button>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-400 space-y-2 font-mono">
                <div className="text-slate-300 font-sans font-semibold">Bookmarklet Payload:</div>
                <div className="p-3 bg-black/40 rounded border border-white/10 text-[11px] text-cyan-300 break-all">
                  {bookmarkletCode}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Open-source Manifest V3 compatible with Chrome 88+, Edge 88+, Brave, Opera, & Firefox
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 rounded-full text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
