export type BusinessRole = "owner" | "admin" | "sales" | "viewer";

export function normalizeBusinessRole(role: unknown): BusinessRole {
    if (role === "owner" || role === "admin" || role === "sales" || role === "viewer") {
        return role;
    }

    return "viewer";
}
