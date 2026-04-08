import fs from "fs";
import path from "path";
import { generateSpeech, generateMusic } from "../pollinations.js";

/**
 * Generate podcast speech audio via elevenlabs TTS.
 * @returns {Buffer} MP3 audio buffer
 */
export async function generatePodcastSpeech(script, voice = "shimmer") {
  console.log("🎙️ Generating podcast speech (elevenlabs)...");
  const buffer = await generateSpeech({ text: script, voice });
  console.log("✅ Podcast speech generated.");
  return buffer;
}

/**
 * Generate background music via acestep.
 * @param {string} topicName - Used to generate a fitting music prompt
 * @param {number} duration - Duration in seconds
 * @returns {Buffer} MP3 audio buffer
 */
export async function generatePodcastMusic(topicName, duration = 60) {
  console.log("🎵 Generating background music (acestep)...");
  const prompt = `Calm, upbeat, lo-fi podcast background music inspired by the theme: ${topicName}. Soft beats, ambient, no vocals.`;
  const buffer = await generateMusic({ prompt, duration });
  console.log("✅ Background music generated.");
  return buffer;
}


generatePodcastMusic("Decoding The Vibe: Social Media's New Blame Game").then((musicBuffer) => {
  const outPath = path.join("podcast_music_test.mp3");
  fs.writeFileSync(outPath, musicBuffer);
  console.log(`🎵 Music saved → ${outPath} (${musicBuffer.length} bytes)`);
});