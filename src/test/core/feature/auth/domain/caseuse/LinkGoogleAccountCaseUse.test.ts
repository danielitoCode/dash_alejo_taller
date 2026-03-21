import { describe, expect, it, vi } from "vitest";
import { LinkGoogleAccountCaseUse } from "../../../../../../core/feature/auth/domain/caseuse/LinkGoogleAccountCaseUse";
import type { SessionNetManager } from "../../../../../../core/feature/auth/domain/repository/session.net.manager";
import type { UserNetRepository } from "../../../../../../core/feature/auth/domain/repository/user.net.repository";

describe("LinkGoogleAccountCaseUse", () => {
    it("crea sesión con la contraseña actual y luego guarda el vínculo Google", async () => {
        const createEmailSession = vi.fn<SessionNetManager["createEmailSession"]>().mockResolvedValue("user-1");
        const linkGoogle = vi.fn<UserNetRepository["linkGoogle"]>().mockResolvedValue();

        const sessionManager = {
            createEmailSession,
            createTokenSession: vi.fn(),
            createOAuthSession: vi.fn(),
            closeSessions: vi.fn()
        } satisfies SessionNetManager;

        const userRepository = {
            getCurrentUser: vi.fn(),
            createAccount: vi.fn(),
            updateName: vi.fn(),
            updatePassword: vi.fn(),
            updatePhotoUrl: vi.fn(),
            linkGoogle,
            updatePhone: vi.fn(),
            updateRole: vi.fn(),
            deleteUser: vi.fn()
        } satisfies UserNetRepository;

        const useCase = new LinkGoogleAccountCaseUse(userRepository, sessionManager);

        const result = await useCase.execute({
            email: "admin@example.com",
            currentPassword: "current-pass",
            googleSub: "google-sub-123",
            name: "Admin Test",
            photoUrl: "https://cdn.test/avatar.png"
        });

        expect(result).toBe("user-1");
        expect(createEmailSession).toHaveBeenCalledWith("admin@example.com", "current-pass");
        expect(linkGoogle).toHaveBeenCalledWith("google-sub-123", "https://cdn.test/avatar.png", "Admin Test");
    });
});
