import type { BusinessRole } from "./BusinessRole";

/**
 * Sesión de identidad desacoplada del vendor (Auth0 / futuro).
 * `subject` = claim estable (Auth0 `sub`) para FK y mapas de rol.
 * No incluye secretos de Appwrite ni password.
 */
export interface AuthSession {
    /** Identificador estable del IdP (Auth0 `sub`). */
    subject: string;
    accessToken: string;
    email?: string | null;
    displayName?: string | null;
    /** Roles de negocio ya normalizados (owner | admin | sales | viewer). */
    roles: BusinessRole[];
    /** Epoch ms de expiración del access token, si se conoce. */
    expiresAtMs?: number;
    /** Foto de perfil del IdP, si existe. */
    pictureUrl?: string | null;
}

/** Claim custom recomendado en Auth0 Action (array o string). */
export const AUTH_ROLES_CLAIM = "https://alejotaller.app/roles";
