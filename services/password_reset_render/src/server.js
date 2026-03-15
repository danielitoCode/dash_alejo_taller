import express from "express";
import { confirmCode, requestCode } from "./handlers.js";

const app = express();
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/password-reset/request", async (req, res) => {
  try {
    const jwt = String(req.header("x-appwrite-user-jwt") || "");
    await requestCode({ requesterJwt: jwt });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: e instanceof Error ? e.message : "Error" });
  }
});

app.post("/password-reset/confirm", async (req, res) => {
  try {
    const jwt = String(req.header("x-appwrite-user-jwt") || "");
    const code = req.body?.code;
    const newPassword = req.body?.newPassword;
    await confirmCode({ requesterJwt: jwt, code, newPassword });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, error: e instanceof Error ? e.message : "Error" });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[password_reset_render] listening on :${port}`);
});

