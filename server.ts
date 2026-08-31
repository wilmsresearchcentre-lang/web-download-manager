import express from "express";
import path from "path";
import http from "http";
import https from "https";
import { URL } from "url";
import { spawn } from "child_process";
import ytdl from "yt-dlp-exec";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.use(express.json());

// Enable CORS for all API routes & expose Range and Content headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Range, Content-Type, Authorization, Accept, X-Requested-With"
  );
  res.header(
    "Access-Control-Expose-Headers",
    "Content-Range, Content-Length, Accept-Ranges, Content-Disposition, Content-Type"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Helper to determine media category
function detectCategory(filename: string, mimeType = ""): string {
  const lower = filename.toLowerCase();
  const ext = lower.split(".").pop() || "";
  const mime = mimeType.toLowerCase();

  if (
    ["mp4", "mkv", "webm", "avi", "mov", "flv", "wmv", "m4v", "3gp", "ts"].includes(ext) ||
    mime.startsWith("video/")
  ) {
    return "video";
  }
  if (
    ["mp3", "m4a", "wav", "flac", "aac", "ogg", "wma", "opus"].includes(ext) ||
    mime.startsWith("audio/")
  ) {
    return "audio";
  }
  if (
    ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "dmg"].includes(ext) ||
    mime.includes("zip") ||
    mime.includes("compressed")
  ) {
    return "compressed";
  }
  if (
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv", "md"].includes(ext) ||
    mime.includes("pdf") ||
    mime.includes("document")
  ) {
    return "document";
  }
  if (["exe", "msi", "apk", "app", "deb", "rpm", "bin", "bat", "sh"].includes(ext)) {
    return "software";
  }
  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext) ||
    mime.startsWith("image/")
  ) {
    return "image";
  }
  return "other";
}

function extractFilename(targetUrl: string, contentDisposition?: string): string {
  if (contentDisposition) {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match && utf8Match[1]) {
      return decodeURIComponent(utf8Match[1]);
    }
    const standardMatch = contentDisposition.match(
      /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i
    );
    if (standardMatch && standardMatch[1]) {
      return standardMatch[1].replace(/['"]/g, "").trim();
    }
  }

  try {
    const parsed = new URL(targetUrl);
    const pathname = parsed.pathname;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const last = decodeURIComponent(segments[segments.length - 1]);
      if (last.includes(".")) {
        return last;
      }
      if (last) {
        return `${last}.mp4`;
      }
    }
  } catch {
    // ignore
  }

  return "download_file";
}

