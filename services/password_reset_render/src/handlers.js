import { createAdminUsers, resolveRequesterUserId } from "./appwrite.js";
import { createGmailTransport } from "./mailer.js";
import { generateCode, hashCode } from "./resetCode.js";

const env = (key) => process.env[key] || "";

export const requestCode = async ({ requesterJwt }) => {
  const userId = await resolveRequesterUserId(requesterJwt);
  const { users, projectId } = createAdminUsers();
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
  const merged = { ...prefs, password_reset: { hash, expiresAt } };
  await users.updatePrefs(userId, merged);

  const { transporter, from } = createGmailTransport();
  await transporter.sendMail({
    from,
    to: email,
    subject: "Código de verificación",
    text: `Hola ${name}!\n\nTu código de verificación es: ${code}\n\nExpira en ${Math.round(ttlSeconds / 60)} minutos.`,
    html: `<div style="font-family:Inter,Arial,sans-serif;padding:20px"><h2>Código de verificación</h2><p>Hola <b>${name}</b>, tu código es:</p><div style="font-size:28px;letter-spacing:6px;font-weight:800;padding:12px 14px;border-radius:12px;background:#f3f5ff;display:inline-block">${code}</div><p style="color:#555">Expira en ${Math.round(ttlSeconds / 60)} minutos.</p></div>`,
  });
};

export const confirmCode = async ({ requesterJwt, code, newPassword }) => {
  const userId = await resolveRequesterUserId(requesterJwt);
  if (!code || typeof code !== "string" || code.trim().length < 4) throw new Error("Código inválido.");
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8)
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");

  const { users, projectId } = createAdminUsers();
  const user = await users.get(userId);
  const prefs = user?.prefs && typeof user.prefs === "object" ? user.prefs : {};
  const reset = prefs?.password_reset && typeof prefs.password_reset === "object" ? prefs.password_reset : null;

  const expiresAt = Number(reset?.expiresAt || 0);
  const storedHash = String(reset?.hash || "");
  if (!expiresAt || !storedHash) throw new Error("No hay una verificación pendiente.");
  if (Date.now() > expiresAt) throw new Error("El código expiró. Solicita uno nuevo.");

  const salt = env("PASSWORD_RESET_SALT") || projectId || "appwrite";
  const computed = hashCode({ code: code.trim(), userId, salt });
  if (computed !== storedHash) throw new Error("Código incorrecto.");

  await users.updatePassword(userId, newPassword);
  const merged = { ...prefs };
  delete merged.password_reset;
  await users.updatePrefs(userId, merged);
};

