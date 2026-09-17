import { ENV } from "./env";
import { resolveAuthProvider } from "../feature/auth/di/authPort.factory";

/** @deprecated Auth0 eliminado — siempre false */
export function isAuth0Provider(): boolean {
    return false;
}

export function isClerkProvider(): boolean {
    return resolveAuthProvider() === "clerk";
}

export function isTursoDataProvider(): boolean {
    return String(ENV.dataProvider ?? "").trim().toLowerCase() === "turso";
}

/** Auth: no Account Appwrite. */
export function isAppwriteAuthDisabled(): boolean {
    return isClerkProvider();
}

/**
 * Datos / RT Appwrite desconectados mientras operamos Clerk+Turso.
 */
export function isAppwriteDataStackDisabled(): boolean {
    return isClerkProvider() || isTursoDataProvider();
}

/** Alias */
export function isAppwriteDataDisabled(): boolean {
    return isAppwriteDataStackDisabled();
}
