import { generateAudio, transcribeAudio } from "../pollinations.js";
import { compressAudio } from "../compress.js";
import { PODCAST_TTS_PROMPT, PODCAST_VOICE } from "../config.js";
import path from "path";

const TMP = path.resolve("tmp/podcast");

/**
 * Generate podcast speech + transcript.
 * Compresses WAV→MP3, transcribes, returns both.
 * @returns {{ buffer: Buffer, transcript: object }}
 */
export async function generatePodcastSpeech(script, voice = PODCAST_VOICE) {
  console.log("🎙️ Generating podcast speech...");
  const base64 = await generateAudio({ script, voice, developerPrompt: PODCAST_TTS_PROMPT });
  const rawBuffer = Buffer.from(base64, "base64");

  const buffer = compressAudio(rawBuffer, path.join(TMP, "speech"));
  console.log(`✅ Podcast speech compressed (${(buffer.length / 1024).toFixed(0)}KB)`);

  // console.log("📝 Transcribing podcast audio...");
  // const transcript = await transcribeAudio(buffer, "podcast.mp3");
  // console.log(`✅ Transcript: ${transcript.segments?.length || 0} segments`);

  // return { buffer, transcript };
}


generatePodcastSpeech("Welcome to the Elixpo Podcast, and today we’re taking a front-row seat to a story about the Chilean sky and a brand-new telescope that just unveiled the cosmos in a way we’ve never really seen before. It’s April 13th, 2026, and yes, out in Chile, on a high, quiet slope called Cerro Pachón, astronomers have been waiting for this moment—because this isn’t just “a new photo.” This is the first release of images from the Vera C. Rubin Observatory, and the images are already being described as unprecedented in detail. Imagine standing in a museum where you’ve seen every painting through a soft, slightly foggy glass… and then, all at once, the glass clears. The distant galaxies snap into sharper focus. The cosmic neighborhoods start to look like neighborhoods, not smudges. And—perhaps most exciting—thousands of new asteroids are showing up, as if the night sky just opened a drawer and spilled its contents onto our doorstep. So, what exactly is Rubin, and why does this week’s release feel like a milestone so huge it almost sounds unbelievable? Well, the observatory combines the world’s largest digital camera with an 8.4-meter telescope, and that camera isn’t like the old “take one picture, save one picture” approach. It’s built for sweeping the sky, repeatedly, systematically, like a time-lapse filmmaker who never gets tired. The first images include vivid views of the Virgo Cluster, which is one of the major galaxy gatherings in our local cosmic neighborhood. And then there are these breathtaking glimpses of star-forming regions like the Trifid and Lagoon Nebulae—places about 9,000 light-years away where gas and dust are actively birthing new stars. ")