import {
    createAuth0Client,
    type Auth0Client,
    type RedirectLoginOptions,
} from "@auth0/auth0-spa-js";
import type { AuthPort } from "../domain/AuthPort";
import {
    AUTH_ROLES_CLAIM,
    type AuthSession,
} from "../domain/entity/AuthSession";
import {
    normalizeBusinessRole,
    type BusinessRole,
} from "../domain/entity/BusinessRole";
import { ENV } from "../../../infrastructure/env";

function parseRolesFromClaims(claims: Record<string, unknown> | undefined): BusinessRole[] {
    if (!claims) return ["viewer"];
    const raw = claims[AUTH_ROLES_CLAIM] ?? claims["roles"];
    const list: unknown[] = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? raw.split(/[\s,]+/).filter(Boolean)
          : [];
    if (list.length === 0) return ["viewer"];
    const roles = list.map((r) => normalizeBusinessRole(r));
    return [...new Set(roles)];
}

/**
 * Defaults alineados con Auth0 Application (SPA):
 * Callback / Logout / Web Origins = http://localhost:5173/
 * → redirect_uri y returnTo = location.origin (no /callback).
 */
function requireAuth0Config(): {
    domain: string;
    clientId: string;
    audience?: string;
    redirectUri: string;
    logoutReturnTo: string;
} {
    const domain = (ENV.auth0Domain ?? "").trim();
    const clientId = (ENV.auth0ClientId ?? "").trim();
    if (!domain || !clientId) {
        throw new Error(
            "Auth0: faltan VITE_AUTH0_DOMAIN y/o VITE_AUTH0_CLIENT_ID en el entorno",
        );
    }
    const origin =
        typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    const redirectUri = (ENV.auth0RedirectUri ?? "").trim() || origin;
    const logoutReturnTo = (ENV.auth0LogoutReturnTo ?? "").trim() || origin;
    const audience = (ENV.auth0Audience ?? "").trim() || undefined;
    return { domain, clientId, audience, redirectUri, logoutReturnTo };
}

/**
 * Adapter Auth0 SPA oficial (`@auth0/auth0-spa-js`).
 * No implementa OAuth a mano. Roles vía claim o fallback viewer.
 */
export class Auth0AuthAdapter implements AuthPort {
    private client: Auth0Client | null = null;
    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.client) return;
        if (this.initPromise) return this.initPromise;
        this.initPromise = this.doInit();
        try {
            await this.initPromise;
        } finally {
            this.initPromise = null;
        }
    }

    private async doInit(): Promise<void> {
        const cfg = requireAuth0Config();
        this.client = await createAuth0Client({
            domain: cfg.domain,
            clientId: cfg.clientId,
            authorizationParams: {
                redirect_uri: cfg.redirectUri,
                ...(cfg.audience ? { audience: cfg.audience } : {}),
            },
            cacheLocation: "localstorage",
            useRefreshTokens: true,
        });
    }

    private async ensureClient(): Promise<Auth0Client> {
        await this.init();
        if (!this.client) throw new Error("Auth0 client no inicializado");
        return this.client;
    }

    async loginWithRedirect(appState?: { returnTo?: string }): Promise<void> {
        const client = await this.ensureClient();
        const cfg = requireAuth0Config();
        const options: RedirectLoginOptions = {
            authorizationParams: {
                redirect_uri: cfg.redirectUri,
                ...(cfg.audience ? { audience: cfg.audience } : {}),
            },
            appState: appState ?? undefined,
        };
        await client.loginWithRedirect(options);
    }

    async handleRedirectCallback(): Promise<void> {
        if (typeof window === "undefined") return;
        const q = window.location.search;

        // Error devuelto por Auth0 tras redirect
        if (q.includes("error=")) {
            const params = new URLSearchParams(q);
            const msg = `${params.get("error")} — ${params.get("error_description") ?? ""}`;
            window.history.replaceState({}, document.title, window.location.pathname);
            throw new Error(`Auth0: ${msg}`);
        }

        if (!q.includes("code=") || !q.includes("state=")) return;

        const client = await this.ensureClient();
        await client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    async logout(): Promise<void> {
        const client = await this.ensureClient();
        const cfg = requireAuth0Config();
        await client.logout({
            logoutParams: {
                returnTo: cfg.logoutReturnTo,
            },
        });
    }

    async isAuthenticated(): Promise<boolean> {
        const client = await this.ensureClient();
        return client.isAuthenticated();
    }

    async getAccessToken(): Promise<string | null> {
        const client = await this.ensureClient();
        if (!(await client.isAuthenticated())) return null;
        try {
            const token = await client.getTokenSilently();
            return token ?? null;
        } catch {
            return null;
        }
    }

    async getSubject(): Promise<string | null> {
        const session = await this.getSession();
        return session?.subject ?? null;
    }

    async getSession(): Promise<AuthSession | null> {
        const client = await this.ensureClient();
        if (!(await client.isAuthenticated())) return null;

        const user = await client.getUser();
        if (!user?.sub) return null;

        let accessToken = "";
        try {
            const token = await client.getTokenSilently();
            if (!token) return null;
            accessToken = token;
        } catch {
            return null;
        }

        const claims = user as Record<string, unknown>;
        const roles = parseRolesFromClaims(claims);

        return {
            subject: user.sub,
            accessToken,
            email: user.email ?? null,
            displayName: user.name ?? user.nickname ?? null,
            roles,
            pictureUrl: user.picture ?? null,
        };
    }
}
