import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════
   THEME — light / dark tokens
═══════════════════════════════════════════════════════════ */
const LIGHT = {
  bg:       "#f9fafb",
  surface:  "#ffffff",
  surface2: "#f3f4f6",
  border:   "#e5e7eb",
  text:     "#111827",
  text2:    "#6b7280",
  text3:    "#9ca3af",
};
const DARK = {
  bg:       "#0f172a",
  surface:  "#1e293b",
  surface2: "#0f172a",
  border:   "#334155",
  text:     "#f1f5f9",
  text2:    "#94a3b8",
  text3:    "#64748b",
};
const ACCENT = "#f59e0b";

/* ═══════════════════════════════════════════════════════════
   API — calls our Express backend (never exposes keys)
═══════════════════════════════════════════════════════════ */
async function api(endpoint, body) {
  const res = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Request failed");
  return data;
}

/* ═══════════════════════════════════════════════════════════
   MOCK EMAILS (also served by backend GET /api/emails)
   We load from backend on mount; this is the fallback.
═══════════════════════════════════════════════════════════ */
const FALLBACK_EMAILS = [
  { id:1, from:"Sarah Chen",   addr:"sarah@techcorp.com",  subject:"Q3 Performance Report — Action Required", preview:"Revenue up 23% YoY, NPS improved to 72. Decisions needed on Q4 budget...", body:"Hi team,\n\nPlease review the attached Q3 performance report before our Friday meeting.\n\nKey highlights:\n• Revenue up 23% YoY\n• Customer acquisition cost down 15%\n• NPS score improved to 72\n\nWe need firm decisions on Q4 budget allocation. Please come prepared.\n\nBest,\nSarah", date:"Apr 19, 9:14 AM", unread:true,  starred:true,  tag:"Work"     },
  { id:2, from:"Marcus Rivera", addr:"m.rivera@design.io", subject:"New dashboard mockups ready for review",   preview:"Hey! Finished the redesign. Would love feedback before dev starts...",           body:"Hey!\n\nJust wrapped up the dashboard redesign mockups. Need your feedback before we hand off to dev.\n\nFigma links:\n• Mobile: figma.com/mobile-v3\n• Desktop: figma.com/desktop-v3\n• Components: figma.com/components\n\nWant to walk through on a call?\n\nCheers,\nMarcus",                                  date:"Apr 19, 8:30 AM", unread:true,  starred:false, tag:"Design"   },
  { id:3, from:"Priya Sharma",  addr:"priya@startup.ai",   subject:"Partnership opportunity — AI integration", preview:"Our AI layer reduces manual work by 60%. Open to a 30-min call?",               body:"Dear colleague,\n\nI'm reaching out about a potential partnership.\n\nOur AI integration layer offers:\n• 60% reduction in manual data entry\n• Real-time analytics dashboard\n• Seamless REST API integration\n• SOC 2 Type II certified\n\nWould you be open to a 30-minute call?\n\nBest regards,\nPriya Sharma\nCEO, StartupAI",                                                                    date:"Apr 18, 4:45 PM", unread:false, starred:true,  tag:"Business" },
  { id:4, from:"DevOps Team",   addr:"devops@company.com", subject:"Maintenance window — Saturday 2:00 AM UTC",preview:"All services unavailable 2–5 AM UTC. Complete critical tasks beforehand...",     body:"Hi all,\n\nUpcoming scheduled maintenance:\n\n📅 Date: Saturday, April 21\n⏰ Time: 2:00 AM – 5:00 AM UTC\n⚠️ Impact: All services unavailable\n\nWhat's happening:\n• Database migration to PostgreSQL 16\n• Load balancer certificate rotation\n\nFor urgent issues: devops@company.com\n\nDevOps Team",   date:"Apr 18, 2:00 PM", unread:false, starred:false, tag:"Tech"     },
  { id:5, from:"Jordan Lee",    addr:"jordan@investor.vc", subject:"Follow-up: Series A discussion",           preview:"Partners reviewed your deck — very interested. Next: due diligence & deep-dive.", body:"Hi,\n\nFollowing up from last week. Partners reviewed your deck — very interested.\n\nNext steps:\n1. Due diligence data room\n2. Technical deep-dive with our CTO\n3. Reference checks\n\nTargeting a decision within 3 weeks.\n\nAvailable Tue/Wed afternoon?\n\nJordan Lee\nPartner, Vertex VC",              date:"Apr 17, 11:20 AM",unread:true,  starred:true,  tag:"Finance"  },
  { id:6, from:"GitHub",        addr:"noreply@github.com", subject:"Security alert: high-severity vulnerability",preview:"High-severity CVE detected in lodash@4.17.20. Dependabot PR opened...",       body:"Security Alert\n\nHigh-severity vulnerability (CVE-2026-1234) detected:\n\nRepository: your-org/main-app\nPackage: lodash@4.17.20 → fix: 4.17.21\nSeverity: HIGH\n\nDependabot PR: github.com/your-org/main-app/pull/142\n\nGitHub Security",                                                                date:"Apr 17, 9:05 AM", unread:false, starred:false, tag:"Tech"     },
];

const TAG_COLORS = {
  Work:     { bg:"#dbeafe", fg:"#1e40af" },
  Design:   { bg:"#ede9fe", fg:"#5b21b6" },
  Business: { bg:"#dcfce7", fg:"#166534" },
  Tech:     { bg:"#fef3c7", fg:"#92400e" },
  Finance:  { bg:"#fee2e2", fg:"#991b1b" },
};

const AVATAR_COLORS = ["#f59e0b","#3b82f6","#10b981","#8b5cf6","#ef4444","#06b6d4","#ec4899"];

