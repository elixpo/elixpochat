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
 * Parse the tagged script into sections.
 * Returns array of { type: "male"|"female"|"image", content: string }
 */
export function parseScript(raw) {
  const sections = [];
  const tagRegex = /\[(MALE|FEMALE|IMAGE:[^\]]*)\]/gi;
  let lastIndex = 0;
  let currentVoice = "female";
  let match;

  while ((match = tagRegex.exec(raw)) !== null) {
    const textBefore = raw.slice(lastIndex, match.index).trim();
    if (textBefore) {
      sections.push({ type: currentVoice, content: textBefore });
    }

    const tag = match[1];
    if (tag.toUpperCase() === "MALE") {
      currentVoice = "male";
    } else if (tag.toUpperCase() === "FEMALE") {
      currentVoice = "female";
    } else if (tag.toUpperCase().startsWith("IMAGE:")) {
      sections.push({ type: "image", content: tag.slice(6).trim() });
    }

    lastIndex = tagRegex.lastIndex;
  }

  const remaining = raw.slice(lastIndex).trim();
  if (remaining) {
    sections.push({ type: currentVoice, content: remaining });
  }

  return sections;
}

function cleanScript(raw) {
  return raw
    .replace(/\n{3,}/g, "\n")
    .replace(/^\s+|\s+$/gm, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function generatePodcastScript(infoMarkdown, topicName) {
  console.log("⏳ Generating podcast script...");
  const now = new Date().toISOString();
  const systemPrompt =
    "You are a podcast scriptwriter for the 'Elixpo Podcast' — a two-host show with a MALE and FEMALE host. " +
    `Current date: ${now}. Mention the date if relevant. ` +
    "Write a natural, conversational script where both hosts take turns. Use these tags to mark who speaks:\n" +
    "  [MALE] — before the male host's lines\n" +
    "  [FEMALE] — before the female host's lines\n" +
    "  [IMAGE:description] — insert exactly 5 of these throughout the script to trigger carousel images. The description should be a short 15-20 word visual scene related to what's being discussed at that moment.\n\n" +
    "Rules:\n" +
    "- Alternate between [MALE] and [FEMALE] naturally, like a real conversation — one host says 2-4 sentences, then the other responds.\n" +
    "- The FEMALE host opens with a warm welcome to Elixpo Podcast and introduces the topic.\n" +
    "- The MALE host jumps in with excitement and they riff off each other.\n" +
    "- Place [IMAGE:...] tags at 5 evenly spaced moments — after an interesting point, before a transition, or during a vivid description.\n" +
    "- Sprinkle natural fillers: 'umm', 'hmm', 'you know', 'right?', 'I mean', 'okay so'.\n" +
    "- Keep sentences short and punchy — this is spoken, not written.\n" +
    "- CRITICAL: Output ONLY the spoken words with tags. NO markdown, NO bold, NO asterisks, NO stage directions, NO parentheticals.\n" +
    "- Script should be 900-1100 words total (both hosts combined) for ~5 minutes of audio.\n" +
    "- End with both hosts wrapping up together naturally.";

  const raw = await chatCompletion({
    model: MODELS.scriptWriter,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Based on this content about '${topicName}':\n\n${infoMarkdown}\n\nWrite a two-host podcast script of 900-1100 words with [MALE], [FEMALE], and exactly 5 [IMAGE:...] tags.`,
      },
    ],
    seed: Math.floor(Math.random() * 1000),
  });

  if (!raw) throw new Error("Podcast script generation returned empty");

  const script = cleanScript(raw);
  const sections = parseScript(script);
  const speechSections = sections.filter((s) => s.type !== "image");
  const imageSections = sections.filter((s) => s.type === "image");
  const wordCount = speechSections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0);

  console.log(`✅ Script: ${wordCount} words, ${speechSections.length} speech sections, ${imageSections.length} images`);
  return { script, sections };
}
