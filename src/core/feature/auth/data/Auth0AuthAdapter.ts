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
import { ENV, parseCsvEnv } from "../../../infrastructure/env";
import { logger } from "../../../infrastructure/presentation/util/logger.service";

/**
 * Roles de autorización: SOLO claim namespaced del JWT (inyectado por Action
 * desde app_metadata). Nunca app_metadata en el cliente ni claim genérico "roles".
 * @see .roadmap/Core6/AUTH0_ROLES_ACTION.md
 */
function parseRolesFromNamespacedClaim(raw: unknown): BusinessRole[] {
    const list: unknown[] = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? raw.split(/[\s,]+/).filter(Boolean)
          : [];
    if (list.length === 0) return [];
    return [...new Set(list.map((r) => normalizeBusinessRole(r)))];
}

/** Decodifica payload JWT (sin verificar firma: el token ya viene de Auth0 SDK). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
        const json =
            typeof atob === "function"
                ? atob(b64 + pad)
                : Buffer.from(b64 + pad, "base64").toString("utf8");
        const payload = JSON.parse(json) as Record<string, unknown>;
        return payload && typeof payload === "object" ? payload : null;
    } catch {
        return null;
    }
}

/**
 * Extrae roles únicamente de https://alejotaller.app/roles en access token
 * y, si falta, en el perfil ID token (getUser) — nunca app_metadata local.
 */
function resolveRolesFromTokens(
    accessToken: string,
    idTokenUser: Record<string, unknown> | undefined,
): BusinessRole[] {
    const fromAccess = decodeJwtPayload(accessToken);
    if (fromAccess && AUTH_ROLES_CLAIM in fromAccess) {
        const roles = parseRolesFromNamespacedClaim(fromAccess[AUTH_ROLES_CLAIM]);
        if (roles.length > 0) return roles;
    }

    // ID token: Auth0 refleja custom claims del Action en getUser()
    if (idTokenUser && AUTH_ROLES_CLAIM in idTokenUser) {
        const roles = parseRolesFromNamespacedClaim(idTokenUser[AUTH_ROLES_CLAIM]);
        if (roles.length > 0) return roles;
    }

    // Sin claim firmado → sin privilegios de negocio (viewer)
    return ["viewer"];
}

/** Bootstrap temporal — no sustituye Action + app_metadata en prod. */
function applyAdminAllowlist(
    subject: string,
    email: string | null | undefined,
    roles: BusinessRole[],
): BusinessRole[] {
    const subjects = parseCsvEnv(ENV.adminSubjects);
    const emails = parseCsvEnv(ENV.adminEmails);
    if (subjects.length === 0 && emails.length === 0) return roles;

    const sub = subject.trim().toLowerCase();
    const mail = (email ?? "").trim().toLowerCase();
    const isAdmin =
        (sub && subjects.includes(sub)) || (mail && emails.includes(mail));
    if (!isAdmin) return roles;
    if (roles.includes("admin") || roles.includes("owner")) return roles;
    logger.info(`[Auth0] admin allowlist match → role=admin (${mail || sub})`);
    return ["admin", ...roles.filter((r) => r !== "viewer")];
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

        // Autorización: solo claim JWT namespaced (Action ← app_metadata).
        // No se lee user.app_metadata ni claims["roles"] sueltos.
        let roles = resolveRolesFromTokens(
            accessToken,
            user as Record<string, unknown>,
        );
        roles = applyAdminAllowlist(user.sub, user.email ?? null, roles);

        logger.info(
            `[Auth0] session sub=${mask(user.sub, 12)} email=${user.email ?? "—"} roles=[${roles.join(",")}] claim=${AUTH_ROLES_CLAIM}`,
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
