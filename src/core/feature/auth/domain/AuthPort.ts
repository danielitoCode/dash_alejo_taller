import type { AuthSession } from "./entity/AuthSession";

export type AuthLoginOptions = {
    returnTo?: string;
    /** Auth0 connection name, e.g. `google-oauth2` for Google social (free plan). */
    connection?: string;
};

/**
 * Puerto de autenticación (Fase 1 migración plataforma).
 * Case uses / UI dependen de esto; Auth0 vive solo en el adapter.
 */
export interface AuthPort {
    init(): Promise<void>;

    /** Redirect al Universal Login (o a un IdP concreto vía `connection`). */
    loginWithRedirect(appState?: AuthLoginOptions): Promise<void>;

    handleRedirectCallback(): Promise<void>;

    logout(): Promise<void>;

    getSession(): Promise<AuthSession | null>;

    getAccessToken(): Promise<string | null>;

    getSubject(): Promise<string | null>;

    isAuthenticated(): Promise<boolean>;
}
