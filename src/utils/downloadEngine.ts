import { DownloadCategory, DownloadSegment, DownloadStatus, DownloadTask, ProbeResult, SniffedMedia } from '../types';

export const PRESET_SAMPLE_DOWNLOADS = [
  {
    title: "Nature & Wildlife 1080p Film (Big Buck Bunny)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    filename: "Big_Buck_Bunny_1080p_HQ.mp4",
    category: "video" as DownloadCategory,
    size: 158008374,
    mimeType: "video/mp4",
    description: "Full HD open-source film live stream"
  },
  {
    title: "Action Thriller Trailer (720p HD MP4)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    filename: "Action_Trailer_720p_HD.mp4",
    category: "video" as DownloadCategory,
    size: 15480000,
    mimeType: "video/mp4",
    description: "High definition CC0 sample MP4 video"
  },
  {
    title: "Blooming Flower Timelapse (480p SD MP4)",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    filename: "Blooming_Flower_Timelapse_480p.mp4",
    category: "video" as DownloadCategory,
    size: 1128375,
    mimeType: "video/mp4",
    description: "Fast-streaming cartoon animation video"
  },
  {
    title: "Viper Synthwave Theme (HQ MP3 Audio)",
    url: "https://raw.githubusercontent.com/mdn/learning-area/master/html/multimedia-and-embedding/video-and-audio-content/viper.mp3",
    filename: "Viper_Synthwave_Theme_320k.mp3",
    category: "audio" as DownloadCategory,
    size: 1314238,
    mimeType: "audio/mpeg",
    description: "High-bitrate electronic soundscape audio track"
  },
  {
    title: "T-Rex Roar Sound Effect (MP3 Audio)",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
    filename: "TRex_Roar_Sound_Effect.mp3",
    category: "audio" as DownloadCategory,
    size: 39868,
    mimeType: "audio/mpeg",
    description: "Realistic studio monster sound effect"
  },
  {
    title: "Superheroes Developer Dataset (JSON)",
    url: "https://raw.githubusercontent.com/mdn/learning-area/master/javascript/oojs/json/superheroes.json",
    filename: "Superheroes_Dataset.json",
    category: "document" as DownloadCategory,
    size: 368,
    mimeType: "application/json",
    description: "Structured dataset document"
  }
];

export const SIMULATED_YOUTUBE_VIDEOS: SniffedMedia[] = [
  {
    id: "yt-1",
    title: "Cyberpunk 2077 - Next-Gen Ray Tracing Gameplay",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "14:22",
    resolution: "1080p 60fps",
    format: "mp4",
    sizeFormatted: "15.4 MB",
    sizeBytes: 15480000,
    thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
    category: "video"
  },
  {
    id: "yt-2",
    title: "Synthwave Chill Radio - 24/7 Lofi Electronic Beats",
    url: "https://raw.githubusercontent.com/mdn/learning-area/master/html/multimedia-and-embedding/video-and-audio-content/viper.mp3",
    duration: "03:45",
    resolution: "320 kbps",
    format: "mp3",
    sizeFormatted: "1.31 MB",
    sizeBytes: 1314238,
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    category: "audio"
  },
  {
    id: "yt-3",
    title: "Blender Open Movie Project 4K HDR",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: "12:14",
    resolution: "1080p Full HD",
    format: "mp4",
    sizeFormatted: "158 MB",
    sizeBytes: 158008374,
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80",
    category: "video"
  }
];

export function detectCategory(filename: string, mimeType = ''): DownloadCategory {
  const lower = filename.toLowerCase();
  const ext = lower.split('.').pop() || '';
  const mime = mimeType.toLowerCase();

  if (['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv', 'm4v', '3gp', 'ts'].includes(ext) || mime.startsWith('video/')) {
    return 'video';
  }
  if (['mp3', 'm4a', 'wav', 'flac', 'aac', 'ogg', 'wma', 'opus', 'mid'].includes(ext) || mime.startsWith('audio/')) {
    return 'audio';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'dmg'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
    return 'compressed';
  }
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv', 'md'].includes(ext) || mime.includes('pdf') || mime.includes('document')) {
    return 'document';
  }
  if (['exe', 'msi', 'apk', 'app', 'deb', 'rpm', 'bin', 'bat', 'sh'].includes(ext)) {
    return 'software';
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'].includes(ext) || mime.startsWith('image/')) {
    return 'image';
  }
  return 'other';
}

