import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════
   MOCK EMAIL DATA
═══════════════════════════════════════════════════════════ */
const INITIAL_EMAILS = [
  {
    id: 1, from: "Sarah Chen", addr: "sarah@techcorp.com",
    subject: "Q3 Performance Report — Action Required",
    preview: "Please review the Q3 report before Friday's meeting. Revenue up 23% YoY, NPS improved to 72...",
    body: "Hi team,\n\nPlease review the attached Q3 performance report before our Friday meeting.\n\nKey highlights:\n• Revenue up 23% YoY\n• Customer acquisition cost down 15%\n• NPS score improved to 72\n\nWe need firm decisions on Q4 budget allocation. Please come prepared with your team's top priorities and blockers.\n\nLooking forward to a productive session.\n\nBest,\nSarah",
    date: "Apr 19, 9:14 AM", unread: true, starred: true, tag: "Work"
  },
  {
    id: 2, from: "Marcus Rivera", addr: "m.rivera@design.io",
    subject: "New dashboard mockups ready for review",
    preview: "Hey! Finished the redesign mockups. Would love your feedback before development starts...",
    body: "Hey!\n\nJust wrapped up the dashboard redesign mockups and would love your feedback before we hand off to dev.\n\nFigma links:\n• Mobile (v3): figma.com/mobile-v3\n• Desktop (v3): figma.com/desktop-v3\n• Component library: figma.com/components\n\nThe big changes are a new nav pattern, consolidated stats cards, and a dark mode that actually works.\n\nLet me know if you want to hop on a quick call to walk through the decisions.\n\nCheers,\nMarcus",
    date: "Apr 19, 8:30 AM", unread: true, starred: false, tag: "Design"
  },
  {
    id: 3, from: "Priya Sharma", addr: "priya@startup.ai",
    subject: "Partnership opportunity — AI integration layer",
    preview: "I'm reaching out about a potential partnership. Our AI layer reduces manual work by 60%...",
    body: "Dear colleague,\n\nI'm reaching out regarding a potential partnership between our organizations. We've developed an AI integration layer that could significantly streamline your team's workflow.\n\nKey benefits:\n• 60% reduction in manual data entry\n• Real-time analytics dashboard\n• Seamless REST API integration (no migration required)\n• SOC 2 Type II certified\n\nWe've helped similar companies cut ops costs by an average of $200K/yr.\n\nWould you be open to a 30-minute call this week? I'm flexible on timing.\n\nBest regards,\nPriya Sharma\nCEO, StartupAI",
    date: "Apr 18, 4:45 PM", unread: false, starred: true, tag: "Business"
  },
  {
    id: 4, from: "DevOps Team", addr: "devops@company.com",
    subject: "Scheduled maintenance — Saturday 2:00 AM UTC",
    preview: "All services will be unavailable for ~3 hours. Please complete critical tasks beforehand...",
    body: "Hi all,\n\nHeads-up on our upcoming scheduled maintenance window:\n\n📅 Date: Saturday, April 21\n⏰ Time: 2:00 AM – 5:00 AM UTC\n⚠️ Impact: All services unavailable\n\nWhat's happening:\n• Database migration to PostgreSQL 16\n• Load balancer certificate rotation\n• CDN cache purge\n\nPlease complete all critical tasks before the window. The team will be on-call throughout.\n\nFor urgent issues during maintenance: devops@company.com or Slack #incidents\n\nThank you,\nDevOps Team",
    date: "Apr 18, 2:00 PM", unread: false, starred: false, tag: "Tech"
  },
  {
    id: 5, from: "Jordan Lee", addr: "jordan@investor.vc",
    subject: "Follow-up: Series A discussion",
    preview: "Partners reviewed your deck — very interested. Next steps: due diligence and a tech deep-dive...",
    body: "Hi,\n\nFollowing up on our conversation last week. Good news — the partners have reviewed your deck and we're very interested in moving forward.\n\nProposed next steps:\n1. Data room access for due diligence\n2. Technical deep-dive call with our CTO (1–2 hrs)\n3. Customer reference calls (3–4 references)\n\nWe're targeting a term sheet decision within 3 weeks assuming the process goes smoothly.\n\nAre you available for a kickoff call Tuesday or Wednesday afternoon?\n\nLooking forward to it,\nJordan Lee\nPartner, Vertex Venture Capital",
    date: "Apr 17, 11:20 AM", unread: true, starred: true, tag: "Finance"
  },
  {
    id: 6, from: "GitHub", addr: "noreply@github.com",
    subject: "Security alert: dependency vulnerability detected",
    preview: "We detected a high-severity vulnerability in your repository. Immediate action recommended...",
    body: "Security Alert\n\nA high-severity vulnerability (CVE-2026-1234) was detected in a dependency of your repository:\n\nRepository: your-org/main-app\nPackage: lodash@4.17.20\nSeverity: HIGH\nAffected versions: < 4.17.21\n\nRecommended action: Update lodash to version 4.17.21 or later.\n\nDependabot has opened a pull request with the fix: github.com/your-org/main-app/pull/142\n\nReview it here →\n\nGitHub Security",
    date: "Apr 17, 9:05 AM", unread: false, starred: false, tag: "Tech"
  }
];

