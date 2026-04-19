// server/routes/emails.js - Gmail API Integration
const express = require("express");
const router  = express.Router();
const fs      = require("fs");
const path    = require("path");
const nodemailer = require("nodemailer");

// Gmail OAuth2 Config
const configPath = path.join(__dirname, "..", "gmail-config.json");

function loadGmailConfig() {
  if (!fs.existsSync(configPath)) return null;
  try { return JSON.parse(fs.readFileSync(configPath, "utf8")); } 
  catch { return null; }
}

function saveGmailConfig(c) { fs.writeFileSync(configPath, JSON.stringify(c, null, 2), "utf8"); }
function deleteGmailConfig() { if (fs.existsSync(configPath)) fs.unlinkSync(configPath); }

// Real Gmail Sending
async function sendGmail(to, subject, body) {
  const c = loadGmailConfig();
  if (!c) throw new Error("Gmail API not configured. Set up in Settings.");
  
  const trans = nodemailer.createTransport({
    service: "gmail",
    auth: { type: "OAuth2", user: c.userEmail, clientId: c.clientId, clientSecret: c.clientSecret, refreshToken: c.refreshToken }
  });
  await trans.sendMail({ from: c.userEmail, to, subject, text: body });
}

// Email Storage
let emails = [
  { id:1, from:"Sarah Chen",   addr:"sarah@techcorp.com",  subject:"Q3 Performance Report", body:"Hi team,\n\nPlease review Q3 report.\n\nBest,\nSarah", date:"Apr 19, 9:14 AM", unread:true,  starred:true,  tag:"Work" },
  { id:2, from:"Marcus Rivera", addr:"m.rivera@design.io", subject:"Dashboard mockups ready", body:"Hey!\n\nFinished redesign.\n\nCheers,\nMarcus", date:"Apr 19, 8:30 AM", unread:true,  starred:false, tag:"Design" },
  { id:3, from:"Priya Sharma",  addr:"priya@startup.ai",   subject:"Partnership opportunity", body:"Dear colleague,\n\nPartnership inquiry.\n\nBest regards,\nPriya", date:"Apr 18, 4:45 PM", unread:false, starred:true,  tag:"Business" },
  { id:4, from:"DevOps Team",   addr:"devops@company.com", subject:"Maintenance window", body:"Hi all,\n\nScheduled maintenance Saturday.\n\nDevOps Team", date:"Apr 18, 2:00 PM", unread:false, starred:false, tag:"Tech" },
  { id:5, from:"Jordan Lee",    addr:"jordan@investor.vc", subject:"Series A follow-up", body:"Hi,\n\nPartners interested.\n\nJordan Lee", date:"Apr 17, 11:20 AM",unread:true,  starred:true,  tag:"Finance" },
  { id:6, from:"GitHub",        addr:"noreply@github.com", subject:"Security alert", body:"Security Alert\n\nHigh-severity CVE detected.\n\nGitHub Security", date:"Apr 17, 9:05 AM", unread:false, starred:false, tag:"Tech" },
];

let scheduled = [];
const scheduledPath = path.join(__dirname, "..", "scheduled-emails.json");

function loadScheduled() {
  if (fs.existsSync(scheduledPath)) {
    try { scheduled = JSON.parse(fs.readFileSync(scheduledPath, "utf8")); } 
    catch { scheduled = []; }
  }
}
function saveScheduled() { fs.writeFileSync(scheduledPath, JSON.stringify(scheduled, null, 2), "utf8"); }
loadScheduled();

// Scheduler
let schedulerInterval = null;
function startScheduler() {
  if (schedulerInterval) return;
  schedulerInterval = setInterval(async () => {
    const now = new Date();
    const due = scheduled.filter(s => new Date(s.dateTime) <= now && s.status === "scheduled");
    for (const email of due) {
      try {
        await sendGmail(email.to, email.subject, email.body);
        console.log("[SCHEDULED] Sent: " + email.subject);
        const idx = scheduled.findIndex(s => s.id === email.id);
        if (idx !== -1) {
          if (email.repeat === "once") scheduled.splice(idx, 1);
          else {
            const nextDate = new Date(email.dateTime);
            if (email.repeat === "daily") nextDate.setDate(nextDate.getDate() + 1);
            if (email.repeat === "weekly") nextDate.setDate(nextDate.getDate() + 7);
            if (email.repeat === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
            scheduled[idx].dateTime = nextDate.toISOString();
          }
        }
      } catch (err) { console.error("[SCHEDULED] Error:", err.message); }
    }
    saveScheduled();
  }, 30000);
}
startScheduler();

// Routes
router.get("/setup", (req, res) => {
  const config = loadGmailConfig();
  res.json({ connected: !!config, config: config ? { userEmail: config.userEmail } : null });
});

router.post("/setup/connect", async (req, res) => {
  try {
    const { clientId, clientSecret, refreshToken, userEmail } = req.body;
    if (!clientId || !clientSecret || !refreshToken || !userEmail) return res.status(400).json({ error: "All fields required" });
    saveGmailConfig({ clientId, clientSecret, refreshToken, userEmail });
    await sendGmail(userEmail, "MailMind Test", "Gmail API connected!");
    res.json({ connected: true, config: { userEmail } });
  } catch (err) { deleteGmailConfig(); res.status(500).json({ error: err.message }); }
});

router.post("/setup/disconnect", (req, res) => { deleteGmailConfig(); res.json({ connected: false }); });

router.get("/", (req, res) => { res.json({ emails }); });
router.get("/scheduled", (req, res) => { res.json({ scheduled }); });

router.post("/send", async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) return res.status(400).json({ error: "to, subject, body required" });
  try { await sendGmail(to, subject, body); res.json({ success: true, message: "Email sent." }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/schedule", (req, res) => {
  const { to, subject, body, dateTime, repeat } = req.body;
  if (!to || !subject || !dateTime) return res.status(400).json({ error: "to, subject, dateTime required" });
  scheduled.unshift({ id: Date.now(), to, subject, body: body || "", dateTime, repeat: repeat || "once", status: "scheduled" });
  saveScheduled(); res.json({ success: true });
});

router.delete("/scheduled/:id", (req, res) => {
  scheduled = scheduled.filter(e => e.id !== parseInt(req.params.id));
  saveScheduled(); res.json({ success: true });
});

module.exports = router;
