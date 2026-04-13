import dotenv from "dotenv";
dotenv.config();

// ── API ──
export const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY || "";
export const POLLINATIONS_BASE = "https://gen.pollinations.ai";

// ── Cloudinary ──
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

// ── Models ──
export const MODELS = {
  research: "perplexity-fast",
  scriptWriter: "openai",
  promptWriter: "openai-fast",
  audioSpeech: "openai-audio",
  imageGen: "zimage",
  transcription: "whisper",
};

// ── Voices ──
export const NEWS_VOICES = ["shimmer", "ash", "shimmer", "ash", "shimmer", "ash", "shimmer"];
export const PODCAST_VOICE = "shimmer";

// ── Limits ──
export const MAX_NEWS_ITEMS = 7;

// ── Cloudinary paths ──
export const CLOUDINARY_NEWS_ROOT = "elixpochat/news";
export const CLOUDINARY_PODCAST_ROOT = "elixpochat/podcast";

// ── TTS developer prompts ──
export const PODCAST_TTS_PROMPT = "You're talking to a live audience, not reading a script — speak like a real person having a conversation, paraphrase freely, break long sentences into short punchy ones, react genuinely with excitement or curiosity, breathe audibly between thoughts, laugh or go 'huh' or 'wow' when something is surprising, speed up when you're excited and slow down for impact, keep sentences short and rhythmic like natural speech not written prose, absolutely no intro music or outro sound effects or any audio overlay at the start or end just your raw voice from the first word, never say the words 'pause' or 'sigh' or 'breath' out loud just do them naturally, you are an energetic engaging speaker who makes people lean in and listen.";

export const NEWS_TTS_PROMPT = "You're a quick sharp news host delivering stories to real people — speak naturally not like you're reading, paraphrase the script to sound conversational, keep sentences short and direct, react to the content with genuine tone shifts like surprise or urgency, breathe between stories, no intro jingle or outro sound just start talking immediately, never say 'pause' or 'sigh' out loud just let your voice carry the emotion, be fast but clear, warm but punchy, like someone telling you breaking news over coffee.";

// ── Filenames (tmp + cloudinary) ──
export const FILES = {
  news: {
    backup: "_backup.json",
    thumbnail: "thumbnail",
    metadata: "metadata.json",
    item: {
      script: "script.txt",
      banner: "banner",
      audio: "audio",
      transcript: "transcript",
      metadata: "metadata.json",
    },
  },
  podcast: {
    backup: "_backup.json",
    script: "script.txt",
    thumbnail: "thumbnail",
    banner: "banner",
    audio: "audio",
    transcript: "transcript",
    metadata: "metadata.json",
  },
};
