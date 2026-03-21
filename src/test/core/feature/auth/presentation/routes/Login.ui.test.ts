import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavController } from "../../../../../../lib/navigation/NavController";

const { openCustomSession, getCurrentUser, linkGoogleAccount, createAccount } = vi.hoisted(() => ({
    openCustomSession: vi.fn(),
    getCurrentUser: vi.fn(),
    linkGoogleAccount: vi.fn(),
    createAccount: vi.fn()
}));

vi.mock("../../../../../../core/feature/auth/di/auth.container", () => ({
    authContainer: {
        useCases: {
            sessions: {
                openSession: {
                    openCustomSession
                }
            },
            accounts: {
                getCurrentUser,
                linkGoogleAccount
            }
        }
    }
}));

vi.mock("../../../../../../core/feature/auth/presentation/viewmodel/register.store", () => ({
    registerStore: {
        createAccount
    }
}));

vi.mock("../../../../../../core/infrastructure/env", () => ({
    ENV: {
        googleClientId: "google-client-id"
    }
}));

vi.mock("../../../../../../core/feature/auth/presentation/util/google-id-token", () => ({
    parseGoogleIdToken: vi.fn(() => ({
        email: "admin@example.com",
        sub: "google-sub",
        name: "Admin",
        picture: ""
    }))
}));

import Login from "../../../../../../core/feature/auth/presentation/routes/Login.svelte";

describe("Login route", () => {
    beforeEach(() => {
        openCustomSession.mockReset();
        getCurrentUser.mockReset();
        linkGoogleAccount.mockReset();
        createAccount.mockReset();
    });

    it("inicia sesión y navega al home cuando el usuario es admin", async () => {
        openCustomSession.mockResolvedValue("user-1");
        getCurrentUser.mockResolvedValue({ role: "admin" });
        const navController = new NavController("login");
        navController.navigate = vi.fn();

        render(Login, { navController });

        await fireEvent.input(screen.getByPlaceholderText("correo@dominio.com"), {
            target: { value: "admin@example.com" }
        });
        await fireEvent.input(screen.getByPlaceholderText("••••••••"), {
            target: { value: "secret-123" }
        });
        await fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => {
            expect(openCustomSession).toHaveBeenCalledWith("admin@example.com", "secret-123");
            expect(navController.navigate).toHaveBeenCalledWith("home", { id: "user-1" });
        });
    });

    it("abre el modal de Google con el iframe configurado", async () => {
        const navController = new NavController("login");
        render(Login, { navController });

        await fireEvent.click(screen.getByRole("button", { name: /continuar con google/i }));

        expect(await screen.findByRole("dialog", { name: "Autenticación con Google" })).toBeInTheDocument();
        const frame = screen.getByTitle("Google");
        expect(frame).toHaveAttribute("src", expect.stringContaining("/google-auth.html#"));
        expect(frame).toHaveAttribute("src", expect.stringContaining("client_id=google-client-id"));
    });
});
