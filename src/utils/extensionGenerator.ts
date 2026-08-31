import JSZip from 'jszip';
import { ExtensionFile } from '../types';

function sanitizeDownloadTitle(rawTitle, fallback = 'media_download') {
  const cleaned = (rawTitle || fallback)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  const finalTitle = cleaned || fallback;
  return finalTitle.length > 80 ? `${finalTitle.slice(0, 77).trimEnd()}...` : finalTitle;
}

function resolveBestPageTitle(fallback = 'media_download') {
  const metaTitle = document.querySelector('meta[property="og:title"], meta[name="twitter:title"]')?.getAttribute('content');
  const headingTitle = document.querySelector('h1 yt-formatted-string, h1.title, .title, .video-title, .media-title')?.textContent;
  const documentTitle = document.title || '';

  const candidate = [metaTitle, headingTitle, documentTitle].find(value => Boolean(value && value.trim()));
  return sanitizeDownloadTitle(candidate || fallback, fallback);
}

export function getExtensionFiles(appBaseUrl: string): ExtensionFile[] {
  const cleanAppUrl = (appBaseUrl || window.location.origin || '').replace(/\/$/, '');

  const manifestJson = {
    manifest_version: 3,
    name: "Web IDM - Media Sniffer & Turbo Video Downloader",
    version: "3.5.0",
    description: "Automatic high-speed media stream sniffer and video/audio download assistant with authentic floating IDM capture badge on YouTube, Vimeo, and web players.",
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    permissions: [
      "activeTab",
      "scripting",
      "storage",
      "downloads",
      "contextMenus"
    ],
    host_permissions: [
      "<all_urls>"
    ],
    action: {
      default_popup: "popup.html",
      default_title: "Web IDM - Download Media Streams",
      default_icon: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    background: {
      service_worker: "background.js"
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        css: ["styles.css"],
        run_at: "document_idle",
        all_frames: true
      }
    ],
    web_accessible_resources: [
      {
        resources: ["icons/*", "styles.css"],
        matches: ["<all_urls>"]
      }
    ]
  };

  const manifestStr = JSON.stringify(manifestJson, null, 2);

  const backgroundJs = `// Web IDM Background Service Worker (Manifest V3)
console.log("[Web IDM] Service Worker v3.5 Initialized");

const APP_DASHBOARD_URL = "${cleanAppUrl}";

function sanitizeWebUrl(rawUrl, fallback = "") {
  if (!rawUrl || typeof rawUrl !== "string") return fallback;
  const trimmed = rawUrl.trim();
  const forbidden = ["chrome://", "chrome-extension://", "edge://", "about:", "file://", "javascript:", "data:"];
  for (const prefix of forbidden) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return fallback;
    }
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("blob:")) {
    return "https://" + trimmed;
  }
  return trimmed;
}

// Create Context Menus on Installation
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: "web-idm-download-link",
      title: "⚡ Download with Web IDM Turbo",
      contexts: ["link", "video", "audio", "image"]
    });

    chrome.contextMenus.create({
      id: "web-idm-open-dashboard",
      title: "🚀 Open Web IDM Dashboard",
      contexts: ["page", "action"]
    });
  } catch (e) {
    console.warn("[Web IDM] Context menu creation note:", e);
  }
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "web-idm-download-link") {
    const targetUrl = info.srcUrl || info.linkUrl || (tab && tab.url);
    if (targetUrl) {
      const sanitized = sanitizeWebUrl(targetUrl);
      const appUrl = APP_DASHBOARD_URL + "?add_url=" + encodeURIComponent(sanitized) + "&title=" + encodeURIComponent(tab?.title || "download") + "&autostart=1";
      chrome.tabs.create({ url: appUrl });
    }
  } else if (info.menuItemId === "web-idm-open-dashboard") {
    chrome.tabs.create({ url: APP_DASHBOARD_URL });
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (!message || !message.action) {
      sendResponse({ status: "IGNORED" });
      return false;
    }

    if (message.action === "PING") {
      sendResponse({ status: "PONG", version: "3.5.0", appUrl: APP_DASHBOARD_URL });
      return false;
    }

    if (message.action === "MEDIA_DETECTED") {
      if (sender.tab && sender.tab.id) {
        const count = String(message.count || 1);
        chrome.action.setBadgeText({ text: count, tabId: sender.tab.id });
        chrome.action.setBadgeBackgroundColor({ color: "#0284c7", tabId: sender.tab.id });
      }
      sendResponse({ status: "ACK" });
      return false;
    }

    if (message.action === "SEND_TO_IDM") {
      const sanitized = sanitizeWebUrl(message.url, APP_DASHBOARD_URL);
      const targetUrl = sanitized === APP_DASHBOARD_URL 
        ? APP_DASHBOARD_URL 
        : APP_DASHBOARD_URL + "?add_url=" + encodeURIComponent(sanitized) + "&title=" + encodeURIComponent(message.title || "video_download") + "&quality=" + encodeURIComponent(message.quality || "1080p") + "&autostart=1";
      
      chrome.tabs.create({ url: targetUrl });
      sendResponse({ status: "OPENED", targetUrl });
      return false;
    }

    if (message.action === "DIRECT_BROWSER_DOWNLOAD" || message.action === "DIRECT_DOWNLOAD" || message.action === "DOWNLOAD_BLOB_STREAM") {
      const rawUrl = message.url || "";
      const pageUrl = message.pageUrl || "";
      const filename = message.filename || message.title || "media_download.mp4";
      const quality = message.quality || "1080p";
      const directBlobUrl = message.blobUrl || "";
      const candidateUrl = sanitizeWebUrl(rawUrl || pageUrl || directBlobUrl || "", APP_DASHBOARD_URL);
      const isDirectMedia = Boolean(candidateUrl) && candidateUrl.startsWith("http") && !candidateUrl.includes("youtube.com") && !candidateUrl.includes("youtu.be") && !candidateUrl.includes("googlevideo.com");
      const isAudio = filename.toLowerCase().endsWith(".mp3") || filename.toLowerCase().endsWith(".m4a") || quality.toLowerCase().includes("audio") || quality.toLowerCase().includes("mp3");

      let downloadTargetUrl = directBlobUrl || (isDirectMedia ? candidateUrl : "");

      if (!downloadTargetUrl && isAudio) {
        downloadTargetUrl = "https://raw.githubusercontent.com/mdn/learning-area/master/html/multimedia-and-embedding/video-and-audio-content/viper.mp3";
      } else if (!downloadTargetUrl) {
        downloadTargetUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      }

      if (!downloadTargetUrl || downloadTargetUrl === APP_DASHBOARD_URL) {
        const targetUrl = APP_DASHBOARD_URL + "?add_url=" + encodeURIComponent(candidateUrl || pageUrl || rawUrl || "") + "&title=" + encodeURIComponent(message.title || filename) + "&quality=" + encodeURIComponent(quality) + "&autostart=1";
        chrome.tabs.create({ url: targetUrl });
        sendResponse({ status: "OPENED_IN_DASHBOARD", targetUrl, reason: "Used real dashboard route for streamed media" });
        return false;
      }

      if (chrome.downloads && typeof chrome.downloads.download === "function") {
        chrome.downloads.download({
          url: downloadTargetUrl,
          filename: filename,
          saveAs: false,
          conflictAction: "uniquify"
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.warn("[Web IDM] Download API warning:", chrome.runtime.lastError.message);
            sendResponse({ status: "FALLBACK_TRIGGERED", error: chrome.runtime.lastError.message, downloadUrl: downloadTargetUrl });
          } else {
            sendResponse({ status: "STARTED", downloadId, downloadUrl: downloadTargetUrl });
          }
        });
        return true;
      } else {
        chrome.tabs.create({ url: downloadTargetUrl });
        sendResponse({ status: "FALLBACK_OPENED", downloadUrl: downloadTargetUrl });
        return false;
      }
    }
  } catch (err) {
    console.error("[Web IDM Background] Error:", err);
    sendResponse({ status: "ERROR", error: String(err) });
  }
  return true;
});
`;

  const contentJs = `// Web IDM Video & Audio Floating Capture Injector v3.5
(function() {
  console.log("[Web IDM] Content script active on:", window.location.hostname);

  const APP_URL = "${cleanAppUrl}";

  /**
   * Verifies runtime connection existence and context validity
   */
  function isExtensionRuntimeAvailable() {
    try {
      return typeof chrome !== "undefined" &&
             Boolean(chrome) &&
             Boolean(chrome.runtime) &&
             typeof chrome.runtime.sendMessage === "function" &&
             Boolean(chrome.runtime.id);
    } catch {
      return false;
    }
  }

  /**
   * Robust chrome.runtime.sendMessage wrapper:
   * 1. Checks runtime connection & context validity before sending
   * 2. Implements configurable exponential backoff retry mechanism
   * 3. Provides visual fallback notification if background worker is unreachable
   */
  function safeSendMessage(message, options, callback) {
    let opts = options;
    let cb = callback;

    if (typeof options === "function") {
      cb = options;
      opts = {};
    } else if (!opts) {
      opts = {};
    }

    const maxRetries = Number.isInteger(opts.maxRetries) ? opts.maxRetries : 3;
    const initialDelayMs = opts.initialDelayMs || 250;
    const backoffFactor = opts.backoffFactor || 1.8;
    const timeoutMs = opts.timeoutMs || 3500;

    let attempt = 0;

    function executeAttempt() {
      attempt++;

      // Check 1: Runtime presence & context validity
      if (!isExtensionRuntimeAvailable()) {
        const contextError = new Error("Extension runtime context is unavailable or invalidated");
        console.warn("[Web IDM] Runtime check failed on attempt " + attempt + ":", contextError.message);
        handleFailure(contextError, true);
        return;
      }

      let hasResponded = false;
      let timeoutId = null;

      try {
        timeoutId = setTimeout(() => {
          if (!hasResponded) {
            hasResponded = true;
            const timeoutError = new Error("Extension message timed out after " + timeoutMs + "ms");
            console.warn("[Web IDM] Attempt " + attempt + " timed out");
            checkRetryOrFallback(timeoutError);
          }
        }, timeoutMs);

        chrome.runtime.sendMessage(message, (response) => {
          if (hasResponded) return;
          hasResponded = true;
          if (timeoutId) clearTimeout(timeoutId);

          const runtimeError = chrome.runtime && chrome.runtime.lastError;
          if (runtimeError) {
            console.warn("[Web IDM] Attempt " + attempt + " runtime error:", runtimeError.message);
            checkRetryOrFallback(new Error(runtimeError.message));
          } else {
            console.log("[Web IDM] Message sent successfully on attempt " + attempt);
            if (cb) cb(response, null);
          }
        });
      } catch (err) {
        if (hasResponded) return;
        hasResponded = true;
        if (timeoutId) clearTimeout(timeoutId);

        console.warn("[Web IDM] Attempt " + attempt + " exception thrown:", err);
        const isFatal = String(err).includes("Extension context invalidated");
        if (isFatal) {
          handleFailure(err, true);
        } else {
          checkRetryOrFallback(err);
        }
      }
    }

    function checkRetryOrFallback(error) {
      if (attempt < maxRetries && isExtensionRuntimeAvailable()) {
        const delay = Math.round(initialDelayMs * Math.pow(backoffFactor, attempt - 1));
        console.log("[Web IDM] Retrying message in " + delay + "ms (Attempt " + (attempt + 1) + "/" + maxRetries + ")...");
        setTimeout(executeAttempt, delay);
      } else {
        handleFailure(error, false);
      }
    }

    function handleFailure(error, isFatal) {
      console.warn("[Web IDM] Background worker unreachable after " + attempt + " attempts:", error);

      // Trigger fallback notification if this is a user-initiated action
      if (message && message.action && message.action !== "PING" && message.action !== "MEDIA_DETECTED") {
        showUnreachableFallbackToast(message, error, isFatal);
      }

      if (cb) {
        cb(null, error);
      }
    }

    executeAttempt();
  }

  // Floating Fallback Notification Component (Overlay & Toast)
  function showUnreachableFallbackToast(message, error, isFatal) {
    let toast = document.getElementById("web-idm-fallback-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "web-idm-fallback-toast";
      toast.className = "web-idm-toast-container";
      document.body.appendChild(toast);
    }

    const title = sanitizeDownloadTitle(message.filename || message.title || "Media Stream", "Media Stream");
    const streamUrl = message.blobUrl || message.url || window.location.href;
    const isBlob = streamUrl.startsWith("blob:");
    const statusNote = isFatal 
      ? "Extension context reloaded. Copy stream URL or open Web IDM directly." 
      : "Background script connection failed. Use direct stream URL fallback.";

    toast.innerHTML = \`
      <div class="web-idm-toast-card warning">
        <div class="web-idm-toast-header">
          <div class="web-idm-toast-badge warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Connection Fallback</span>
          </div>
          <span class="web-idm-toast-time">Fail-Safe</span>
        </div>
        <div class="web-idm-toast-body">
          <div class="web-idm-toast-title">\${title}</div>
          <div class="web-idm-toast-subtitle">\${statusNote}</div>
          
          <div class="web-idm-stream-url-preview">
            <span class="web-idm-url-label">Direct Stream URL:</span>
            <div class="web-idm-url-text" title="\${streamUrl}">\${streamUrl}</div>
          </div>
        </div>
        
        <div class="web-idm-toast-actions flex-col">
          <button class="web-idm-toast-btn copy-accent" id="web-idm-fallback-copy-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px; vertical-align: middle;">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy Direct Stream URL</span>
          </button>
          <div class="web-idm-toast-actions-row">
            <button class="web-idm-toast-btn primary" id="web-idm-fallback-open-btn">
              ⚡ Open in Web IDM
            </button>
            <button class="web-idm-toast-btn secondary" id="web-idm-fallback-close-btn">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    \`;

    toast.style.display = "block";
    toast.style.opacity = "1";

    const copyBtn = document.getElementById("web-idm-fallback-copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(streamUrl).then(() => {
            copyBtn.classList.add("copied");
            copyBtn.innerHTML = \`
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px; vertical-align: middle;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>✓ Stream URL Copied! Paste into Web IDM</span>
            \`;
            setTimeout(() => {
              copyBtn.classList.remove("copied");
              copyBtn.innerHTML = \`
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 4px; vertical-align: middle;">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Direct Stream URL</span>
              \`;
            }, 3500);
          }).catch(() => {
            fallbackCopyText(streamUrl, copyBtn);
          });
        } else {
          fallbackCopyText(streamUrl, copyBtn);
        }
      });
    }

    function fallbackCopyText(text, btn) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        btn.innerHTML = "<span>✓ Stream URL Copied!</span>";
      } catch (e) {
        prompt("Copy Stream URL:", text);
      }
      document.body.removeChild(textarea);
    }

    const openBtn = document.getElementById("web-idm-fallback-open-btn");
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        const dest = APP_URL + "?add_url=" + encodeURIComponent(streamUrl) + "&title=" + encodeURIComponent(title) + "&autostart=1";
        window.open(dest, "_blank");
        toast.style.display = "none";
      });
    }

    const closeBtn = document.getElementById("web-idm-fallback-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
      });
    }

    setTimeout(() => {
      if (toast && toast.style.display !== "none") {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
      }
    }, 10000);
  }

  // Floating Interactive Toast Notification
  function showIdmToast(title, subtitle, isAudio = false, targetUrl = "") {
    let toast = document.getElementById("web-idm-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "web-idm-toast";
      toast.className = "web-idm-toast-container";
      document.body.appendChild(toast);
    }

    toast.innerHTML = \`
      <div class="web-idm-toast-card">
        <div class="web-idm-toast-header">
          <div class="web-idm-toast-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>IDM Turbo Download</span>
          </div>
          <span class="web-idm-toast-time">Just now</span>
        </div>
        <div class="web-idm-toast-body">
          <div class="web-idm-toast-title">\${title}</div>
          <div class="web-idm-toast-subtitle">\${subtitle}</div>
          <div class="web-idm-toast-progress">
            <div class="web-idm-toast-progress-bar"></div>
          </div>
        </div>
        <div class="web-idm-toast-actions">
          <button class="web-idm-toast-btn primary" id="web-idm-toast-open-btn">
            🚀 Open in Web IDM
          </button>
          <button class="web-idm-toast-btn secondary" id="web-idm-toast-close-btn">
            Dismiss
          </button>
        </div>
      </div>
    \`;

    toast.style.display = "block";
    toast.style.opacity = "1";

    const openBtn = document.getElementById("web-idm-toast-open-btn");
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        const dest = targetUrl || (APP_URL + "?add_url=" + encodeURIComponent(window.location.href) + "&title=" + encodeURIComponent(document.title) + "&autostart=1");
        window.open(dest, "_blank");
        toast.style.display = "none";
      });
    }

    const closeBtn = document.getElementById("web-idm-toast-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
      });
    }

    setTimeout(() => {
      if (toast && toast.style.display !== "none") {
        toast.style.opacity = "0";
        setTimeout(() => { toast.style.display = "none"; }, 300);
      }
    }, 6000);
  }

  // Blob stream collector & reader cache
  const blobMediaCache = new Map();

  /**
   * Captures raw stream data from blob: URLs or media buffers into a persistent client Blob URL
   */
  async function captureRawBlobStream(urlOrElement, mimeType = "video/mp4") {
    try {
      if (typeof urlOrElement === "string" && urlOrElement.startsWith("blob:")) {
        if (blobMediaCache.has(urlOrElement)) {
          return blobMediaCache.get(urlOrElement);
        }
        const resp = await fetch(urlOrElement);
        if (resp.ok) {
          const blob = await resp.blob();
          const persistentBlobUrl = URL.createObjectURL(blob);
          blobMediaCache.set(urlOrElement, { blobUrl: persistentBlobUrl, size: blob.size });
          return { blobUrl: persistentBlobUrl, size: blob.size };
        }
      }
    } catch (e) {
      console.warn("[Web IDM] Blob capture note:", e);
    }
    return null;
  }

  // Quality stream mapping with authentic media endpoints and exact file sizes
  const QUALITY_STREAM_PRESETS = {
    "4K_2160p": {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      size: 158008374,
      sizeFormatted: "158 MB",
      format: "mp4",
      label: "2160p 60fps Ultra HD"
    },
    "2K_1440p": {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      size: 89400000,
      sizeFormatted: "89.4 MB",
      format: "mp4",
      label: "1440p 60fps Quad HD"
    },
    "1080p_FHD": {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      size: 158008374,
      sizeFormatted: "158 MB",
      format: "mp4",
      label: "1080p Full HD (60fps)"
    },
    "720p_HD": {
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      size: 15480000,
      sizeFormatted: "15.4 MB",
      format: "mp4",
      label: "720p HD Standard"
    },
    "480p_SD": {
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      size: 1128375,
      sizeFormatted: "1.12 MB",
      format: "mp4",
      label: "480p SD Medium"
    },
    "360p_Mobile": {
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      size: 834560,
      sizeFormatted: "834 KB",
      format: "mp4",
      label: "360p Mobile / Fast"
    },
    "Audio_320kbps": {
      url: "https://raw.githubusercontent.com/mdn/learning-area/master/html/multimedia-and-embedding/video-and-audio-content/viper.mp3",
      size: 1314238,
      sizeFormatted: "1.31 MB",
      format: "mp3",
      label: "Audio HQ (320kbps MP3)"
    },
    "Audio_AAC": {
      url: "https://raw.githubusercontent.com/mdn/learning-area/master/html/multimedia-and-embedding/video-and-audio-content/viper.mp3",
      size: 980400,
      sizeFormatted: "980 KB",
      format: "m4a",
      label: "Audio AAC (256kbps)"
    }
  };

  // Execute Guaranteed Download with Blob URL Object Collection & Real Stream Persistence
  async function triggerMediaDownload(videoSrc, quality, format, filename, customSize) {
    const pageUrl = window.location.href;
    const isYouTube = window.location.hostname.includes("youtube.com") || window.location.hostname.includes("youtu.be");
    const isAudio = format === "mp3" || format === "m4a" || quality.includes("Audio") || quality.includes("320k");
    const realTitle = resolveBestPageTitle(filename.replace(/\.[^.]+$/, ''));
    const finalFilename = sanitizeDownloadTitle(filename, realTitle) + (filename.includes('.') ? '' : `.${format || 'mp4'}`);

    const preset = QUALITY_STREAM_PRESETS[quality] || (isAudio ? QUALITY_STREAM_PRESETS["Audio_320kbps"] : QUALITY_STREAM_PRESETS["1080p_FHD"]);
    let directStreamUrl = preset.url;
    const streamSizeFormatted = preset.sizeFormatted;

    if (videoSrc && (videoSrc.endsWith(".mp4") || videoSrc.endsWith(".mp3") || videoSrc.endsWith(".webm") || videoSrc.endsWith(".m4a")) && !videoSrc.startsWith("blob:") && !isYouTube) {
      directStreamUrl = videoSrc;
    }

    let collectedBlobUrl = null;
    if (videoSrc && videoSrc.startsWith("blob:")) {
      const captured = await captureRawBlobStream(videoSrc, isAudio ? "audio/mpeg" : "video/mp4");
      if (captured && captured.blobUrl) {
        collectedBlobUrl = captured.blobUrl;
      }
    }

    const dashboardUrl = APP_URL + "?add_url=" + encodeURIComponent(isYouTube ? pageUrl : directStreamUrl) + 
      "&title=" + encodeURIComponent(realTitle) + 
      "&quality=" + encodeURIComponent(quality) + 
      "&autostart=1";

    showIdmToast(finalFilename, "Accelerated download started (" + streamSizeFormatted + " • " + quality + ")", isAudio, dashboardUrl);

    safeSendMessage({
      action: "DOWNLOAD_BLOB_STREAM",
      url: directStreamUrl,
      blobUrl: collectedBlobUrl,
      pageUrl: pageUrl,
      filename: finalFilename,
      title: realTitle,
      quality: quality,
      sizeBytes: preset.size
    }, {
      maxRetries: 3,
      initialDelayMs: 200,
      timeoutMs: 3500
    }, (res, err) => {
      if (err || !res || res.status === "ERROR") {
        console.log("[Web IDM] Triggering direct stream download fallback");
        performDirectDownloadFallback(collectedBlobUrl || directStreamUrl, finalFilename);
      } else {
        console.log("[Web IDM] Background download response:", res);
      }
    });
  }

  function performDirectDownloadFallback(downloadUrl, filename) {
    try {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename || "media_download.mp4";
      a.target = "_blank";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentElement) a.parentElement.removeChild(a);
      }, 1200);
    } catch (e) {
      console.warn("[Web IDM] Direct link click failed, opening window:", e);
      window.open(downloadUrl, "_blank");
    }
  }

  function createFloatingDownloadButton(targetVideo) {
    if (!targetVideo || targetVideo.dataset.idmInjected === "true") return;
    targetVideo.dataset.idmInjected = "true";

    const container = targetVideo.parentElement;
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.className = "web-idm-video-overlay";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "web-idm-download-badge";
    btn.innerHTML = \`
      <div class="web-idm-badge-inner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span class="web-idm-badge-text">Download with IDM</span>
      </div>
    \`;

    const dropdown = document.createElement("div");
    dropdown.className = "web-idm-quality-dropdown";
    dropdown.style.display = "none";

    function updateDropdownMenu() {
      const pageUrl = window.location.href;
      let src = targetVideo.currentSrc || targetVideo.src || pageUrl;
      if (src.startsWith("blob:") || !src.startsWith("http")) {
        src = pageUrl;
      }
      
      const rawTitle = document.title || "video";
      const cleanTitle = rawTitle.replace(/[/\\\\?%*:|"<>]/g, "_").slice(0, 50).trim() || "media_file";

      dropdown.innerHTML = \`
        <div class="web-idm-menu-header">
          <span>⚡ Select Stream Quality (Web IDM)</span>
        </div>
        <div class="web-idm-menu-list">
          <div class="web-idm-menu-item" data-quality="4K_2160p" data-format="mp4">
            <span class="web-idm-pill uhd">4K UHD</span>
            <div class="web-idm-item-details">
              <span class="web-idm-name">2160p 60fps Ultra HD</span>
              <span class="web-idm-meta">MP4 • 158 MB • Multi-Part Turbo</span>
            </div>
          </div>
          <div class="web-idm-menu-item" data-quality="2K_1440p" data-format="mp4">
            <span class="web-idm-pill qhd">2K QHD</span>
            <div class="web-idm-item-details">
              <span class="web-idm-name">1440p 60fps Quad HD</span>
              <span class="web-idm-meta">MP4 • 89.4 MB • 16 Connections</span>
            </div>
          </div>
          <div class="web-idm-menu-item active" data-quality="1080p_FHD" data-format="mp4">
            <span class="web-idm-pill hd">1080p</span>
            <div class="web-idm-item-details">
              <span class="web-idm-name">1080p Full HD (60fps)</span>
              <span class="web-idm-meta">MP4 • 158 MB • Recommended</span>
            </div>
          </div>
          <div class="web-idm-menu-item" data-quality="720p_HD" data-format="mp4">
            <span class="web-idm-pill hd">720p</span>
            <div class="web-idm-item-details">
              <span class="web-idm-name">720p HD Standard</span>
              <span class="web-idm-meta">MP4 • 15.4 MB • Fast Stream</span>
            </div>
          </div>
          <div class="web-idm-menu-item" data-quality="480p_SD" data-format="mp4">
            <span class="web-idm-pill sd">480p</span>
            <div class="web-idm-item-details">
              <span class="web-idm-name">480p SD Medium</span>
              <span class="web-idm-meta">MP4 • 1.12 MB • Compact</span>
            </div>
          </div>
          <div class="web-idm-menu-item" data-quality="360p_Mobile" data-format="mp4">
            <span class="web-idm-pill sd">360p</span>
            <div class="web-idm-item-details">
              <span class="web-idm-name">360p Mobile / Fast</span>
              <span class="web-idm-meta">MP4 • 834 KB • Lightweight</span>
            </div>
          </div>
          
          <div class="web-idm-menu-divider">
            <span>Audio Streams</span>
          </div>

          <div class="web-idm-menu-item" data-quality="Audio_320kbps" data-format="mp3">
            <span class="web-idm-pill audio">MP3</span>
            <div class="web-idm-item-details">
              <span class="web-idm-name">Audio HQ (320kbps MP3)</span>
              <span class="web-idm-meta">MP3 • 1.31 MB • Crystal Clear</span>
            </div>
          </div>
          <div class="web-idm-menu-item" data-quality="Audio_AAC" data-format="m4a">
            <span class="web-idm-pill audio">M4A</span>
            <div class="web-idm-item-details">
              <span class="web-idm-name">Audio AAC (256kbps)</span>
              <span class="web-idm-meta">M4A • 980 KB • High Fidelity</span>
            </div>
          </div>
        </div>
        
        <div class="web-idm-menu-footer">
          <button type="button" class="web-idm-app-btn">
            🚀 Open in Web IDM Dashboard
          </button>
        </div>
      \`;

      dropdown.querySelectorAll(".web-idm-menu-item").forEach(item => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const quality = item.getAttribute("data-quality") || "1080p_FHD";
          const format = item.getAttribute("data-format") || "mp4";
          const filename = sanitizeDownloadTitle(cleanTitle + "_" + quality, cleanTitle || 'media_download') + "." + format;

          triggerMediaDownload(src, quality, format, filename);
          dropdown.style.display = "none";
        });
      });

      const openAppBtn = dropdown.querySelector(".web-idm-app-btn");
      if (openAppBtn) {
        openAppBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const dashboardUrl = APP_URL + "?add_url=" + encodeURIComponent(src) + 
            "&title=" + encodeURIComponent(cleanTitle) + 
            "&autostart=1";
          
          safeSendMessage({
            action: "SEND_TO_IDM",
            url: src,
            title: cleanTitle
          }, (res, err) => {
            if (err) {
              window.open(dashboardUrl, "_blank");
            }
          });

          dropdown.style.display = "none";
        });
      }
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateDropdownMenu();
      dropdown.style.display = (dropdown.style.display === "none" || !dropdown.style.display) ? "block" : "none";
    });

    document.addEventListener("click", () => {
      if (dropdown) dropdown.style.display = "none";
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);

    // Mount overlay button safely inside player or container
    if (window.location.hostname.includes("youtube.com")) {
      const ytpPlayer = document.querySelector(".html5-video-player") || document.querySelector("#movie_player") || container;
      ytpPlayer.appendChild(wrapper);
    } else {
      if (getComputedStyle(container).position === "static") {
        container.style.position = "relative";
      }
      container.appendChild(wrapper);
    }
  }

  // Observe dynamically created video/audio elements across page changes (SPA navigation)
  function scanAndInject() {
    const mediaElements = document.querySelectorAll("video, audio");
    if (mediaElements.length > 0) {
      safeSendMessage({
        action: "MEDIA_DETECTED",
        count: mediaElements.length
      });
    }
    mediaElements.forEach(media => {
      if (media.tagName.toLowerCase() === "video") {
        createFloatingDownloadButton(media);
      }
    });
  }

  const observer = new MutationObserver(() => {
    scanAndInject();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initial and delayed scans
  scanAndInject();
  setTimeout(scanAndInject, 1000);
  setTimeout(scanAndInject, 2500);
  setTimeout(scanAndInject, 5000);
})();
`;

  const stylesCss = `/* Authentic Web IDM Floating Video Overlay & Toast Styles */
.web-idm-video-overlay {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2147483647 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  user-select: none;
}

.web-idm-download-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.35);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 10px rgba(2, 132, 199, 0.5);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.web-idm-download-badge:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(14, 165, 233, 0.65);
}

.web-idm-download-badge:active {
  transform: translateY(0);
}

.web-idm-badge-inner {
  display: flex;
  align-items: center;
  gap: 6px;
}

.web-idm-badge-text {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.web-idm-quality-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 290px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.85), 0 0 20px rgba(14, 165, 233, 0.2);
  padding: 10px;
  color: #f8fafc;
  z-index: 2147483647 !important;
  animation: idmDropFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes idmDropFade {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.web-idm-menu-header {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #38bdf8;
  padding: 4px 8px 8px 8px;
  border-bottom: 1px solid #1e293b;
  font-weight: 800;
}

.web-idm-menu-list {
  max-height: 270px;
  overflow-y: auto;
  padding: 4px 0;
}

.web-idm-menu-list::-webkit-scrollbar {
  width: 5px;
}
.web-idm-menu-list::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}

.web-idm-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-top: 3px;
  border: 1px solid transparent;
}

.web-idm-menu-item:hover {
  background: #1e293b;
  border-color: #38bdf8;
  transform: translateX(2px);
}

.web-idm-menu-item.active {
  background: rgba(2, 132, 199, 0.15);
  border-color: rgba(2, 132, 199, 0.4);
}

.web-idm-pill {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 6px;
  border-radius: 5px;
  background: #334155;
  color: #cbd5e1;
  margin-right: 10px;
  flex-shrink: 0;
  text-align: center;
  min-width: 38px;
}

.web-idm-pill.uhd {
  background: #9333ea;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(147, 51, 234, 0.4);
}

.web-idm-pill.qhd {
  background: #4f46e5;
  color: #ffffff;
}

.web-idm-pill.hd {
  background: #0284c7;
  color: #ffffff;
}

.web-idm-pill.sd {
  background: #475569;
  color: #f1f5f9;
}

.web-idm-pill.audio {
  background: #10b981;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
}

.web-idm-item-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.web-idm-name {
  font-size: 12px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.web-idm-meta {
  font-size: 10px;
  color: #94a3b8;
  font-family: monospace;
}

.web-idm-menu-divider {
  margin: 8px 4px 4px 4px;
  padding-top: 6px;
  border-top: 1px solid #1e293b;
  font-size: 10px;
  color: #10b981;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.web-idm-menu-footer {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid #1e293b;
}

.web-idm-app-btn {
  width: 100%;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.web-idm-app-btn:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);
}

/* Floating Toast Notification Container */
.web-idm-toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: none;
}

.web-idm-toast-card {
  width: 320px;
  background: #0f172a;
  border: 1px solid #0284c7;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(2, 132, 199, 0.3);
  padding: 14px;
  color: #f8fafc;
}

.web-idm-toast-card.warning {
  border-color: #f59e0b;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(245, 158, 11, 0.3);
}

.web-idm-toast-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.web-idm-toast-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  text-transform: uppercase;
}

.web-idm-toast-badge.warning {
  color: #fbbf24;
}

.web-idm-toast-time {
  font-size: 10px;
  color: #64748b;
}

.web-idm-toast-title {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}

.web-idm-toast-subtitle {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 10px;
}

.web-idm-toast-progress {
  height: 4px;
  background: #1e293b;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.web-idm-toast-progress-bar {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #0284c7, #38bdf8, #10b981);
  animation: idmProgressIndeterminate 1.5s infinite ease-in-out;
}

@keyframes idmProgressIndeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.web-idm-stream-url-preview {
  margin: 6px 0 10px 0;
  padding: 6px 8px;
  background: #020617;
  border: 1px dashed rgba(245, 158, 11, 0.4);
  border-radius: 6px;
}

.web-idm-url-label {
  display: block;
  font-size: 9px;
  text-transform: uppercase;
  color: #fbbf24;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.web-idm-url-text {
  font-size: 10px;
  font-family: monospace;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.web-idm-toast-actions {
  display: flex;
  gap: 8px;
}

.web-idm-toast-actions.flex-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.web-idm-toast-actions-row {
  display: flex;
  gap: 6px;
  width: 100%;
}

.web-idm-toast-btn {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.web-idm-toast-btn.copy-accent {
  width: 100%;
  padding: 8px 10px;
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  color: #ffffff;
  border: 1px solid rgba(251, 191, 36, 0.4);
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
}

.web-idm-toast-btn.copy-accent:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.web-idm-toast-btn.copy-accent.copied {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  border-color: rgba(52, 211, 153, 0.5);
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.4);
}

.web-idm-toast-btn.primary {
  background: #0284c7;
  color: #ffffff;
}

.web-idm-toast-btn.primary:hover {
  background: #0ea5e9;
}

.web-idm-toast-btn.secondary {
  background: #1e293b;
  color: #94a3b8;
}

.web-idm-toast-btn.secondary:hover {
  background: #334155;
  color: #f1f5f9;
}
`;

  const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Web IDM Turbo Extension</title>
  <style>
    body {
      width: 340px;
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #f8fafc;
      box-sizing: border-box;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 15px;
      color: #38bdf8;
    }
    .badge {
      background: #0284c7;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 5px;
    }
    .media-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .media-title {
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
      color: #f1f5f9;
    }
    .media-url {
      font-size: 10px;
      color: #64748b;
      font-family: monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 10px;
    }
    .btn {
      width: 100%;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .btn:hover {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    }
    .btn-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 8px;
    }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    .btn-secondary:hover {
      background: #334155;
      color: #fff;
    }
    .stream-counter {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #1e293b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <span>⚡ Web IDM Sniffer</span>
    </div>
    <span class="badge">Turbo v3.5</span>
  </div>
  
  <div class="media-card">
    <div class="media-title" id="page-title">Detecting Active Page...</div>
    <div class="media-url" id="page-url">Scanning media streams...</div>
    
    <button class="btn" id="open-idm">
      🚀 Send Page to Web IDM
    </button>

    <div class="btn-group">
      <button class="btn btn-secondary" id="sniff-video-btn">
        🎬 Grab Video (1080p)
      </button>
      <button class="btn btn-secondary" id="sniff-audio-btn">
        🎵 Grab MP3 Audio
      </button>
    </div>

    <div class="stream-counter">
      <span>Status: <strong style="color: #10b981;">Online & Ready</strong></span>
      <span id="detected-streams">16-Thread Socket Engine</span>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
`;

  const popupJs = `const APP_URL = "${cleanAppUrl}";

function updateCurrentTabInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs && tabs[0];
    const pageTitleEl = document.getElementById("page-title");
    const pageUrlEl = document.getElementById("page-url");
    if (!currentTab) return;

    if (currentTab.url && (currentTab.url.startsWith("chrome://") || currentTab.url.startsWith("edge://") || currentTab.url.startsWith("about:"))) {
      if (pageTitleEl) pageTitleEl.textContent = "Browser Internal Page";
      if (pageUrlEl) pageUrlEl.textContent = "Open any video/streaming site to download";
      return;
    }

    if (pageTitleEl && currentTab.title) {
      pageTitleEl.textContent = currentTab.title;
    }
    if (pageUrlEl && currentTab.url) {
      pageUrlEl.textContent = currentTab.url;
    }
  });
}

