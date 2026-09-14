import { createClient, type Client } from "@libsql/client/web";
import { ENV } from "../env";

let client: Client | null = null;

export function isTursoDataProvider(): boolean {
    return String(ENV.dataProvider ?? "").trim().toLowerCase() === "turso";
}

export function getTursoClient(): Client {
    if (client) return client;
    const url = (ENV.tursoUrl ?? "").trim();
    const authToken = (ENV.tursoAuthToken ?? "").trim();
    if (!url) throw new Error("Turso: falta VITE_TURSO_URL");
    if (!authToken) throw new Error("Turso: falta VITE_TURSO_AUTH_TOKEN");
    client = createClient({ url, authToken });
    if (import.meta.env.DEV) {
        console.info("[turso] client ready");
    }
    return client;
}

export function resetTursoClient(): void {
    client = null;
}

export function newId(): string {
    return crypto.randomUUID();
}
