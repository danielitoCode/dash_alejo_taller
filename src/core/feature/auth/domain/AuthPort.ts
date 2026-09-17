import type { AuthSession } from "./entity/AuthSession";

export type AuthLoginOptions = {
    returnTo?: string;
    /**
     * Legacy Auth0 connection. Panel: no usar Google.
     * Ignorado por Clerk (email/password en UI hosted).
     */
    connection?: string;
    /** Prefill email (Auth0 login_hint). */
    loginHint?: string;
    /** Clerk: "login" | "signup". Default login. */
    screenHint?: "login" | "signup";
};

/**
 * Puerto de autenticación (migración plataforma).
 * Case uses / UI dependen de esto; Clerk/Auth0 viven solo en el adapter.
 */
export interface AuthPort {
    init(): Promise<void>;

    /** Redirect al IdP (Clerk Universal Login o Auth0 Database). */
    loginWithRedirect(appState?: AuthLoginOptions): Promise<void>;

    handleRedirectCallback(): Promise<void>;

    logout(): Promise<void>;

    getSession(): Promise<AuthSession | null>;

    getAccessToken(): Promise<string | null>;

    getSubject(): Promise<string | null>;

    isAuthenticated(): Promise<boolean>;
}
