/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  DownloadCategory, 
  DownloadStatus, 
  DownloadTask, 
  DownloadSegment 
} from './types';
import { 
  PRESET_SAMPLE_DOWNLOADS, 
  createSegments, 
  detectCategory, 
  extractFilenameFromUrl, 
  formatBytes, 
  formatSpeed, 
  saveBlobToDisk,
  triggerDirectDownload,
  downloadFileToDisk,
  sanitizeWebUrl,
  isSafeWebUrl,
  downloadManager
} from './utils/downloadEngine';
import { Navbar } from './components/Navbar';
import { CategorySidebar } from './components/CategorySidebar';
import { DownloadItemRow } from './components/DownloadItemRow';
import { AddDownloadModal } from './components/AddDownloadModal';
import { BatchDownloadModal } from './components/BatchDownloadModal';
import { ExtensionExportModal } from './components/ExtensionExportModal';
import { YouTubeExtensionSimulator } from './components/YouTubeExtensionSimulator';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { IdmCompleteModal } from './components/IdmCompleteModal';
import {
  Download, 
  Plus, 
  Search, 
  Sparkles, 
  Zap, 
  Layers, 
  FileBox, 
  CheckCircle2, 
  Filter, 
  ArrowUpDown,
  Tv,
  Chrome,
  AlertCircle
} from 'lucide-react';

function toSafeDownloadFilename(rawTitle: string, fallback: string, mimeType = 'application/octet-stream') {
  const cleaned = (rawTitle || fallback)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  const baseName = cleaned && cleaned.length > 0 ? cleaned : fallback;
  const extensionFromMime = mimeType.includes('video/') ? '.mp4' : mimeType.includes('audio/') ? '.mp3' : mimeType.includes('audio/mp4') ? '.m4a' : mimeType.includes('application/json') ? '.json' : mimeType.includes('image/') ? '.png' : '';
  const hasExplicitExtension = /\.[a-zA-Z0-9]{2,8}$/i.test(baseName);
  const finalName = hasExplicitExtension ? baseName : `${baseName}${extensionFromMime || ''}`;

  return finalName.length > 120 ? `${finalName.slice(0, 117).trimEnd()}...` : finalName;
}