// Execute yt-dlp via yt-dlp-exec library with child_process fallback
async function extractMediaInfoWithYtDlp(targetUrl: string): Promise<any> {
  // 1. Try yt-dlp-exec library
  try {
    if (typeof ytdl === "function") {
      const output = await ytdl(targetUrl, {
        dumpSingleJson: true,
        noWarnings: true,
        noCheckCertificates: true,
        preferFreeFormats: true,
        extractorArgs: "youtube:player_client=android,ios,web"
      } as any);

      if (output && typeof output === "object") {
        return output;
      }
    }
  } catch (err: any) {
    console.warn("yt-dlp-exec error, trying direct spawn fallback:", err?.message || err);
  }

  // 2. Direct binary spawn fallback
  return new Promise((resolve, reject) => {
    const args = [
      "--extractor-args",
      "youtube:player_client=android,ios,web",
      "--dump-single-json",
      "--no-warnings",
      "--no-check-certificates",
      targetUrl
    ];

    const child = spawn("yt-dlp", args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          const json = JSON.parse(stdout);
          resolve(json);
        } catch (e: any) {
          reject(new Error(`Failed to parse yt-dlp JSON: ${e.message}`));
        }
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr || stdout}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

// Get direct decrypted media stream URL for a given target video
async function getDirectStreamUrl(
  targetUrl: string,
  formatSelector = "best[ext=mp4]/best"
): Promise<string> {
  // 1. Try yt-dlp-exec
  try {
    if (typeof ytdl === "function") {
      const directUrl = await ytdl(targetUrl, {
        getUrl: true,
        format: formatSelector,
        noWarnings: true,
        noCheckCertificates: true,
        extractorArgs: "youtube:player_client=android,ios,web"
      } as any);

      const directStr = typeof directUrl === "string" ? (directUrl as string) : String(directUrl || "");
      if (directStr && directStr.trim().startsWith("http")) {
        return directStr.trim().split("\n")[0];
      }
    }
  } catch (e: any) {
    console.warn("yt-dlp-exec getUrl failed, trying spawn fallback:", e?.message);
  }

  // 2. Fallback to child process
  return new Promise((resolve, reject) => {
    const args = [
      "--extractor-args",
      "youtube:player_client=android,ios,web",
      "-g",
      "-f",
      formatSelector,
      "--no-warnings",
      "--no-check-certificates",
      targetUrl
    ];

    const child = spawn("yt-dlp", args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      const url = stdout.trim().split("\n")[0];
      if (code === 0 && url && url.startsWith("http")) {
        resolve(url);
      } else {
        reject(new Error(`Failed to extract direct stream URL: ${stderr || stdout}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

// 1. Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    engine: "Web IDM Multi-Threaded Real Network Engine (yt-dlp-exec)",
    timestamp: Date.now()
  });
});

// 2. Real URL probe & metadata extraction endpoint (supports both video platforms & direct URLs)
app.get("/api/probe", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: "URL query parameter is required" });
    return;
  }

  const isVideoPlatform =
    /(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|tiktok\.com|soundcloud\.com|twitter\.com|x\.com)/i.test(
      targetUrl
    );

  if (isVideoPlatform) {
    try {
      const meta = await extractMediaInfoWithYtDlp(targetUrl);
      const title = meta.title || "Online Video Stream";
      const uploader = meta.uploader || meta.channel || "Media Creator";
      const thumbnail = meta.thumbnail || (meta.thumbnails && meta.thumbnails[0]?.url) || "";
      const cleanFilename = `${title.replace(/[/\\?%*:|"<>]/g, "_")}.${meta.ext || "mp4"}`;

      // Filter and map real formats with their direct URLs and sizes
      const rawFormats = meta.formats || [];
      const streamOptions: Array<{
        quality: string;
        format: string;
        size: number;
        directUrl: string;
      }> = [];

      const validStreams = rawFormats.filter(
        (f: any) => f.url && (f.vcodec !== "none" || f.acodec !== "none")
      );

      // Best 1080p / High quality
      const f1080 =
        validStreams.find(
          (f: any) => (f.height === 1080 || f.format_note?.includes("1080")) && f.ext === "mp4"
        ) || validStreams.find((f: any) => f.height >= 1080 && f.url);
      if (f1080) {
        streamOptions.push({
          quality: `${f1080.height || "1080"}p Full HD`,
          format: f1080.ext || "mp4",
          size:
            f1080.filesize ||
            f1080.filesize_approx ||
            Math.round((meta.duration || 180) * 1500000),
          directUrl: f1080.url
        });
      }

      // Best 720p HD
      const f720 =
        validStreams.find(
          (f: any) => (f.height === 720 || f.format_note?.includes("720")) && f.ext === "mp4"
        ) || validStreams.find((f: any) => f.height === 720 && f.url);
      if (f720) {
        streamOptions.push({
          quality: "720p HD",
          format: f720.ext || "mp4",
          size:
            f720.filesize ||
            f720.filesize_approx ||
            Math.round((meta.duration || 180) * 800000),
          directUrl: f720.url
        });
      }

      // 480p / 360p standard
      const f360 =
        validStreams.find((f: any) => f.format_id === "18" || f.height === 360) ||
        validStreams.find((f: any) => f.vcodec !== "none" && f.url);
      if (f360) {
        streamOptions.push({
          quality: `${f360.height || "360"}p SD`,
          format: f360.ext || "mp4",
          size:
            f360.filesize ||
            f360.filesize_approx ||
            Math.round((meta.duration || 180) * 400000),
          directUrl: f360.url
        });
      }

      // Audio-only stream
      const fAudio =
        validStreams.find((f: any) => f.vcodec === "none" && f.acodec !== "none" && f.url) ||
        validStreams.find((f: any) => f.acodec !== "none" && f.url);
      if (fAudio) {
        streamOptions.push({
          quality: `${Math.round(fAudio.abr || 128)}kbps Audio (${fAudio.ext || "m4a"})`,
          format: fAudio.ext || "mp3",
          size:
            fAudio.filesize ||
            fAudio.filesize_approx ||
            Math.round((meta.duration || 180) * 16000),
          directUrl: fAudio.url
        });
      }

      // If no separate stream options extracted, add the top stream
      if (streamOptions.length === 0 && validStreams.length > 0) {
        const top = validStreams[validStreams.length - 1];
        streamOptions.push({
          quality: `${top.height ? top.height + "p" : "Direct Stream"}`,
          format: top.ext || "mp4",
          size:
            top.filesize ||
            top.filesize_approx ||
            (meta.duration ? meta.duration * 500000 : 25000000),
          directUrl: top.url
        });
      }

      const primarySize =
        streamOptions[0]?.size || meta.filesize || meta.filesize_approx || 35000000;

      res.json({
        ok: true,
        url: targetUrl,
        filename: cleanFilename,
        title,
        author: uploader,
        thumbnail,
        mimeType: "video/mp4",
        totalSize: primarySize,
        resumable: true,
        category: "video",
        corsEnabled: true,
        isYouTube: true,
        serverHeader: "Platform Stream Edge (yt-dlp-exec decrypted)",
        streams: streamOptions
      });
      return;
    } catch (ytErr: any) {
      console.warn("yt-dlp-exec probe error, proceeding with standard HTTP probe:", ytErr?.message);
    }
  }

  // Standard Web URL Probe (HEAD request + Range 0-1 inspection)
  try {
    const headRes = await fetch(targetUrl, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 WebIDM/3.2",
        Accept: "*/*"
      },
      redirect: "follow"
    });

    const finalUrl = headRes.url || targetUrl;
    const contentLength = headRes.headers.get("content-length");
    const contentType = headRes.headers.get("content-type") || "application/octet-stream";
    const acceptRanges = headRes.headers.get("accept-ranges");
    const contentDisposition = headRes.headers.get("content-disposition") || undefined;
    const serverHeader = headRes.headers.get("server") || "Standard Web Server";

    const filename = extractFilename(finalUrl, contentDisposition);
    let totalSize = contentLength ? parseInt(contentLength, 10) : 0;
    const isResumable = acceptRanges === "bytes" || totalSize > 0;

    // If HEAD didn't return content-length, verify with Range: bytes=0-1
    if (totalSize === 0) {
      try {
        const rangeCheck = await fetch(targetUrl, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Range: "bytes=0-1",
            Accept: "*/*"
          },
          redirect: "follow"
        });
        const rangeHeader = rangeCheck.headers.get("content-range");
        if (rangeHeader) {
          const match = rangeHeader.match(/\/(\d+)$/);
          if (match && match[1]) {
            totalSize = parseInt(match[1], 10);
          }
        }
      } catch {
        // ignore
      }
    }

    const category = detectCategory(filename, contentType);

    res.json({
      ok: true,
      url: targetUrl,
      finalUrl,
      filename,
      mimeType: contentType,
      totalSize,
      resumable: isResumable,
      category,
      corsEnabled: true,
      serverHeader
    });
  } catch (err: any) {
    // If standard fetch probe fails, try a direct GET range inspection
    try {
      const getRes = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Range: "bytes=0-1",
          Accept: "*/*"
        },
        redirect: "follow"
      });

      const finalUrl = getRes.url || targetUrl;
      const contentRange = getRes.headers.get("content-range");
      let totalSize = 0;
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match && match[1]) totalSize = parseInt(match[1], 10);
      }
      const contentType = getRes.headers.get("content-type") || "application/octet-stream";
      const filename = extractFilename(
        finalUrl,
        getRes.headers.get("content-disposition") || undefined
      );
      const category = detectCategory(filename, contentType);

      res.json({
        ok: true,
        url: targetUrl,
        finalUrl,
        filename,
        mimeType: contentType,
        totalSize,
        resumable: Boolean(contentRange),
        category,
        corsEnabled: true,
        serverHeader: getRes.headers.get("server") || "Direct Media Host"
      });
    } catch (finalErr: any) {
      res.status(500).json({
        ok: false,
        error: `Could not probe URL: ${finalErr.message || "Host unreachable"}`
      });
    }
  }
});

