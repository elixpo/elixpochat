import { POLLINATIONS_BASE, POLLINATIONS_API_KEY } from "./config.js";

export async function chatCompletion({ model, messages, json = false, seed, temperature }) {
  const body = { model, messages };
  if (json) body.response_format = { type: "json_object" };
  if (seed !== undefined) body.seed = seed;
  if (temperature !== undefined) body.temperature = temperature;

  const res = await fetch(`${POLLINATIONS_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${POLLINATIONS_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Pollinations chat error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}


export async function generateAudio({ script, voice = "shimmer", developerPrompt }) {
  const body = {
    model: "openai-audio",
    modalities: ["text", "audio"],
    audio: { voice, format: "wav" },
    messages: [
      { role: "developer", content: developerPrompt },
      { role: "user", content: script },
    ],
  };

  const res = await fetch(`${POLLINATIONS_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${POLLINATIONS_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Pollinations audio error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const base64Audio = data.choices?.[0]?.message?.audio?.data;
  if (!base64Audio) throw new Error("No audio data returned");
  return base64Audio;
}


/**
 * Text-to-speech via elevenlabs model (GET /audio/{text}).
 * Returns raw audio buffer (mp3).
 */
export async function generateSpeech({ text, voice = "shimmer" }) {
  const encoded = encodeURIComponent(text);
  const url = `${POLLINATIONS_BASE}/audio/${encoded}?voice=${voice}&model=elevenlabs&key=${POLLINATIONS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Speech gen error ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Music generation via acestep model (GET /audio/{text}).
 * @param {string} prompt - Music description or lyrics
 * @param {number} duration - Duration in seconds (default 30)
 * Returns raw audio buffer (mp3).
 */
export async function generateMusic({ prompt, duration = 30 }) {
  const encoded = encodeURIComponent(prompt);
  const url = `${POLLINATIONS_BASE}/audio/${encoded}?model=acestep&duration=${duration}&key=${POLLINATIONS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Music gen error ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function generateImage({ prompt, width = 1024, height = 1024, model = "flux", seed = 42 }) {
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    model : "zimage",
    seed: String(seed),
    nologo: "true",
    private: "true",
    key: POLLINATIONS_API_KEY,
  });

  const url = `${POLLINATIONS_BASE}/image/${encodeURIComponent(prompt)}?${params}`;
  const res = await fetch(url, { timeout: 120000 });
  if (!res.ok) throw new Error(`Image gen error ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
