import { Account, Client, Users, Databases } from "node-appwrite";

const env = (key) => process.env[key] || "";

export const createAdminUsers = () => {
  const endpoint = env("APPWRITE_ENDPOINT");
  const projectId = env("APPWRITE_PROJECT_ID");
  const apiKey = env("APPWRITE_API_KEY");

  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Faltan APPWRITE_ENDPOINT/APPWRITE_PROJECT_ID/APPWRITE_API_KEY.");
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return { users: new Users(client), projectId };
};

export const createAdminDatabases = () => {
  const endpoint = env("APPWRITE_ENDPOINT");
  const projectId = env("APPWRITE_PROJECT_ID");
  const apiKey = env("APPWRITE_API_KEY");

  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Faltan APPWRITE_ENDPOINT/APPWRITE_PROJECT_ID/APPWRITE_API_KEY.");
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return new Databases(client);
};

export const resolveRequesterUserId = async (jwt) => {
  if (!jwt) throw new Error("Falta x-appwrite-user-jwt.");

  const endpoint = env("APPWRITE_ENDPOINT");
  const projectId = env("APPWRITE_PROJECT_ID");
  if (!endpoint || !projectId) throw new Error("Faltan APPWRITE_ENDPOINT/APPWRITE_PROJECT_ID.");

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
  const account = new Account(client);
  const me = await account.get();
  if (!me?.$id) throw new Error("JWT inválido.");
  return me.$id;
};

/**
 * Actualiza el estado de una venta en Appwrite
 * @param {string} saleId - ID de la venta
 * @param {string} newStatus - Nuevo estado: "VERIFIED" o "DELETED"
 */
export async function updateSaleStatus(saleId, newStatus) {
  const databases = createAdminDatabases();
  const databaseId = env("APPWRITE_DATABASE_ID") || "default";
  const collectionId = "sale";

  const updated = await databases.updateDocument(databaseId, collectionId, saleId, {
    buy_state: newStatus,
  });

  return updated;
}

