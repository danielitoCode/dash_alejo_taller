import type {SessionNetManager} from "../repository/session.net.manager";

export class OpenSessionCaseUse {
    constructor(private readonly sessionNetManager: SessionNetManager) {}
    async openCustomSession(email: string, pass: string): Promise<string> {
        return await this.sessionNetManager.createEmailSession(email, pass);
    }
}