export function extractFilenameFromUrl(url: string, defaultName = 'download_file'): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = decodeURIComponent(segments[segments.length - 1]);
      if (last && last.includes('.')) {
        return last;
      }
      if (last) {
        return last + '.mp4';
      }
    }
  } catch {
    // ignore URL parsing error
  }
  return defaultName;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes <= 0 || isNaN(bytes) || !isFinite(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0 || isNaN(bytesPerSec)) return '0.0 KB/s';
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
}

export function formatEta(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds) || isNaN(seconds)) return '--:--';
  if (seconds > 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function sanitizeWebUrl(rawUrl: string, fallbackUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'): string {
  if (!rawUrl || typeof rawUrl !== 'string') return fallbackUrl;
  const trimmed = rawUrl.trim();
  
  const forbiddenPrefixes = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'javascript:',
    'data:',
    'file://',
    'view-source:',
    'devtools://'
  ];

  for (const prefix of forbiddenPrefixes) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return fallbackUrl;
    }
  }

  if (trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    if (trimmed.startsWith('/')) {
      return typeof window !== 'undefined' ? `${window.location.origin}${trimmed}` : fallbackUrl;
    }
    return `https://${trimmed}`;
  }

  return trimmed;
}

export function isSafeWebUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim().toLowerCase();
  if (
    trimmed.startsWith('chrome://') || 
    trimmed.startsWith('chrome-extension://') || 
    trimmed.startsWith('edge://') || 
    trimmed.startsWith('about:') || 
    trimmed.startsWith('file://') ||
    trimmed.startsWith('javascript:')
  ) {
    return false;
  }
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:');
}

export function createSegments(totalSize: number, threadCount: number): DownloadSegment[] {
  const count = Math.max(1, Math.min(threadCount, 32));
  const effectiveSize = totalSize > 0 ? totalSize : 0;
  
  if (effectiveSize <= 0) {
    return [{
      id: 1,
      startByte: 0,
      endByte: 0,
      currentByte: 0,
      progress: 0,
      speed: 0,
      status: 'pending'
    }];
  }

  const segmentSize = Math.floor(effectiveSize / count);
  const segments: DownloadSegment[] = [];

  for (let i = 0; i < count; i++) {
    const startByte = i * segmentSize;
    const endByte = i === count - 1 ? effectiveSize - 1 : (i + 1) * segmentSize - 1;
    segments.push({
      id: i + 1,
      startByte,
      endByte,
      currentByte: startByte,
      progress: 0,
      speed: 0,
      status: 'pending'
    });
  }

  return segments;
}

export function getProxyDownloadUrl(targetUrl: string, filename: string, forceDownload = true): string {
  if (targetUrl.startsWith('blob:') || targetUrl.startsWith('data:') || targetUrl.startsWith('/api/')) {
    return targetUrl;
  }
  return `/api/proxy-download?url=${encodeURIComponent(targetUrl)}&filename=${encodeURIComponent(filename)}${forceDownload ? '&download=1' : ''}`;
}

export async function probeUrl(rawUrl: string): Promise<ProbeResult> {
  const fallbackName = extractFilenameFromUrl(rawUrl);
  const category = detectCategory(fallbackName);

  // 1. Try Backend Proxy probe endpoint for full headers & platform stream extraction
  try {
    const probeRes = await fetch(`/api/probe?url=${encodeURIComponent(rawUrl)}`);
    if (probeRes.ok) {
      const data = await probeRes.json();
      if (data.ok) {
        return {
          url: rawUrl,
          filename: data.filename || fallbackName,
          mimeType: data.mimeType || 'application/octet-stream',
          totalSize: data.totalSize || 0,
          resumable: Boolean(data.resumable),
          category: data.category || category,
          corsEnabled: true,
          serverHeader: data.serverHeader || 'Web IDM Proxy Edge',
          isYouTube: data.isYouTube,
          title: data.title,
          author: data.author,
          thumbnail: data.thumbnail,
          streams: data.streams
        };
      }
    }
  } catch {
    // Backend probe failed, fallback to client probe
  }

  // 2. Direct client-side HEAD probe fallback
  try {
    const response = await fetch(rawUrl, {
      method: 'HEAD',
      mode: 'cors'
    });

    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type') || '';
    const acceptRanges = response.headers.get('accept-ranges');
    const contentDisposition = response.headers.get('content-disposition');

    let filename = fallbackName;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
    const detectedCat = detectCategory(filename, contentType);

    return {
      url: rawUrl,
      filename,
      mimeType: contentType || 'application/octet-stream',
      totalSize,
      resumable: acceptRanges === 'bytes' || Boolean(contentLength),
      category: detectedCat,
      corsEnabled: true,
      serverHeader: response.headers.get('server') || 'Direct Web Server'
    };
  } catch {
    return {
      url: rawUrl,
      filename: fallbackName,
      mimeType: category === 'video' ? 'video/mp4' : category === 'audio' ? 'audio/mpeg' : 'application/octet-stream',
      totalSize: 0,
      resumable: true,
      category,
      corsEnabled: false,
      serverHeader: 'Direct Media Stream (Web IDM Proxy Accelerated)'
    };
  }
}

