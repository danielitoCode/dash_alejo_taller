import type { AuthPort } from "../domain/AuthPort";
import { Auth0AuthAdapter } from "../data/Auth0AuthAdapter";
import { ENV } from "../../../infrastructure/env";

export type AuthProviderId = "auth0" | "appwrite";

export function resolveAuthProvider(): AuthProviderId {
    const p = (ENV.authProvider ?? "appwrite").toLowerCase().trim();
    if (p === "auth0") return "auth0";
    return "appwrite";
}

/**
 * Fase 1: solo Auth0 implementa AuthPort.
 * Con VITE_AUTH_PROVIDER=appwrite el flujo legacy (SessionNetManager) sigue activo;
 * no se instancia Auth0 hasta que el flag sea auth0.
 */
export function createAuthPort(): AuthPort | null {
    if (resolveAuthProvider() !== "auth0") return null;
    return new Auth0AuthAdapter();
}

/** Singleton lazy para UI / guards. */
let cached: AuthPort | null | undefined;

export function getAuthPort(): AuthPort | null {
    if (cached === undefined) {
        cached = createAuthPort();
    }
    return cached;
}
