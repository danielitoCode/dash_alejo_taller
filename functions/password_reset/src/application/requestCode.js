import { createUsersAdmin } from "../infrastructure/appwriteAdmin.js";
import { createGmailTransport } from "../infrastructure/mailer.js";
import { generateCode, hashCode } from "../domain/resetCode.js";

const env = (key) => process.env[key] || "";

export const requestCode = async ({ userId, log }) => {
  const { users, projectId } = createUsersAdmin();
  const user = await users.get(userId);
  const email = String(user?.email || "");
  const name = String(user?.name || "usuario");

  if (!email) throw new Error("El usuario no tiene email configurado.");

  const ttlSeconds = Number(env("PASSWORD_RESET_TTL_SECONDS") || 600);
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const salt = env("PASSWORD_RESET_SALT") || projectId || "appwrite";

  const code = generateCode();
  const hash = hashCode({ code, userId, salt });

  const prefs = user?.prefs && typeof user.prefs === "object" ? user.prefs : {};
  const merged = {
    ...prefs,
    password_reset: {
      hash,
      expiresAt,
    },
  };

  await users.updatePrefs(userId, merged);

  const { transporter, from, replyTo } = createGmailTransport();

  const subject = "Código de verificación";
  const text = `Hola ${name}!\n\nTu código de verificación es: ${code}\n\nEste código expira en ${Math.round(
    ttlSeconds / 60
  )} minutos.\n\nSi no solicitaste esta acción, ignora este correo.`;

  const html = `
<div style="font-family: Inter, Arial, sans-serif; background:#f6f7fb; padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:20px;border:1px solid #eee;">
    <h2 style="margin:0 0 12px 0;">Verificación de seguridad</h2>
    <p style="margin:0 0 12px 0;">Hola <strong>${name}</strong>,</p>
    <p style="margin:0 0 18px 0;">Tu código para cambiar la contraseña es:</p>
    <div style="font-size:28px; letter-spacing:6px; font-weight:800; padding:14px 16px; border-radius:12px; background:#f3f5ff; display:inline-block;">
      ${code}
    </div>
    <p style="margin:18px 0 0 0;color:#555;">Este código expira en ${Math.round(ttlSeconds / 60)} minutos.</p>
  </div>
</div>`;

  await transporter.sendMail({
    from,
    to: email,
    replyTo,
    subject,
    text,
    html,
  });

  log?.(`Password reset code sent to ${email}`);
};

