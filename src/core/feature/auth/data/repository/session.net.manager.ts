import {type Account} from "appwrite";
import type {User} from "../../domain/entity/User";
import {account} from "../../../../infrastructure/di/appwrite.config";
import type {SessionNetManager} from "../../domain/repository/session.net.manager";

export class SessionNetManagerImpl implements SessionNetManager{
    constructor(private readonly account: Account) {}

    async createEmailSession(email:string, password:string): Promise<string> {
        let response = await account.createEmailPasswordSession(email, password);
        return response.userId
    }

    async closeSessions(): Promise<void> {
        await account.deleteSessions()
    }
}