import type { AuthSession } from "./entity/AuthSession";

/**
 * Puerto de autenticación (Fase 1 migración plataforma).
 * Case uses / UI dependen de esto; Auth0 vive solo en el adapter.
 */
export interface AuthPort {
    /** Crear cliente IdP y rehidratar sesión si existe. */
    init(): Promise<void>;

    /** Redirect al Universal Login (o equivalente). */
    loginWithRedirect(appState?: { returnTo?: string }): Promise<void>;

    /** Procesar `?code=` tras callback; no-op si no hay code. */
    handleRedirectCallback(): Promise<void>;

    logout(): Promise<void>;

    getSession(): Promise<AuthSession | null>;

    getAccessToken(): Promise<string | null>;

    /** Auth0 `sub` (o null). */
    getSubject(): Promise<string | null>;

    isAuthenticated(): Promise<boolean>;
}
