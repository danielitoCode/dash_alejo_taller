import {Client, Databases, Storage, Account, Functions} from "appwrite"
import {ENV} from "../env";

const client = new Client()

if (ENV.appwriteEndpoint && ENV.appwriteProjectId) {
    console.info("[sale-debug][env][step 0] appwrite config present", {
        endpoint: ENV.appwriteEndpoint,
        projectId: ENV.appwriteProjectId,
        hasDatabaseId: Boolean(ENV.databaseId)
    });
    client
        .setEndpoint(ENV.appwriteEndpoint)
        .setProject(ENV.appwriteProjectId)
} else {
    console.error("[sale-debug][env][step 0] missing appwrite config", {
        endpoint: ENV.appwriteEndpoint ?? null,
        projectId: ENV.appwriteProjectId ?? null,
        databaseId: ENV.databaseId ?? null
    });
    console.warn(
        "[appwrite] Missing VITE_APPWRITE_ENDPOINT and/or VITE_APPWRITE_PROJECT_ID. Appwrite client not configured."
    );
}

export const databases = new Databases(client)
export const storage = new Storage(client)
export const account = new Account(client)
export const functions = new Functions(client)

export { client }