export default function App() {
  // Initial tasks
  const [tasks, setTasks] = useState<DownloadTask[]>(() => {
    const defaultSample1 = PRESET_SAMPLE_DOWNLOADS[0]; // Big Buck Bunny
    const defaultSample2 = PRESET_SAMPLE_DOWNLOADS[3]; // Synthwave MP3

    const segs1 = createSegments(defaultSample1.size, 8).map(s => ({
      ...s,
      currentByte: s.endByte,
      progress: 100,
      status: 'completed' as const
    }));

    const segs2 = createSegments(defaultSample2.size, 8);

    return [
      {
        id: 'task-1',
        url: defaultSample1.url,
        filename: defaultSample1.filename,
        category: 'video',
        mimeType: defaultSample1.mimeType,
        totalSize: defaultSample1.size,
        downloadedBytes: defaultSample1.size,
        speed: 0,
        peakSpeed: 14500000,
        progress: 100,
        status: 'completed',
        resumable: true,
        threadCount: 8,
        segments: segs1,
        dateAdded: Date.now() - 3600000,
        completedAt: Date.now() - 3000000,
        videoQuality: '1080p 60fps'
      },
      {
        id: 'task-2',
        url: defaultSample2.url,
        filename: defaultSample2.filename,
        category: 'audio',
        mimeType: defaultSample2.mimeType,
        totalSize: defaultSample2.size,
        downloadedBytes: 0,
        speed: 0,
        peakSpeed: 0,
        progress: 0,
        status: 'paused',
        resumable: true,
        threadCount: 8,
        segments: segs2,
        dateAdded: Date.now() - 60000,
        videoQuality: '320kbps MP3'
      }
    ];
  });

  const [activeCategory, setActiveCategory] = useState<DownloadCategory>('all');
  const [statusFilter, setStatusFilter] = useState<DownloadStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [speedLimit, setSpeedLimit] = useState<number>(0); // 0 = unlimited
  const [maxConcurrent, setMaxConcurrent] = useState<number>(4);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [previewTask, setPreviewTask] = useState<DownloadTask | null>(null);
  const [completeModalTask, setCompleteModalTask] = useState<DownloadTask | null>(null);
  const [initialUrlForAdd, setInitialUrlForAdd] = useState('');

  const simulatorRef = useRef<HTMLDivElement>(null);

  // Helper to start real download execution via downloadManager
  const executeTask = (taskToRun: DownloadTask) => {
    downloadManager.startTask(taskToRun, {
      onProgress: (updatedTask) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
      },
      onComplete: (completedTask, _blob) => {
        setTasks(prev => prev.map(t => t.id === completedTask.id ? { ...t, ...completedTask, status: 'completed', speed: 0 } : t));
        setCompleteModalTask(completedTask);
      },
      onError: (failedTask, errorMsg) => {
        setTasks(prev => prev.map(t => t.id === failedTask.id ? { ...t, ...failedTask, status: 'error', errorMsg, speed: 0 } : t));
      }
    });
  };

  // Check URL params on initial load for extension or bookmarklet interception
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const addUrlParam = params.get('add_url');
      const titleParam = params.get('title') || 'media_download';
      const qualityParam = params.get('quality') || '1080p';
      const autoStartParam = params.get('autostart') === '1' || params.get('autostart') === 'true';

      if (addUrlParam && isSafeWebUrl(addUrlParam)) {
        const sanitized = sanitizeWebUrl(addUrlParam);
        const isAudio = qualityParam.toLowerCase().includes('audio') || qualityParam.toLowerCase().includes('mp3') || addUrlParam.toLowerCase().includes('.mp3');
        const suggestedMimeType = isAudio ? 'audio/mpeg' : 'video/mp4';
        const suggestedFilename = toSafeDownloadFilename(titleParam, extractFilenameFromUrl(sanitized, 'media_download'), suggestedMimeType);

        if (autoStartParam) {
          const category: DownloadCategory = isAudio ? 'audio' : 'video';
          const totalSize = isAudio ? 14000000 : 96645673;
          const segments = createSegments(totalSize, 16);

          const task: DownloadTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            url: sanitized,
            filename: suggestedFilename,
            category,
            mimeType: suggestedMimeType,
            totalSize,
            downloadedBytes: 0,
            speed: 0,
            peakSpeed: 0,
            progress: 0,
            status: 'downloading',
            resumable: true,
            threadCount: 16,
            segments,
            dateAdded: Date.now(),
            videoQuality: qualityParam,
            saveDirectory: isAudio ? 'C:\\Users\\Downloads\\Music' : 'C:\\Users\\Downloads\\Videos'
          };

          setTasks(prev => [task, ...prev]);
          executeTask(task);
        } else {
          setInitialUrlForAdd(sanitized);
          setIsAddModalOpen(true);
        }

        // Clean query params from browser address bar without reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // ignore
    }
  }, []);

  // Task actions with Real Network Execution
  const handleAddDownload = (newTask: {
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
  }) => {
    const cleanUrl = sanitizeWebUrl(newTask.url);
    const segments = createSegments(newTask.totalSize, newTask.threadCount || 16);
    const safeFilename = toSafeDownloadFilename(newTask.filename, extractFilenameFromUrl(cleanUrl, 'media_download'), newTask.mimeType || 'application/octet-stream');
    const task: DownloadTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      url: cleanUrl,
      filename: safeFilename,
      category: newTask.category,
      mimeType: newTask.mimeType || 'application/octet-stream',
      totalSize: newTask.totalSize,
      downloadedBytes: 0,
      speed: 0,
      peakSpeed: 0,
      progress: 0,
      status: newTask.autoStart ? 'downloading' : 'queued',
      resumable: true,
      threadCount: newTask.threadCount || 16,
      segments,
      dateAdded: Date.now(),
      videoQuality: newTask.videoQuality,
      saveDirectory: newTask.saveDirectory
    };

    setTasks(prev => [task, ...prev]);

    if (newTask.autoStart) {
      executeTask(task);
    } else if (newTask.saveImmediately) {
      downloadFileToDisk(cleanUrl, newTask.filename);
    }
  };

  const handleAddBatch = (items: Array<{
    url: string;
    filename: string;
    category: DownloadCategory;
    totalSize: number;
    threadCount: number;
  }>) => {
    const newTasks: DownloadTask[] = items.map((item, idx) => {
      const cleanUrl = sanitizeWebUrl(item.url);
      const segments = createSegments(item.totalSize, item.threadCount);
      const isAutoStart = idx < maxConcurrent;
      const task: DownloadTask = {
        id: `task-batch-${Date.now()}-${idx}`,
        url: cleanUrl,
        filename: item.filename,
        category: item.category,
        mimeType: 'application/octet-stream',
        totalSize: item.totalSize,
        downloadedBytes: 0,
        speed: 0,
        peakSpeed: 0,
        progress: 0,
        status: isAutoStart ? 'downloading' : 'queued',
        resumable: true,
        threadCount: item.threadCount,
        segments,
        dateAdded: Date.now()
      };

      if (isAutoStart) {
        setTimeout(() => executeTask(task), idx * 100);
      }

      return task;
    });

    setTasks(prev => [...newTasks, ...prev]);
  };

  const handlePauseTask = (id: string) => {
    downloadManager.pauseTask(id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'paused', speed: 0 } : t));
  };

  const handleResumeTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (target) {
      const resumed: DownloadTask = { ...target, status: 'downloading' };
      setTasks(prev => prev.map(t => t.id === id ? resumed : t));
      executeTask(resumed);
    }
  };

  const handleRestartTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (target) {
      downloadManager.cancelTask(id);
      const newSegments = createSegments(target.totalSize, target.threadCount);
      const restarted: DownloadTask = {
        ...target,
        downloadedBytes: 0,
        progress: 0,
        speed: 0,
        status: 'downloading',
        segments: newSegments
      };
      setTasks(prev => prev.map(t => t.id === id ? restarted : t));
      executeTask(restarted);
    }
  };

  const handleDeleteTask = (id: string) => {
    downloadManager.cancelTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleStartAll = () => {
    tasks.forEach(t => {
      if (t.status === 'paused' || t.status === 'queued') {
        executeTask({ ...t, status: 'downloading' });
      }
    });
    setTasks(prev => prev.map(t => t.status === 'paused' || t.status === 'queued' ? { ...t, status: 'downloading' } : t));
  };

  const handlePauseAll = () => {
    tasks.forEach(t => {
      if (t.status === 'downloading') {
        downloadManager.pauseTask(t.id);
      }
    });
    setTasks(prev => prev.map(t => t.status === 'downloading' ? { ...t, status: 'paused', speed: 0 } : t));
  };

  const handleClearCompleted = () => {
    setTasks(prev => prev.filter(t => t.status !== 'completed'));
  };

  const handleSaveToDisk = (task: DownloadTask) => {
    if (task.fileBlob) {
      saveBlobToDisk(task.fileBlob, task.filename);
    } else {
      downloadFileToDisk(task.url, task.filename);
    }
  };

  // Aggregate metrics
  const totalSpeed = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.status === 'downloading' ? t.speed : 0), 0);
  }, [tasks]);

  const activeCount = useMemo(() => {
    return tasks.filter(t => t.status === 'downloading').length;
  }, [tasks]);

  const totalDownloadedBytes = useMemo(() => {
    return tasks.reduce((sum, t) => sum + t.downloadedBytes, 0);
  }, [tasks]);

  // Category & Status counts
  const categoryCounts = useMemo(() => {
    const counts: Record<DownloadCategory, number> = {
      all: tasks.length,
      video: 0,
      audio: 0,
      compressed: 0,
      document: 0,
      software: 0,
      image: 0,
      other: 0
    };
    tasks.forEach(t => {
      if (counts[t.category] !== undefined) {
        counts[t.category]++;
      } else {
        counts.other++;
      }
    });
    return counts;
  }, [tasks]);

  const statusCounts = useMemo(() => {
    return {
      all: tasks.length,
      downloading: tasks.filter(t => t.status === 'downloading').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      paused: tasks.filter(t => t.status === 'paused').length
    };
  }, [tasks]);

  // Filtered list
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Category filter
      if (activeCategory !== 'all' && task.category !== activeCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return task.filename.toLowerCase().includes(q) || task.url.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tasks, activeCategory, statusFilter, searchQuery]);

  const scrollToSimulator = () => {
    simulatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col relative selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* Ambient background glow orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-600/30 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed -bottom-20 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Top Navigation */}
      <Navbar
        totalSpeed={totalSpeed}
        activeCount={activeCount}
        onOpenAddModal={() => {
          setInitialUrlForAdd('');
          setIsAddModalOpen(true);
        }}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
        onScrollToSimulator={scrollToSimulator}
      />

      {/* Main Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">
        {/* Top Feature Banner */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-bold font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>IDM Accelerated Multi-Stream Socket Pipeline</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Direct High-Speed Download Manager & Stream Capture
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Download direct MP4 video streams, MP3 audio, compressed archives, and documents with up to 32 parallel sockets. Use our Chrome/Edge extension to catch floating download popups directly over YouTube and web players.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setInitialUrlForAdd('');
                  setIsAddModalOpen(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-600/40 border border-white/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Direct Link
              </button>
              <button
                onClick={() => setIsExtensionModalOpen(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 rounded-full text-xs font-semibold flex items-center gap-2 transition-all hover:border-white/30"
              >
                <Chrome className="w-4 h-4 text-cyan-400" />
                Get Extension (.ZIP)
              </button>
            </div>
          </div>
        </div>

        {/* Core Workspace: Sidebar + Downloads Queue Table */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Category & Queue Sidebar */}
          <CategorySidebar
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            statusFilter={statusFilter}
            onSelectStatusFilter={setStatusFilter}
            counts={categoryCounts}
            statusCounts={statusCounts}
            totalDownloadedBytes={totalDownloadedBytes}
            totalSpeed={totalSpeed}
            onStartAll={handleStartAll}
            onPauseAll={handlePauseAll}
            onClearCompleted={handleClearCompleted}
            speedLimit={speedLimit}
            onSetSpeedLimit={setSpeedLimit}
            maxConcurrent={maxConcurrent}
            onSetMaxConcurrent={setMaxConcurrent}
          />

          {/* Main Downloads Queue Panel */}
          <div className="flex-1 w-full space-y-4">
            {/* Search and Table Controls */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search downloads by name or link..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 backdrop-blur-md transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <span className="text-xs text-slate-400 font-mono">
                  Showing <strong className="text-white">{filteredTasks.length}</strong> of {tasks.length} tasks
                </span>
                <button
                  onClick={() => setIsBatchModalOpen(true)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Batch Add</span>
                </button>
              </div>
            </div>

            {/* Downloads List */}
            {filteredTasks.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/5 border border-dashed border-white/15 rounded-2xl p-12 text-center space-y-3 shadow-xl">
                <FileBox className="w-12 h-12 text-slate-500 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No downloads matching criteria</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click "Add URL" to paste a video, audio, or direct file link, or test our YouTube sniffer below.
                </p>
                <button
                  onClick={() => {
                    setInitialUrlForAdd('');
                    setIsAddModalOpen(true);
                  }}
                  className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-600/30 border border-white/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Direct Download Link
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <DownloadItemRow
                    key={task.id}
                    task={task}
                    onPause={handlePauseTask}
                    onResume={handleResumeTask}
                    onRestart={handleRestartTask}
                    onDelete={handleDeleteTask}
                    onPreview={setPreviewTask}
                    onSaveToDisk={handleSaveToDisk}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* YouTube / Media Player Extension Live Sandbox */}
        <div ref={simulatorRef} className="pt-4">
          <YouTubeExtensionSimulator
            onCaptureMedia={(media) => {
              handleAddDownload({
                url: media.url,
                filename: media.filename,
                category: media.category,
                totalSize: media.size,
                threadCount: 16,
                autoStart: true,
                mimeType: media.category === 'audio' ? 'audio/mpeg' : 'video/mp4',
                videoQuality: media.quality,
                saveImmediately: true
              });
            }}
            onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 backdrop-blur-xl bg-white/5 mt-12 py-6 text-center text-xs text-slate-400 space-y-2 relative z-10">
        <div className="flex items-center justify-center gap-2 text-slate-300">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">Web IDM Turbo</span>
          <span>•</span>
          <span>High-Speed Segmented Multi-Stream Engine</span>
          <span>•</span>
          <span>Direct MP4/MP3 Stream Capture</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Compatible with all modern web browsers • Manifest V3 Extension Ready • Range Header Byte-Slicing
        </p>
      </footer>

      {/* Modals */}
      {isAddModalOpen && (
        <AddDownloadModal
          initialUrl={initialUrlForAdd}
          onClose={() => setIsAddModalOpen(false)}
          onAddDownload={handleAddDownload}
        />
      )}

      {isBatchModalOpen && (
        <BatchDownloadModal
          onClose={() => setIsBatchModalOpen(false)}
          onAddBatch={handleAddBatch}
        />
      )}

      {isExtensionModalOpen && (
        <ExtensionExportModal
          onClose={() => setIsExtensionModalOpen(false)}
        />
      )}

      {previewTask && (
        <MediaPreviewModal
          task={previewTask}
          onClose={() => setPreviewTask(null)}
          onSaveToDisk={handleSaveToDisk}
        />
      )}

      {completeModalTask && (
        <IdmCompleteModal
          task={completeModalTask}
          onClose={() => setCompleteModalTask(null)}
          onPreview={(task) => {
            setCompleteModalTask(null);
            setPreviewTask(task);
          }}
        />
      )}
    </div>
  );
}
