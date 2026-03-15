import nodemailer from "nodemailer";

const env = (key) => process.env[key] || "";

export const createGmailTransport = () => {
  const from = env("GMAIL_FROM");
  const pass = env("GMAIL_APP_PASSWORD");
  if (!from || !pass) {
    throw new Error("Falta configurar GMAIL_FROM y/o GMAIL_APP_PASSWORD.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: from, pass },
  });

  return { transporter, from, replyTo: env("GMAIL_REPLY_TO") || undefined };
};