// 3. Endpoint to fetch real, high-quality, decrypted media URLs using yt-dlp-exec
app.get("/api/extract-media", async (req, res) => {
  const targetUrl = req.query.url as string;
  const quality = (req.query.quality as string) || "best";

  if (!targetUrl) {
    res.status(400).json({ ok: false, error: "Target URL is required" });
    return;
  }

  try {
    const meta = await extractMediaInfoWithYtDlp(targetUrl);
    const directUrl = await getDirectStreamUrl(targetUrl, quality === "audio" ? "bestaudio/best" : "best[ext=mp4]/best");

    res.json({
      ok: true,
      title: meta.title,
      uploader: meta.uploader || meta.channel,
      duration: meta.duration,
      thumbnail: meta.thumbnail,
      directUrl,
      formats: (meta.formats || []).map((f: any) => ({
        formatId: f.format_id,
        resolution: f.resolution || (f.height ? `${f.height}p` : undefined),
        ext: f.ext,
        filesize: f.filesize || f.filesize_approx,
        vcodec: f.vcodec,
        acodec: f.acodec,
        url: f.url
      }))
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Failed to extract media" });
  }
});

// 4. Real Streaming Proxy with yt-dlp-exec and full Range header forwarding
app.get("/api/proxy-download", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: "Target URL parameter is required." });
    return;
  }

  const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(targetUrl);

  try {
    let directStreamUrl = targetUrl;

    // Agar YouTube link hai, toh asli video stream (mp4) nikalain
    if (isYouTube) {
      try {
        if (typeof ytdl === "function") {
          const info: any = await ytdl(targetUrl, {
            dumpSingleJson: true,
            format: "best[ext=mp4]/best",
            noWarnings: true,
            noCheckCertificates: true,
            extractorArgs: "youtube:player_client=android,ios,web"
          } as any);
          if (info && info.url) {
            directStreamUrl = info.url;
          }
        }
      } catch (err: any) {
        console.warn("Direct yt-dlp-exec extraction fallback:", err?.message);
        const direct = await getDirectStreamUrl(targetUrl);
        if (direct) directStreamUrl = direct;
      }
    }

    // Client (Frontend) se aane wala Range header
    const range = (req.headers.range as string) || (req.query.range as string);
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Web-IDM-Engine/3.0",
      Accept: "*/*"
    };

    if (range) {
      fetchHeaders["Range"] = range; // Forward chunk request to server
    }

    const response = await fetch(directStreamUrl, {
      headers: fetchHeaders,
      redirect: "follow"
    });

    // Forward real headers back to the browser
    res.status(response.status);
    response.headers.forEach((value, key) => {
      // Exclude problematic hop-by-hop headers
      if (!["content-encoding", "transfer-encoding", "connection"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Ensure CORS and Accept-Ranges are present
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");

    // Stream the actual bytes to the frontend
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.end();
    }
  } catch (error: any) {
    console.error("Download Failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to fetch real stream: " + (error?.message || error) });
    } else {
      res.end();
    }
  }
});

