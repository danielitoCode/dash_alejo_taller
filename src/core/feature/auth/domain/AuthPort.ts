import type { AuthSession } from "./entity/AuthSession";

export type AuthLoginOptions = {
    returnTo?: string;
    /**
     * Auth0 connection. Panel: solo Database.
     * `Username-Password-Authentication` = usuario/contraseña (sin Google).
     */
    connection?: string;
    /** Prefill email en Universal Login. */
    loginHint?: string;
};

/**
 * Puerto de autenticación (migración plataforma).
 * Case uses / UI dependen de esto; Auth0 vive solo en el adapter.
 */
export interface AuthPort {
    init(): Promise<void>;

    /** Redirect al Universal Login (Database por defecto en panel). */
    loginWithRedirect(appState?: AuthLoginOptions): Promise<void>;

    handleRedirectCallback(): Promise<void>;

    logout(): Promise<void>;

    getSession(): Promise<AuthSession | null>;

    getAccessToken(): Promise<string | null>;

    getSubject(): Promise<string | null>;

    isAuthenticated(): Promise<boolean>;
}
