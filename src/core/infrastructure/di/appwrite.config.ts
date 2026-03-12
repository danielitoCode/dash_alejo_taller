import {Client, Databases, Storage, Account, Functions} from "appwrite"
import {ENV} from "../env";

const client = new Client()

client
    .setEndpoint(ENV.appwriteEndpoint)
    .setProject(ENV.appwriteProjectId)

export const databases = new Databases(client)
export const storage = new Storage(client)
export const account = new Account(client)
export const functions = new Functions(client)

export { client }
