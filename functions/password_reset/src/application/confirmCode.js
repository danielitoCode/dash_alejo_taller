import { createUsersAdmin } from "../infrastructure/appwriteAdmin.js";
import { hashCode } from "../domain/resetCode.js";

const env = (key) => process.env[key] || "";

export const confirmCode = async ({ userId, code, newPassword, log }) => {
  if (!code || typeof code !== "string" || code.trim().length < 4) {
    throw new Error("Código inválido.");
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }

  const { users, projectId } = createUsersAdmin();
  const user = await users.get(userId);
  const prefs = user?.prefs && typeof user.prefs === "object" ? user.prefs : {};
  const reset = prefs?.password_reset && typeof prefs.password_reset === "object" ? prefs.password_reset : null;

  const expiresAt = Number(reset?.expiresAt || 0);
  const storedHash = String(reset?.hash || "");
  if (!expiresAt || !storedHash) {
    throw new Error("No hay una verificación pendiente.");
  }
  if (Date.now() > expiresAt) {
    throw new Error("El código expiró. Solicita uno nuevo.");
  }

  const salt = env("PASSWORD_RESET_SALT") || projectId || "appwrite";
  const computed = hashCode({ code: code.trim(), userId, salt });
  if (computed !== storedHash) {
    throw new Error("Código incorrecto.");
  }

  await users.updatePassword(userId, newPassword);

  const merged = { ...prefs };
  delete merged.password_reset;
  await users.updatePrefs(userId, merged);

  log?.(`Password updated for userId=${userId}`);
};

