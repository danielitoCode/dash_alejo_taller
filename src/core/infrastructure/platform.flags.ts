import { ENV } from "./env";
import { resolveAuthProvider } from "../feature/auth/di/authPort.factory";

export function isAuth0Provider(): boolean {
    return resolveAuthProvider() === "auth0";
}

export function isTursoDataProvider(): boolean {
    return String(ENV.dataProvider ?? "").trim().toLowerCase() === "turso";
}

/** Auth: no Account Appwrite. */
export function isAppwriteAuthDisabled(): boolean {
    return isAuth0Provider();
}

/**
 * Datos / RT Appwrite desconectados mientras operamos Auth0+Turso.
 * El código Appwrite permanece; no se invoca en el camino caliente.
 */
export function isAppwriteDataStackDisabled(): boolean {
    return isAuth0Provider() || isTursoDataProvider();
}