const TAG_COLORS = {
  Work:     { bg: "#dbeafe", fg: "#1e40af" },
  Design:   { bg: "#ede9fe", fg: "#5b21b6" },
  Business: { bg: "#dcfce7", fg: "#166534" },
  Tech:     { bg: "#fef3c7", fg: "#92400e" },
  Finance:  { bg: "#fee2e2", fg: "#991b1b" },
};

const AVATAR_COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16"
];

/* ═══════════════════════════════════════════════════════════
   AI API CALL — multi-provider
═══════════════════════════════════════════════════════════ */
async function callAI(userMessage, systemPrompt, config) {
  const { provider, apiKey, model } = config;

  if (!apiKey) throw new Error("No API key set. Go to Settings → paste your key.");

  // OpenAI / Groq / Together / Mistral (all use OpenAI-compatible format)
  if (provider === "openai" || provider === "groq" || provider === "together" || provider === "mistral") {
    const baseUrl =
      provider === "groq"     ? "https://api.groq.com/openai/v1/chat/completions" :
      provider === "together" ? "https://api.together.xyz/v1/chat/completions" :
      provider === "mistral"  ? "https://api.mistral.ai/v1/chat/completions" :
                                "https://api.openai.com/v1/chat/completions";

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt || "You are an expert AI email productivity assistant." },
          { role: "user",   content: userMessage }
        ]
      })
    });
    const d = await res.json();
    if (d.error) throw new Error(d.error.message);
    return d.choices[0].message.content;
  }

  // Google Gemini
  if (provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: (systemPrompt ? systemPrompt + "\n\n" : "") + userMessage }] }]
      })
    });
    const d = await res.json();
    if (d.error) throw new Error(d.error.message);
    return d.candidates[0].content.parts[0].text;
  }

  throw new Error("Unknown provider: " + provider);
}

/* ═══════════════════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════════════════ */
function Avatar({ name, size = 36, idx = 0 }) {
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "22", color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 500, flexShrink: 0, letterSpacing: 0.5
    }}>{initials}</div>
  );
}

function TagBadge({ label }) {
  const c = TAG_COLORS[label] || { bg: "#f3f4f6", fg: "#374151" };
  return (
    <span style={{
      background: c.bg, color: c.fg, fontSize: 10, fontWeight: 600,
      padding: "2px 7px", borderRadius: 5, letterSpacing: 0.3
    }}>{label.toUpperCase()}</span>
  );
}

