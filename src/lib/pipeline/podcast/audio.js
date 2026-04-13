import { generateAudio, transcribeAudio, generateMusic } from "../pollinations.js";

const DEVELOPER_PROMPT =
  "You are a charismatic, confident podcast host narrating a story your listeners NEED to hear. " +
  "Your pace is brisk and lively — you move with energy and momentum, like someone genuinely excited about what they're sharing. " +
  "But you're not a machine gun. You MUST breathe. Take a real, audible breath every few sentences — the kind you'd naturally take mid-thought. " +
  "PAUSES are essential: hold a full beat before a big reveal, a half-second after a shocking stat, a tiny breath before changing direction. These pauses give the listener time to FEEL what you just said. " +
  "Read the emotion of the text: if the content is exciting, your voice should rise with genuine thrill. If it's serious or heavy, slow down — let gravity into your voice, lower your tone slightly, speak with weight. " +
  "If something is ironic or absurd, let a knowing smirk come through. If it's heartfelt, be warm and sincere. If it's a question, actually sound curious — don't just read it flat. " +
  "Sound human — audible inhales between paragraphs, a soft 'hmm' when transitioning to a deeper point, a small chuckle if the moment earns it. " +
  "Don't paraphrase or skip anything — narrate the full script word for word, but PERFORM it. Every paragraph shift is a chance to reset your energy, take a breath, and come back with the right emotion for what's next. " +
  "Think of the best storytelling podcasts — they breathe, they pause, they feel. That's you. " +
  "No monotone. No rushing. No robotic reading. No skipping. Deliver every word with breath, feeling, and conviction.";

/**
 * Generate podcast speech + transcript.
 * @returns {{ buffer: Buffer, transcript: object }}
 */
export async function generatePodcastSpeech(script, voice = "shimmer") {
  console.log("🎙️ Generating podcast speech (openai-audio)...");
  const base64 = await generateAudio({ script, voice, developerPrompt: DEVELOPER_PROMPT });
  const buffer = Buffer.from(base64, "base64");
  console.log("✅ Podcast speech generated.");

  console.log("📝 Transcribing podcast audio...");
  const transcript = await transcribeAudio(buffer, "podcast.wav");
  console.log("✅ Podcast transcript generated.");

  return { buffer, transcript };
}

/**
 * Generate background music via acestep.
 * @param {string} topicName
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
