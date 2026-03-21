import type { SessionNetManager } from "../../../../../../../core/feature/auth/domain/repository/session.net.manager";

export class FakeSessionNetManager implements SessionNetManager {
    public readonly calls = {
        createEmailSession: [] as Array<{ email: string; password: string }>,
        createTokenSession: [] as Array<{ userId: string; secret: string }>,
        createOAuthSession: [] as Array<{ provider: "google"; successUrl: string; failureUrl: string }>,
        closeSessions: 0
    };

    constructor(private readonly emailSessionResult = "fake-user-id") {}

    async createEmailSession(email: string, password: string): Promise<string> {
        this.calls.createEmailSession.push({ email, password });
        return this.emailSessionResult;
    }

    async createTokenSession(userId: string, secret: string): Promise<string> {
        this.calls.createTokenSession.push({ userId, secret });
        return userId;
    }

    async createOAuthSession(provider: "google", successUrl: string, failureUrl: string): Promise<void> {
        this.calls.createOAuthSession.push({ provider, successUrl, failureUrl });
    }

    async closeSessions(): Promise<void> {
        this.calls.closeSessions += 1;
    }
}
