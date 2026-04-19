// server/routes/ai.js
// All AI provider calls go through here — API key never touches the browser

const express = require("express");
const router  = express.Router();

// ─── Universal AI Caller ──────────────────────────────────────────────────────
// Supports: OpenAI, Groq, Together AI (all OpenAI-compatible), Google Gemini
async function callAIProvider(userMessage, systemPrompt, config) {
  const { fetch } = await import("node-fetch");

  const provider = config.provider || process.env.AI_PROVIDER || "openai";
  const model    = config.model    || process.env.AI_MODEL    || "gpt-4o-mini";

  // API key: prefer what the frontend sends, fall back to .env
  const apiKey =
    (config.apiKey && config.apiKey.trim()) ||
    process.env.MISTRAL_API_KEY ||
    process.env.GROQ_API_KEY   ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.TOGETHER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No API key found. Add it in the app Settings tab, or set it in server/.env"
    );
  }

  // Ensure we have a valid provider
  const validProvider = ["openai", "groq", "together", "mistral", "gemini"].includes(provider) 
    ? provider 
    : "mistral";

  // ── OpenAI / Groq / Together / Mistral (OpenAI-compatible format) ──────────────────
  if (["openai", "groq", "together", "mistral"].includes(validProvider)) {
    const BASE_URLS = {
      openai:   "https://api.openai.com/v1/chat/completions",
      groq:     "https://api.groq.com/openai/v1/chat/completions",
      together: "https://api.together.xyz/v1/chat/completions",
      mistral: "https://api.mistral.ai/v1/chat/completions",
    };

    const res = await fetch(BASE_URLS[validProvider], {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt || "You are a helpful AI email assistant." },
          { role: "user",   content: userMessage },
        ],
      }),
    });

    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error.message || data.error.code || JSON.stringify(data.error));
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error(`Invalid response from ${provider}: ${JSON.stringify(data)}`);
    }
    
    return data.choices[0].message.content;
  }

  // ── Google Gemini ─────────────────────────────────────────────────────────
  if (provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
              ? `${systemPrompt}\n\nUser: ${userMessage}`
              : userMessage,
          }],
        }],
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error(`Unknown provider: "${provider}". Use openai, groq, together, mistral, or gemini.`);
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
// Main chat endpoint — full conversation
router.post("/chat", async (req, res) => {
  try {
    const { message, system, config = {} } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const reply = await callAIProvider(message, system, config);
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/summarize ───────────────────────────────────────────────────
// Summarizes an email body
router.post("/summarize", async (req, res) => {
  try {
    const { emailBody, from, subject, config = {} } = req.body;
    if (!emailBody) return res.status(400).json({ error: "emailBody is required" });

    const prompt =
      `Summarize this email clearly and concisely. Structure your response with:\n` +
      `1. Main point (1 sentence)\n` +
      `2. Action required (if any)\n` +
      `3. Urgency level: Low / Medium / High\n\n` +
      `From: ${from || "Unknown"}\nSubject: ${subject || "No subject"}\n\n${emailBody}`;

    const system =
      "You are an expert email analyst. Be concise, use bullet points, and always state urgency clearly.";

    const summary = await callAIProvider(prompt, system, config);
    res.json({ summary });
  } catch (err) {
    console.error("Summarize error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/reply ───────────────────────────────────────────────────────
// Generates an email reply at the requested tone
router.post("/reply", async (req, res) => {
  try {
    const { emailBody, from, subject, tone, config = {} } = req.body;
    if (!emailBody) return res.status(400).json({ error: "emailBody is required" });

    const toneMap = {
      formal:    "professional and formal — full sentences, polite sign-off",
      casual:    "friendly and conversational — first-name basis, relaxed",
      short:     "ultra-brief — 2 to 3 sentences only, get straight to the point",
      assertive: "confident and direct — state your position clearly without hedging",
    };

    const toneDesc = toneMap[tone] || toneMap.formal;

    const prompt =
      `Write a ${toneDesc} email reply to the following email.\n` +
      `Write ONLY the reply body — no subject line, no "Subject:" prefix.\n\n` +
      `Original email from ${from || "the sender"}:\n` +
      `Subject: ${subject || ""}\n\n${emailBody}`;

    const system =
      "You are an expert professional email writer. Match the tone exactly as instructed. Write only the reply body text.";

    const draft = await callAIProvider(prompt, system, config);
    res.json({ draft });
  } catch (err) {
    console.error("Reply error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/draft ───────────────────────────────────────────────────────
// Drafts a fresh email from scratch
router.post("/draft", async (req, res) => {
  try {
    const { to, subject, context, tone, config = {} } = req.body;

    const toneMap = {
      formal:     "professional and formal",
      casual:     "friendly and conversational",
      persuasive: "persuasive and compelling",
      brief:      "concise and to-the-point (under 100 words)",
    };

    const prompt =
      `Write a complete email body in a ${toneMap[tone] || "professional"} tone.\n` +
      (to      ? `Recipient: ${to}\n`         : "") +
      (subject ? `Subject: ${subject}\n`      : "") +
      (context ? `Context: ${context}\n`      : "") +
      `\nWrite ONLY the email body. No subject line. No "Dear..." unless natural for the tone.`;

    const system =
      "You are an expert email copywriter. Write complete, compelling email bodies only. No commentary.";

    const draft = await callAIProvider(prompt, system, config);
    res.json({ draft });
  } catch (err) {
    console.error("Draft error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/daily-summary ───────────────────────────────────────────────
// Summarizes the user's entire day of emails into a briefing
router.post("/daily-summary", async (req, res) => {
  try {
    const { emails, config = {} } = req.body;
    if (!emails || !emails.length) return res.status(400).json({ error: "emails array is required" });

    const emailList = emails
      .map(e => `From: ${e.from} | Subject: ${e.subject} | Preview: ${e.preview}`)
      .join("\n");

    const prompt =
      `Here are my emails for today:\n\n${emailList}\n\n` +
      `Give me an executive daily briefing covering:\n` +
      `• What's most urgent (needs action today)\n` +
      `• What needs a reply\n` +
      `• Any deadlines or time-sensitive items\n` +
      `• Top 3 action items in priority order\n\n` +
      `Keep it under 200 words. Be direct and actionable.`;

    const system =
      "You are a sharp, efficient executive assistant. Be direct, use bullet points, prioritize ruthlessly.";

    const briefing = await callAIProvider(prompt, system, config);
    res.json({ briefing });
  } catch (err) {
    console.error("Daily summary error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ai/schedule-draft ─────────────────────────────────────────────
// Generates an email body for a scheduled/routine email
router.post("/schedule-draft", async (req, res) => {
  try {
    const { to, subject, repeat, config = {} } = req.body;

    const prompt =
      `Write an email body for a ${repeat === "weekly" ? "weekly" : "scheduled"} automated email.\n` +
      (to      ? `To: ${to}\n`          : "") +
      (subject ? `Subject: ${subject}\n` : "") +
      `\nWrite a professional, complete email body only.`;

    const system = "You are an expert email writer. Write only the email body.";

    const draft = await callAIProvider(prompt, system, config);
    res.json({ draft });
  } catch (err) {
    console.error("Schedule draft error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
