import fs from "fs";
import path from "path";
import { generateAudio, transcribeAudio } from "../pollinations.js";
import { compressAudio } from "../compress.js";

const DEVELOPER_PROMPT =
  "Narrate the full script word for word as a charismatic podcast host — brisk but breathing, emotionally expressive, with real pauses before reveals and after big moments, never monotone or robotic, just a human voice that makes every sentence land.";

const TMP = path.resolve("tmp");

/**
 * Generate podcast speech + transcript.
 * Saves audio to tmp/ before transcribing.
 * @returns {{ buffer: Buffer, transcript: object }}
 */
export async function generatePodcastSpeech(script, voice = "shimmer") {
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

  console.log("🎙️ Generating podcast speech (openai-audio)...");
  const base64 = await generateAudio({ script, voice, developerPrompt: DEVELOPER_PROMPT });
  const rawBuffer = Buffer.from(base64, "base64");

  // Compress WAV → MP3 and save to tmp
  const buffer = compressAudio(rawBuffer, "podcast_speech");
  const tmpPath = path.join(TMP, "podcast_speech.mp3");
  fs.writeFileSync(tmpPath, buffer);
  console.log(`✅ Podcast speech saved → ${tmpPath} (${buffer.length} bytes)`);

  // Transcribe (chunked internally if needed)
  console.log("📝 Transcribing podcast audio...");
  const transcript = await transcribeAudio(buffer, "podcast.mp3");
  console.log(`✅ Transcript: ${transcript.segments?.length || 0} segments`);

  return { buffer, transcript };
}

