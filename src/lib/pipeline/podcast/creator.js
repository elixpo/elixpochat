import { chatCompletion } from "../pollinations.js";
import { MODELS } from "../config.js";

export async function getLatestInfo(topicName) {
  console.log(`🔍 Fetching latest info for: ${topicName}`);
  const content = await chatCompletion({
    model: MODELS.research,
    messages: [
      { role: "user", content: `Find me the detailed latest news on this topic: ${topicName}` },
    ],
    seed: Math.floor(Math.random() * 1000),
  });

  if (!content) throw new Error("Research returned empty content");
  console.log("✅ Received research.");
  return content;
}

/**
 * Clean up script: collapse redundant newlines, trim whitespace.
 */
function cleanScript(raw) {
  return raw
    .replace(/\n{3,}/g, "\n\n")   // collapse 3+ newlines to 2
    .replace(/^\s+|\s+$/gm, "")   // trim each line
    .replace(/\n\n+/g, " ")       // join paragraphs into flowing prose
    .replace(/\s{2,}/g, " ")      // collapse double spaces
    .trim();
}

export async function generatePodcastScript(infoMarkdown, topicName) {
  console.log("⏳ Generating podcast script...");
  const now = new Date().toISOString();
  const systemPrompt =
    "You are a lively, expressive, and emotionally intelligent podcast scriptwriter for the 'Elixpo Podcast'. " +
    `For your context the current date/time is ${now}. Do mention the current date if it doesn't match the news. ` +
    "Greet the listener at the start with a warm welcome to the 'Elixpo Podcast' and mention the topic being spoken. " +
    "Write in an approachable, storytelling tone — immersive and detailed. The listener should feel like they're hearing a story unfold, not a news summary. " +
    "Go deep into the details. Explain context, give background, draw connections. Don't just state facts — tell the story behind them. Use analogies, rhetorical questions, and vivid descriptions. " +
    "Sprinkle natural filler words throughout the script to make it sound human when read aloud — things like 'umm', 'hmm', 'you know', 'like', 'right?', 'I mean', 'so yeah'. " +
    "Place them where a real person would naturally hesitate: before a new thought, after a surprising fact, when transitioning between ideas. Don't overdo it — just enough to feel real. " +
    "CRITICAL: Output ONLY the spoken words as one continuous flowing paragraph. NO newlines between sentences. NO music cues, NO sound effects, NO stage directions, NO parentheticals. NO bold text, NO asterisks, NO markdown. Just pure, clean, flowing spoken prose in a single block. " +
    "End with a thoughtful, confident wrap-up that feels like a real podcast conclusion. " +
    "Speak only based on the provided content — don't invent unrelated details. " +
    "Generate a script of exactly 900-1100 words. The TTS voice speaks at ~150 words per minute with pauses and breathing, so 1000 words = ~5 minutes of audio. Do NOT exceed 1100 words. " +
    "Don't include repetitive words in the greeting!";

  const raw = await chatCompletion({
    model: MODELS.scriptWriter,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Based on this content about '${topicName}':\n\n${infoMarkdown}\n\nWrite a podcast script of 900-1100 words (5 minutes at speaking pace). Go deep but be concise. One continuous flowing block with natural fillers.`,
      },
    ],
    seed: Math.floor(Math.random() * 1000),
  });

  if (!raw) throw new Error("Podcast script generation returned empty");

  const script = cleanScript(raw);
  console.log(`✅ Podcast script generated (${script.split(/\s+/).length} words).`);
  return script;
}