export function saveBlobToDisk(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 3000);
}

export function triggerDirectDownload(blobUrlOrDirectUrl: string, filename: string) {
  let downloadUrl = blobUrlOrDirectUrl;
  
  if (!blobUrlOrDirectUrl.startsWith('blob:') && !blobUrlOrDirectUrl.startsWith('data:') && !blobUrlOrDirectUrl.startsWith('/api/')) {
    downloadUrl = getProxyDownloadUrl(blobUrlOrDirectUrl, filename, true);
  }

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 1000);
}

export async function downloadFileToDisk(urlOrBlob: string, filename: string): Promise<void> {
  if (urlOrBlob.startsWith('blob:') || urlOrBlob.startsWith('data:')) {
    triggerDirectDownload(urlOrBlob, filename);
    return;
  }

  triggerDirectDownload(urlOrBlob, filename);
}

// =========================================================================
// REAL MULTI-THREADED DOWNLOAD RUNNER ENGINE WITH RANGE SOCKET STREAMING
// =========================================================================

export interface DownloadRunnerOptions {
  onProgress: (task: DownloadTask) => void;
  onComplete: (task: DownloadTask, blob: Blob) => void;
  onError: (task: DownloadTask, error: string) => void;
}

class ActiveDownloadJob {
  public task: DownloadTask;
  public options: DownloadRunnerOptions;
  public abortController: AbortController | null = null;
  public segmentAbortControllers: Map<number, AbortController> = new Map();
  public isPaused = false;
  public isCancelled = false;

  private segmentBuffers: Map<number, Uint8Array[]> = new Map();
  private lastTime = Date.now();
  private lastBytes = 0;

  constructor(task: DownloadTask, options: DownloadRunnerOptions) {
    this.task = { ...task };
    this.options = options;
  }

  public async start(): Promise<void> {
    this.isPaused = false;
    this.isCancelled = false;
    this.abortController = new AbortController();
    this.lastTime = Date.now();
    this.lastBytes = this.task.downloadedBytes;

    // Check if task has valid totalSize and multiple threads configured
    const canMultiThread = this.task.resumable && this.task.totalSize > 0 && this.task.threadCount > 1;

    if (canMultiThread) {
      await this.runMultiThreadedDownload();
    } else {
      await this.runSingleThreadStreamDownload();
    }
  }

  public pause(): void {
    this.isPaused = true;
    if (this.abortController) {
      this.abortController.abort();
    }
    this.segmentAbortControllers.forEach(ctrl => ctrl.abort());
    this.segmentAbortControllers.clear();

    this.task.status = 'paused';
    this.task.speed = 0;
    this.task.segments = this.task.segments.map(seg => ({
      ...seg,
      speed: 0,
      status: seg.progress >= 100 ? 'completed' : 'pending'
    }));
    this.options.onProgress(this.task);
  }

  public cancel(): void {
    this.isCancelled = true;
    if (this.abortController) {
      this.abortController.abort();
    }
    this.segmentAbortControllers.forEach(ctrl => ctrl.abort());
    this.segmentAbortControllers.clear();

    this.task.status = 'cancelled';
    this.task.speed = 0;
    this.options.onProgress(this.task);
  }

