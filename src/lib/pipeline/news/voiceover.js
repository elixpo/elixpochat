import fs from "fs";
import path from "path";
import { generateAudio, transcribeAudio, chatCompletion } from "../pollinations.js";
import { compressAudio } from "../compress.js";
import { NEWS_TTS_PROMPT } from "../prompts.js";
import { MODELS } from "../config.js";

export async function generateVoiceover(script, newsIndex, voice = "shimmer") {
  const itemDir = path.resolve(`tmp/news/item_${newsIndex}`);
  if (!fs.existsSync(itemDir)) fs.mkdirSync(itemDir, { recursive: true });

  console.log(`🎙️ Generating voiceover for topic ${newsIndex} (${voice})...`);

  let text = script;
  let base64 = null;
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      base64 = await generateAudio({ script: text, voice, developerPrompt: NEWS_TTS_PROMPT });
      break;
    } catch (err) {
      const isContentFilter = err.message?.includes("content management policy") || err.message?.includes("filtered");
      if (!isContentFilter || attempt === maxAttempts - 1) throw err;

      console.warn(`  ⚠️ Content filter hit on topic ${newsIndex}, paraphrasing (attempt ${attempt + 2})...`);
      text = await chatCompletion({
        model: MODELS.promptWriter,
        messages: [
          { role: "system", content: "Rephrase the following text to be completely safe for all audiences. Keep the same meaning and tone but remove anything that could be flagged by a content filter. Keep it the same length. Output only the rephrased text." },
          { role: "user", content: text },
        ],
      });
    }
  }

  const rawBuffer = Buffer.from(base64, "base64");
  const buffer = compressAudio(rawBuffer, path.join(itemDir, "audio"));
  fs.writeFileSync(path.join(itemDir, "audio.mp3"), buffer);
  console.log(`✅ Voiceover saved (${buffer.length} bytes)`);

  console.log(`📝 Transcribing audio for topic ${newsIndex}...`);
  const transcript = await transcribeAudio(buffer, `news${newsIndex}.mp3`);
  console.log(`✅ Transcript: ${transcript.segments?.length || 0} segments`);

  return { buffer, transcript };
}
