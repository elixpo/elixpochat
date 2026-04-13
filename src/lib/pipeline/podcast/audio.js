import { generateAudio, transcribeAudio } from "../pollinations.js";
import { compressAudio } from "../compress.js";
import { PODCAST_TTS_PROMPT, PODCAST_VOICE } from "../config.js";
import path from "path";

const TMP = path.resolve("tmp/podcast");

/**
 * Generate podcast speech + transcript.
 * Compresses WAV→MP3, transcribes, returns both.
 * @returns {{ buffer: Buffer, transcript: object }}
 */
export async function generatePodcastSpeech(script, voice = PODCAST_VOICE) {
  console.log("🎙️ Generating podcast speech...");
  const base64 = await generateAudio({ script, voice, developerPrompt: PODCAST_TTS_PROMPT });
  const rawBuffer = Buffer.from(base64, "base64");

  const buffer = compressAudio(rawBuffer, path.join(TMP, "speech"));
  console.log(`✅ Podcast speech compressed (${(buffer.length / 1024).toFixed(0)}KB)`);

  console.log("📝 Transcribing podcast audio...");
  const transcript = await transcribeAudio(buffer, "podcast.mp3");
  console.log(`✅ Transcript: ${transcript.segments?.length || 0} segments`);

  return { buffer, transcript };
}
