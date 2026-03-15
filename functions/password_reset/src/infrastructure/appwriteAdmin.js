import { Client, Users } from "node-appwrite";

const env = (key) => process.env[key] || "";

export const createUsersAdmin = () => {
  const endpoint = env("APPWRITE_FUNCTION_API_ENDPOINT") || env("APPWRITE_ENDPOINT");
  const projectId = env("APPWRITE_FUNCTION_PROJECT_ID") || env("APPWRITE_PROJECT_ID");
  const apiKey = env("APPWRITE_FUNCTION_API_KEY") || env("APPWRITE_API_KEY");

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Faltan variables de Appwrite. Configura APPWRITE_FUNCTION_API_ENDPOINT, APPWRITE_FUNCTION_PROJECT_ID, APPWRITE_FUNCTION_API_KEY."
    );
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return { users: new Users(client), projectId };
};

