import { Clerk } from "@clerk/clerk-js";
import type { AuthPort, AuthLoginOptions } from "../domain/AuthPort";
import type { AuthSession } from "../domain/entity/AuthSession";
import {
    normalizeBusinessRole,
    type BusinessRole,
} from "../domain/entity/BusinessRole";
import { ENV, parseCsvEnv } from "../../../infrastructure/env";
import { logger } from "../../../infrastructure/presentation/util/logger.service";

function mask(value: string | null | undefined, keep = 6): string {
    if (!value) return "—";
    if (value.length <= keep) return "***";
    return `${value.slice(0, keep)}…`;
}

function parseRole(raw: unknown): BusinessRole[] {
    if (typeof raw === "string" && raw.trim()) {
        return [normalizeBusinessRole(raw.trim())];
    }
    if (Array.isArray(raw) && raw.length > 0) {
        const first = String(raw[0] ?? "").trim();
        return first ? [normalizeBusinessRole(first)] : [];
    }
    return [];
}

/** Panel: role solo desde publicMetadata / claim — sin default client. */
function resolveRoles(
    user: { publicMetadata?: Record<string, unknown> | null },
    sessionClaims?: Record<string, unknown> | null,
): BusinessRole[] {
    const fromMeta = parseRole(user.publicMetadata?.role);
    if (fromMeta.length) return fromMeta;
    if (sessionClaims) {
        const fromClaim = parseRole(sessionClaims.role ?? sessionClaims.metadata);
        if (fromClaim.length) return fromClaim;
        const meta = sessionClaims.metadata;
        if (meta && typeof meta === "object" && !Array.isArray(meta)) {
            const nested = parseRole((meta as Record<string, unknown>).role);
            if (nested.length) return nested;
        }
    }
    return [];
}

/** Bootstrap temporal: VITE_ADMIN_EMAILS / VITE_ADMIN_SUBJECTS. */
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
    logger.info(`[Clerk] admin allowlist match → role=admin (${mail || sub})`);
    return ["admin"];
}

export class ClerkAuthAdapter implements AuthPort {
    private clerk: Clerk | null = null;
    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.clerk) {
            logger.info("[Clerk] init: client ya listo");
            return;
        }
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            const key = (ENV.clerkPublishableKey ?? "").trim();
            if (!key) {
                logger.error("[Clerk] falta VITE_CLERK_PUBLISHABLE_KEY");
                throw new Error("Clerk: falta VITE_CLERK_PUBLISHABLE_KEY");
            }
            logger.info(`[Clerk] init pk=${mask(key, 10)}`);
            const clerk = new Clerk(key);
            const origin =
                typeof window !== "undefined"
                    ? window.location.origin
                    : "http://localhost:5173";
            await clerk.load({
                signInForceRedirectUrl: origin,
                signUpForceRedirectUrl: origin,
                afterSignOutUrl: origin,
            });
            this.clerk = clerk;
            logger.info("[Clerk] client listo");
        })();

        try {
            await this.initPromise;
        } catch (e) {
            logger.error(
                `[Clerk] init falló: ${e instanceof Error ? e.message : String(e)}`,
            );
            throw e;
        } finally {
            this.initPromise = null;
        }
    }

    private async ensure(): Promise<Clerk> {
        await this.init();
        if (!this.clerk) throw new Error("Clerk no inicializado");
        return this.clerk;
    }

    /** Panel: solo sign-in (email/password en UI de Clerk). Sin Google forzado. */
    async loginWithRedirect(appState?: AuthLoginOptions): Promise<void> {
        const clerk = await this.ensure();
        const returnTo =
            appState?.returnTo ||
            (typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost:5173");

        const isSignup = appState?.screenHint === "signup";
        logger.info(
            `[Clerk] login redirect mode=${isSignup ? "signup" : "signin"} returnTo=${returnTo}`,
        );

        if (isSignup) {
            await clerk.redirectToSignUp({
                signUpForceRedirectUrl: returnTo,
                signInForceRedirectUrl: returnTo,
            });
            return;
        }

        await clerk.redirectToSignIn({
            signInForceRedirectUrl: returnTo,
            signUpForceRedirectUrl: returnTo,
        });
    }

    async handleRedirectCallback(): Promise<void> {
        const clerk = await this.ensure();
        const user = await this.waitForUser(clerk);
        if (user) {
            logger.info(`[Clerk] callback: sesión activa user=${mask(user.id, 12)}`);
        } else {
            logger.info("[Clerk] callback: sin sesión (no-op)");
        }
    }

    async logout(): Promise<void> {
        const clerk = await this.ensure();
        const origin =
            typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost:5173";
        logger.info(`[Clerk] logout → ${origin}`);
        await clerk.signOut({ redirectUrl: origin });
    }

    async isAuthenticated(): Promise<boolean> {
        const clerk = await this.ensure();
        return Boolean(await this.waitForUser(clerk));
    }

    async getAccessToken(): Promise<string | null> {
        const clerk = await this.ensure();
        if (!clerk.session) return null;
        try {
            const token = await clerk.session.getToken();
            return token ?? null;
        } catch (e) {
            logger.warn(
                `[Clerk] getToken: ${e instanceof Error ? e.message : String(e)}`,
            );
            return null;
        }
    }

    async getSubject(): Promise<string | null> {
        return (await this.getSession())?.subject ?? null;
    }

    private async waitForUser(clerk: Clerk, attempts = 10): Promise<typeof clerk.user> {
        for (let i = 0; i < attempts; i++) {
            if (clerk.user) return clerk.user;
            await new Promise((r) => setTimeout(r, 120));
        }
        return clerk.user;
    }

    async getSession(): Promise<AuthSession | null> {
        const clerk = await this.ensure();
        const user = await this.waitForUser(clerk);
        if (!user) {
            logger.info("[Clerk] getSession: no autenticado");
            return null;
        }

        let accessToken = "";
        let claims: Record<string, unknown> | null = null;
        try {
            const token = await clerk.session?.getToken();
            if (!token) {
                logger.warn("[Clerk] getSession: token vacío");
                return null;
            }
            accessToken = token;
            try {
                const parts = token.split(".");
                if (parts.length >= 2) {
                    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
                    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
                    claims = JSON.parse(atob(b64 + pad)) as Record<string, unknown>;
                }
            } catch {
                claims = null;
            }
        } catch (e) {
            logger.warn(
                `[Clerk] getSession token: ${e instanceof Error ? e.message : String(e)}`,
            );
            return null;
        }

        const email =
            user.primaryEmailAddress?.emailAddress ??
            user.emailAddresses?.[0]?.emailAddress ??
            null;
        let roles = resolveRoles(
            { publicMetadata: (user.publicMetadata ?? {}) as Record<string, unknown> },
            claims,
        );
        roles = applyAdminAllowlist(user.id, email, roles);

        const displayName =
            [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
            user.username ||
            email;

        logger.info(
            `[Clerk] session sub=${mask(user.id, 12)} email=${email ?? "—"} role=${roles[0] ?? "(none)"}`,
        );

        return {
            subject: user.id,
            accessToken,
            email,
            displayName: displayName || null,
            roles,
            pictureUrl: user.imageUrl ?? null,
        };
    }
}