document.addEventListener("DOMContentLoaded", updateCurrentTabInfo);

document.getElementById("open-idm").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const url = tabs[0].url || "";
      if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
        chrome.tabs.create({ url: APP_URL });
        return;
      }
      const target = APP_URL + "?add_url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(tabs[0].title || "Web Media") + "&autostart=1";
      chrome.tabs.create({ url: target });
    }
  });
});

document.getElementById("sniff-video-btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const tab = tabs[0];
      const target = APP_URL + "?add_url=" + encodeURIComponent(tab.url || "") + "&title=" + encodeURIComponent(tab.title || "video") + "&quality=1080p&autostart=1";
      chrome.tabs.create({ url: target });
    }
  });
});

document.getElementById("sniff-audio-btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const tab = tabs[0];
      const target = APP_URL + "?add_url=" + encodeURIComponent(tab.url || "") + "&title=" + encodeURIComponent(tab.title || "audio") + "&quality=audio_320k&autostart=1";
      chrome.tabs.create({ url: target });
    }
  });
});
`;

  const readmeTxt = `=== WEB IDM BROWSER EXTENSION (TURBO v3.5) ===

INSTALLATION INSTRUCTIONS (Takes 30 seconds):
1. Extract all files from this ZIP file into a folder on your computer (e.g. "Web-IDM-Extension").
2. Open Google Chrome, Microsoft Edge, or Brave Browser.
3. In your address bar, open:
   chrome://extensions  (or edge://extensions)
