/**
 * Configuración centralizada de roles y permisos (panel back-office).
 * Core1 3.3: ROLE_LABELS es la única fuente de verdad labels ↔ BusinessRole.
 */

import type { BusinessRole } from "../entity/BusinessRole";
import { normalizeBusinessRole } from "../entity/BusinessRole";

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
        "reservation",
        "inventory",
        "suppliers",
        "purchases",
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
        "reservation",
        "inventory",
        "suppliers",
        "purchases",
    ],
    sales: [
        "dashboard",
        "support",
        "support-detail",
        "sales",
        "sales-detail",
        "reservation",
    ],
    viewer: [
        "dashboard",
        "support",
        "support-detail",
    ],
};

/**
 * Labels Appwrite por rol de negocio.
 * Al crear/actualizar usuarios gestionados se usan exactamente estos arrays.
 */
export const ROLE_LABELS: Record<BusinessRole, string[]> = {
    owner: ["owner", "admin"],
    admin: ["admin"],
    sales: ["sales"],
    viewer: ["viewer"],
};

export const ROLE_DESCRIPTIONS: Record<BusinessRole, string> = {
    owner: "Propietario - Control total del sistema",
    admin: "Administrador - Acceso a todas las funciones",
    sales: "Ventas - Gestión de ventas y reservas",
    viewer: "Visualizador - Acceso de solo lectura",
};

export const ROLE_COLORS: Record<BusinessRole, string> = {
    owner: "#FF6B6B",
    admin: "#4ECDC4",
    sales: "#45B7D1",
    viewer: "#95A5A6",
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
    return [...ROLE_LABELS[role]];
}

/** Normaliza labels Appwrite a minúsculas sin vacíos. */
export function normalizeAppwriteLabels(labels: unknown): string[] {
    if (!Array.isArray(labels)) return [];
    return labels
        .map((l) => (typeof l === "string" ? l.toLowerCase().trim() : ""))
        .filter(Boolean);
}

/**
 * Deriva BusinessRole desde labels Appwrite (prioridad = ROLE_HIERARCHY).
 * Ej: ["admin","owner"] → owner.
 */
export function businessRoleFromLabels(labels: unknown): BusinessRole | null {
    const normalized = normalizeAppwriteLabels(labels);
    if (normalized.length === 0) return null;
    for (const role of ROLE_HIERARCHY) {
        if (normalized.includes(role)) return role;
    }
    return null;
}

/**
 * Resolución canónica de rol para panel:
 * 1) labels Appwrite
 * 2) role / prefs.role explícito
 * 3) viewer por defecto
 */
export function resolveBusinessRole(input: {
    labels?: unknown;
    role?: unknown;
    prefsRole?: unknown;
}): BusinessRole {
    const fromLabels = businessRoleFromLabels(input.labels);
    if (fromLabels) return fromLabels;

    const explicit = input.role ?? input.prefsRole;
    if (explicit !== null && explicit !== undefined && String(explicit).trim() !== "") {
        return normalizeBusinessRole(explicit);
    }

    return "viewer";
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

export function canManageRole(managerRole: BusinessRole, targetRole: BusinessRole): boolean {
    return compareRoles(managerRole, targetRole) >= 0;
}

export function assignableRoles(managerRole: BusinessRole): BusinessRole[] {
    return ROLE_HIERARCHY.filter((r) => canManageRole(managerRole, r));
}

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
    normalizeAppwriteLabels,
    businessRoleFromLabels,
    resolveBusinessRole,
    getRoleDescription,
    getRoleColor,
    compareRoles,
    canManageRole,
    assignableRoles,
    assertCanAssignRole,
};
