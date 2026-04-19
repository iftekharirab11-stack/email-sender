// MailMind Backend — Express server
const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/ai",     require("./routes/ai"));
app.use("/api/emails", require("./routes/emails"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "MailMind server is running ✓" });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ MailMind server running at http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health\n`);
});