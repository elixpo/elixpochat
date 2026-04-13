import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Compress WAV audio to MP3 using ffmpeg (lossy, good quality).
 * @param {Buffer} wavBuffer - Raw WAV audio
 * @param {string} name - Full path prefix (e.g. /tmp/podcast/speech)
 * @returns {Buffer} Compressed MP3 buffer
 */
export function compressAudio(wavBuffer, name = "audio") {
  const dir = path.dirname(name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const wavPath = `${name}_raw.wav`;
  const mp3Path = `${name}.mp3`;

  fs.writeFileSync(wavPath, wavBuffer);

  try {
    execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 128k -ac 1 "${mp3Path}" 2>/dev/null`);
    const compressed = fs.readFileSync(mp3Path);
    const ratio = ((1 - compressed.length / wavBuffer.length) * 100).toFixed(1);
    console.log(`  🗜️ Audio: ${(wavBuffer.length / 1024 / 1024).toFixed(1)}MB → ${(compressed.length / 1024 / 1024).toFixed(1)}MB (${ratio}% smaller)`);

    fs.unlinkSync(wavPath);
    return compressed;
  } catch {
    console.warn(`  ⚠️ ffmpeg not available, using raw WAV`);
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
    if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
    return wavBuffer;
  }
}

/**
 * Compress image using ffmpeg (lossy JPEG).
 * @param {Buffer} imageBuffer - Raw image bytes
 * @param {string} name - Full path prefix (e.g. /tmp/news/item_0/banner)
 * @returns {Buffer} Compressed JPEG buffer
 */
export function compressImage(imageBuffer, name = "image") {
  const dir = path.dirname(name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const inputPath = `${name}_raw.jpg`;
  const outputPath = `${name}.jpg`;

  fs.writeFileSync(inputPath, imageBuffer);

  try {
    execSync(`ffmpeg -y -i "${inputPath}" -q:v 4 "${outputPath}" 2>/dev/null`);
    const compressed = fs.readFileSync(outputPath);
    const ratio = ((1 - compressed.length / imageBuffer.length) * 100).toFixed(1);
    console.log(`  🗜️ Image: ${(imageBuffer.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB (${ratio}% smaller)`);

    fs.unlinkSync(inputPath);
    return compressed;
  } catch {
    console.warn(`  ⚠️ ffmpeg not available, using raw image`);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    return imageBuffer;
  }
}
