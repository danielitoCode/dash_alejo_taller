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
import { logger } from "../../../infrastructure/presentation/util/logger.service";

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

function mask(value: string | null | undefined, keep = 6): string {
    if (!value) return "—";
    if (value.length <= keep) return "***";
    return `${value.slice(0, keep)}…`;
}

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
        logger.info(
            `[Auth0] init domain=${cfg.domain} clientId=${mask(cfg.clientId)} redirect=${cfg.redirectUri}`,
        );
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
        logger.info("[Auth0] client listo (cache=localstorage, refreshTokens=on)");
    }

    private async ensureClient(): Promise<Auth0Client> {
        await this.init();
        if (!this.client) throw new Error("Auth0 client no inicializado");
        return this.client;
    }

    async loginWithRedirect(appState?: { returnTo?: string; connection?: string }): Promise<void> {
        const client = await this.ensureClient();
        const cfg = requireAuth0Config();
        const connection = appState?.connection;
        logger.info(
            `[Auth0] loginWithRedirect connection=${connection ?? "universal"} returnTo=${appState?.returnTo ?? cfg.redirectUri}`,
        );
        const options: RedirectLoginOptions = {
            authorizationParams: {
                redirect_uri: cfg.redirectUri,
                ...(cfg.audience ? { audience: cfg.audience } : {}),
                ...(connection ? { connection } : {}),
            },
            appState: appState?.returnTo ? { returnTo: appState.returnTo } : undefined,
        };
        await client.loginWithRedirect(options);
    }

    async handleRedirectCallback(): Promise<void> {
        if (typeof window === "undefined") return;
        const q = window.location.search;

        if (q.includes("error=")) {
            const params = new URLSearchParams(q);
            const msg = `${params.get("error")} — ${params.get("error_description") ?? ""}`;
            logger.error(`[Auth0] callback error: ${msg}`);
            window.history.replaceState({}, document.title, window.location.pathname);
            throw new Error(`Auth0: ${msg}`);
        }

        if (!q.includes("code=") || !q.includes("state=")) {
            logger.log("[Auth0] callback: sin code/state (no-op)");
            return;
        }

        logger.info("[Auth0] handleRedirectCallback: procesando code/state…");
        const client = await this.ensureClient();
        await client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
        logger.info("[Auth0] callback OK — query limpia");
    }

    async logout(): Promise<void> {
        const client = await this.ensureClient();
        const cfg = requireAuth0Config();
        logger.info(`[Auth0] logout → returnTo=${cfg.logoutReturnTo}`);
        await client.logout({
            logoutParams: {
                returnTo: cfg.logoutReturnTo,
            },
        });
    }

    async isAuthenticated(): Promise<boolean> {
        const client = await this.ensureClient();
        const ok = await client.isAuthenticated();
        logger.log(`[Auth0] isAuthenticated=${ok}`);
        return ok;
    }

    async getAccessToken(): Promise<string | null> {
        const client = await this.ensureClient();
        if (!(await client.isAuthenticated())) return null;
        try {
            const token = await client.getTokenSilently();
            logger.log(`[Auth0] getAccessToken ok len=${token?.length ?? 0}`);
            return token ?? null;
        } catch (e) {
            logger.warn(
                `[Auth0] getAccessToken falló: ${e instanceof Error ? e.message : String(e)}`,
            );
            return null;
        }
    }

    async getSubject(): Promise<string | null> {
        const session = await this.getSession();
        return session?.subject ?? null;
    }

    async getSession(): Promise<AuthSession | null> {
        const client = await this.ensureClient();
        if (!(await client.isAuthenticated())) {
            logger.log("[Auth0] getSession: no autenticado");
            return null;
        }

        const user = await client.getUser();
        if (!user?.sub) {
            logger.warn("[Auth0] getSession: user sin sub");
            return null;
        }

        let accessToken = "";
        try {
            const token = await client.getTokenSilently();
            if (!token) {
                logger.warn("[Auth0] getSession: token vacío");
                return null;
            }
            accessToken = token;
        } catch (e) {
            logger.warn(
                `[Auth0] getSession token: ${e instanceof Error ? e.message : String(e)}`,
            );
            return null;
        }

        const claims = user as Record<string, unknown>;
        const roles = parseRolesFromClaims(claims);

        logger.info(
            `[Auth0] session sub=${mask(user.sub, 12)} email=${user.email ?? "—"} roles=[${roles.join(",")}]`,
        );

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