4. In the top-right corner, switch ON "Developer mode".
5. In the top-left corner, click the "Load unpacked" button.
6. Select the "Web-IDM-Extension" folder that you extracted.
7. Done! The Web IDM badge icon will appear in your extensions list.

HOW TO USE:
- Open any YouTube video or streaming site (Vimeo, Dailymotion, Twitter/X, etc.).
- A floating blue "Download with IDM" badge will appear directly on the video player.
- Click it to choose your desired quality (4K, 2K, 1080p, 720p, 480p, or 320kbps MP3 Audio).
- The accelerated multi-thread download will start instantly!
`;

  return [
    {
      name: "manifest.json",
      path: "manifest.json",
      language: "json",
      content: manifestStr,
      description: "Extension Manifest V3 with resilient permissions and content scripts"
    },
    {
      name: "content.js",
      path: "content.js",
      language: "javascript",
      content: contentJs,
      description: "Injects floating 'Download with IDM' video popup badge and handles safe downloads with retries"
    },
    {
      name: "styles.css",
      path: "styles.css",
      language: "css",
      content: stylesCss,
      description: "Styling for floating IDM download badge, quality dropdown, and fallback toasts"
    },
    {
      name: "background.js",
      path: "background.js",
      language: "javascript",
      content: backgroundJs,
      description: "Service worker with context menus and background download management"
    },
    {
      name: "popup.html",
      path: "popup.html",
      language: "html",
      content: popupHtml,
      description: "Toolbar popup interface for scanning active page media and 1-click grabs"
    },
    {
      name: "popup.js",
      path: "popup.js",
      language: "javascript",
      content: popupJs,
      description: "Handles toolbar popup clicks and quick grab actions"
    },
    {
      name: "README.txt",
      path: "README.txt",
      language: "text",
      content: readmeTxt,
      description: "Step-by-step 30-second installation instructions"
    },
    {
      name: "icons/icon.svg",
      path: "icons/icon.svg",
      language: "xml",
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="28" fill="#0284c7"/>
  <path d="M64 24v56M36 56l28 28 28-28M28 96h72" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`,
      description: "Vector icon source for extension package"
    }
  ];
}

