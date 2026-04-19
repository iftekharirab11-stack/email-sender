# MailMind — AI Email Agent

A fully functional AI-powered email productivity app.
Supports **OpenAI**, **Groq (free)**, **Google Gemini**, and **Together AI**.

---

## Project Structure

```
mailmind/
├── client/                  ← React + Vite frontend (port 5173)
│   ├── src/
│   │   ├── App.jsx          ← All UI pages
│   │   ├── main.jsx         ← React entry point
│   │   └── index.css        ← Global styles
│   ├── index.html
│   ├── vite.config.js       ← Proxies /api/* → backend
│   └── package.json
│
├── server/                  ← Express backend (port 3001)
│   ├── routes/
│   │   ├── ai.js            ← All AI provider calls
│   │   └── emails.js        ← Email CRUD
│   ├── index.js             ← Server entry
│   ├── .env.example         ← Copy to .env
│   └── package.json
│
├── package.json             ← Root: runs both together
└── README.md
```

---

## Setup — Step by Step

### Step 1 — Install dependencies

Open your terminal in the `mailmind` folder and run:

```bash
# Install root dependencies (concurrently)
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

Or all in one shot:
```bash
npm run install:all
```

---

### Step 2 — Set up your API key

```bash
# Copy the example env file
cp server/.env.example server/.env
```

Now open `server/.env` and fill in **one** API key (you only need ONE provider):

```env
# Option A — OpenAI (paid, best quality)
OPENAI_API_KEY=sk-...your-key...

# Option B — Groq (FREE, very fast)
GROQ_API_KEY=gsk_...your-key...

# Option C — Google Gemini (has free tier)
GEMINI_API_KEY=AIza...your-key...

# Option D — Together AI
TOGETHER_API_KEY=...your-key...

# Option E — Mistral AI (FREE tier available)
MISTRAL_API_KEY=...your-key...
```

**Where to get free API keys:**
- Groq (free): https://console.groq.com/keys
- Gemini (free tier): https://aistudio.google.com/app/apikey
- Mistral (free tier): https://console.mistral.ai
- OpenAI: https://platform.openai.com/api-keys

---

### Step 3 — Run the app

```bash
npm run dev
```

This starts BOTH the backend (port 3001) and frontend (port 5173) together.

Open your browser: **http://localhost:5173**

---

### Step 4 — Set your provider in the app

1. Go to **Settings** tab in the app
2. Select your provider (OpenAI / Groq / Mistral / Gemini / Together)
3. Paste your API key
4. Select the model
5. Click **Save Settings**

You're done! All AI features will now work.

---

## Features

| Feature | How it works |
|---|---|
| **Dashboard** | Stats overview + AI "Summarize My Day" button |
| **AI Chat** | Full conversational chat with your AI provider |
| **Inbox** | Read emails, AI Summarize, AI Reply (4 tones) |
| **Compose** | Write emails + AI Draft with tone selector |
| **Scheduler** | Schedule emails, set repeat, AI draft body |
| **Dark mode** | Toggle in the sidebar bottom |

---

## API Endpoints (Backend)

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/ai/chat | Main AI chat |
| POST | /api/ai/summarize | Summarize email |
| POST | /api/ai/reply | Generate reply at tone |
| POST | /api/ai/draft | Draft email from scratch |
| POST | /api/ai/daily-summary | Daily inbox briefing |
| GET | /api/emails | Fetch all emails |
| POST | /api/emails/send | Send email (mock) |
| POST | /api/emails/schedule | Schedule email |
| GET | /api/emails/scheduled | List scheduled |
| DELETE | /api/emails/scheduled/:id | Cancel scheduled |

---

## Troubleshooting

**"No API key found"**
→ You forgot to add a key in Settings or in `server/.env`

**"Cannot connect to server"**
→ Make sure `npm run dev` is running (you need BOTH terminal processes)

**AI gives wrong answers**
→ Try switching to a better model (gpt-4o instead of gpt-4o-mini)

**CORS error**
→ Make sure you're opening http://localhost:5173 (not 3001)

---

## Upgrade: Real Gmail Integration

In `server/routes/emails.js`, replace the mock `sendEmail` function with real Gmail API calls:

```js
const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(...);
// ... Gmail API logic here
```

Full guide: https://developers.google.com/gmail/api/guides/sending
