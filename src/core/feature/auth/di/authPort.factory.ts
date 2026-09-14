import type { AuthPort } from "../domain/AuthPort";
import { Auth0AuthAdapter } from "../data/Auth0AuthAdapter";
import { ENV } from "../../../infrastructure/env";

export type AuthProviderId = "auth0" | "appwrite";

/** Auth0 si flag auth0; si DATA_PROVIDER=turso y no hay flag, preferir auth0. */
export function resolveAuthProvider(): AuthProviderId {
    const p = (ENV.authProvider ?? "").toLowerCase().trim();
    if (p === "auth0") return "auth0";
    if (p === "appwrite") return "appwrite";
    const data = String(ENV.dataProvider ?? "").toLowerCase().trim();
    if (data === "turso") return "auth0";
    return "appwrite";
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