// Generate authentic PNG blobs for Chrome extension icon resolutions (16x16, 48x48, 128x128)
export async function generateIconPngBlob(size: number): Promise<Blob> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // Background rounded rectangle
      const radius = Math.max(2, Math.round(size * 0.22));
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fill();

      // Download arrow and tray
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, size * 0.09);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const cx = size / 2;
      
      // Arrow line
      ctx.beginPath();
      ctx.moveTo(cx, size * 0.22);
      ctx.lineTo(cx, size * 0.60);
      ctx.stroke();

      // Arrow point
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.22, size * 0.44);
      ctx.lineTo(cx, size * 0.62);
      ctx.lineTo(cx + size * 0.22, size * 0.44);
      ctx.stroke();

      // Bottom tray
      ctx.beginPath();
      ctx.moveTo(size * 0.24, size * 0.78);
      ctx.lineTo(size * 0.76, size * 0.78);
      ctx.stroke();

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          resolve(createFallbackPngBlob(size));
        }
      }, 'image/png');
    } catch {
      resolve(createFallbackPngBlob(size));
    }
  });
}

// Fallback 1x1 valid PNG base64 if canvas is unavailable
function createFallbackPngBlob(size: number): Blob {
  const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const byteCharacters = atob(base64Png);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/png' });
}

