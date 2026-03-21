import { describe, expect, it } from "vitest";
import { LinkGoogleAccountCaseUse } from "../../../../../../core/feature/auth/domain/caseuse/LinkGoogleAccountCaseUse";
import { FakeSessionNetManager } from "../../../../../fakes/core/feature/auth/domain/repository/fake-session.manager";
import { FakeUserNetRepository } from "../../../../../fakes/core/feature/auth/domain/repository/fake-user.repository";

describe("LinkGoogleAccountCaseUse", () => {
    it("crea sesión con la contraseña actual y luego guarda el vínculo Google", async () => {
        const sessionManager = new FakeSessionNetManager("user-1");
        const userRepository = new FakeUserNetRepository();

        const useCase = new LinkGoogleAccountCaseUse(userRepository, sessionManager);

        const result = await useCase.execute({
            email: "admin@example.com",
            currentPassword: "current-pass",
            googleSub: "google-sub-123",
            name: "Admin Test",
            photoUrl: "https://cdn.test/avatar.png"
        });

        expect(result).toBe("user-1");
        expect(sessionManager.calls.createEmailSession).toEqual([
            { email: "admin@example.com", password: "current-pass" }
        ]);
        expect(userRepository.calls.linkGoogle).toEqual([
            { sub: "google-sub-123", photoUrl: "https://cdn.test/avatar.png", name: "Admin Test" }
        ]);
    });
});
