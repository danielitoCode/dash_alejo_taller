/**
 * Configuración centralizada de roles y permisos
 * 
 * Este archivo centraliza toda la lógica de roles para:
 * 1. Evitar duplicación de código
 * 2. Facilitar mantenimiento
 * 3. Mejorar la seguridad
 */

import type { BusinessRole } from "../entity/BusinessRole";

/**
 * Roles que tienen permisos de administrador
 */
export const ADMIN_ROLES: BusinessRole[] = ["admin", "owner"];

/**
 * Jerarquía de roles (de mayor a menor privilegio)
 */
export const ROLE_HIERARCHY: BusinessRole[] = ["owner", "admin", "sales", "viewer"];

/**
 * Definición de rutas accesibles por cada rol
 */
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

/**
 * Labels de AppWrite correspondientes a cada rol
 * Se usan al crear o actualizar usuarios
 */
export const ROLE_LABELS: Record<BusinessRole, string[]> = {
    owner: ["owner", "admin"],
    admin: ["admin"],
    sales: ["sales"],
    viewer: ["viewer"]
};

/**
 * Descripciones legibles de los roles
 */
export const ROLE_DESCRIPTIONS: Record<BusinessRole, string> = {
    owner: "Propietario - Control total del sistema",
    admin: "Administrador - Acceso a todas las funciones",
    sales: "Ventas - Gestión de ventas y reservas",
    viewer: "Visualizador - Acceso de solo lectura"
};

/**
 * Colores para mostrar los roles en UI
 */
export const ROLE_COLORS: Record<BusinessRole, string> = {
    owner: "#FF6B6B",   // Rojo
    admin: "#4ECDC4",   // Turquesa
    sales: "#45B7D1",   // Azul
    viewer: "#95A5A6"   // Gris
};

/**
 * Verifica si un rol tiene permisos de administrador
 * @param role - Rol a verificar
 * @returns true si el rol es admin u owner
 */
export function isAdminRole(role: string | null | undefined): boolean {
    return role !== null && role !== undefined && ADMIN_ROLES.includes(role as BusinessRole);
}

/**
 * Verifica si un rol puede acceder a una ruta específica
 * @param role - Rol del usuario
 * @param path - Ruta a verificar
 * @returns true si el rol tiene acceso a la ruta
 */
export function canAccessRoute(role: BusinessRole | null | undefined, path: string): boolean {
    if (!role) return false;
    return ROLE_ROUTE_ACCESS[role]?.includes(path) ?? false;
}

/**
 * Obtiene la primera ruta permitida para un rol
 * @param role - Rol del usuario
 * @returns Primera ruta permitida o "dashboard"
 */
export function getFirstAllowedRoute(role: BusinessRole | null | undefined): string {
    if (!role) return "dashboard";
    return ROLE_ROUTE_ACCESS[role]?.[0] ?? "dashboard";
}

/**
 * Obtiene los labels de AppWrite para un rol
 * @param role - Rol a convertir
 * @returns Array de labels de AppWrite
 */
export function getRoleLabels(role: BusinessRole): string[] {
    return ROLE_LABELS[role];
}

/**
 * Obtiene la descripción legible de un rol
 * @param role - Rol a describir
 * @returns Descripción legible
 */
export function getRoleDescription(role: BusinessRole): string {
    return ROLE_DESCRIPTIONS[role];
}

/**
 * Obtiene el color asociado a un rol
 * @param role - Rol para el que obtener color
 * @returns Código hex del color
 */
export function getRoleColor(role: BusinessRole): string {
    return ROLE_COLORS[role];
}

/**
 * Compara la jerarquía de dos roles
 * @param roleA - Primer rol
 * @param roleB - Segundo rol
 * @returns 1 si roleA > roleB, -1 si roleA < roleB, 0 si son iguales
 */
export function compareRoles(roleA: BusinessRole, roleB: BusinessRole): number {
    const indexA = ROLE_HIERARCHY.indexOf(roleA);
    const indexB = ROLE_HIERARCHY.indexOf(roleB);
    
    if (indexA < indexB) return 1;   // A es mayor (más privilegios)
    if (indexA > indexB) return -1;  // B es mayor
    return 0;                         // Iguales
}

/**
 * Verifica si un rol puede gestionar otro rol
 * Un rol solo puede gestionar roles con menor o igual jerarquía
 * @param managerRole - Rol del que está gestionando
 * @param targetRole - Rol a ser gestionado
 * @returns true si el manager puede gestionar target
 */
export function canManageRole(managerRole: BusinessRole, targetRole: BusinessRole): boolean {
    return compareRoles(managerRole, targetRole) >= 0;
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
    canManageRole
};

