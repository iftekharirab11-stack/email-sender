// server/routes/emails.js
const express = require("express");
const router  = express.Router();
const fs      = require("fs");
const path    = require("path");
const nodemailer = require("nodemailer");

const configPath = path.join(__dirname, "..", "email-config.json");

function loadEmailConfig() {
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    return null;
  }
}

function saveEmailConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

function deleteEmailConfig() {
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}

function createTransport(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: !!config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

let emails = [
  { id:1, from:"Sarah Chen",   addr:"sarah@techcorp.com",  subject:"Q3 Performance Report — Action Required", preview:"Revenue up 23% YoY, NPS improved to 72...", body:"Hi team,\n\nPlease review the attached Q3 performance report before our Friday meeting.\n\nKey highlights:\n• Revenue up 23% YoY\n• Customer acquisition cost down 15%\n• NPS score improved to 72\n\nWe need firm decisions on Q4 budget allocation.\n\nBest,\nSarah", date:"Apr 19, 9:14 AM", unread:true,  starred:true,  tag:"Work"     },
  { id:2, from:"Marcus Rivera", addr:"m.rivera@design.io", subject:"New dashboard mockups ready for review",   preview:"Hey! Finished the redesign...", body:"Hey!\n\nJust wrapped up the dashboard redesign mockups.\n\nFigma links:\n• Mobile: figma.com/mobile-v3\n• Desktop: figma.com/desktop-v3\n\nCheers,\nMarcus", date:"Apr 19, 8:30 AM", unread:true,  starred:false, tag:"Design"   },
  { id:3, from:"Priya Sharma",  addr:"priya@startup.ai",   subject:"Partnership opportunity — AI integration", preview:"Our AI layer reduces manual work by 60%...", body:"Dear colleague,\n\nI'm reaching out about a potential partnership.\n\nOur AI integration layer offers:\n• 60% reduction in manual data entry\n• Real-time analytics dashboard\n\nBest regards,\nPriya Sharma\nCEO, StartupAI", date:"Apr 18, 4:45 PM", unread:false, starred:true,  tag:"Business" },
  { id:4, from:"DevOps Team",   addr:"devops@company.com", subject:"Maintenance window — Saturday 2:00 AM UTC",preview:"All services unavailable 2–5 AM UTC...", body:"Hi all,\n\nUpcoming scheduled maintenance:\n\nDate: Saturday, April 21\nTime: 2:00 AM – 5:00 AM UTC\n\nWhat's happening:\n• Database migration\n• Certificate rotation\n\nDevOps Team", date:"Apr 18, 2:00 PM", unread:false, starred:false, tag:"Tech"     },
  { id:5, from:"Jordan Lee",    addr:"jordan@investor.vc", subject:"Follow-up: Series A discussion", preview:"Partners reviewed your deck — very interested...", body:"Hi,\n\nFollowing up from last week. Partners reviewed your deck — very interested.\n\nNext steps:\n1. Due diligence data room\n2. Technical deep-dive\n\nJordan Lee\nPartner, Vertex VC", date:"Apr 17, 11:20 AM",unread:true,  starred:true,  tag:"Finance"  },
  { id:6, from:"GitHub",        addr:"noreply@github.com", subject:"Security alert: high-severity vulnerability",preview:"High-severity CVE detected...", body:"Security Alert\n\nHigh-severity vulnerability (CVE-2026-1234) detected.\n\nGitHub Security", date:"Apr 17, 9:05 AM", unread:false, starred:false, tag:"Tech"     },
];

let scheduled = [];

router.get("/setup", (req, res) => {
  const config = loadEmailConfig();
  res.json({
    connected: !!config,
    config: config
      ? {
          provider: config.provider,
          user: config.user,
          host: config.host,
          port: config.port,
          secure: config.secure,
        }
      : null,
  });
});

router.post("/setup/connect", async (req, res) => {
  try {
    const { provider, user, pass, host, port, secure } = req.body;
    if (!provider || !user || !pass) {
      return res.status(400).json({ error: "provider, user, and pass are required" });
    }

    const config = {
      provider,
      user,
      pass,
      host: provider === "gmail" ? "smtp.gmail.com" : host,
      port: provider === "gmail" ? 465 : Number(port) || 587,
      secure: provider === "gmail" ? true : !!secure,
    };

    const transporter = createTransport(config);
    await transporter.verify();
    saveEmailConfig(config);
    res.json({ connected: true, config: { provider: config.provider, user: config.user } });
  } catch (err) {
    console.error("Email setup error:", err.message);
    res.status(500).json({ error: err.message || "Failed to connect email provider" });
  }
});

router.post("/setup/disconnect", (req, res) => {
  deleteEmailConfig();
  res.json({ connected: false });
});

router.get("/", (req, res) => {
  res.json({ emails });
});

router.get("/scheduled", (req, res) => {
  res.json({ scheduled });
});

router.post("/send", async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "to, subject, body required" });
  }

  const config = loadEmailConfig();
  if (!config) {
    return res.status(400).json({ error: "Email provider is not connected. Set up email in Settings first." });
  }

  try {
    const transporter = createTransport(config);
    await transporter.sendMail({
      from: config.user,
      to,
      subject,
      text: body,
    });
    res.json({ success: true, message: "Email sent." });
  } catch (err) {
    console.error("Send email error:", err.message);
    res.status(500).json({ error: err.message || "Failed to send email" });
  }
});

router.post("/schedule", (req, res) => {
  const { to, subject, body, dateTime, repeat } = req.body;
  if (!to || !subject || !dateTime) {
    return res.status(400).json({ error: "to, subject, dateTime required" });
  }
  const newEmail = {
    id: Date.now(),
    to,
    subject,
    body: body || "",
    dateTime,
    repeat: repeat || "once",
    status: "scheduled",
  };
  scheduled.unshift(newEmail);
  res.json({ success: true, scheduled: newEmail });
});

router.delete("/scheduled/:id", (req, res) => {
  const id = parseInt(req.params.id);
  scheduled = scheduled.filter(e => e.id !== id);
  res.json({ success: true });
});

module.exports = router;