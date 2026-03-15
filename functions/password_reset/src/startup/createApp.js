import { parseJsonBody } from "../interfaces/parseJsonBody.js";
import { json } from "../interfaces/response.js";
import { requestCode } from "../application/requestCode.js";
import { confirmCode } from "../application/confirmCode.js";

export const createApp = ({ log, error }) => {
  return async (ctx) => {
    const body = parseJsonBody(ctx?.req?.bodyRaw);
    const action = body?.action;

    const userId =
      ctx?.req?.headers?.["x-appwrite-user-id"] ||
      ctx?.req?.headers?.["x-appwrite-userid"] ||
      ctx?.req?.headers?.["x-appwrite-user"] ||
      "";

    if (!userId) {
      return json(ctx, 401, { success: false, error: "No autenticado.", code: "UNAUTHENTICATED" });
    }

    try {
      if (action === "request") {
        await requestCode({ userId, log });
        return json(ctx, 200, { success: true });
      }

      if (action === "confirm") {
        await confirmCode({ userId, code: body?.code, newPassword: body?.newPassword, log });
        return json(ctx, 200, { success: true });
      }

      return json(ctx, 400, {
        success: false,
        error: 'Body inválido. Se espera { "action": "request" } o { "action": "confirm", "code": "...", "newPassword": "..." }',
        code: "BAD_REQUEST",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error inesperado";
      error?.(message);
      return json(ctx, 400, { success: false, error: message, code: "FAILED" });
    }
  };
};