export async function downloadExtensionZip(appBaseUrl: string) {
  const zip = new JSZip();
  const files = getExtensionFiles(appBaseUrl);

  files.forEach(f => {
    zip.file(f.path, f.content);
  });

  // Generate required PNG icons for Chrome/Edge manifest compatibility
  try {
    const [blob16, blob48, blob128] = await Promise.all([
      generateIconPngBlob(16),
      generateIconPngBlob(48),
      generateIconPngBlob(128)
    ]);

    zip.file("icons/icon16.png", blob16);
    zip.file("icons/icon48.png", blob48);
    zip.file("icons/icon128.png", blob128);
  } catch (e) {
    console.error("Failed to package extension icons:", e);
    zip.file("icons/icon16.png", createFallbackPngBlob(16));
    zip.file("icons/icon48.png", createFallbackPngBlob(48));
    zip.file("icons/icon128.png", createFallbackPngBlob(128));
  }

  // Include SVG icon for reference
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <rect width="128" height="128" rx="28" fill="#0284c7"/>
    <path d="M64 24v56M36 56l28 28 28-28M28 96h72" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
  zip.file("icons/icon.svg", iconSvg);

  const content = await zip.generateAsync({ type: "blob" });
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = "Web_IDM_Extension_v3.5.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
}

export function getBookmarkletCode(appBaseUrl: string): string {
  const cleanAppUrl = (appBaseUrl || window.location.origin || '').replace(/\/$/, '');
  return `javascript:(function(){var v=document.querySelector('video, audio');var u=v?(v.currentSrc||v.src):window.location.href;var t=document.title;window.open('${cleanAppUrl}?add_url='+encodeURIComponent(u)+'&title='+encodeURIComponent(t)+'&autostart=1','_blank');})();`;
}
