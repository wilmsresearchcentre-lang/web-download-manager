import React, { useState } from 'react';
import { SIMULATED_YOUTUBE_VIDEOS, sanitizeWebUrl } from '../utils/downloadEngine';
import { SniffedMedia, DownloadCategory } from '../types';
import { 
  Play, 
  Download, 
  Sparkles, 
  Volume2, 
  Tv, 
  ChevronDown, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Radio,
  FileDown,
  Layers,
  Info,
  Maximize2,
  AlertTriangle,
  Copy,
  CheckCircle2,
  X
} from 'lucide-react';

interface YouTubeExtensionSimulatorProps {
  onCaptureMedia: (media: {
    url: string;
    filename: string;
    category: DownloadCategory;
    size: number;
    quality: string;
  }) => void;
  onOpenExtensionModal: () => void;
}

export const YouTubeExtensionSimulator: React.FC<YouTubeExtensionSimulatorProps> = ({
  onCaptureMedia,
  onOpenExtensionModal
}) => {
  const [selectedVideo, setSelectedVideo] = useState<SniffedMedia>(SIMULATED_YOUTUBE_VIDEOS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [capturedNotification, setCapturedNotification] = useState<string | null>(null);
  const [simulateConnectionError, setSimulateConnectionError] = useState(false);
  const [showFallbackOverlay, setShowFallbackOverlay] = useState(false);
  const [copiedStreamUrl, setCopiedStreamUrl] = useState(false);

  const handleSelectQuality = (
    qualityLabel: string, 
    format: 'mp4' | 'mp3', 
    estimatedSize: number, 
    customUrl?: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDropdownOpen(false);
    
    // If connection failure is simulated, trigger the visual fallback notification overlay immediately
    if (simulateConnectionError) {
      setShowFallbackOverlay(true);
      return;
    }

    // Ensure strict HTTPS web URL sanitization, disallowing chrome:// or internal protocols
    const rawTarget = customUrl || selectedVideo.url;
    const sanitizedUrl = sanitizeWebUrl(rawTarget, 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
    
    const cleanTitle = (selectedVideo.title || 'media_stream').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanTitle}_${qualityLabel}.${format}`;
    const category: DownloadCategory = format === 'mp3' ? 'audio' : 'video';

    onCaptureMedia({
      url: sanitizedUrl,
      filename,
      category,
      size: estimatedSize,
      quality: qualityLabel
    });

    setCapturedNotification(`Captured "${filename}" (${qualityLabel}) into Accelerated Download Pipeline!`);
    setTimeout(() => setCapturedNotification(null), 4000);
  };

  const handleCopyDirectStreamUrl = (url: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedStreamUrl(true);
      setTimeout(() => setCopiedStreamUrl(false), 3000);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              YouTube & Media Player Sniffer Simulator
            </h2>
            <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              Live Browser Extension Overlay
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test how our Browser Extension automatically detects video/audio streams and overlays the iconic IDM floating download widget.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSimulateConnectionError(!simulateConnectionError);
              if (!simulateConnectionError) {
                setShowFallbackOverlay(true);
              } else {
                setShowFallbackOverlay(false);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              simulateConnectionError
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{simulateConnectionError ? 'Simulating Error: Active' : 'Test Background Failure'}</span>
          </button>

          <button
            onClick={onOpenExtensionModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-lg shadow-blue-600/30 border border-white/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Get Extension (.ZIP)
          </button>
        </div>
      </div>

      {capturedNotification && (
        <div className="backdrop-blur-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{capturedNotification}</span>
          </div>
          <span className="text-[11px] text-cyan-300 underline cursor-pointer" onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}>
            View Active Task ↓
          </span>
        </div>
      )}

      {/* Interactive Mock Video Player Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Video Screen with Floating Widget */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative aspect-video bg-black/60 rounded-2xl overflow-hidden border border-white/20 shadow-2xl group">
            {/* The Real Playing Video */}
            <video
              key={selectedVideo.url}
              src={selectedVideo.url}
              controls
              autoPlay
              muted
              loop
              className="w-full h-full object-cover"
            />

            {/* Simulated YouTube Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none z-10">
              <div className="flex items-center gap-2 text-white text-xs font-medium truncate max-w-[60%]">
                <div className="w-6 h-4 bg-red-600 rounded flex items-center justify-center font-bold text-[9px] text-white shadow">
                  ▶
                </div>
                <span className="truncate drop-shadow-md">{selectedVideo.title}</span>
              </div>
            </div>

            {/* === THE CRITICAL IDM FLOATING VIDEO DOWNLOAD BUTTON === */}
            <div className="absolute top-3 right-3 z-30 pointer-events-auto">
              <div className="relative">
                <button
                  id="idm-floating-sniff-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-600/40 border border-white/25 transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download this video</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating IDM Quality Picker Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 backdrop-blur-2xl bg-[#0f172a]/95 border border-white/20 rounded-2xl shadow-2xl p-2.5 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-cyan-300 uppercase tracking-wider border-b border-white/10 flex items-center justify-between">
                      <span>Available Streams</span>
                      <span className="text-[10px] text-slate-400 font-mono">IDM v3.2</span>
                    </div>

                    {simulateConnectionError && (
                      <div className="mx-1 my-1.5 p-2 bg-amber-500/20 border border-amber-400/50 rounded-xl text-[11px] text-amber-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Background script simulated as offline. Click any stream to trigger fallback.</span>
                      </div>
                    )}

                    <div className="space-y-1 mt-1.5 max-h-64 overflow-y-auto pr-1">
                      <button
                        onClick={(e) => handleSelectQuality('4K_UltraHD', 'mp4', Math.floor(selectedVideo.sizeBytes * 2.8), undefined, e)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:bg-purple-600/30 text-left transition-colors group cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow">4K</span>
                          <div className="text-xs">
                            <div className="font-semibold text-white group-hover:text-purple-300">2160p Ultra HD (60fps)</div>
                            <div className="text-[10px] text-slate-400">{(selectedVideo.sizeBytes * 2.8 / 1048576).toFixed(1)} MB • AV1 / Master</div>
                          </div>
                        </div>
                        <FileDown className="w-4 h-4 text-slate-400 group-hover:text-purple-300" />
                      </button>

                      <button
                        onClick={(e) => handleSelectQuality('1440p_2K', 'mp4', Math.floor(selectedVideo.sizeBytes * 1.6), undefined, e)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:bg-indigo-600/30 text-left transition-colors group cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow">2K</span>
                          <div className="text-xs">
                            <div className="font-semibold text-white group-hover:text-indigo-300">1440p Quad HD (60fps)</div>
                            <div className="text-[10px] text-slate-400">{(selectedVideo.sizeBytes * 1.6 / 1048576).toFixed(1)} MB • High Bitrate</div>
                          </div>
                        </div>
                        <FileDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-300" />
                      </button>

                      <button
                        onClick={(e) => handleSelectQuality('1080p_60fps', 'mp4', selectedVideo.sizeBytes, undefined, e)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:bg-blue-600/30 text-left transition-colors group cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow">1080p</span>
                          <div className="text-xs">
                            <div className="font-semibold text-white group-hover:text-cyan-300">1080p Full HD (60fps)</div>
                            <div className="text-[10px] text-slate-400">{selectedVideo.sizeFormatted} • AVC/AAC</div>
                          </div>
                        </div>
                        <FileDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
                      </button>

                      <button
                        onClick={(e) => handleSelectQuality('720p_HD', 'mp4', Math.floor(selectedVideo.sizeBytes * 0.55), undefined, e)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:bg-sky-600/30 text-left transition-colors group cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-sky-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">720p</span>
                          <div className="text-xs">
                            <div className="font-semibold text-white group-hover:text-cyan-300">720p High Definition</div>
                            <div className="text-[10px] text-slate-400">{(selectedVideo.sizeBytes * 0.55 / 1048576).toFixed(1)} MB • Fast Stream</div>
                          </div>
                        </div>
                        <FileDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
                      </button>

                      <button
                        onClick={(e) => handleSelectQuality('480p_SD', 'mp4', Math.floor(selectedVideo.sizeBytes * 0.32), undefined, e)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:bg-slate-700/50 text-left transition-colors group cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-700 text-slate-200 font-bold text-[10px] px-2 py-0.5 rounded-md">480p</span>
                          <div className="text-xs">
                            <div className="font-semibold text-white group-hover:text-cyan-300">480p Standard Quality</div>
                            <div className="text-[10px] text-slate-400">{(selectedVideo.sizeBytes * 0.32 / 1048576).toFixed(1)} MB • Mobile Friendly</div>
                          </div>
                        </div>
                        <FileDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
                      </button>

                      <button
                        onClick={(e) => handleSelectQuality('360p_Mobile', 'mp4', Math.floor(selectedVideo.sizeBytes * 0.18), undefined, e)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:bg-slate-800/50 text-left transition-colors group cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-800 text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-md">360p</span>
                          <div className="text-xs">
                            <div className="font-semibold text-white group-hover:text-cyan-300">360p Low Bandwidth</div>
                            <div className="text-[10px] text-slate-400">{(selectedVideo.sizeBytes * 0.18 / 1048576).toFixed(1)} MB • Ultra Fast</div>
                          </div>
                        </div>
                        <FileDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300" />
                      </button>

                      <div className="my-1 border-t border-white/10 pt-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2">
                        Audio Streams
                      </div>

                      <button
                        onClick={(e) => handleSelectQuality('Audio_320kbps', 'mp3', 1314238, 'https://raw.githubusercontent.com/mdn/learning-area/master/html/multimedia-and-embedding/video-and-audio-content/viper.mp3', e)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:bg-emerald-600/30 text-left transition-colors group cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow">MP3</span>
                          <div className="text-xs">
                            <div className="font-semibold text-white group-hover:text-emerald-300">Audio 320 kbps (HQ MP3)</div>
                            <div className="text-[10px] text-slate-400">1.3 MB • Studio Stereo</div>
                          </div>
                        </div>
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      </button>

                      <button
                        onClick={(e) => handleSelectQuality('Audio_AAC_M4A', 'mp3', 950000, 'https://raw.githubusercontent.com/mdn/learning-area/master/html/multimedia-and-embedding/video-and-audio-content/viper.mp3', e)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:bg-teal-600/30 text-left transition-colors group cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-teal-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow">M4A</span>
                          <div className="text-xs">
                            <div className="font-semibold text-white group-hover:text-teal-300">Audio 256 kbps (AAC / M4A)</div>
                            <div className="text-[10px] text-slate-400">0.9 MB • Apple / Mobile</div>
                          </div>
                        </div>
                        <Volume2 className="w-4 h-4 text-teal-400" />
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/10 px-1">
                      <button
                        onClick={(e) => handleSelectQuality('All_Batch', 'mp4', selectedVideo.sizeBytes, undefined, e)}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 active:bg-cyan-600/30 text-cyan-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-white/10 cursor-pointer select-none"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Send Stream to Multi-Socket Engine
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* === VISUAL NOTIFICATION COMPONENT: FALLBACK OVERLAY === */}
            {showFallbackOverlay && (
              <div className="absolute inset-x-3 bottom-3 sm:right-3 sm:left-auto sm:w-84 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="backdrop-blur-2xl bg-[#0f172a]/95 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl text-white space-y-3 shadow-amber-500/20 ring-1 ring-amber-400/40">
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Connection Fallback Active
                      </span>
                    </div>
                    <button
                      onClick={() => setShowFallbackOverlay(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                      title="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold text-slate-100 truncate">{selectedVideo.title}</h5>
                    <p className="text-[11px] text-amber-200/90 leading-tight">
                      Background script connection unreachable. Copy the direct media stream URL below to download directly in Web IDM:
                    </p>
                    
                    <div className="p-2 bg-black/60 border border-dashed border-amber-500/40 rounded-xl space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                        Direct Stream URL:
                      </span>
                      <div className="text-[10px] font-mono text-slate-300 break-all select-all line-clamp-2 bg-white/5 p-1 rounded">
                        {selectedVideo.url}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Primary 'Copy Direct Stream URL' button */}
                    <button
                      onClick={() => handleCopyDirectStreamUrl(selectedVideo.url)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                        copiedStreamUrl
                          ? 'bg-emerald-600 text-white shadow-emerald-600/40 scale-100'
                          : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-600/30 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      {copiedStreamUrl ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>✓ Stream URL Copied! Paste in Web IDM</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Direct Stream URL</span>
                        </>
                      )}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleSelectQuality('1080p_FHD', 'mp4', selectedVideo.sizeBytes);
                          setShowFallbackOverlay(false);
                        }}
                        className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>⚡ Open in Web IDM</span>
                      </button>
                      <button
                        onClick={() => setShowFallbackOverlay(false)}
                        className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-slate-300 text-[11px] font-medium rounded-lg transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                HD
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">{selectedVideo.title}</h4>
                <p className="text-[11px] text-slate-400">
                  Duration: {selectedVideo.duration} • Quality: {selectedVideo.resolution} • Direct stream verified
                </p>
              </div>
            </div>
            <span className="text-[11px] bg-white/10 border border-white/20 px-3 py-1 rounded-full text-cyan-300 font-mono font-medium">
              {selectedVideo.sizeFormatted}
            </span>
          </div>
        </div>

        {/* Video selector and live stream inspector sidebar */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between px-1">
            <span>Test Media Channels</span>
            <span className="text-[10px] text-cyan-400 font-mono">3 Presets</span>
          </div>

          <div className="space-y-2">
            {SIMULATED_YOUTUBE_VIDEOS.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedVideo(item);
                  setIsDropdownOpen(false);
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex gap-3 items-center ${
                  selectedVideo.id === item.id
                    ? 'backdrop-blur-xl bg-white/15 border-blue-400/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/50'
                    : 'backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/10">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded font-mono font-bold">
                    {item.duration}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-semibold text-white truncate leading-snug">
                    {item.title}
                  </h5>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span className="text-cyan-300 font-medium">{item.resolution}</span>
                    <span>•</span>
                    <span>{item.sizeFormatted}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Feature highlights callout */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 text-xs space-y-2.5 text-slate-400 shadow-xl">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How Extension Interception Works:</span>
            </div>
            <ul className="text-[11px] space-y-1.5 list-disc pl-4 text-slate-400 leading-relaxed">
              <li>Hooks directly into HTML5 media elements and network buffers</li>
              <li>Extracts raw video/audio without quality degradation</li>
              <li>Bypasses player throttling using multi-socket chunking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
