import {SessionNetManagerImpl} from "../../data/repository/session.net.manager";

export interface SessionNetManager {
    createEmailSession(email:string, password:string): Promise<string>
    closeSessions(): Promise<void>
}