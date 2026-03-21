import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../setup/msw.server";

const { envState } = vi.hoisted(() => ({
    envState: {
        googleAuthUrl: "https://worker.example.dev",
        passwordResetUrl: "",
        googleClientId: "",
        appwriteEndpoint: "",
        appwriteProjectId: "",
        databaseId: "",
        adminFunctionUsers: "",
        storageBucketId: "",
        infraStatusUrl: "",
        appwriteConsoleUrl: "",
        renderConsoleUrl: "",
        cloudflareConsoleUrl: "",
        pulseBaseUrl: "",
        pulseApiKey: "",
        pulseSupportMessagesPath: "",
        pusherAppId: "",
        pusherSecrets: "",
        pusherKey: "",
        pusherCluster: "",
        pusherSupportChannel: ""
    }
}));

vi.mock("../../../../../../core/infrastructure/env", () => ({
    ENV: envState
}));

import { GoogleAuthNetRepositoryImpl } from "../../../../../../core/feature/auth/data/repository/google-auth.repository";

describe("GoogleAuthNetRepositoryImpl", () => {
    beforeEach(() => {
        envState.googleAuthUrl = "https://worker.example.dev";
    });

    it("intercambia la credencial y devuelve el payload del backend", async () => {
        server.use(
            http.post("https://worker.example.dev", async ({ request }) => {
                const body = await request.json();
                expect(body).toEqual({
                    action: "exchange",
                    credential: "cred-123",
                    allowCreate: true
                });

                return HttpResponse.json({
                    success: true,
                    kind: "session",
                    userId: "user-1",
                    secret: "secret-1"
                });
            })
        );

        const repository = new GoogleAuthNetRepositoryImpl();

        await expect(repository.exchangeCredential({ credential: "cred-123", allowCreate: true })).resolves.toEqual({
            kind: "session",
            userId: "user-1",
            secret: "secret-1"
        });
    });

    it("propaga el error devuelto por el backend", async () => {
        server.use(
            http.post("https://worker.example.dev", () =>
                HttpResponse.json({ success: false, error: "Credencial expirada" }, { status: 401 })
            )
        );

        const repository = new GoogleAuthNetRepositoryImpl();

        await expect(repository.exchangeCredential({ credential: "cred-123" })).rejects.toThrow("Credencial expirada");
    });

    it("falla si la URL del servicio no está configurada", async () => {
        envState.googleAuthUrl = "  ";
        const repository = new GoogleAuthNetRepositoryImpl();

        await expect(repository.exchangeCredential({ credential: "cred-123" })).rejects.toThrow(
            "VITE_GOOGLE_AUTH_URL no está configurada"
        );
    });
});
