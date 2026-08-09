/**
 * Configuración centralizada de roles y permisos (panel back-office).
 */

import type { BusinessRole } from "../entity/BusinessRole";

export const ADMIN_ROLES: BusinessRole[] = ["admin", "owner"];

/** Jerarquía de mayor a menor privilegio. */
export const ROLE_HIERARCHY: BusinessRole[] = ["owner", "admin", "sales", "viewer"];

export const ROLE_ROUTE_ACCESS: Record<BusinessRole, string[]> = {
    owner: [
        "dashboard",
        "support",
        "support-detail",
        "users",
        "product",
        "category",
        "sales",
        "sales-detail",
        "promo",
        "settings",
        "reservation"
    ],
    admin: [
        "dashboard",
        "support",
        "support-detail",
        "users",
        "product",
        "category",
        "sales",
        "sales-detail",
        "promo",
        "settings",
        "reservation"
    ],
    sales: [
        "dashboard",
        "support",
        "support-detail",
        "sales",
        "sales-detail",
        "reservation"
    ],
    viewer: [
        "dashboard",
        "support",
        "support-detail"
    ]
};

export const ROLE_LABELS: Record<BusinessRole, string[]> = {
    owner: ["owner", "admin"],
    admin: ["admin"],
    sales: ["sales"],
    viewer: ["viewer"]
};

export const ROLE_DESCRIPTIONS: Record<BusinessRole, string> = {
    owner: "Propietario - Control total del sistema",
    admin: "Administrador - Acceso a todas las funciones",
    sales: "Ventas - Gestión de ventas y reservas",
    viewer: "Visualizador - Acceso de solo lectura"
};

export const ROLE_COLORS: Record<BusinessRole, string> = {
    owner: "#FF6B6B",
    admin: "#4ECDC4",
    sales: "#45B7D1",
    viewer: "#95A5A6"
};

export function isAdminRole(role: string | null | undefined): boolean {
    return role !== null && role !== undefined && ADMIN_ROLES.includes(role as BusinessRole);
}

export function canAccessRoute(role: BusinessRole | null | undefined, path: string): boolean {
    if (!role) return false;
    return ROLE_ROUTE_ACCESS[role]?.includes(path) ?? false;
}

export function getFirstAllowedRoute(role: BusinessRole | null | undefined): string {
    if (!role) return "dashboard";
    return ROLE_ROUTE_ACCESS[role]?.[0] ?? "dashboard";
}

export function getRoleLabels(role: BusinessRole): string[] {
    return ROLE_LABELS[role];
}

export function getRoleDescription(role: BusinessRole): string {
    return ROLE_DESCRIPTIONS[role];
}

export function getRoleColor(role: BusinessRole): string {
    return ROLE_COLORS[role];
}

export function compareRoles(roleA: BusinessRole, roleB: BusinessRole): number {
    const indexA = ROLE_HIERARCHY.indexOf(roleA);
    const indexB = ROLE_HIERARCHY.indexOf(roleB);

    if (indexA < indexB) return 1;
    if (indexA > indexB) return -1;
    return 0;
}

/**
 * Un manager solo puede gestionar roles de menor o igual jerarquía.
 * Core1 3.2.
 */
export function canManageRole(managerRole: BusinessRole, targetRole: BusinessRole): boolean {
    return compareRoles(managerRole, targetRole) >= 0;
}

/** Roles que el manager puede asignar (crear o cambiar). */
export function assignableRoles(managerRole: BusinessRole): BusinessRole[] {
    return ROLE_HIERARCHY.filter((r) => canManageRole(managerRole, r));
}

/**
 * Valida asignación de rol (alta o cambio).
 * - Debe poder asignar el rol destino.
 * - Si el usuario ya tiene un rol, debe poder gestionar ese rol actual
 *   (no tocar cuentas de mayor jerarquía).
 */
export function assertCanAssignRole(
    managerRole: BusinessRole,
    newRole: BusinessRole,
    currentTargetRole?: BusinessRole | null
): void {
    if (!canManageRole(managerRole, newRole)) {
        throw new Error(
            `Tu rol (${managerRole}) no puede asignar el rol ${newRole}`
        );
    }
    if (currentTargetRole && !canManageRole(managerRole, currentTargetRole)) {
        throw new Error(
            `Tu rol (${managerRole}) no puede modificar un usuario con rol ${currentTargetRole}`
        );
    }
}

export default {
    ADMIN_ROLES,
    ROLE_HIERARCHY,
    ROLE_ROUTE_ACCESS,
    ROLE_LABELS,
    ROLE_DESCRIPTIONS,
    ROLE_COLORS,
    isAdminRole,
    canAccessRoute,
    getFirstAllowedRoute,
    getRoleLabels,
    getRoleDescription,
    getRoleColor,
    compareRoles,
    canManageRole,
    assignableRoles,
    assertCanAssignRole
};
