import type { AuthPort } from "../domain/AuthPort";
import { Auth0AuthAdapter } from "../data/Auth0AuthAdapter";
import { ClerkAuthAdapter } from "../data/ClerkAuthAdapter";
import { ENV } from "../../../infrastructure/env";

export type AuthProviderId = "clerk" | "auth0" | "appwrite";

/**
 * Panel Core6: Clerk por defecto si hay publishable key.
 * Auth0 solo con VITE_AUTH_PROVIDER=auth0 (legacy).
 * Appwrite solo con VITE_AUTH_PROVIDER=appwrite (legacy).
 */
export function resolveAuthProvider(): AuthProviderId {
    const p = (ENV.authProvider ?? "").toLowerCase().trim();
    if (p === "appwrite") return "appwrite";
    if (p === "auth0") return "auth0";
    if (p === "clerk") return "clerk";
    const clerkKey = (ENV.clerkPublishableKey ?? "").trim();
    if (clerkKey) return "clerk";
    if ((ENV.auth0Domain ?? "").trim() && (ENV.auth0ClientId ?? "").trim()) {
        return "auth0";
    }
    return "clerk";
}

export function createAuthPort(): AuthPort | null {
    const provider = resolveAuthProvider();
    if (provider === "clerk") return new ClerkAuthAdapter();
    if (provider === "auth0") return new Auth0AuthAdapter();
    return null;
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

/** Clerk o Auth0 (IdP externo). */
export function isExternalAuthProvider(): boolean {
    const p = resolveAuthProvider();
    return p === "clerk" || p === "auth0";
}
