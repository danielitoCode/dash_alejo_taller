import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../setup/msw.server";

const { envState, createJWT } = vi.hoisted(() => ({
    envState: {
        googleAuthUrl: "",
        passwordResetUrl: "https://reset.example.dev",
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
    },
    createJWT: vi.fn(async () => ({ jwt: "jwt-user-token" }))
}));

vi.mock("../../../../../../core/infrastructure/env", () => ({
    ENV: envState
}));

vi.mock("../../../../../../core/infrastructure/di/infrastructure.container", () => ({
    infrastructureContainer: {
        appwrite: {
            account: {
                createJWT
            }
        }
    }
}));

import { PasswordResetNetRepositoryImpl } from "../../../../../../core/feature/auth/data/repository/password-reset.repository";

describe("PasswordResetNetRepositoryImpl", () => {
    beforeEach(() => {
        envState.passwordResetUrl = "https://reset.example.dev";
        createJWT.mockReset();
        createJWT.mockResolvedValue({ jwt: "jwt-user-token" });
    });

    it("solicita el código con el JWT del usuario actual", async () => {
        server.use(
            http.post("https://reset.example.dev/password-reset/request", async ({ request }) => {
                expect(request.headers.get("x-appwrite-user-jwt")).toBe("jwt-user-token");
                return HttpResponse.json({ success: true });
            })
        );

        const repository = new PasswordResetNetRepositoryImpl();

        await expect(repository.requestCode()).resolves.toBeUndefined();
        expect(createJWT).toHaveBeenCalledTimes(1);
    });

    it("confirma el código enviando el nuevo password", async () => {
        server.use(
            http.post("https://reset.example.dev/password-reset/confirm", async ({ request }) => {
                expect(await request.json()).toEqual({ code: "123456", newPassword: "nuevo-pass" });
                return HttpResponse.json({ success: true });
            })
        );

        const repository = new PasswordResetNetRepositoryImpl();

        await expect(repository.confirmCode({ code: "123456", newPassword: "nuevo-pass" })).resolves.toBeUndefined();
    });

    it("muestra el error funcional del backend", async () => {
        server.use(
            http.post("https://reset.example.dev/password-reset/request", () =>
                HttpResponse.json({ success: false, error: "Código no enviado" }, { status: 400 })
            )
        );

        const repository = new PasswordResetNetRepositoryImpl();

        await expect(repository.requestCode()).rejects.toThrow("Código no enviado");
    });
});
