import crypto from "crypto";
import fs from "fs";
import path from "path";

import { uploadBuffer } from "../storage.js";
import { compressThumbnail, compressBanner, extractDominantColor } from "../compress.js";
import { fetchPodcastTopics, pickPodcastTopic } from "./topics.js";
import { getLatestInfo, generatePodcastScript } from "./creator.js";
import { generatePodcastSpeech } from "./audio.js";
import { generatePodcastThumbnail, generatePodcastBanner } from "./images.js";

const TMP_ROOT = path.resolve("tmp/podcast");
const BACKUP_FILE = path.join(TMP_ROOT, "_backup.json");
const CLOUDINARY_ROOT = "elixpochat/podcast";

function ensureTmp() {
  if (!fs.existsSync(TMP_ROOT)) fs.mkdirSync(TMP_ROOT, { recursive: true });
}

function cleanupTmp() {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  console.log("🧹 Cleaned up tmp/podcast/");
}

function logBackup(state) {
  ensureTmp();
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(state, null, 2), "utf-8");
}

function loadBackup() {
  if (!fs.existsSync(BACKUP_FILE)) return null;
  return JSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
}

function writeMetadata(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function generatePodcastId(podcastName) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return crypto.createHash("sha256").update(`${timestamp}_${podcastName}`).digest("hex").slice(0, 16);
}

/**
 * Run the full podcast generation pipeline.
 * @param {D1Database} db - Cloudflare D1 database
 */
export async function runPodcastPipeline(db) {
  console.log("🎙️ Starting podcast pipeline...");
  ensureTmp();

  let backup = loadBackup();
  let podcastId, topicName, topicSource, podcastScript;

  if (backup && backup.status) {
    podcastId = backup.podcast_id;
    topicName = backup.topic_name;
    topicSource = backup.topic_source;
    podcastScript = backup.podcast_script;
    console.log("🗂️ Resumed from backup.");
  } else {
    const topics = await fetchPodcastTopics();
    if (!topics.length) {
      console.log("⚠️ No trending topics found.");
      return;
    }

    const picked = await pickPodcastTopic(topics);
    topicName = (picked.podcast_title || "").replace(/,/g, " ").trim();
    topicSource = picked.source_url || "";
    podcastId = generatePodcastId(topicName);

    backup = {
      podcast_id: podcastId,
      topic_name: topicName,
      topic_source: topicSource,
      status: "topic_stored",
    };
    logBackup(backup);
    console.log(`📌 Topic: ${topicName} | ID: ${podcastId}`);
  }

  // Step 1: Script
  if (backup.status === "topic_stored") {
    console.log("📝 Generating podcast script...");
    const info = await getLatestInfo(topicName);
    podcastScript = await generatePodcastScript(info, topicName);
    backup.podcast_script = podcastScript;
    backup.status = "script_generated";

    fs.writeFileSync(path.join(TMP_ROOT, "script.txt"), podcastScript, "utf-8");
    logBackup(backup);
    console.log("✅ Script generated.");
  }

  // Step 2: Thumbnail + Banner (after topic is decided)
  if (backup.status === "script_generated") {
    console.log("🎨 Generating images...");

    const rawThumb = await generatePodcastThumbnail(topicName);
    const thumbBuffer = compressThumbnail(rawThumb, path.join(TMP_ROOT, "thumbnail"));
    fs.writeFileSync(path.join(TMP_ROOT, "thumbnail.jpg"), thumbBuffer);
    const thumbUrl = await uploadBuffer(thumbBuffer, CLOUDINARY_ROOT, "thumbnail");

    const rawBanner = await generatePodcastBanner(topicName);
    const bannerBuffer = compressBanner(rawBanner, path.join(TMP_ROOT, "banner"));
    fs.writeFileSync(path.join(TMP_ROOT, "banner.jpg"), bannerBuffer);
    const bannerUrl = await uploadBuffer(bannerBuffer, CLOUDINARY_ROOT, "banner");

    // Extract gradient color from banner
    const gradientColor = extractDominantColor(bannerBuffer, path.join(TMP_ROOT, "banner_color"));

    backup.thumbnail_url = thumbUrl;
    backup.banner_url = bannerUrl;
    backup.gradient_color = gradientColor;
    backup.status = "images_uploaded";
    logBackup(backup);
    console.log("✅ Images uploaded.");
  }

  // Step 3: Speech + Transcript
  if (backup.status === "images_uploaded") {
    console.log("🔊 Generating speech...");
    const { buffer: speechBuffer, transcript } = await generatePodcastSpeech(podcastScript || backup.podcast_script);

    fs.writeFileSync(path.join(TMP_ROOT, "audio.mp3"), speechBuffer);
    fs.writeFileSync(path.join(TMP_ROOT, "transcript.json"), JSON.stringify(transcript, null, 2));

    const audioUrl = await uploadBuffer(speechBuffer, CLOUDINARY_ROOT, "audio", "video");
    const transcriptUrl = await uploadBuffer(Buffer.from(JSON.stringify(transcript)), CLOUDINARY_ROOT, "transcript", "raw");

    backup.audio_url = audioUrl;
    backup.transcript_url = transcriptUrl;
    backup.status = "audio_uploaded";
    logBackup(backup);
    console.log("✅ Speech + transcript uploaded.");
  }

  // Step 4: Save to D1 + write metadata
  if (backup.status === "audio_uploaded") {
    console.log("💾 Saving to database...");

    await db
      .prepare(
        "INSERT OR REPLACE INTO podcasts (id, podcast_name, podcast_audio_url, podcast_music_url, podcast_transcript_url, podcast_thumbnail_url, podcast_banner_url, topic_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(podcastId, topicName, backup.audio_url, "", backup.transcript_url || "", backup.thumbnail_url, backup.banner_url, topicSource)
      .run();

    const statsData = JSON.stringify({
      latestPodcastID: podcastId,
      latestPodcastName: topicName,
      latestPodcastThumbnail: backup.thumbnail_url,
      latestPodcastBanner: backup.banner_url,
      gradientColor: backup.gradient_color,
    });
    await db.prepare("INSERT OR REPLACE INTO gen_stats (key, data) VALUES (?, ?)").bind("podcast", statsData).run();

    // Write full metadata to tmp
    // Get duration from the transcript segments
    let duration = null;
    try {
      const transcriptData = JSON.parse(fs.readFileSync(path.join(TMP_ROOT, "transcript.json"), "utf-8"));
      if (transcriptData.segments?.length) {
        duration = Math.ceil(transcriptData.segments[transcriptData.segments.length - 1].end);
      }
    } catch { /* ignore */ }

    writeMetadata(path.join(TMP_ROOT, "metadata.json"), {
      id: podcastId,
      name: topicName,
      source: topicSource,
      date: new Date().toISOString(),
      timestamp: Math.floor(Date.now() / 1000),
      audio_url: backup.audio_url,
      transcript_url: backup.transcript_url,
      thumbnail_url: backup.thumbnail_url,
      banner_url: backup.banner_url,
      gradient_color: backup.gradient_color,
      description: `AI-generated podcast about: ${topicName}`,
      duration,
    });

    // cleanupTmp();
    backup.status = "complete";
    console.log("✅ Podcast pipeline complete!");
  }
}
