// Bring-your-own-key AI calls, made straight from the browser to the provider you choose.
// The key lives only in this browser's localStorage and is never included in progress exports.

export const PROVIDERS = {
  anthropic: { label: "Anthropic (Claude)", defaultModel: "claude-sonnet-5-5", models: ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"], keyHint: "sk-ant-…" },
  openai: { label: "OpenAI", defaultModel: "gpt-4.1-mini", models: [], keyHint: "sk-…" },
  compatible: { label: "OpenAI-compatible (OpenRouter, Azure, local)", defaultModel: "", models: [], keyHint: "Your provider's key" },
};

export function aiReady(settings) {
  return !!(settings && settings.apiKey && settings.provider && (settings.model || PROVIDERS[settings.provider]?.defaultModel));
}

async function readSSE(res, onEvent) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let ev;
      try { ev = JSON.parse(data); } catch { continue; /* non-JSON keep-alive */ }
      onEvent(ev);
    }
  }
}

async function failure(res) {
  let detail = "";
  try { const j = await res.json(); detail = j.error?.message || j.message || JSON.stringify(j); } catch { detail = res.statusText; }
  if (res.status === 401) return new Error("The provider rejected the API key (401). Check the key in Settings.");
  if (res.status === 404) return new Error(`Model not found (404). Check the model name in Settings. ${detail}`);
  if (res.status === 429) return new Error("Rate limit or credit limit reached (429). Wait a minute or check your provider billing.");
  return new Error(`AI request failed (${res.status}): ${detail}`);
}

/**
 * Stream a reply. messages: [{role: "user"|"assistant", content: string}]
 * onDelta(textSoFar) is called as text arrives. Returns the full text.
 */
export async function chat(settings, { system, messages, maxTokens = 1500, signal, onDelta = () => {} }) {
  const provider = settings.provider;
  const model = settings.model || PROVIDERS[provider].defaultModel;
  let full = "";
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": settings.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages, stream: true }),
    });
    if (!res.ok) throw await failure(res);
    await readSSE(res, (ev) => {
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") { full += ev.delta.text; onDelta(full); }
      if (ev.type === "error") throw new Error(ev.error?.message || "Stream error");
    });
    return full;
  }
  const base = (provider === "compatible" ? settings.baseUrl : "https://api.openai.com/v1") || "https://api.openai.com/v1";
  const res = await fetch(base.replace(/\/$/, "") + "/chat/completions", {
    method: "POST", signal,
    headers: { "content-type": "application/json", authorization: "Bearer " + settings.apiKey },
    body: JSON.stringify({ model, stream: true, messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!res.ok) throw await failure(res);
  await readSSE(res, (ev) => {
    const t = ev.choices?.[0]?.delta?.content;
    if (t) { full += t; onDelta(full); }
  });
  return full;
}

/** Pull the first JSON object or array out of a model reply. */
export function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const src = fenced ? fenced[1] : text;
  const start = src.search(/[\[{]/);
  if (start < 0) throw new Error("No JSON in reply");
  const open = src[start], close = open === "{" ? "}" : "]";
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return JSON.parse(src.slice(start, i + 1));
  }
  throw new Error("Unfinished JSON in reply");
}
