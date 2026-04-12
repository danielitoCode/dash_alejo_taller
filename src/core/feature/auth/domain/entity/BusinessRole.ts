export type BusinessRole = "owner" | "admin" | "sales" | "viewer";

export function normalizeBusinessRole(role: unknown): BusinessRole {
    const r = typeof role === "string" ? role.toLowerCase().trim() : "";
    if (r === "owner" || r === "admin" || r === "sales" || r === "viewer") {
        return r;
    }
    return "viewer";
}