function Btn({ children, onClick, loading, primary, small, danger, full, disabled }) {
  return (
    <button onClick={onClick} disabled={loading || disabled} style={{
      padding: small ? "6px 12px" : "9px 18px",
      fontSize: small ? 12 : 13,
      fontWeight: 500,
      borderRadius: 8,
      border: primary ? "none" : danger ? "1px solid #fca5a5" : "0.5px solid var(--color-border-secondary)",
      background: primary ? "#f59e0b" : danger ? "#fef2f2" : "transparent",
      color: primary ? "#1c1917" : danger ? "#b91c1c" : "var(--color-text-primary)",
      cursor: (loading || disabled) ? "not-allowed" : "pointer",
      opacity: (loading || disabled) ? 0.55 : 1,
      display: "inline-flex", alignItems: "center", gap: 6,
      width: full ? "100%" : "auto",
      justifyContent: full ? "center" : "flex-start",
      transition: "opacity 0.15s",
      whiteSpace: "nowrap", flexShrink: 0
    }}>
      {loading ? <span style={{ display: "inline-flex", gap: 3 }}>
        {[0,1,2].map(i => <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%", background: "currentColor",
          animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`
        }} />)}
      </span> : children}
    </button>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = "text", rows, readOnly }) {
  const baseStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box",
    border: "0.5px solid var(--color-border-secondary)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)", fontSize: 13,
    fontFamily: "var(--font-sans)", outline: "none",
    resize: rows ? "vertical" : "none", lineHeight: 1.6,
    opacity: readOnly ? 0.7 : 1
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </label>}
      {rows
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={baseStyle} readOnly={readOnly} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={baseStyle} readOnly={readOnly} />
      }
    </div>
  );
}

function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      padding: "24px 28px 20px",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: -0.3 }}>{title}</h1>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

function AIResponseBox({ content, loading }) {
  if (!content && !loading) return null;
  return (
    <div style={{
      background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 10, padding: "14px 16px", marginTop: 12
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", marginBottom: 8, letterSpacing: 0.5 }}>
        ✦ AI RESPONSE
      </div>
      {loading
        ? <div style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Thinking...</div>
        : <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)" }}>{content}</pre>
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════ */
const NAV = [
  { id: "dashboard", label: "Dashboard",  icon: "⊡" },
  { id: "chat",      label: "AI Chat",    icon: "◉" },
  { id: "inbox",     label: "Inbox",      icon: "◻" },
  { id: "compose",   label: "Compose",    icon: "✦" },
  { id: "scheduler", label: "Scheduler",  icon: "◷" },
  { id: "settings",  label: "Settings",   icon: "⊛" },
];

function Sidebar({ view, setView, unreadCount }) {
  return (
    <aside style={{
      width: 210, background: "var(--color-background-secondary)",
      borderRight: "0.5px solid var(--color-border-tertiary)",
      display: "flex", flexDirection: "column", flexShrink: 0,
      userSelect: "none", height: "100vh", position: "sticky", top: 0
    }}>
      {/* Brand */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#f59e0b", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 16
          }}>✉</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.2 }}>MailMind</div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", letterSpacing: 0.5 }}>AI EMAIL AGENT</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ padding: "12px 8px", flex: 1 }}>
        {NAV.map(item => {
          const active = view === item.id;
          return (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8, border: "none",
              background: active ? "#f59e0b18" : "transparent",
              color: active ? "#f59e0b" : "var(--color-text-secondary)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              fontSize: 13, fontWeight: active ? 500 : 400, textAlign: "left",
              marginBottom: 2, position: "relative", transition: "all 0.15s"
            }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {item.id === "inbox" && unreadCount > 0 && (
                <span style={{
                  marginLeft: "auto", background: "#f59e0b", color: "#1c1917",
                  fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10
                }}>{unreadCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom user area */}
      <div style={{
        padding: "12px 12px 16px",
        borderTop: "0.5px solid var(--color-border-tertiary)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name="You" size={30} idx={1} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>You</div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>user@email.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════ */
function Dashboard({ emails, setView, aiConfig, scheduledCount }) {
  const [daySummary, setDaySummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const unread   = emails.filter(e => e.unread).length;
  const starred  = emails.filter(e => e.starred).length;
  const total    = emails.length;

  async function getDailySummary() {
    setSummaryLoading(true);
    setDaySummary("");
    try {
      const emailList = emails.map(e =>
        `From: ${e.from} | Subject: ${e.subject} | Preview: ${e.preview}`
      ).join("\n");
      const result = await callAI(
        `Here are my emails today:\n\n${emailList}\n\nGive me a concise daily briefing: what's urgent, what needs a reply, any deadlines, and your top 3 action items.`,
        "You are a sharp executive assistant. Be direct and actionable. Use bullet points. Keep it under 200 words.",
        aiConfig
      );
      setDaySummary(result);
    } catch (e) {
      setDaySummary("⚠ " + e.message);
    }
    setSummaryLoading(false);
  }

  const stats = [
    { label: "Total Emails",  value: total,        color: "#3b82f6" },
    { label: "Unread",        value: unread,        color: "#f59e0b" },
    { label: "Starred",       value: starred,       color: "#8b5cf6" },
    { label: "Scheduled",     value: scheduledCount, color: "#10b981" },
  ];

  return (
    <div style={{ padding: "0 0 40px" }}>
      <PageHeader
        title="Dashboard"
        subtitle={`Sunday, April 19, 2026 · ${unread} unread messages`}
        actions={
          <Btn primary onClick={getDailySummary} loading={summaryLoading}>
            ✦ Summarize My Day
          </Btn>
        }
      />

      <div style={{ padding: "24px 28px" }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: 12, padding: "16px 18px"
            }}>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 6, fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* AI Daily Summary box */}
        <AIResponseBox content={daySummary} loading={summaryLoading} />

        {/* Recent emails + Quick actions side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, marginTop: 24 }}>
          {/* Recent emails */}
          <div style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: 12, overflow: "hidden"
          }}>
            <div style={{ padding: "14px 18px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Recent Emails</span>
              <button onClick={() => setView("inbox")} style={{ fontSize: 12, color: "#f59e0b", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
            </div>
            {emails.slice(0, 5).map((em, i) => (
              <div key={em.id} onClick={() => setView("inbox")} style={{
                padding: "12px 18px", cursor: "pointer",
                borderBottom: i < 4 ? "0.5px solid var(--color-border-tertiary)" : "none",
                display: "flex", alignItems: "center", gap: 12,
                background: em.unread ? "var(--color-background-secondary)" : "transparent",
                transition: "background 0.1s"
              }}>
                <Avatar name={em.from} size={32} idx={i} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: em.unread ? 600 : 400, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{em.from}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", flexShrink: 0 }}>{em.date.split(",")[1]?.trim()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{em.subject}</div>
                </div>
                {em.unread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />}
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{
            background: "var(--color-background-primary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: 12, padding: "18px"
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: "var(--color-text-primary)" }}>Quick Actions</div>
            {[
              { label: "Open AI Chat", icon: "◉", page: "chat", desc: "Ask anything" },
              { label: "Compose Email", icon: "✦", page: "compose", desc: "AI-powered drafts" },
              { label: "View Inbox", icon: "◻", page: "inbox", desc: `${unread} unread` },
              { label: "Schedule Email", icon: "◷", page: "scheduler", desc: "Set reminders" },
            ].map(a => (
              <button key={a.page} onClick={() => setView(a.page)} style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)",
                background: "var(--color-background-secondary)", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10, marginBottom: 8, transition: "border-color 0.15s"
              }}>
                <span style={{ fontSize: 16, color: "#f59e0b" }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAT PAGE
═══════════════════════════════════════════════════════════ */
const SYSTEM_CHAT = `You are MailMind, an expert AI email productivity assistant. You help users:
- Summarize and analyze emails
- Draft professional replies with different tones
- Schedule tasks and set reminders
- Give productivity advice
Be conversational, smart, and concise. Use line breaks for readability.`;

function ChatPage({ aiConfig }) {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hey! I'm MailMind, your AI email assistant 👋\n\nI can help you draft emails, summarize your inbox, suggest replies, and manage your schedule. What do you need?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const history = messages.filter(m => m.role !== "error").slice(-10);
      const conversationText = history.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");
      const reply = await callAI(
        conversationText ? `${conversationText}\n\nUser: ${text}` : text,
        SYSTEM_CHAT,
        aiConfig
      );
      setMessages(prev => [...prev, { role: "ai", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", content: "⚠ " + e.message }]);
    }
    setLoading(false);
  }

  const QUICK = [
    "Draft a polite follow-up email",
    "How do I write a cold email that gets replies?",
    "Help me decline a meeting professionally",
    "Write a thank-you note after an interview"
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <PageHeader
        title="AI Chat"
        subtitle="Powered by your configured AI provider"
        actions={
          <Btn small onClick={() => setMessages([{ role: "ai", content: "Chat cleared! How can I help?" }])}>
            Clear
          </Btn>
        }
      />

      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 28px" }}>
        {messages.length === 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                style={{
                  padding: "7px 13px", fontSize: 12, borderRadius: 20,
                  border: "0.5px solid var(--color-border-secondary)",
                  background: "var(--color-background-secondary)",
                  color: "var(--color-text-secondary)", cursor: "pointer"
                }}>{q}</button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex", gap: 10, marginBottom: 16,
            justifyContent: m.role === "user" ? "flex-end" : "flex-start"
          }}>
            {m.role === "ai" && (
              <div style={{
                width: 30, height: 30, borderRadius: "50%", background: "#f59e0b22",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, flexShrink: 0, color: "#f59e0b"
              }}>✦</div>
            )}
            <div style={{
              maxWidth: "72%", padding: "11px 15px", borderRadius: 12,
              background: m.role === "user"
                ? "#f59e0b"
                : "var(--color-background-primary)",
              border: m.role === "user" ? "none" : "0.5px solid var(--color-border-tertiary)",
              color: m.role === "user" ? "#1c1917" : "var(--color-text-primary)",
              fontSize: 13, lineHeight: 1.65,
              borderBottomRightRadius: m.role === "user" ? 4 : 12,
              borderBottomLeftRadius: m.role === "ai" ? 4 : 12
            }}>
              <pre style={{ margin: 0, fontFamily: "var(--font-sans)", whiteSpace: "pre-wrap" }}>{m.content}</pre>
            </div>
            {m.role === "user" && <Avatar name="You" size={30} idx={1} />}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f59e0b22", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>✦</div>
            <div style={{
              padding: "12px 16px", borderRadius: 12, borderBottomLeftRadius: 4,
              background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
              display: "flex", gap: 5, alignItems: "center"
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#f59e0b",
                  animation: `bounce 1s ease-in-out ${i * 0.18}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: "16px 28px 20px",
        borderTop: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-background-secondary)"
      }}>
        <div style={{ display: "flex", gap: 10 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your emails, or request a draft… (Enter to send)"
            rows={2}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13,
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-primary)",
              color: "var(--color-text-primary)", fontFamily: "var(--font-sans)",
              resize: "none", outline: "none", lineHeight: 1.5
            }}
          />
          <Btn primary onClick={send} loading={loading} disabled={!input.trim()}>Send</Btn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INBOX PAGE
═══════════════════════════════════════════════════════════ */
function InboxPage({ emails, setEmails, aiConfig }) {
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [tone, setTone] = useState("formal");
  const [filter, setFilter] = useState("all");

  const filtered = emails.filter(e =>
    filter === "unread"  ? e.unread  :
    filter === "starred" ? e.starred : true
  );

  function openEmail(em) {
    setSelected(em);
    setSummary("");
    setReply("");
    if (em.unread) {
      setEmails(prev => prev.map(e => e.id === em.id ? { ...e, unread: false } : e));
    }
  }

  async function summarize() {
    if (!selected) return;
    setSummaryLoading(true);
    setSummary("");
    try {
      const result = await callAI(
        `Summarize this email clearly. List: 1) The main point, 2) Any action required, 3) Urgency level.\n\nFrom: ${selected.from}\nSubject: ${selected.subject}\n\n${selected.body}`,
        "You are an expert email analyst. Be concise and use bullet points.",
        aiConfig
      );
      setSummary(result);
    } catch (e) { setSummary("⚠ " + e.message); }
    setSummaryLoading(false);
  }

  async function generateReply() {
    if (!selected) return;
    setReplyLoading(true);
    setReply("");
    try {
      const toneMap = {
        formal: "professional and formal",
        casual: "friendly and conversational",
        short:  "very brief, 2-3 sentences max",
        assertive: "confident and direct"
      };
      const result = await callAI(
        `Write a ${toneMap[tone]} reply to this email. Just the reply body, no subject line.\n\nOriginal email from ${selected.from}:\n\n${selected.body}`,
        "You are an expert email writer. Match the requested tone perfectly. Write only the reply body.",
        aiConfig
      );
      setReply(result);
    } catch (e) { setReply("⚠ " + e.message); }
    setReplyLoading(false);
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Email list */}
      <div style={{
        width: 340, borderRight: "0.5px solid var(--color-border-tertiary)",
        display: "flex", flexDirection: "column", flexShrink: 0
      }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>Inbox</h2>
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "unread", "starred"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                border: "0.5px solid var(--color-border-secondary)",
                background: filter === f ? "#f59e0b" : "transparent",
                color: filter === f ? "#1c1917" : "var(--color-text-secondary)", cursor: "pointer"
              }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {filtered.map((em, i) => (
            <div key={em.id} onClick={() => openEmail(em)} style={{
              padding: "12px 14px", cursor: "pointer",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
              background: selected?.id === em.id
                ? "#f59e0b12"
                : em.unread ? "var(--color-background-secondary)" : "transparent",
              borderLeft: selected?.id === em.id ? "2px solid #f59e0b" : "2px solid transparent"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Avatar name={em.from} size={34} idx={i} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: em.unread ? 600 : 400, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {em.from}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", flexShrink: 0 }}>
                      {em.date.split(",")[1]?.trim() || em.date}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: em.unread ? 500 : 400, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                    {em.subject}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <TagBadge label={em.tag} />
                    {em.starred && <span style={{ color: "#f59e0b", fontSize: 12 }}>★</span>}
                    {em.unread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", marginLeft: "auto" }} />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email detail */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>◻</div>
            <div style={{ fontSize: 14 }}>Select an email to read</div>
          </div>
        ) : (
          <div style={{ padding: "24px 28px", flex: 1 }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.3 }}>{selected.subject}</h2>
                <TagBadge label={selected.tag} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={selected.from} size={32} idx={emails.findIndex(e => e.id === selected.id)} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{selected.from}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{selected.addr} · {selected.date}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{
              background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: 10, padding: "18px 20px", marginBottom: 16
            }}>
              <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)" }}>
                {selected.body}
              </pre>
            </div>

            {/* AI Actions */}
            <div style={{
              background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: 10, padding: "16px 18px"
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: 12, letterSpacing: 0.5 }}>AI TOOLS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Btn small onClick={summarize} loading={summaryLoading}>✦ Summarize</Btn>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <select value={tone} onChange={e => setTone(e.target.value)} style={{
                    padding: "6px 10px", borderRadius: 8, fontSize: 12,
                    border: "0.5px solid var(--color-border-secondary)",
                    background: "var(--color-background-primary)",
                    color: "var(--color-text-primary)", cursor: "pointer"
                  }}>
                    <option value="formal">Formal reply</option>
                    <option value="casual">Casual reply</option>
                    <option value="short">Short reply</option>
                    <option value="assertive">Assertive reply</option>
                  </select>
                  <Btn small onClick={generateReply} loading={replyLoading}>Generate</Btn>
                </div>
              </div>

              {/* Summary result */}
              {(summary || summaryLoading) && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", marginBottom: 8, letterSpacing: 0.5 }}>SUMMARY</div>
                  {summaryLoading ? <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Analyzing…</div>
                    : <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)" }}>{summary}</pre>}
                </div>
              )}

              {/* Reply result */}
              {(reply || replyLoading) && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", letterSpacing: 0.5 }}>DRAFTED REPLY</div>
                    {reply && (
                      <button onClick={() => navigator.clipboard?.writeText(reply)}
                        style={{ fontSize: 11, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>
                        Copy
                      </button>
                    )}
                  </div>
                  {replyLoading ? <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Drafting…</div>
                    : <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)" }}>{reply}</pre>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPOSE PAGE
═══════════════════════════════════════════════════════════ */
function ComposePage({ aiConfig }) {
  const [to, setTo]           = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody]       = useState("");
  const [tone, setTone]       = useState("formal");
  const [draftLoading, setDraftLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [draftPrompt, setDraftPrompt] = useState("");

  async function generateDraft() {
    if (!subject.trim() && !draftPrompt.trim()) return;
    setDraftLoading(true);
    try {
      const result = await callAI(
        `Write a ${tone} email${subject ? ` with subject: "${subject}"` : ""}${to ? ` to ${to}` : ""}${draftPrompt ? `. Additional context: ${draftPrompt}` : ""}.\n\nWrite only the email body (no subject line, no "Subject:" prefix).`,
        "You are an expert email writer. Write complete, professional email bodies only. No extra commentary.",
        aiConfig
      );
      setBody(result);
    } catch (e) { setBody("⚠ " + e.message); }
    setDraftLoading(false);
  }

  function handleSend() {
    if (!to || !subject || !body) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setTo(""); setSubject(""); setBody(""); setDraftPrompt("");
    }, 3000);
  }

  return (
    <div style={{ padding: "0 0 40px" }}>
      <PageHeader title="Compose" subtitle="Write or AI-draft an email" />

      <div style={{ padding: "24px 28px" }}>
        {sent ? (
          <div style={{
            background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 12,
            padding: "20px", textAlign: "center", color: "#065f46"
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Email sent successfully!</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Your message has been delivered (demo mode)</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
            {/* Main compose area */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FieldInput label="To" value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@email.com" />
              <FieldInput label="Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…" />
              <FieldInput label="Body" value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message here, or use AI Draft →" rows={12} multiline />

              <div style={{ display: "flex", gap: 10 }}>
                <Btn primary onClick={handleSend} disabled={!to || !subject || !body} full>Send Email</Btn>
                <Btn onClick={() => { setTo(""); setSubject(""); setBody(""); }}>Clear</Btn>
              </div>
            </div>

            {/* AI Draft panel */}
            <div style={{
              background: "var(--color-background-secondary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: 12, padding: "18px", display: "flex", flexDirection: "column", gap: 14, height: "fit-content"
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>✦ AI Draft Assistant</div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: 5, letterSpacing: 0.5 }}>TONE</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {["formal", "casual", "persuasive", "brief"].map(t => (
                    <button key={t} onClick={() => setTone(t)} style={{
                      padding: "7px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                      border: "0.5px solid var(--color-border-secondary)",
                      background: tone === t ? "#f59e0b" : "var(--color-background-primary)",
                      color: tone === t ? "#1c1917" : "var(--color-text-secondary)",
                      cursor: "pointer", textTransform: "capitalize"
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              <FieldInput
                label="Extra context (optional)"
                value={draftPrompt}
                onChange={e => setDraftPrompt(e.target.value)}
                placeholder="e.g. follow up on yesterday's call, be apologetic..."
                rows={3}
                multiline
              />

              <Btn primary onClick={generateDraft} loading={draftLoading} full>
                ✦ Generate Draft
              </Btn>

              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
                AI will use your To/Subject fields plus any context above to write the email body.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCHEDULER PAGE
═══════════════════════════════════════════════════════════ */
function SchedulerPage({ scheduled, setScheduled, aiConfig }) {
  const [to, setTo]         = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody]     = useState("");
  const [dateTime, setDateTime] = useState("");
  const [repeat, setRepeat] = useState("once");
  const [draftLoad, setDraftLoad] = useState(false);

  async function autoFill() {
    if (!subject) return;
    setDraftLoad(true);
    try {
      const text = await callAI(
        `Write a ${repeat === "weekly" ? "weekly routine" : "one-time"} email body for subject: "${subject}"${to ? ` to ${to}` : ""}. Just the body.`,
        "You are an expert email writer. Write only the email body.",
        aiConfig
      );
      setBody(text);
    } catch (e) { setBody("⚠ " + e.message); }
    setDraftLoad(false);
  }

  function schedule() {
    if (!to || !subject || !dateTime) return;
    const entry = {
      id: Date.now(), to, subject, body, dateTime, repeat,
      status: "scheduled"
    };
    setScheduled(prev => [entry, ...prev]);
    setTo(""); setSubject(""); setBody(""); setDateTime(""); setRepeat("once");
  }

  function remove(id) {
    setScheduled(prev => prev.filter(s => s.id !== id));
  }

  const REPEAT_ICONS = { once: "·", daily: "∞", weekly: "↻", monthly: "◷" };

  return (
    <div style={{ padding: "0 0 40px" }}>
      <PageHeader title="Scheduler" subtitle="Schedule emails and automated routines" />

      <div style={{ padding: "24px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Schedule form */}
        <div style={{
          background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", gap: 14
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>New Scheduled Email</div>

          <FieldInput label="To" value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@email.com" />
          <FieldInput label="Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…" />

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: 5, letterSpacing: 0.5 }}>SEND DATE & TIME</label>
            <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box",
                border: "0.5px solid var(--color-border-secondary)",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)", fontSize: 13, outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: 5, letterSpacing: 0.5 }}>REPEAT</label>
            <select value={repeat} onChange={e => setRepeat(e.target.value)} style={{
              width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box",
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)", fontSize: 13
            }}>
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <FieldInput label="Body" value={body} onChange={e => setBody(e.target.value)} placeholder="Email body…" rows={4} multiline />
            </div>
          </div>
          <Btn small onClick={autoFill} loading={draftLoad} disabled={!subject}>✦ AI Draft Body</Btn>

          <Btn primary onClick={schedule} disabled={!to || !subject || !dateTime} full>Schedule Email</Btn>
        </div>

        {/* Scheduled list */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 14 }}>
            Scheduled ({scheduled.length})
          </div>

          {scheduled.length === 0 ? (
            <div style={{
              border: "0.5px dashed var(--color-border-secondary)", borderRadius: 12,
              padding: "40px", textAlign: "center", color: "var(--color-text-tertiary)"
            }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>◷</div>
              <div style={{ fontSize: 13 }}>No scheduled emails yet</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {scheduled.map(s => (
                <div key={s.id} style={{
                  background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: 10, padding: "14px 16px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.subject}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>To: {s.to}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                          {new Date(s.dateTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                          background: "#fef3c7", color: "#92400e"
                        }}>{REPEAT_ICONS[s.repeat]} {s.repeat.toUpperCase()}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                          background: "#d1fae5", color: "#065f46"
                        }}>SCHEDULED</span>
                      </div>
                    </div>
                    <button onClick={() => remove(s.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--color-text-tertiary)", fontSize: 16, padding: "0 4px",
                      flexShrink: 0
                    }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pre-built routines */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 10, letterSpacing: 0.5 }}>ROUTINE TEMPLATES</div>
            {[
              { name: "Daily Inbox Summary", desc: "Every morning at 8AM", icon: "☀", color: "#f59e0b" },
              { name: "Weekly Report", desc: "Every Sunday at 6PM", icon: "📊", color: "#3b82f6" },
              { name: "Follow-up Reminder", desc: "3 days after sent emails", icon: "↩", color: "#10b981" },
            ].map(r => (
              <div key={r.name} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: "var(--color-background-secondary)", borderRadius: 8,
                border: "0.5px solid var(--color-border-tertiary)", marginBottom: 8
              }}>
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{r.desc}</div>
                </div>
                <button style={{
                  padding: "4px 10px", fontSize: 11, borderRadius: 6,
                  border: "0.5px solid var(--color-border-secondary)",
                  background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer"
                }}>Enable</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════════════════════════ */
const PROVIDERS = [
  { id: "openai",   label: "OpenAI",        models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"], hint: "platform.openai.com/api-keys" },
  { id: "groq",     label: "Groq",          models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"], hint: "console.groq.com/keys" },
  { id: "together", label: "Together AI",   models: ["meta-llama/Llama-3-70b-chat-hf", "mistralai/Mixtral-8x7B"], hint: "api.together.xyz" },
  { id: "mistral",  label: "Mistral AI",   models: ["mistral-small-latest", "mistral-medium-latest", "mistral-large-latest"], hint: "console.mistral.ai" },
  { id: "gemini",   label: "Google Gemini", models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"], hint: "aistudio.google.com/app/apikey" },
];

function SettingsPage({ aiConfig, setAiConfig }) {
  const [local, setLocal] = useState({ ...aiConfig });
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const currentProvider = PROVIDERS.find(p => p.id === local.provider) || PROVIDERS[0];

  function save() {
    setAiConfig({ ...local });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ padding: "0 0 40px" }}>
      <PageHeader title="Settings" subtitle="Configure your AI provider and preferences" />

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>

        {/* Provider card */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 16 }}>AI Provider</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {PROVIDERS.map(p => (
              <button key={p.id} onClick={() => {
                const firstModel = p.models[0];
                setLocal(l => ({ ...l, provider: p.id, model: firstModel }));
              }} style={{
                padding: "10px 14px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                border: local.provider === p.id ? "1.5px solid #f59e0b" : "0.5px solid var(--color-border-secondary)",
                background: local.provider === p.id ? "#f59e0b12" : "var(--color-background-secondary)",
                color: local.provider === p.id ? "#f59e0b" : "var(--color-text-secondary)"
              }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</div>
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{p.models[0]}</div>
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: 5, letterSpacing: 0.5 }}>MODEL</label>
            <select value={local.model} onChange={e => setLocal(l => ({ ...l, model: e.target.value }))} style={{
              width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box",
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)", fontSize: 13
            }}>
              {currentProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: 5, letterSpacing: 0.5 }}>API KEY</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type={showKey ? "text" : "password"}
                value={local.apiKey}
                onChange={e => setLocal(l => ({ ...l, apiKey: e.target.value }))}
                placeholder={`Your ${currentProvider.label} API key…`}
                style={{
                  flex: 1, padding: "9px 12px", borderRadius: 8,
                  border: "0.5px solid var(--color-border-secondary)",
                  background: "var(--color-background-secondary)",
                  color: "var(--color-text-primary)", fontSize: 13, outline: "none", fontFamily: "var(--font-mono)"
                }}
              />
              <button onClick={() => setShowKey(s => !s)} style={{
                padding: "0 12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)",
                background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 12
              }}>{showKey ? "Hide" : "Show"}</button>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6 }}>
              Get your key: <span style={{ color: "#f59e0b" }}>{currentProvider.hint}</span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 16 }}>Preferences</div>
          {[
            { key: "autoSummarize", label: "Auto-summarize new emails", desc: "Generate a summary when you open an email" },
            { key: "dailyDigest",   label: "Daily digest notification",  desc: "Get an AI briefing every morning" },
            { key: "smartReply",    label: "Smart reply suggestions",    desc: "Show 3 quick reply options for each email" },
          ].map(pref => (
            <div key={pref.key} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0", borderBottom: "0.5px solid var(--color-border-tertiary)"
            }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{pref.label}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{pref.desc}</div>
              </div>
              <button onClick={() => setLocal(l => ({ ...l, [pref.key]: !l[pref.key] }))} style={{
                width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                background: local[pref.key] ? "#f59e0b" : "var(--color-background-tertiary)",
                position: "relative", flexShrink: 0, transition: "background 0.2s"
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", background: "white",
                  position: "absolute", top: 3,
                  left: local[pref.key] ? 21 : 3,
                  transition: "left 0.2s"
                }} />
              </button>
            </div>
          ))}
        </div>

        {/* Gmail placeholder */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>Gmail Integration</div>
          <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 14 }}>Connect your Gmail account to enable real email sending, inbox sync, and smart filters.</div>
          <FieldInput label="Gmail API Client ID" value={local.gmailClientId || ""} onChange={e => setLocal(l => ({ ...l, gmailClientId: e.target.value }))} placeholder="Your Google OAuth client ID…" />
          <div style={{ marginTop: 12 }}>
            <Btn disabled full>Connect Gmail (coming soon)</Btn>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Btn primary onClick={save} full>Save Settings</Btn>
          {saved && <span style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>✓ Saved!</span>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
const DEFAULT_AI_CONFIG = {
  provider: "openai",
  model: "gpt-4o-mini",
  apiKey: "",
  autoSummarize: false,
  dailyDigest: true,
  smartReply: true,
  gmailClientId: ""
};

export default function App() {
  const [view, setView]           = useState("dashboard");
  const [emails, setEmails]       = useState(INITIAL_EMAILS);
  const [scheduled, setScheduled] = useState([]);
  const [aiConfig, setAiConfig]   = useState(DEFAULT_AI_CONFIG);

  const unreadCount = emails.filter(e => e.unread).length;

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-6px); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 3px; }
      `}</style>

      <div style={{
        display: "flex", height: "100vh", overflow: "hidden",
        background: "var(--color-background-tertiary)",
        fontFamily: "var(--font-sans)"
      }}>
        <Sidebar view={view} setView={setView} unreadCount={unreadCount} />

        <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
          {view === "dashboard" && (
            <Dashboard
              emails={emails} setView={setView}
              aiConfig={aiConfig} scheduledCount={scheduled.length}
            />
          )}
          {view === "chat"      && <ChatPage aiConfig={aiConfig} />}
          {view === "inbox"     && <InboxPage emails={emails} setEmails={setEmails} aiConfig={aiConfig} />}
          {view === "compose"   && <ComposePage aiConfig={aiConfig} />}
          {view === "scheduler" && <SchedulerPage scheduled={scheduled} setScheduled={setScheduled} aiConfig={aiConfig} />}
          {view === "settings"  && <SettingsPage aiConfig={aiConfig} setAiConfig={setAiConfig} />}
        </main>
      </div>
    </>
  );
}