// 5. Web Page Media Sniffer (scrapes live video/audio tags from any website)
app.post("/api/sniff", async (req, res) => {
  const { pageUrl } = req.body;
  if (!pageUrl) {
    res.status(400).json({ error: "pageUrl is required" });
    return;
  }

  try {
    const pageRes = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!pageRes.ok) {
      res.status(pageRes.status).json({ error: `Could not fetch page: ${pageRes.statusText}` });
      return;
    }

    const html = await pageRes.text();
    const mediaUrls: Array<{ url: string; type: string; quality?: string }> = [];

    // Extract video tags
    const videoRegex = /<video[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = videoRegex.exec(html)) !== null) {
      mediaUrls.push({ url: new URL(match[1], pageUrl).href, type: "video/mp4" });
    }

    // Extract source tags
    const sourceRegex = /<source[^>]*src=["']([^"']+)["'][^>]*type=["']([^"']*)["'][^>]*>/gi;
    while ((match = sourceRegex.exec(html)) !== null) {
      mediaUrls.push({ url: new URL(match[1], pageUrl).href, type: match[2] || "video/mp4" });
    }

    // Extract og:video
    const ogVideoRegex = /<meta[^>]*property=["']og:video["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
    while ((match = ogVideoRegex.exec(html)) !== null) {
      mediaUrls.push({ url: new URL(match[1], pageUrl).href, type: "video/mp4" });
    }

    res.json({
      ok: true,
      foundCount: mediaUrls.length,
      media: mediaUrls
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to parse page" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Web IDM Server running at http://${HOST}:${PORT}`);
  });
}

startServer();
