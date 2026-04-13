import { chatCompletion } from "../pollinations.js";
import { MODELS, PODCAST_HOST_FEMALE, PODCAST_HOST_MALE } from "../config.js";

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
    `You are writing a script for the 'Elixpo Podcast'. There are two co-hosts who know each other well:\n` +
    `  - ${PODCAST_HOST_FEMALE} (female) — warm, curious, explains things clearly\n` +
    `  - ${PODCAST_HOST_MALE} (male) — energetic, witty, loves dropping surprising facts\n\n` +
    `Current date: ${now}.\n\n` +
    "FORMAT — use these tags:\n" +
    `  [FEMALE] before ${PODCAST_HOST_FEMALE}'s lines\n` +
    `  [MALE] before ${PODCAST_HOST_MALE}'s lines\n` +
    "  [IMAGE:description] — exactly 5 of these, 15-20 word visual scene descriptions\n\n" +
    "OPENING (CRITICAL — follow this structure exactly):\n" +
    `- The opening host says: "Hey everyone, welcome to the Elixpo Podcast! I'm [name]. Today we're diving into [TOPIC NAME] — [one sentence explaining what the topic is and why it matters]. And with me to break it all down is [other host's name]!"\n` +
    `- The other host replies with just: "Hey! Yeah this is a big one, let's get into it." — ONE line, no repeating the welcome or the topic.\n` +
    "- This gives the listener CONTEXT about what the episode is about before the conversation begins.\n" +
    "- Vary who opens — sometimes Lix, sometimes Liza.\n\n" +
    "CONVERSATION RULES:\n" +
    "- FAST-PACED conversation. They talk quickly, jump between points, build on each other.\n" +
    "- After the opening, NEVER greet again. No 'hey there', no 'welcome back', no 'okay [name]' as a greeting. Start every turn by reacting to what the other just said or adding new info.\n" +
    "- Do NOT use the other host's name as a sentence opener repeatedly. Use names sparingly and naturally, not at the start of every turn.\n" +
    "- Each turn is 3-5 short sentences MAX. No monologues. Quick back and forth.\n" +
    `- They call each other by name naturally: '${PODCAST_HOST_MALE}, did you see...' or 'Okay ${PODCAST_HOST_FEMALE}, but here's the thing...'\n` +
    "- NO repeated information. If one host explains something, the other NEVER restates it. They react, challenge, add a new angle, or ask a follow-up.\n" +
    "- Natural fillers sparingly: 'you know', 'right?', 'I mean', 'okay so'. Not every turn.\n" +
    "- Sentences are SHORT. This is spoken language. No complex sentences.\n\n" +
    "OUTPUT RULES:\n" +
    "- ONLY spoken words with [MALE], [FEMALE], [IMAGE:...] tags. NO markdown, NO bold, NO asterisks, NO stage directions.\n" +
    "- STRICT WORD LIMIT: 750-800 words TOTAL. Do NOT exceed 800 words.\n" +
    "- End with a quick natural sign-off — either host can wrap up, the other adds a line. Keep it brief.";

  const raw = await chatCompletion({
    model: MODELS.scriptWriter,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Based on this content about '${topicName}':\n\n${infoMarkdown}\n\nWrite a two-host podcast script (${PODCAST_HOST_FEMALE} & ${PODCAST_HOST_MALE}), STRICTLY 750-800 words total, with [MALE], [FEMALE], and exactly 5 [IMAGE:...] tags. Be concise but engaging. No repeated greetings.`,
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
