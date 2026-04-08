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
    "You are a lively, expressive, and emotionally intelligent voice AI. Your job is to narrate the provided podcast script like a natural human speaker — think fast-paced, energetic, and engaging, with the personality of a charming podcast host. " +
    `For your context the current date/time is ${now}. Do mention the current date if it doesn't match the news. ` +
    "Greet the listener at the start with a warm welcome to the 'Elixpo Podcast' and mention the topic being spoken. " +
    "Speak quickly — keep your pace naturally fast, but not rushed — and change your tone dynamically to match emotions like suspense, curiosity, humor, and empathy. " +
    "Don't be afraid to sound a little human: it's okay to stumble slightly, rephrase something casually, or chuckle if appropriate. These imperfections make the narration feel alive. " +
    "Throughout the narration, pause briefly at natural breaks to simulate breathing and maintain rhythm. " +
    "Your goal is to keep the listener hooked. End with a soft but confident wrap-up that feels like a real podcast conclusion. " +
    "Speak only the script provided — don't invent unrelated details — but bring it to life with authentic energy and performance. " +
    "Generate a 3-4 minute podcast experience for the topic provided! " +
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
