import React, { useState, useEffect } from 'react';
import { DownloadCategory, ProbeResult } from '../types';
import { 
  probeUrl, 
  detectCategory, 
  extractFilenameFromUrl, 
  formatBytes, 
  PRESET_SAMPLE_DOWNLOADS,
  sanitizeWebUrl
} from '../utils/downloadEngine';
import { 
  X, 
  Download, 
  Link2, 
  CheckCircle2, 
  Folder, 
  FolderOpen, 
  Sparkles, 
  ClipboardPaste,
  Clock,
  Film,
  Music,
  FileArchive,
  FileText,
  Package,
  Image as ImageIcon,
  HardDrive
} from 'lucide-react';

interface AddDownloadModalProps {
  initialUrl?: string;
  onClose: () => void;
  onAddDownload: (task: {
    url: string;
    filename: string;
    category: DownloadCategory;
    totalSize: number;
    threadCount: number;
    autoStart: boolean;
    mimeType: string;
    videoQuality?: string;
    saveImmediately?: boolean;
    saveDirectory?: string;
  }) => void;
}

const DEFAULT_DIRECTORIES: Record<string, string> = {
  all: 'C:\\Users\\Downloads',
  video: 'C:\\Users\\Downloads\\Videos',
  audio: 'C:\\Users\\Downloads\\Music',
  compressed: 'C:\\Users\\Downloads\\Compressed',
  document: 'C:\\Users\\Downloads\\Documents',
  software: 'C:\\Users\\Downloads\\Programs',
  image: 'C:\\Users\\Downloads\\Pictures',
  other: 'C:\\Users\\Downloads'
};

const COMMON_DIRECTORIES = [
  { label: 'Downloads (Default)', path: 'C:\\Users\\Downloads', icon: HardDrive },
  { label: 'Videos Folder', path: 'C:\\Users\\Downloads\\Videos', icon: Film },
  { label: 'Music / Audio', path: 'C:\\Users\\Downloads\\Music', icon: Music },
  { label: 'Compressed Archives', path: 'C:\\Users\\Downloads\\Compressed', icon: FileArchive },
  { label: 'Documents', path: 'C:\\Users\\Downloads\\Documents', icon: FileText },
  { label: 'Programs / Software', path: 'C:\\Users\\Downloads\\Programs', icon: Package },
  { label: 'Desktop', path: 'C:\\Users\\Desktop', icon: Folder }
];