  // --- Multi-Threaded Range-based Segment Fetch Engine ---
  private async runMultiThreadedDownload(): Promise<void> {
    try {
      const proxyBase = getProxyDownloadUrl(this.task.url, this.task.filename, false);
      const totalSize = this.task.totalSize;

      // Ensure segments exist
      if (!this.task.segments || this.task.segments.length === 0) {
        this.task.segments = createSegments(totalSize, this.task.threadCount);
      }

      this.task.status = 'downloading';
      this.options.onProgress(this.task);

      // Spawn concurrent fetch requests for all pending segments
      const segmentPromises = this.task.segments.map(async (seg) => {
        if (seg.progress >= 100) {
          return;
        }

        const segController = new AbortController();
        this.segmentAbortControllers.set(seg.id, segController);

        if (!this.segmentBuffers.has(seg.id)) {
          this.segmentBuffers.set(seg.id, []);
        }

        const start = seg.currentByte;
        const end = seg.endByte;

        if (start > end) {
          seg.progress = 100;
          seg.status = 'completed';
          return;
        }

        let segLastTime = Date.now();
        let segLastLoaded = 0;

        try {
          const response = await fetch(proxyBase, {
            headers: {
              'Range': `bytes=${start}-${end}`
            },
            signal: segController.signal
          });

          if (!response.ok && response.status !== 206) {
            throw new Error(`HTTP ${response.status} on segment ${seg.id}`);
          }

          // If server ignored Range and returned 200, check if we need fallback
          if (response.status === 200 && this.task.segments.length > 1 && seg.id !== 1) {
            // Server doesn't support ranges, fallback to single stream
            throw new Error('SERVER_NO_RANGE_SUPPORT');
          }

          if (!response.body) {
            throw new Error(`No response body for segment ${seg.id}`);
          }

          seg.status = 'active';
          const reader = response.body.getReader();
          const bufferList = this.segmentBuffers.get(seg.id)!;

          while (true) {
            if (this.isPaused || this.isCancelled) {
              await reader.cancel();
              break;
            }

            const { done, value } = await reader.read();
            if (done) {
              seg.progress = 100;
              seg.currentByte = seg.endByte + 1;
              seg.status = 'completed';
              seg.speed = 0;
              break;
            }

            if (value && value.length > 0) {
              bufferList.push(value);
              seg.currentByte += value.length;
              const segTotal = Math.max(1, seg.endByte - seg.startByte + 1);
              const segDownloaded = Math.min(segTotal, seg.currentByte - seg.startByte);
              seg.progress = Math.min(100, (segDownloaded / segTotal) * 100);

              // Calculate per-segment speed
              const now = Date.now();
              const dt = (now - segLastTime) / 1000;
              if (dt >= 0.3) {
                const dBytes = value.length + segLastLoaded;
                seg.speed = dBytes / dt;
                segLastTime = now;
                segLastLoaded = 0;
              } else {
                segLastLoaded += value.length;
              }

              this.updateAggregateTaskProgress();
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError' || this.isPaused || this.isCancelled) {
            return;
          }
          if (err.message === 'SERVER_NO_RANGE_SUPPORT') {
            throw err;
          }
          console.warn(`Segment ${seg.id} download error:`, err);
          seg.status = 'error';
          throw err;
        } finally {
          this.segmentAbortControllers.delete(seg.id);
        }
      });

      await Promise.all(segmentPromises);

      if (this.isPaused || this.isCancelled) {
        return;
      }

      // Check if all segments are completed
      const allCompleted = this.task.segments.every(s => s.progress >= 100 || s.status === 'completed');
      if (allCompleted) {
        await this.mergeAndFinalize();
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || this.isPaused || this.isCancelled) {
        return;
      }

      if (err.message === 'SERVER_NO_RANGE_SUPPORT') {
        console.info('[Web IDM] Upstream does not support Range header, falling back to real single-stream fetch.');
        this.task.threadCount = 1;
        this.task.segments = createSegments(this.task.totalSize, 1);
        await this.runSingleThreadStreamDownload();
        return;
      }

      this.task.status = 'error';
      this.task.errorMsg = err.message || 'Download error';
      this.options.onError(this.task, this.task.errorMsg || 'Download failed');
    }
  }

  // --- Single-Threaded Fallback Stream Engine ---
  private async runSingleThreadStreamDownload(): Promise<void> {
    try {
      const proxyBase = getProxyDownloadUrl(this.task.url, this.task.filename, false);
      this.task.status = 'downloading';
      this.options.onProgress(this.task);

      if (!this.task.segments || this.task.segments.length === 0) {
        this.task.segments = [{
          id: 1,
          startByte: 0,
          endByte: this.task.totalSize > 0 ? this.task.totalSize - 1 : 0,
          currentByte: 0,
          progress: 0,
          speed: 0,
          status: 'active'
        }];
      }

      const seg = this.task.segments[0];
      seg.status = 'active';

      const response = await fetch(proxyBase, {
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // If Content-Length header is present and we didn't know totalSize before
      const headerLen = response.headers.get('content-length');
      if (headerLen && (!this.task.totalSize || this.task.totalSize === 0)) {
        this.task.totalSize = parseInt(headerLen, 10);
        seg.endByte = this.task.totalSize - 1;
      }

      if (!response.body) {
        throw new Error('No readable response body');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loadedBytes = 0;
      let lastTick = Date.now();
      let tickBytes = 0;

      while (true) {
        if (this.isPaused || this.isCancelled) {
          await reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) {
          seg.progress = 100;
          seg.status = 'completed';
          break;
        }

        if (value && value.length > 0) {
          chunks.push(value);
          loadedBytes += value.length;
          seg.currentByte = loadedBytes;
          tickBytes += value.length;

          const now = Date.now();
          const dt = (now - lastTick) / 1000;
          if (dt >= 0.25) {
            const currentSpeed = tickBytes / dt;
            seg.speed = currentSpeed;
            this.task.speed = currentSpeed;
            this.task.peakSpeed = Math.max(this.task.peakSpeed, currentSpeed);
            lastTick = now;
            tickBytes = 0;
          }

          if (this.task.totalSize > 0) {
            const overallPct = Math.min(100, (loadedBytes / this.task.totalSize) * 100);
            seg.progress = overallPct;
            this.task.progress = overallPct;
          } else {
            // Indeterminate size: dynamic progress
            this.task.progress = Math.min(99, Math.floor(Math.log10(loadedBytes + 1) * 12));
          }

          this.task.downloadedBytes = loadedBytes;
          this.options.onProgress(this.task);
        }
      }

      if (this.isPaused || this.isCancelled) {
        return;
      }

      // Merge single-thread chunks into Blob
      const blob = new Blob(chunks, { type: this.task.mimeType || 'application/octet-stream' });
      this.finalizeCompletedBlob(blob);
    } catch (err: any) {
      if (err.name === 'AbortError' || this.isPaused || this.isCancelled) {
        return;
      }
      this.task.status = 'error';
      this.task.errorMsg = err.message || 'Stream download failed';
      this.options.onError(this.task, this.task.errorMsg || 'Download failed');
    }
  }

  // --- Real-time Progress & Speed Calculation ---
  private updateAggregateTaskProgress(): void {
    let totalDownloaded = 0;
    let aggregateSpeed = 0;

    this.task.segments.forEach(seg => {
      const segTotal = Math.max(1, seg.endByte - seg.startByte + 1);
      const segDownloaded = Math.min(segTotal, Math.max(0, seg.currentByte - seg.startByte));
      totalDownloaded += segDownloaded;
      aggregateSpeed += (seg.status === 'active' ? seg.speed : 0);
    });

    const now = Date.now();
    const dt = (now - this.lastTime) / 1000;
    if (dt >= 0.3) {
      const delta = Math.max(0, totalDownloaded - this.lastBytes);
      const instantSpeed = delta / dt;
      this.task.speed = instantSpeed > 0 ? instantSpeed : aggregateSpeed;
      this.task.peakSpeed = Math.max(this.task.peakSpeed, this.task.speed);
      this.lastTime = now;
      this.lastBytes = totalDownloaded;
    }

    this.task.downloadedBytes = totalDownloaded;
    if (this.task.totalSize > 0) {
      this.task.progress = Math.min(100, (totalDownloaded / this.task.totalSize) * 100);
    }

    this.options.onProgress(this.task);
  }

  // --- Merge All Segments & Trigger Direct Disk Download ---
  private async mergeAndFinalize(): Promise<void> {
    try {
      const orderedBuffers: Uint8Array[] = [];

      // Sort segments by id (1, 2, 3...) to merge bytes strictly in order
      const sortedSegments = [...this.task.segments].sort((a, b) => a.id - b.id);
      for (const seg of sortedSegments) {
        const segChunks = this.segmentBuffers.get(seg.id) || [];
        for (const chunk of segChunks) {
          orderedBuffers.push(chunk);
        }
      }

      const finalBlob = new Blob(orderedBuffers, { type: this.task.mimeType || 'application/octet-stream' });
      this.finalizeCompletedBlob(finalBlob);
    } catch (mergeErr: any) {
      console.error('Error during blob assembly:', mergeErr);
      this.task.status = 'error';
      this.task.errorMsg = `Failed to assemble downloaded chunks: ${mergeErr.message}`;
      this.options.onError(this.task, this.task.errorMsg);
    }
  }

  private finalizeCompletedBlob(blob: Blob): void {
    const blobUrl = URL.createObjectURL(blob);
    this.task.fileBlob = blob;
    this.task.blobUrl = blobUrl;
    this.task.downloadedBytes = blob.size;
    this.task.totalSize = blob.size;
    this.task.progress = 100;
    this.task.speed = 0;
    this.task.status = 'completed';
    this.task.completedAt = Date.now();

    // Trigger direct download to user's disk
    saveBlobToDisk(blob, this.task.filename);

    this.options.onComplete(this.task, blob);
  }
}

// Global active manager to track running download jobs
class DownloadEngineManager {
  private activeJobs: Map<string, ActiveDownloadJob> = new Map();

  public startTask(task: DownloadTask, options: DownloadRunnerOptions): void {
    if (this.activeJobs.has(task.id)) {
      const existing = this.activeJobs.get(task.id)!;
      existing.pause();
    }
    const job = new ActiveDownloadJob(task, options);
    this.activeJobs.set(task.id, job);
    job.start();
  }

  public pauseTask(taskId: string): void {
    const job = this.activeJobs.get(taskId);
    if (job) {
      job.pause();
    }
  }

  public cancelTask(taskId: string): void {
    const job = this.activeJobs.get(taskId);
    if (job) {
      job.cancel();
      this.activeJobs.delete(taskId);
    }
  }

  public isJobActive(taskId: string): boolean {
    return this.activeJobs.has(taskId);
  }
}

export const downloadManager = new DownloadEngineManager();

/**
 * Executes a real multi-threaded download dividing the target file across N concurrent range threads.
 */
export async function executeRealMultiThreadDownload(
  fileUrl: string, 
  filename: string, 
  totalSize: number, 
  threadCount: number,
  onProgressUpdate: (segmentId: number, downloadedBytes: number) => void
) {
  const segmentSize = Math.floor(totalSize / threadCount);
  const downloadPromises: Promise<{ id: number; data: Uint8Array }>[] = [];

  for (let i = 0; i < threadCount; i++) {
    const start = i * segmentSize;
    // Last thread covers all remaining bytes
    const end = i === threadCount - 1 ? totalSize - 1 : start + segmentSize - 1;

    // Har thread (chunk) ka apna function
    const chunkPromise = new Promise<{ id: number; data: Uint8Array }>(async (resolve, reject) => {
      try {
        const response = await fetch(`/api/proxy-download?url=${encodeURIComponent(fileUrl)}`, {
          headers: { "Range": `bytes=${start}-${end}` }
        });

        if (!response.body) throw new Error("ReadableStream not supported.");

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;

        // Read stream chunk by chunk for REAL progress
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          loaded += value.length;
          
          // Update UI dynamically
          onProgressUpdate(i + 1, loaded); 
        }

        // Merge this specific thread's chunks
        const mergedChunk = new Uint8Array(loaded);
        let offset = 0;
        for (const chunk of chunks) {
          mergedChunk.set(chunk, offset);
          offset += chunk.length;
        }

        resolve({ id: i + 1, data: mergedChunk });
      } catch (err) {
        reject(err);
      }
    });

    downloadPromises.push(chunkPromise);
  }

  // Sab threads ka wait karein
  const completedSegments = await Promise.all(downloadPromises);
  
  // Array ko segment ID ke hisaab se sort karein taake file corrupt na ho
  completedSegments.sort((a, b) => a.id - b.id);

  // Saare chunks mila kar final Blob banayein
  const finalBlob = new Blob(completedSegments.map(seg => seg.data), { type: "application/octet-stream" });

  // File ko user ke system mein save karwayein
  triggerDirectDownload(URL.createObjectURL(finalBlob), filename);
}
