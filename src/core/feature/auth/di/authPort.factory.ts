import type { AuthPort } from "../domain/AuthPort";
import { ClerkAuthAdapter } from "../data/ClerkAuthAdapter";
import { ENV } from "../../../infrastructure/env";

export type AuthProviderId = "clerk" | "appwrite";

/**
 * Panel Core6: solo Clerk.
 * Appwrite solo con VITE_AUTH_PROVIDER=appwrite (legacy, no recomendado).
 * Auth0 eliminado del panel.
 */
export function resolveAuthProvider(): AuthProviderId {
    const p = (ENV.authProvider ?? "").toLowerCase().trim();
    if (p === "appwrite") return "appwrite";
    return "clerk";
}

export function createAuthPort(): AuthPort | null {
    if (resolveAuthProvider() !== "clerk") return null;
    return new ClerkAuthAdapter();
}

let cached: AuthPort | null | undefined;

export function getAuthPort(): AuthPort | null {
    if (cached === undefined) {
        cached = createAuthPort();
    }
    return cached;
}

/** true si no debe usarse Account Appwrite para auth. */
export function isAppwriteAuthDisabled(): boolean {
    return resolveAuthProvider() !== "appwrite";
}

/** Clerk (IdP externo del panel). */
export function isExternalAuthProvider(): boolean {
    return resolveAuthProvider() === "clerk";
}
