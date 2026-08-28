export type BusinessRole = "owner" | "admin" | "sales" | "viewer";

/** Alias Appwrite → BusinessRole (operador de piso = sales). */
const ROLE_ALIASES: Record<string, BusinessRole> = {
    owner: "owner",
    admin: "admin",
    sales: "sales",
    operator: "sales",
    viewer: "viewer",
};

export function normalizeBusinessRole(role: unknown): BusinessRole {
    const r = typeof role === "string" ? role.toLowerCase().trim() : "";
    return ROLE_ALIASES[r] ?? "viewer";
}
