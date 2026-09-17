import type { AuthSession } from "./entity/AuthSession";

export type AuthLoginOptions = {
    returnTo?: string;
    /** Prefill email si el IdP lo soporta. */
    loginHint?: string;
    /** Clerk: "login" | "signup". Default login. */
    screenHint?: "login" | "signup";
};

/**
 * Puerto de autenticación.
 * Case uses / UI dependen de esto; Clerk vive solo en el adapter.
 * Auth0 eliminado del panel Core6.
 */
export interface AuthPort {
    init(): Promise<void>;

    /** Redirect a Clerk Universal Login. */
    loginWithRedirect(appState?: AuthLoginOptions): Promise<void>;

    handleRedirectCallback(): Promise<void>;

    logout(): Promise<void>;

    getSession(): Promise<AuthSession | null>;

    getAccessToken(): Promise<string | null>;

    getSubject(): Promise<string | null>;

    isAuthenticated(): Promise<boolean>;
}
