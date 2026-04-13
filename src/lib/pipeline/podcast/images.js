import { chatCompletion, generateImage } from "../pollinations.js";
import { MODELS } from "../config.js";

export async function generatePodcastThumbnail(topic) {
  console.log("🎨 Generating thumbnail prompt...");
  const prompt = await chatCompletion({
    model: MODELS.promptWriter,
    messages: [
      {
        role: "system",
        content:
          "You're a prompt engineer for AI image generation. Given a podcast topic, create a visually stunning oil-painting-style thumbnail description. " +
          "The image must feature a cool, stylized mascot character — an anthropomorphic animal or a sleek abstract figure — that embodies the topic's vibe. " +
          "The mascot should feel like a podcast brand icon: friendly, expressive, memorable, with personality. " +
          "Style: rich oil painting, warm saturated colors, dramatic lighting, painterly brushstrokes, glowing highlights. " +
          "The mascot should be centered, eye-catching, and set against a moody background that hints at the topic's theme. " +
          "No text, no logos, no realistic human faces. " +
          "Output only a single sentence, about 30-40 words.",
      },
      { role: "user", content: topic },
    ],
    seed: 111,
  });
  console.log("🎨 Generating podcast thumbnail image...");
  return generateImage({
    prompt: `${prompt} -- oil painting style -- rich colors -- dramatic lighting -- 1:1 square`,
    width: 512,
    height: 512,
    model: MODELS.imageGen,
    seed: 111,
  });
}

export async function generatePodcastBanner(topic) {
  console.log("🖼️ Generating banner prompt...");
  const prompt = await chatCompletion({
    model: MODELS.promptWriter,
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
    model: MODELS.imageGen,
    seed: 222,
  });
}
