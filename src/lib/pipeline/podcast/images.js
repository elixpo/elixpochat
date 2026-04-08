import { chatCompletion, generateImage } from "../pollinations.js";
import fs from "fs";
/**
 * Generate a visual prompt for podcast images.
 * @param {"thumbnail"|"banner"} imageType
 */
export async function generateVisualPrompt(topic, imageType) {
  const systemPrompts = {
    thumbnail:
      "You're a prompt engineer for AI image generation. Given a podcast title or topic, craft a striking thumbnail description in a short sentence. " +
      "The output should be visually bold and conceptually relevant to the topic. " +
      "Avoid generic robotic faces or tech blobs. Instead, understand the topic and hint at metaphors or symbols like colorful microphones, headphones, " +
      "scenes from the theme (e.g., astronomy, gaming), or artistic interpretations that would attract a viewer. " +
      "Make it pop: use vivid adjectives, 'illustration', 'vector art', 'vibrant colors', and strong contrast. Avoid all text or logos. " +
      "Output only a single sentence, about 30 words, no formatting or lists.",
    banner:
      "You're a visual prompt generator for AI art. Given a podcast topic, produce a realistic, serene, oil-painting-style scene in a short sentence suitable for a cinematic banner (1280x720). " +
      "Focus on atmosphere, lighting, and visual clarity — avoid clutter or text. Use phrases like 'oil painting', 'cinematic lighting', 'soft focus', or 'Tyndall effect'. " +
      "Produce a single, clear image description in 30 words, no markdown formatting or overheads.",
  };

  return chatCompletion({
    model: "openai-fast",
    messages: [
      { role: "system", content: systemPrompts[imageType] },
      { role: "user", content: topic },
    ],
    seed: Math.floor(Math.random() * 999999),
  });
}

/**
 * Generate podcast thumbnail (512x512).
 * @returns {Buffer}
 */
export async function generatePodcastThumbnail(topic) {
  console.log("🎨 Generating thumbnail prompt...");
  const prompt = await chatCompletion({
    model: "openai-fast",
    messages: [
      {
        role: "system",
        content:
          "You're a prompt engineer for AI image generation. Given a podcast title or topic, craft a striking thumbnail description. " +
          "The output should be visually bold, iconic, and conceptually relevant. " +
          "Use metaphors and symbols — colorful microphones, headphones, abstract shapes from the theme. " +
          "Style: vibrant vector illustration, flat design, strong contrast, minimal but meaningful. No text, no faces, no logos. " +
          "Output only a single sentence, about 30 words.",
      },
      { role: "user", content: topic },
    ],
    seed: 111,
  });
  console.log("🎨 Generating podcast thumbnail image...");
  return generateImage({
    prompt: `${prompt} -- vector illustration -- vibrant colors -- 1:1 square icon`,
    width: 512,
    height: 512,
    model: "flux",
    seed: 111,
  });
}

/**
 * Generate podcast banner (1280x720).
 * @returns {Buffer}
 */
export async function generatePodcastBanner(topic) {
  console.log("🖼️ Generating banner prompt...");
  const prompt = await chatCompletion({
    model: "openai-fast",
    messages: [
      {
        role: "system",
        content:
          "You're a visual prompt generator for AI art. Given a podcast topic, produce a cinematic, atmospheric scene for a wide banner (1280x720). " +
          "Style: realistic oil painting, soft golden-hour lighting, Tyndall effect, depth of field. " +
          "Focus on mood and setting — a real-world scene that captures the feeling of the topic. " +
          "No text, no people close-up, no clutter. Think serene, immersive, cinematic. " +
          "Output only a single sentence, about 30 words.",
      },
      { role: "user", content: topic },
    ],
    seed: 222,
  });
  console.log("🖼️ Generating podcast banner image...");
  return generateImage({
    prompt: `${prompt} -- oil painting -- cinematic -- 16:9 landscape`,
    width: 1280,
    height: 720,
    model: "flux",
    seed: 222,
  });
}

generatePodcastBanner("Decoding The Vibe: Social Media's New Blame Game").then((buffer) => {
  const outPath = "podcast_banner_test.jpg";
  console.log("🖼️ Generating podcast banner...");
  fs.writeFileSync(outPath, buffer);
  console.log(`🖼️ Banner saved → ${outPath} (${buffer.length} bytes)`);
});

generatePodcastThumbnail("Decoding The Vibe: Social Media's New Blame Game").then((buffer) => {
  const outPath = "podcast_thumbnail_test.jpg";
  console.log("🎨 Generating podcast thumbnail...");
  fs.writeFileSync(outPath, buffer);
  console.log(`🎨 Thumbnail saved → ${outPath} (${buffer.length} bytes)`);
});