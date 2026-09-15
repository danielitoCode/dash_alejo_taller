import type { AuthPort } from "../domain/AuthPort";
import { Auth0AuthAdapter } from "../data/Auth0AuthAdapter";
import { ENV } from "../../../infrastructure/env";

export type AuthProviderId = "auth0" | "appwrite";

/**
 * Panel Core6: Auth0 por defecto.
 * Solo Appwrite si VITE_AUTH_PROVIDER=appwrite explícito (legacy).
 */
export function resolveAuthProvider(): AuthProviderId {
    const p = (ENV.authProvider ?? "").toLowerCase().trim();
    if (p === "appwrite") return "appwrite";
    if (p === "auth0") return "auth0";
    // Default endurecido: Auth0 (Turso o sin flag)
    return "auth0";
}

export function createAuthPort(): AuthPort | null {
    if (resolveAuthProvider() !== "auth0") return null;
    return new Auth0AuthAdapter();
}

let cached: AuthPort | null | undefined;

export function getAuthPort(): AuthPort | null {
    if (cached === undefined) {
        cached = createAuthPort();
    }
    return cached;
}

/** true si no debe usarse Account/Databases Appwrite para auth. */
export function isAppwriteAuthDisabled(): boolean {
    return resolveAuthProvider() === "auth0";
}
