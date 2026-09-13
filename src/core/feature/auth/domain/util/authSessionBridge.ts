import type { AuthSession } from "../entity/AuthSession";
import type { BusinessRole } from "../entity/BusinessRole";
import { STAFF_ROLES } from "../config/RoleConfig";

/** Rol efectivo para gates del panel (prioridad staff). */
export function primaryBusinessRole(session: AuthSession): BusinessRole {
    const staff = session.roles.find((r) => (STAFF_ROLES as string[]).includes(r));
    if (staff) return staff;
    return session.roles[0] ?? "viewer";
}

/** Forma mínima compatible con canAccessDashboard / navegación. */
export function userLikeFromAuthSession(session: AuthSession): {
    id: string;
    name: string;
    email: string;
    role: BusinessRole;
    sub: string;
} {
    const role = primaryBusinessRole(session);
    const email = session.email ?? "";
    const name =
        session.displayName?.trim() ||
        (email.includes("@") ? email.split("@")[0] : "") ||
        "usuario";
    return {
        id: session.subject,
        name,
        email,
        role,
        sub: session.subject,
    };
}
