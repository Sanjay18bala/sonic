const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

// YouTube search using yt-dlp (no API key needed)
async function searchYouTube(query) {
  return new Promise((resolve, reject) => {
    const { exec } = require("child_process");

    // Use yt-dlp to search YouTube and get video info
    const command = `yt-dlp "ytsearch5:${query}" --print "id,title,uploader,duration,view_count,upload_date,thumbnail" --no-playlist`;

    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error("yt-dlp search error:", error);
        reject(error);
        return;
      }

      if (stderr) {
        console.warn("yt-dlp stderr:", stderr);
      }

      try {
        const lines = stdout.trim().split("\n");
        const results = [];

        for (let i = 0; i < lines.length; i += 7) {
          if (i + 6 < lines.length) {
            const id = lines[i];
            const title = lines[i + 1];
            const uploader = lines[i + 2];
            const duration = lines[i + 3];
            const viewCount = lines[i + 4];
            const uploadDate = lines[i + 5];
            const thumbnail = lines[i + 6];

            if (id && title) {
              results.push({
                id: id.trim(),
                title: title.trim(),
                channelTitle: uploader.trim(),
                thumbnail:
                  thumbnail.trim() ||
                  `https://img.youtube.com/vi/${id.trim()}/default.jpg`,
                duration: duration.trim() || "Unknown",
                viewCount: viewCount.trim()
                  ? `${viewCount.trim()} views`
                  : "Unknown views",
                publishedAt: uploadDate.trim() || "Unknown",
              });
            }
          }
        }

        resolve(results);
      } catch (parseError) {
        console.error("Parse error:", parseError);
        reject(parseError);
      }
    });
  });
}

app.use(cors());
app.use(express.json());

// Serve static files
app.use("/downloads", express.static("downloads"));

// Search YouTube videos using yt-dlp
app.get("/api/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    console.log(`Searching YouTube for: "${query}"`);
    const results = await searchYouTube(query);

    if (results.length === 0) {
      return res.json({ results: [] });
    }

    console.log(`Found ${results.length} results`);
    res.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed. Please try again." });
  }
});

// Download audio from YouTube video
app.post("/api/download", async (req, res) => {
  try {
    const { videoId, title } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required" });
    }

    // Create downloads directory if it doesn't exist
    const downloadsDir = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Generate filename
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `${sanitizedTitle}_${videoId}.mp3`;
    const filepath = path.join(downloadsDir, filename);

    // Download audio using yt-dlp
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const outputPath = path.join(
      downloadsDir,
      `${sanitizedTitle}_${videoId}.%(ext)s`
    );

    const ytdlpCommand = `yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 "${videoUrl}" -o "${outputPath}"`;

    exec(ytdlpCommand, (error, stdout, stderr) => {
      if (error) {
        console.error("Download error:", error);
        res.status(500).json({ error: "Failed to download audio" });
        return;
      }

      // Find the downloaded file
      const files = fs.readdirSync(downloadsDir);
      const downloadedFile = files.find(
        (file) => file.includes(videoId) && file.endsWith(".mp3")
      );

      if (downloadedFile) {
        console.log(`Download completed: ${downloadedFile}`);
        res.json({
          success: true,
          filename: downloadedFile,
          downloadUrl: `http://192.168.0.7:${PORT}/downloads/${downloadedFile}`,
          message: "Audio downloaded successfully",
        });
      } else {
        console.error("Downloaded file not found");
        res.status(500).json({ error: "Downloaded file not found" });
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to process download request" });
  }
});

// Get download status
app.get("/api/download/:videoId/status", (req, res) => {
  const { videoId } = req.params;

  // In a real implementation, you'd track download progress
  // For now, just return a mock status
  res.json({
    videoId,
    status: "completed",
    progress: 100,
    downloadUrl: `http://192.168.0.7:${PORT}/downloads/sample_${videoId}.mp3`,
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`YouTube Downloader Server running on http://localhost:${PORT}`);
  console.log(`Server accessible at http://192.168.0.7:${PORT}`);
  console.log(
    `Downloads will be saved to: ${path.join(process.cwd(), "downloads")}`
  );
  console.log(
    "🎵 Using yt-dlp for YouTube search and download (no API key needed)"
  );
});