/* ═══════════════════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════════════════ */
function Avatar({ name, size = 36, idx = 0 }) {
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const initials = name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color+"22", color,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.36, fontWeight:600, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function Tag({ label }) {
  const c = TAG_COLORS[label] || { bg:"#f3f4f6", fg:"#374151" };
  return (
    <span style={{ background:c.bg, color:c.fg, fontSize:10, fontWeight:700,
      padding:"2px 7px", borderRadius:5, letterSpacing:0.4 }}>
      {label.toUpperCase()}
    </span>
  );
}

function Btn({ children, onClick, loading, primary, small, full, disabled, danger }) {
  return (
    <button onClick={onClick} disabled={loading||disabled} style={{
      padding: small ? "6px 12px" : "9px 18px",
      fontSize: small ? 12 : 13, fontWeight:500, borderRadius:8,
      border: primary ? "none" : danger ? "1px solid #fca5a5" : "1px solid #d1d5db",
      background: primary ? ACCENT : danger ? "#fef2f2" : "transparent",
      color: primary ? "#1c1917" : danger ? "#b91c1c" : "inherit",
      cursor: (loading||disabled) ? "not-allowed" : "pointer",
      opacity: (loading||disabled) ? 0.5 : 1,
      display:"inline-flex", alignItems:"center", gap:6,
      width: full ? "100%" : "auto", justifyContent: full ? "center" : "flex-start",
      whiteSpace:"nowrap", transition:"all 0.15s", flexShrink:0,
    }}>
      {loading
        ? <>{[0,1,2].map(i=><span key={i} style={{ width:5,height:5,borderRadius:"50%",
            background:"currentColor", display:"inline-block",
            animation:`bounce 1s ease-in-out ${i*0.2}s infinite` }} />)}</>
        : children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type="text", rows, readOnly, T }) {
  const s = {
    width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${T.border}`,
    background:T.surface2, color:T.text, fontSize:13, fontFamily:"inherit",
    outline:"none", resize:rows?"vertical":"none", lineHeight:1.6,
    boxSizing:"border-box", opacity:readOnly?0.65:1,
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:T.text2, letterSpacing:0.5 }}>{label.toUpperCase()}</label>}
      {rows
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={s} readOnly={readOnly}/>
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={s} readOnly={readOnly}/>
      }
    </div>
  );
}

function AIBox({ content, loading, T }) {
  if (!content && !loading) return null;
  return (
    <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px 16px", marginTop:12 }}>
      <div style={{ fontSize:11, fontWeight:700, color:ACCENT, marginBottom:8, letterSpacing:0.5 }}>✦ AI RESPONSE</div>
      {loading
        ? <div style={{ color:T.text2, fontSize:13 }}>Thinking…</div>
        : <pre style={{ margin:0, fontSize:13, lineHeight:1.7, color:T.text, whiteSpace:"pre-wrap", fontFamily:"inherit" }}>{content}</pre>}
    </div>
  );
}

function PageHeader({ title, subtitle, actions, T }) {
  return (
    <div style={{ padding:"22px 28px 18px", borderBottom:`1px solid ${T.border}`,
      display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
      <div>
        <h1 style={{ margin:0, fontSize:20, fontWeight:600, color:T.text }}>{title}</h1>
        {subtitle && <p style={{ margin:"4px 0 0", fontSize:13, color:T.text2 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:"flex", gap:8, flexShrink:0 }}>{actions}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════ */
const NAV = [
  { id:"dashboard", label:"Dashboard",  icon:"⊡" },
  { id:"chat",      label:"AI Chat",    icon:"◉" },
  { id:"inbox",     label:"Inbox",      icon:"◻" },
  { id:"compose",   label:"Compose",    icon:"✦" },
  { id:"scheduler", label:"Scheduler",  icon:"◷" },
  { id:"settings",  label:"Settings",   icon:"⊛" },
];

function Sidebar({ view, setView, unread, dark, setDark, T }) {
  return (
    <aside style={{ width:210, background:T.surface, borderRight:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", flexShrink:0, height:"100vh", position:"sticky", top:0 }}>

      {/* Brand */}
      <div style={{ padding:"18px 16px 14px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:8,background:ACCENT,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16 }}>✉</div>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:T.text,lineHeight:1.2 }}>MailMind</div>
            <div style={{ fontSize:9,color:T.text3,letterSpacing:1 }}>AI EMAIL AGENT</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:"10px 8px", flex:1 }}>
        {NAV.map(item => {
          const active = view === item.id;
          return (
            <button key={item.id} onClick={()=>setView(item.id)} style={{
              width:"100%", padding:"8px 10px", borderRadius:8, border:"none",
              background: active ? ACCENT+"20" : "transparent",
              color: active ? ACCENT : T.text2,
              cursor:"pointer", display:"flex", alignItems:"center", gap:10,
              fontSize:13, fontWeight:active?600:400, textAlign:"left",
              marginBottom:2, position:"relative",
            }}>
              <span style={{ fontSize:15,width:18,textAlign:"center" }}>{item.icon}</span>
              {item.label}
              {item.id==="inbox" && unread>0 && (
                <span style={{ marginLeft:"auto",background:ACCENT,color:"#1c1917",
                  fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:10 }}>{unread}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: dark mode toggle + user */}
      <div style={{ padding:"10px 12px 16px", borderTop:`1px solid ${T.border}` }}>
        <button onClick={()=>setDark(d=>!d)} style={{
          width:"100%", padding:"7px 10px", borderRadius:8, border:`1px solid ${T.border}`,
          background:"transparent", color:T.text2, cursor:"pointer",
          fontSize:12, display:"flex", alignItems:"center", gap:8, marginBottom:10
        }}>
          {dark?"☀ Light mode":"◑ Dark mode"}
        </button>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <Avatar name="You" size={30} idx={1}/>
          <div>
            <div style={{ fontSize:12,fontWeight:600,color:T.text }}>You</div>
            <div style={{ fontSize:11,color:T.text3 }}>user@email.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════ */
function Dashboard({ emails, setView, aiConfig, scheduledCount, T }) {
  const [briefing, setBriefing]   = useState("");
  const [briefLoad, setBriefLoad] = useState(false);

  const unread  = emails.filter(e=>e.unread).length;
  const starred = emails.filter(e=>e.starred).length;

  async function getDailySummary() {
    setBriefLoad(true); setBriefing("");
    try {
      const { briefing } = await api("ai/daily-summary", { emails, config: aiConfig });
      setBriefing(briefing);
    } catch(e){ setBriefing("⚠ "+e.message); }
    setBriefLoad(false);
  }

  const stats = [
    { label:"Total Emails",   value:emails.length, color:"#3b82f6" },
    { label:"Unread",         value:unread,         color:ACCENT },
    { label:"Starred",        value:starred,        color:"#8b5cf6" },
    { label:"Scheduled",      value:scheduledCount, color:"#10b981" },
  ];

  return (
    <div style={{ paddingBottom:40 }}>
      <PageHeader T={T}
        title="Dashboard"
        subtitle={`Sunday, April 19, 2026 · ${unread} unread`}
        actions={<Btn primary onClick={getDailySummary} loading={briefLoad}>✦ Summarize My Day</Btn>}
      />

      <div style={{ padding:"24px 28px" }}>
        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
          {stats.map(s=>(
            <div key={s.label} style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px" }}>
              <div style={{ fontSize:11,color:T.text2,marginBottom:6,fontWeight:500 }}>{s.label}</div>
              <div style={{ fontSize:30,fontWeight:700,color:s.color,lineHeight:1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <AIBox content={briefing} loading={briefLoad} T={T}/>

        {/* Recent emails + Quick actions */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 280px",gap:20,marginTop:24 }}>
          {/* Email list */}
          <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden" }}>
            <div style={{ padding:"13px 18px",borderBottom:`1px solid ${T.border}`,
              display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:13,fontWeight:600,color:T.text }}>Recent Emails</span>
              <button onClick={()=>setView("inbox")} style={{ fontSize:12,color:ACCENT,background:"none",border:"none",cursor:"pointer" }}>View all →</button>
            </div>
            {emails.slice(0,5).map((em,i)=>(
              <div key={em.id} onClick={()=>setView("inbox")} style={{
                padding:"11px 18px", cursor:"pointer",
                borderBottom: i<4 ? `1px solid ${T.border}` : "none",
                display:"flex", alignItems:"center", gap:12,
                background: em.unread ? T.surface2 : "transparent",
              }}>
                <Avatar name={em.from} size={32} idx={i}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",gap:8 }}>
                    <span style={{ fontSize:13,fontWeight:em.unread?600:400,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{em.from}</span>
                    <span style={{ fontSize:11,color:T.text3,flexShrink:0 }}>{em.date.split(",")[1]?.trim()}</span>
                  </div>
                  <div style={{ fontSize:12,color:T.text2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2 }}>{em.subject}</div>
                </div>
                {em.unread && <div style={{ width:7,height:7,borderRadius:"50%",background:ACCENT,flexShrink:0 }}/>}
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px" }}>
            <div style={{ fontSize:13,fontWeight:600,color:T.text,marginBottom:14 }}>Quick Actions</div>
            {[
              { label:"Open AI Chat",    icon:"◉", page:"chat",      desc:"Ask anything" },
              { label:"Compose Email",   icon:"✦", page:"compose",   desc:"AI-powered drafts" },
              { label:"View Inbox",      icon:"◻", page:"inbox",     desc:`${unread} unread` },
              { label:"Schedule Email",  icon:"◷", page:"scheduler", desc:"Set reminders" },
            ].map(a=>(
              <button key={a.page} onClick={()=>setView(a.page)} style={{
                width:"100%", padding:"10px 12px", borderRadius:8,
                border:`1px solid ${T.border}`, background:T.surface2,
                cursor:"pointer", textAlign:"left", display:"flex",
                alignItems:"center", gap:10, marginBottom:8,
              }}>
                <span style={{ fontSize:16,color:ACCENT }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize:12,fontWeight:600,color:T.text }}>{a.label}</div>
                  <div style={{ fontSize:11,color:T.text3 }}>{a.desc}</div>
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
const CHAT_SYSTEM = `You are MailMind, an expert AI email productivity assistant. Help users:
- Summarize and analyse emails
- Draft professional replies (any tone)
- Schedule tasks and set reminders
- Give email strategy and productivity advice
Be conversational, sharp, and concise.`;

const QUICK_PROMPTS = [
  "Draft a polite follow-up email",
  "How do I write a cold email that converts?",
  "Help me decline a meeting professionally",
  "Write a thank-you note after a job interview",
];

function ChatPage({ aiConfig, T }) {
  const [msgs, setMsgs]     = useState([
    { role:"ai", text:"Hey! I'm MailMind, your AI email assistant ✦\n\nI can draft emails, summarize your inbox, suggest replies, and more. What do you need?" }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const updated = [...msgs, { role:"user", text }];
    setMsgs(updated);
    setLoading(true);
    try {
      // Build conversation context
      const context = updated.slice(-8).map(m=>`${m.role==="user"?"User":"Assistant"}: ${m.text}`).join("\n\n");
      const { reply } = await api("ai/chat", { message: context, system: CHAT_SYSTEM, config: aiConfig });
      setMsgs(prev => [...prev, { role:"ai", text: reply }]);
    } catch(e) {
      setMsgs(prev => [...prev, { role:"ai", text:"⚠ "+e.message }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100vh" }}>
      <PageHeader T={T} title="AI Chat" subtitle="Ask anything about email, drafting, scheduling…"
        actions={<Btn small T={T} onClick={()=>setMsgs([{ role:"ai", text:"Chat cleared! How can I help?" }])}>Clear</Btn>}
      />

      <div style={{ flex:1,overflow:"auto",padding:"20px 28px" }}>
        {/* Quick prompts */}
        {msgs.length===1 && (
          <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:20 }}>
            {QUICK_PROMPTS.map(q=>(
              <button key={q} onClick={()=>setInput(q)} style={{
                padding:"7px 13px",fontSize:12,borderRadius:20,
                border:`1px solid ${T.border}`, background:T.surface2,
                color:T.text2, cursor:"pointer"
              }}>{q}</button>
            ))}
          </div>
        )}

        {msgs.map((m,i)=>(
          <div key={i} style={{ display:"flex",gap:10,marginBottom:16,justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            {m.role==="ai" && (
              <div style={{ width:30,height:30,borderRadius:"50%",background:ACCENT+"22",
                display:"flex",alignItems:"center",justifyContent:"center",color:ACCENT,flexShrink:0 }}>✦</div>
            )}
            <div style={{
              maxWidth:"72%", padding:"11px 15px", borderRadius:12,
              background: m.role==="user" ? ACCENT : T.surface,
              border: m.role==="user" ? "none" : `1px solid ${T.border}`,
              color: m.role==="user" ? "#1c1917" : T.text,
              fontSize:13, lineHeight:1.65,
              borderBottomRightRadius: m.role==="user" ? 4 : 12,
              borderBottomLeftRadius:  m.role==="ai"   ? 4 : 12,
            }}>
              <pre style={{ margin:0,fontFamily:"inherit",whiteSpace:"pre-wrap" }}>{m.text}</pre>
            </div>
            {m.role==="user" && <Avatar name="You" size={30} idx={1}/>}
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex",gap:10,marginBottom:16 }}>
            <div style={{ width:30,height:30,borderRadius:"50%",background:ACCENT+"22",
              display:"flex",alignItems:"center",justifyContent:"center",color:ACCENT }}>✦</div>
            <div style={{ padding:"12px 16px",borderRadius:12,borderBottomLeftRadius:4,
              background:T.surface,border:`1px solid ${T.border}`,display:"flex",gap:5,alignItems:"center" }}>
              {[0,1,2].map(i=>(
                <div key={i} style={{ width:7,height:7,borderRadius:"50%",background:ACCENT,
                  animation:`bounce 1s ease-in-out ${i*0.18}s infinite` }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:"14px 28px 20px",borderTop:`1px solid ${T.border}`,background:T.surface }}>
        <div style={{ display:"flex",gap:10 }}>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }}
            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
            rows={2}
            style={{ flex:1,padding:"10px 14px",borderRadius:10,fontSize:13,
              border:`1px solid ${T.border}`,background:T.surface2,color:T.text,
              fontFamily:"inherit",resize:"none",outline:"none",lineHeight:1.5 }}
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
function InboxPage({ emails, setEmails, aiConfig, T }) {
  const [selected,     setSelected]     = useState(null);
  const [filter,       setFilter]       = useState("all");
  const [summary,      setSummary]      = useState("");
  const [sumLoad,      setSumLoad]      = useState(false);
  const [draft,        setDraft]        = useState("");
  const [draftLoad,    setDraftLoad]    = useState(false);
  const [tone,         setTone]         = useState("formal");

  const filtered = emails.filter(e=>
    filter==="unread"  ? e.unread  :
    filter==="starred" ? e.starred : true
  );

  function openEmail(em) {
    setSelected(em);
    setSummary(""); setDraft("");
    if (em.unread) setEmails(prev=>prev.map(e=>e.id===em.id?{...e,unread:false}:e));
  }

  async function summarize() {
    setSumLoad(true); setSummary("");
    try {
      const { summary } = await api("ai/summarize", {
        emailBody: selected.body, from: selected.from, subject: selected.subject, config: aiConfig
      });
      setSummary(summary);
    } catch(e){ setSummary("⚠ "+e.message); }
    setSumLoad(false);
  }

  async function generateReply() {
    setDraftLoad(true); setDraft("");
    try {
      const { draft } = await api("ai/reply", {
        emailBody: selected.body, from: selected.from, subject: selected.subject, tone, config: aiConfig
      });
      setDraft(draft);
    } catch(e){ setDraft("⚠ "+e.message); }
    setDraftLoad(false);
  }

  return (
    <div style={{ display:"flex",height:"100vh" }}>
      {/* List */}
      <div style={{ width:320,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0 }}>
        <div style={{ padding:"14px 14px 10px",borderBottom:`1px solid ${T.border}` }}>
          <h2 style={{ margin:"0 0 10px",fontSize:16,fontWeight:600,color:T.text }}>Inbox</h2>
          <div style={{ display:"flex",gap:6 }}>
            {["all","unread","starred"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{
                padding:"4px 11px",borderRadius:20,fontSize:11,fontWeight:600,
                border:`1px solid ${T.border}`,
                background: filter===f ? ACCENT : "transparent",
                color: filter===f ? "#1c1917" : T.text2, cursor:"pointer"
              }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
            ))}
          </div>
        </div>
        <div style={{ flex:1,overflow:"auto" }}>
          {filtered.map((em,i)=>(
            <div key={em.id} onClick={()=>openEmail(em)} style={{
              padding:"11px 14px",cursor:"pointer",
              borderBottom:`1px solid ${T.border}`,
              background: selected?.id===em.id ? ACCENT+"15" : em.unread ? T.surface2 : "transparent",
              borderLeft: selected?.id===em.id ? `2.5px solid ${ACCENT}` : "2.5px solid transparent",
            }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                <Avatar name={em.from} size={34} idx={i}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",gap:6,marginBottom:3 }}>
                    <span style={{ fontSize:13,fontWeight:em.unread?700:400,color:T.text,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{em.from}</span>
                    <span style={{ fontSize:10,color:T.text3,flexShrink:0 }}>{em.date.split(",")[1]?.trim()}</span>
                  </div>
                  <div style={{ fontSize:12,fontWeight:em.unread?500:400,color:T.text2,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:5 }}>{em.subject}</div>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <Tag label={em.tag}/>
                    {em.starred && <span style={{ color:ACCENT,fontSize:12 }}>★</span>}
                    {em.unread  && <div style={{ width:6,height:6,borderRadius:"50%",background:ACCENT,marginLeft:"auto" }}/>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex:1,overflow:"auto" }}>
        {!selected ? (
          <div style={{ height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:T.text3 }}>
            <div style={{ fontSize:48,marginBottom:12,opacity:0.2 }}>◻</div>
            <div style={{ fontSize:14 }}>Select an email to read</div>
          </div>
        ) : (
          <div style={{ padding:"24px 28px" }}>
            {/* Header */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:10 }}>
                <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:T.text,lineHeight:1.3 }}>{selected.subject}</h2>
                <Tag label={selected.tag}/>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <Avatar name={selected.from} size={32} idx={emails.findIndex(e=>e.id===selected.id)}/>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{selected.from}</div>
                  <div style={{ fontSize:12,color:T.text3 }}>{selected.addr} · {selected.date}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"18px 20px",marginBottom:16 }}>
              <pre style={{ margin:0,fontSize:13,lineHeight:1.8,color:T.text,whiteSpace:"pre-wrap",fontFamily:"inherit" }}>
                {selected.body}
              </pre>
            </div>

            {/* AI Tools */}
            <div style={{ background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 18px" }}>
              <div style={{ fontSize:11,fontWeight:700,color:T.text3,marginBottom:12,letterSpacing:0.5 }}>✦ AI TOOLS</div>
              <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                <Btn small onClick={summarize} loading={sumLoad}>✦ Summarize</Btn>
                <select value={tone} onChange={e=>setTone(e.target.value)} style={{
                  padding:"6px 10px",borderRadius:8,fontSize:12,
                  border:`1px solid ${T.border}`,background:T.surface,color:T.text,cursor:"pointer"
                }}>
                  <option value="formal">Formal reply</option>
                  <option value="casual">Casual reply</option>
                  <option value="short">Short reply</option>
                  <option value="assertive">Assertive reply</option>
                </select>
                <Btn small onClick={generateReply} loading={draftLoad}>Generate Reply</Btn>
              </div>

              {(summary||sumLoad) && (
                <div style={{ marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11,fontWeight:700,color:ACCENT,marginBottom:8,letterSpacing:0.5 }}>SUMMARY</div>
                  {sumLoad
                    ? <div style={{ fontSize:13,color:T.text2 }}>Analysing…</div>
                    : <pre style={{ margin:0,fontSize:13,lineHeight:1.65,color:T.text,whiteSpace:"pre-wrap",fontFamily:"inherit" }}>{summary}</pre>}
                </div>
              )}

              {(draft||draftLoad) && (
                <div style={{ marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:ACCENT,letterSpacing:0.5 }}>DRAFTED REPLY</div>
                    {draft && (
                      <button onClick={()=>navigator.clipboard?.writeText(draft)}
                        style={{ fontSize:11,color:T.text2,background:"none",border:"none",cursor:"pointer" }}>Copy</button>
                    )}
                  </div>
                  {draftLoad
                    ? <div style={{ fontSize:13,color:T.text2 }}>Drafting…</div>
                    : <pre style={{ margin:0,fontSize:13,lineHeight:1.65,color:T.text,whiteSpace:"pre-wrap",fontFamily:"inherit" }}>{draft}</pre>}
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
function ComposePage({ aiConfig, T }) {
  const [to,      setTo]      = useState("");
  const [subject, setSubject] = useState("");
  const [body,    setBody]    = useState("");
  const [tone,    setTone]    = useState("formal");
  const [ctx,     setCtx]     = useState("");
  const [draftL,  setDraftL]  = useState(false);
  const [sent,    setSent]    = useState(false);

  async function generateDraft() {
    setDraftL(true);
    try {
      const { draft } = await api("ai/draft", { to, subject, context: ctx, tone, config: aiConfig });
      setBody(draft);
    } catch(e){ setBody("⚠ "+e.message); }
    setDraftL(false);
  }

  async function handleSend() {
    try {
      await api("emails/send", { to, subject, body });
      setSent(true);
      setTimeout(()=>{ setSent(false); setTo(""); setSubject(""); setBody(""); setCtx(""); }, 3000);
    } catch(e){ alert("Send failed: "+e.message); }
  }

  if (sent) return (
    <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center",background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:"40px 48px" }}>
        <div style={{ fontSize:40,color:"#10b981",marginBottom:12 }}>✓</div>
        <div style={{ fontSize:18,fontWeight:600,color:T.text }}>Email sent!</div>
        <div style={{ fontSize:13,color:T.text2,marginTop:6 }}>Your message has been delivered.</div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom:40 }}>
      <PageHeader T={T} title="Compose" subtitle="Write or AI-draft an email"/>
      <div style={{ padding:"24px 28px",display:"grid",gridTemplateColumns:"1fr 290px",gap:20 }}>

        {/* Compose form */}
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <Field T={T} label="To"      value={to}      onChange={e=>setTo(e.target.value)}      placeholder="recipient@email.com"/>
          <Field T={T} label="Subject" value={subject}  onChange={e=>setSubject(e.target.value)} placeholder="Email subject…"/>
          <Field T={T} label="Body"    value={body}     onChange={e=>setBody(e.target.value)}    placeholder="Write your message here, or click ✦ Generate Draft →" rows={14} multiline/>
          <div style={{ display:"flex",gap:10 }}>
            <Btn primary onClick={handleSend} disabled={!to||!subject||!body} full>Send Email</Btn>
            <Btn onClick={()=>{ setTo(""); setSubject(""); setBody(""); setCtx(""); }}>Clear</Btn>
          </div>
        </div>

        {/* AI panel */}
        <div style={{ background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px",display:"flex",flexDirection:"column",gap:14,height:"fit-content" }}>
          <div style={{ fontSize:13,fontWeight:600,color:T.text }}>✦ AI Draft Assistant</div>
          <div>
            <label style={{ fontSize:11,fontWeight:700,color:T.text2,display:"block",marginBottom:6,letterSpacing:0.5 }}>TONE</label>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
              {["formal","casual","persuasive","brief"].map(t=>(
                <button key={t} onClick={()=>setTone(t)} style={{
                  padding:"8px",borderRadius:7,fontSize:12,fontWeight:500,
                  border:`1px solid ${T.border}`,
                  background: tone===t ? ACCENT : T.surface,
                  color: tone===t ? "#1c1917" : T.text2,
                  cursor:"pointer",textTransform:"capitalize"
                }}>{t}</button>
              ))}
            </div>
          </div>
          <Field T={T} label="Extra context (optional)" value={ctx} onChange={e=>setCtx(e.target.value)}
            placeholder="e.g. follow up on yesterday's call, be apologetic, mention the deadline..." rows={3} multiline/>
          <Btn primary onClick={generateDraft} loading={draftL} disabled={!subject&&!ctx} full>✦ Generate Draft</Btn>
          <div style={{ fontSize:11,color:T.text3,lineHeight:1.6 }}>
            Fill in To/Subject above, optionally add context, then click Generate.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCHEDULER PAGE
═══════════════════════════════════════════════════════════ */
const REPEAT_BADGE = { once:"ONCE", daily:"DAILY ∞", weekly:"WEEKLY ↻", monthly:"MONTHLY ◷" };

function SchedulerPage({ scheduled, setScheduled, aiConfig, T }) {
  const [to,       setTo]      = useState("");
  const [subject,  setSubject] = useState("");
  const [body,     setBody]    = useState("");
  const [dateTime, setDateTime]= useState("");
  const [repeat,   setRepeat]  = useState("once");
  const [draftL,   setDraftL]  = useState(false);

  async function autoFill() {
    if (!subject) return;
    setDraftL(true);
    try {
      const { draft } = await api("ai/schedule-draft", { to, subject, repeat, config: aiConfig });
      setBody(draft);
    } catch(e){ setBody("⚠ "+e.message); }
    setDraftL(false);
  }

  function scheduleEmail() {
    if (!to||!subject||!dateTime) return;
    setScheduled(prev=>[{ id:Date.now(),to,subject,body,dateTime,repeat,status:"scheduled" },...prev]);
    setTo(""); setSubject(""); setBody(""); setDateTime(""); setRepeat("once");
  }

  return (
    <div style={{ paddingBottom:40 }}>
      <PageHeader T={T} title="Scheduler" subtitle="Schedule emails and automated routines"/>
      <div style={{ padding:"24px 28px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:24 }}>

        {/* Form */}
        <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px",display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ fontSize:13,fontWeight:600,color:T.text,marginBottom:4 }}>New Scheduled Email</div>
          <Field T={T} label="To"      value={to}      onChange={e=>setTo(e.target.value)}      placeholder="recipient@email.com"/>
          <Field T={T} label="Subject" value={subject}  onChange={e=>setSubject(e.target.value)} placeholder="Email subject…"/>

          <div>
            <label style={{ fontSize:11,fontWeight:700,color:T.text2,display:"block",marginBottom:5,letterSpacing:0.5 }}>SEND DATE & TIME</label>
            <input type="datetime-local" value={dateTime} onChange={e=>setDateTime(e.target.value)}
              style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${T.border}`,
                background:T.surface2,color:T.text,fontSize:13,outline:"none",boxSizing:"border-box" }}/>
          </div>

          <div>
            <label style={{ fontSize:11,fontWeight:700,color:T.text2,display:"block",marginBottom:5,letterSpacing:0.5 }}>REPEAT</label>
            <select value={repeat} onChange={e=>setRepeat(e.target.value)} style={{
              width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${T.border}`,
              background:T.surface2,color:T.text,fontSize:13,boxSizing:"border-box"
            }}>
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <Field T={T} label="Body" value={body} onChange={e=>setBody(e.target.value)} placeholder="Email body…" rows={5} multiline/>
          <Btn small onClick={autoFill} loading={draftL} disabled={!subject}>✦ AI Draft Body</Btn>
          <Btn primary onClick={scheduleEmail} disabled={!to||!subject||!dateTime} full>Schedule Email</Btn>
        </div>

        {/* Scheduled list */}
        <div>
          <div style={{ fontSize:13,fontWeight:600,color:T.text,marginBottom:14 }}>
            Scheduled ({scheduled.length})
          </div>

          {scheduled.length===0 ? (
            <div style={{ border:`1.5px dashed ${T.border}`,borderRadius:12,padding:"40px",textAlign:"center",color:T.text3 }}>
              <div style={{ fontSize:32,marginBottom:8,opacity:0.3 }}>◷</div>
              <div style={{ fontSize:13 }}>No scheduled emails yet</div>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:24 }}>
              {scheduled.map(s=>(
                <div key={s.id} style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 16px" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2 }}>{s.subject}</div>
                      <div style={{ fontSize:12,color:T.text2,marginBottom:6 }}>To: {s.to}</div>
                      <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                        <span style={{ fontSize:11,color:T.text3 }}>
                          {new Date(s.dateTime).toLocaleString("en-US",{ month:"short",day:"numeric",hour:"2-digit",minute:"2-digit" })}
                        </span>
                        <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,background:"#fef3c7",color:"#92400e" }}>
                          {REPEAT_BADGE[s.repeat]}
                        </span>
                        <span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,background:"#dcfce7",color:"#166534" }}>SCHEDULED</span>
                      </div>
                    </div>
                    <button onClick={()=>setScheduled(p=>p.filter(x=>x.id!==s.id))}
                      style={{ background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:18,padding:"0 4px",flexShrink:0 }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Routine templates */}
          <div style={{ fontSize:11,fontWeight:700,color:T.text3,marginBottom:10,letterSpacing:0.5 }}>ROUTINE TEMPLATES</div>
          {[
            { name:"Daily Inbox Digest",  desc:"Every morning at 8AM",  icon:"☀", color:"#f59e0b" },
            { name:"Weekly Status Report",desc:"Every Sunday at 6PM",   icon:"📊", color:"#3b82f6" },
            { name:"Follow-up Reminder",  desc:"3 days after key emails",icon:"↩", color:"#10b981" },
          ].map(r=>(
            <div key={r.name} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
              background:T.surface2,borderRadius:8,border:`1px solid ${T.border}`,marginBottom:8 }}>
              <span style={{ fontSize:18 }}>{r.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:600,color:T.text }}>{r.name}</div>
                <div style={{ fontSize:11,color:T.text3 }}>{r.desc}</div>
              </div>
              <button style={{ padding:"4px 10px",fontSize:11,borderRadius:6,border:`1px solid ${T.border}`,
                background:"transparent",color:T.text2,cursor:"pointer" }}>Enable</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════════════════════════ */
const PROVIDERS = [
  { id:"openai",   label:"OpenAI",       models:["gpt-4o","gpt-4o-mini","gpt-4-turbo"],                       hint:"platform.openai.com/api-keys" },
  { id:"groq",     label:"Groq (Free)",  models:["llama-3.3-70b-versatile","mixtral-8x7b-32768","gemma2-9b-it"],hint:"console.groq.com/keys" },
  { id:"together", label:"Together AI",  models:["meta-llama/Llama-3-70b-chat-hf","mistralai/Mixtral-8x7B"],  hint:"api.together.xyz" },
  { id:"gemini",   label:"Gemini",       models:["gemini-1.5-flash","gemini-1.5-pro","gemini-pro"],            hint:"aistudio.google.com/app/apikey" },
];

function SettingsPage({ aiConfig, setAiConfig, T }) {
  const [local,   setLocal]   = useState({...aiConfig});
  const [saved,   setSaved]   = useState(false);
  const [showKey, setShowKey] = useState(false);

  const prov = PROVIDERS.find(p=>p.id===local.provider) || PROVIDERS[0];

  function save() {
    setAiConfig({...local});
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  }

  return (
    <div style={{ paddingBottom:40 }}>
      <PageHeader T={T} title="Settings" subtitle="Configure your AI provider and preferences"/>
      <div style={{ padding:"24px 28px",maxWidth:640,display:"flex",flexDirection:"column",gap:20 }}>

        {/* Provider */}
        <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px" }}>
          <div style={{ fontSize:13,fontWeight:600,color:T.text,marginBottom:16 }}>AI Provider</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16 }}>
            {PROVIDERS.map(p=>(
              <button key={p.id} onClick={()=>setLocal(l=>({...l,provider:p.id,model:p.models[0]}))} style={{
                padding:"10px 14px",borderRadius:8,textAlign:"left",cursor:"pointer",
                border: local.provider===p.id ? `1.5px solid ${ACCENT}` : `1px solid ${T.border}`,
                background: local.provider===p.id ? ACCENT+"15" : T.surface2,
                color: local.provider===p.id ? ACCENT : T.text2,
              }}>
                <div style={{ fontSize:13,fontWeight:600 }}>{p.label}</div>
                <div style={{ fontSize:10,marginTop:2,opacity:0.7 }}>{p.models[0]}</div>
              </button>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11,fontWeight:700,color:T.text2,display:"block",marginBottom:5,letterSpacing:0.5 }}>MODEL</label>
            <select value={local.model} onChange={e=>setLocal(l=>({...l,model:e.target.value}))} style={{
              width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${T.border}`,
              background:T.surface2,color:T.text,fontSize:13,boxSizing:"border-box"
            }}>
              {prov.models.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize:11,fontWeight:700,color:T.text2,display:"block",marginBottom:5,letterSpacing:0.5 }}>API KEY</label>
            <div style={{ display:"flex",gap:8 }}>
              <input type={showKey?"text":"password"} value={local.apiKey||""}
                onChange={e=>setLocal(l=>({...l,apiKey:e.target.value}))}
                placeholder={`Your ${prov.label} API key…`}
                style={{ flex:1,padding:"9px 12px",borderRadius:8,border:`1px solid ${T.border}`,
                  background:T.surface2,color:T.text,fontSize:13,outline:"none",fontFamily:"monospace" }}
              />
              <button onClick={()=>setShowKey(s=>!s)} style={{
                padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,
                background:"transparent",color:T.text2,cursor:"pointer",fontSize:12
              }}>{showKey?"Hide":"Show"}</button>
            </div>
            <div style={{ fontSize:11,color:T.text3,marginTop:6 }}>
              Get your key at: <span style={{ color:ACCENT }}>{prov.hint}</span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px" }}>
          <div style={{ fontSize:13,fontWeight:600,color:T.text,marginBottom:16 }}>Preferences</div>
          {[
            { key:"dailyDigest",  label:"Daily digest",       desc:"AI briefing every morning" },
            { key:"smartReply",   label:"Smart reply hints",   desc:"3 quick reply options per email" },
            { key:"autoSummarize",label:"Auto-summarize",      desc:"Generate summary when opening email" },
          ].map(pref=>(
            <div key={pref.key} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"12px 0",borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:13,color:T.text }}>{pref.label}</div>
                <div style={{ fontSize:11,color:T.text3 }}>{pref.desc}</div>
              </div>
              <button onClick={()=>setLocal(l=>({...l,[pref.key]:!l[pref.key]}))} style={{
                width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",
                background:local[pref.key] ? ACCENT : T.border,
                position:"relative",flexShrink:0,transition:"background 0.2s"
              }}>
                <div style={{ width:16,height:16,borderRadius:"50%",background:"white",
                  position:"absolute",top:3,left:local[pref.key]?21:3,transition:"left 0.2s" }}/>
              </button>
            </div>
          ))}
        </div>

        {/* Gmail placeholder */}
        <div style={{ background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px" }}>
          <div style={{ fontSize:13,fontWeight:600,color:T.text,marginBottom:4 }}>Gmail Integration</div>
          <div style={{ fontSize:12,color:T.text3,marginBottom:14,lineHeight:1.6 }}>
            Connect Gmail for real sending and inbox sync. Paste your Google OAuth Client ID to get started.
          </div>
          <Field T={T} label="Gmail OAuth Client ID" value={local.gmailClientId||""} onChange={e=>setLocal(l=>({...l,gmailClientId:e.target.value}))} placeholder="Your Google Cloud OAuth client ID…"/>
          <div style={{ marginTop:12 }}>
            <Btn disabled full>Connect Gmail (coming soon)</Btn>
          </div>
        </div>

        {/* Save */}
        <div style={{ display:"flex",gap:12,alignItems:"center" }}>
          <Btn primary onClick={save} full>Save Settings</Btn>
          {saved && <span style={{ fontSize:13,color:"#10b981",fontWeight:600 }}>✓ Saved!</span>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
const DEFAULT_CONFIG = {
  provider:"openai", model:"gpt-4o-mini", apiKey:"",
  dailyDigest:true, smartReply:true, autoSummarize:false, gmailClientId:""
};

export default function App() {
  const [view,      setView]      = useState("dashboard");
  const [emails,    setEmails]    = useState(FALLBACK_EMAILS);
  const [scheduled, setScheduled] = useState([]);
  const [aiConfig,  setAiConfig]  = useState(DEFAULT_CONFIG);
  const [dark,      setDark]      = useState(false);

  // Try to load emails from backend on mount
  useEffect(()=>{
    fetch("/api/emails")
      .then(r=>r.json())
      .then(d=>{ if(d.emails?.length) setEmails(d.emails); })
      .catch(()=>{}); // silently use fallback data
  }, []);

  const T = dark ? DARK : LIGHT;

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform:translateY(0); opacity:0.4; }
          40%          { transform:translateY(-6px); opacity:1; }
        }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track  { background:transparent; }
        ::-webkit-scrollbar-thumb  { background:${T.border}; border-radius:3px; }
      `}</style>

      <div style={{ display:"flex",height:"100vh",overflow:"hidden",
        background:T.bg, color:T.text, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>

        <Sidebar view={view} setView={setView} unread={emails.filter(e=>e.unread).length}
          dark={dark} setDark={setDark} T={T}/>

        <main style={{ flex:1,overflow:"auto",minWidth:0 }}>
          {view==="dashboard" && <Dashboard emails={emails} setView={setView} aiConfig={aiConfig} scheduledCount={scheduled.length} T={T}/>}
          {view==="chat"      && <ChatPage aiConfig={aiConfig} T={T}/>}
          {view==="inbox"     && <InboxPage emails={emails} setEmails={setEmails} aiConfig={aiConfig} T={T}/>}
          {view==="compose"   && <ComposePage aiConfig={aiConfig} T={T}/>}
          {view==="scheduler" && <SchedulerPage scheduled={scheduled} setScheduled={setScheduled} aiConfig={aiConfig} T={T}/>}
          {view==="settings"  && <SettingsPage aiConfig={aiConfig} setAiConfig={setAiConfig} T={T}/>}
        </main>
      </div>
    </>
  );
}
