import { afterEach, describe, expect, it, vi } from "vitest";

describe("ENV", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it("lee las variables nuevas de Google Auth y Password Reset", async () => {
        vi.stubEnv("VITE_GOOGLE_AUTH_URL", "https://worker.example.workers.dev");
        vi.stubEnv("VITE_PASSWORD_RESET_URL", "https://password-reset.onrender.com");

        const { ENV } = await import("../core/infrastructure/env");

        expect(ENV.googleAuthUrl).toBe("https://worker.example.workers.dev");
        expect(ENV.passwordResetUrl).toBe("https://password-reset.onrender.com");
    });
});
