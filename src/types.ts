export type DownloadCategory = 'all' | 'video' | 'audio' | 'compressed' | 'document' | 'software' | 'image' | 'other';

export type DownloadStatus = 'queued' | 'connecting' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';

export interface DownloadSegment {
  id: number;
  startByte: number;
  endByte: number;
  currentByte: number;
  progress: number; // 0 to 100
  speed: number; // bytes/sec
  status: 'pending' | 'active' | 'completed' | 'error';
}

export interface DownloadTask {
  id: string;
  url: string;
  filename: string;
  category: DownloadCategory;
  mimeType: string;
  totalSize: number; // bytes, 0 if unknown
  downloadedBytes: number;
  speed: number; // bytes/sec
  peakSpeed: number; // bytes/sec
  progress: number; // 0 to 100
  status: DownloadStatus;
  resumable: boolean;
  threadCount: number;
  segments: DownloadSegment[];
  dateAdded: number;
  completedAt?: number;
  errorMsg?: string;
  blobUrl?: string;
  fileBlob?: Blob;
  sourceType?: 'direct' | 'youtube_sim' | 'stream' | 'batch';
  videoQuality?: string;
  saveDirectory?: string;
}

export interface StreamOption {
  quality: string;
  format: string;
  size: number;
  directUrl: string;
}

export interface ProbeResult {
  url: string;
  filename: string;
  mimeType: string;
  totalSize: number;
  resumable: boolean;
  category: DownloadCategory;
  corsEnabled: boolean;
  serverHeader?: string;
  isYouTube?: boolean;
  title?: string;
  author?: string;
  thumbnail?: string;
  streams?: StreamOption[];
}

export interface ExtensionFile {
  name: string;
  path: string;
  language: string;
  content: string;
  description: string;
}

export interface SniffedMedia {
  id: string;
  title: string;
  url: string;
  duration: string;
  resolution: string;
  format: 'mp4' | 'mp3' | 'webm' | 'm4a';
  sizeFormatted: string;
  sizeBytes: number;
  thumbnail: string;
  category: 'video' | 'audio';
}