export const AddDownloadModal: React.FC<AddDownloadModalProps> = ({
  initialUrl = '',
  onClose,
  onAddDownload
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [filename, setFilename] = useState('');
  const [category, setCategory] = useState<DownloadCategory>('all');
  const [saveDirectory, setSaveDirectory] = useState<string>('C:\\Users\\Downloads');
  const [isBrowseOpen, setIsBrowseOpen] = useState<boolean>(false);
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeData, setProbeData] = useState<ProbeResult | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p');

  // Auto probe when URL changes
  useEffect(() => {
    if (!url.trim()) return;

    const timer = setTimeout(async () => {
      setIsProbing(true);
      try {
        const result = await probeUrl(url.trim());
        setProbeData(result);
        
        const detectedCat = result.category || 'all';
        setCategory(detectedCat);
        setSaveDirectory(DEFAULT_DIRECTORIES[detectedCat] || 'C:\\Users\\Downloads');

        if (!filename || filename === extractFilenameFromUrl(url)) {
          setFilename(result.filename);
        }

        // If it's YouTube / Media stream with stream options
        if (result.isYouTube && result.streams && result.streams.length > 0) {
          setSelectedQuality(result.streams[0].quality || '1080p');
        }
      } catch (err) {
        console.error("Probe failed", err);
      } finally {
        setIsProbing(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [url]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch {
      // ignore clipboard permission error
    }
  };

  const handleSelectSample = (sample: typeof PRESET_SAMPLE_DOWNLOADS[0]) => {
    setUrl(sample.url);
    setFilename(sample.filename);
    setCategory(sample.category);
    setSaveDirectory(DEFAULT_DIRECTORIES[sample.category] || 'C:\\Users\\Downloads');
  };

  const handleCategoryChange = (newCat: DownloadCategory) => {
    setCategory(newCat);
    setSaveDirectory(DEFAULT_DIRECTORIES[newCat] || 'C:\\Users\\Downloads');
  };

  const handleBrowseFolder = async () => {
    // Try native Directory Picker if supported
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle && dirHandle.name) {
          setSaveDirectory(`C:\\Users\\Downloads\\${dirHandle.name}`);
          return;
        }
      } catch {
        // User cancelled or not allowed in iframe, open visual picker
      }
    }
    setIsBrowseOpen(true);
  };

  const handleProcessSubmit = (saveImmediately = true) => {
    if (!url.trim()) return;

    const targetUrl = sanitizeWebUrl(url.trim());
    const finalFilename = filename.trim() || extractFilenameFromUrl(targetUrl);
    const finalCategory = category === 'all' ? detectCategory(finalFilename) : category;
    const finalSize = probeData?.totalSize || 35000000;

    onAddDownload({
      url: targetUrl,
      filename: finalFilename,
      category: finalCategory,
      totalSize: finalSize,
      threadCount: 16, // Optimal turbo acceleration automatically
      autoStart: saveImmediately,
      mimeType: probeData?.mimeType || 'application/octet-stream',
      videoQuality: selectedQuality || probeData?.streams?.[0]?.quality,
      saveImmediately,
      saveDirectory
    });

    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessSubmit(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a]/75 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-white/20 w-full max-w-xl rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Classic IDM Header Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/20 via-white/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 border border-white/20 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                <span>Download File Info</span>
                <span className="text-[10px] font-mono font-semibold bg-blue-500/20 text-cyan-300 border border-blue-400/30 px-1.5 py-0.2 rounded">
                  IDM Turbo
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Internet Download Manager Instant Grabber
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* 1. Address / URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Address (URL):
            </label>
            <div className="relative flex items-center">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste video, audio, software or direct file link here..."
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 pl-9 pr-20 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3" />
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="absolute right-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-cyan-300 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors border border-white/15 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-cyan-400" />
                Paste
              </button>
            </div>
          </div>

          {/* 2. YouTube / Media Stream Detection & Instant Quality Selector */}
          {probeData?.isYouTube && (
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center gap-3">
                {probeData.thumbnail && (
                  <img
                    src={probeData.thumbnail}
                    alt={probeData.title}
                    className="w-20 h-13 object-cover rounded-lg border border-white/10 shrink-0 shadow"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase font-bold text-red-400">
                    Video Stream Captured
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {probeData.title}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {probeData.author}
                  </p>
                </div>
              </div>

              {/* Quality Options */}
              {probeData.streams && probeData.streams.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-300 mb-1.5">
                    Select Quality:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {probeData.streams.map((stream, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setUrl(stream.directUrl);
                          setSelectedQuality(stream.quality);
                          setFilename(`${(probeData.title || 'video').replace(/[/\\?%*:|"<>]/g, '_')}_${stream.quality}.${stream.format}`);
                          setCategory(stream.format === 'mp3' ? 'audio' : 'video');
                        }}
                        className={`p-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                          selectedQuality === stream.quality || url === stream.directUrl
                            ? 'bg-blue-600 border-blue-400 text-white shadow'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-[11px] font-bold font-mono">
                          {stream.quality}
                        </div>
                        <div className="text-[9px] text-slate-300 flex justify-between">
                          <span>.{stream.format}</span>
                          <span>{formatBytes(stream.size)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick 1-Click Samples for Testing */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Quick Test Links (1-Click):
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PRESET_SAMPLE_DOWNLOADS.slice(0, 4).map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    url === sample.url
                      ? 'bg-blue-600/30 border-blue-400/60 text-cyan-200 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase text-cyan-400">
                    {sample.category}
                  </div>
                  <div className="text-[11px] font-semibold truncate text-slate-200">
                    {sample.filename}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{formatBytes(sample.size)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Category & Save As (File Name) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-200">
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as DownloadCategory)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">Auto Detect</option>
                <option value="video">Video (MP4, MKV, AVI)</option>
                <option value="audio">Music / Audio (MP3, M4A)</option>
                <option value="compressed">Compressed (ZIP, RAR, 7Z)</option>
                <option value="document">Documents (PDF, DOC)</option>
                <option value="software">Programs / Software (EXE, ISO)</option>
                <option value="image">Pictures / Images</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-200">
                Save As (File Name):
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="download_file.mp4"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* 4. Save To / Save Direction with BROWSE Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200">
                Save To (Download Directory):
              </label>
              <span className="text-[10px] text-cyan-400 font-mono">
                Auto-sorted by category
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={saveDirectory}
                  onChange={(e) => setSaveDirectory(e.target.value)}
                  placeholder="C:\Users\Downloads..."
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 pl-9 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <Folder className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
              </div>
              
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm"
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Browse...</span>
              </button>
            </div>
          </div>

          {/* Folder Browse Popup / Picker */}
          {isBrowseOpen && (
            <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-3 space-y-2 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4" />
                  Select Save Directory:
                </span>
                <button
                  type="button"
                  onClick={() => setIsBrowseOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {COMMON_DIRECTORIES.map((dir, idx) => {
                  const Icon = dir.icon;
                  const isSelected = saveDirectory === dir.path;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSaveDirectory(dir.path);
                        setIsBrowseOpen(false);
                      }}
                      className={`p-2 rounded-lg text-left text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white font-semibold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-cyan-300 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{dir.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{dir.path}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* File Size & Server Info Badge */}
          {url && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs flex items-center justify-between text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                {isProbing ? (
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>
                  {isProbing ? 'Checking file size...' : `File Size: ${formatBytes(probeData?.totalSize || 35000000)}`}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">
                {probeData?.resumable ? '✓ Resume Supported' : '✓ Direct Fast Stream'}
              </span>
            </div>
          )}

          {/* Footer IDM Buttons: Start Download | Download Later | Cancel */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!url.trim()}
                onClick={() => handleProcessSubmit(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-cyan-200 rounded-full text-xs font-bold border border-white/15 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Later</span>
              </button>
              
              <button
                type="submit"
                disabled={!url.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-600/30 border border-white/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Start Download</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
