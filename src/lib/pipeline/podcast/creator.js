import { chatCompletion } from "../pollinations.js";

export async function getLatestInfo(topicName) {
  console.log(`🔍 Fetching latest info for: ${topicName}`);
  const content = await chatCompletion({
    model: "perplexity-fast",
    messages: [
      { role: "user", content: `Find me the detailed latest news on this topic: ${topicName}` },
    ],
    seed: Math.floor(Math.random() * 1000),
  });

  if (!content) throw new Error("perplexity-fast returned empty content");
  console.log("✅ Received info from perplexity-fast.");
  return content;
}

export async function generatePodcastScript(infoMarkdown, topicName) {
  console.log("⏳ Generating podcast script...");
  const now = new Date().toISOString();
  const systemPrompt =
    "You are a lively, expressive, and emotionally intelligent podcast scriptwriter for the 'Elixpo Podcast'. " +
    `For your context the current date/time is ${now}. Do mention the current date if it doesn't match the news. ` +
    "Greet the listener at the start with a warm welcome to the 'Elixpo Podcast' and mention the topic being spoken. " +
    "Write in a crisp, energetic, and approachable tone — fast-paced storytelling with emotional color, warmth, and charm. " +
    "CRITICAL: Output ONLY the spoken words. NO music cues, NO sound effects, NO stage directions, NO parentheticals like '(Intro Music)', '(Sound of...)', '(pause)', '(chuckles)', etc. " +
    "NO bold text, NO asterisks, NO markdown formatting of any kind. Just pure, clean, flowing spoken prose. " +
    "Don't be afraid to sound human — casual rephrases, light humor, rhetorical questions. " +
    "End with a soft but confident wrap-up that feels like a real podcast conclusion. " +
    "Speak only based on the provided content — don't invent unrelated details. " +
    "Generate a 3-4 minute script (1000-1500 words). " +
    "Don't include repetitive words in the greeting!";

  const script = await chatCompletion({
    model: "gemini-fast",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Based on this content about '${topicName}':\n\n${infoMarkdown}\n\nWrite a podcast script of 1000–1500 words (3–4 mins).`,
      },
    ],
    seed: Math.floor(Math.random() * 1000),
  });

  if (!script) throw new Error("Podcast script generation returned empty");
  console.log("✅ Podcast script generated.");
  return script;
}
