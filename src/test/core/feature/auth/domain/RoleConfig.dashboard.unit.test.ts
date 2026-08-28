import { describe, it, expect } from "vitest"
import {
    canAccessDashboard,
    canAccessRoute,
    businessRoleFromLabels,
    resolveBusinessRole,
} from "../../../../../core/feature/auth/domain/config/RoleConfig"
import { normalizeBusinessRole } from "../../../../../core/feature/auth/domain/entity/BusinessRole"

describe("canAccessDashboard (Core3 B4)", () => {
    it("owner y admin entran al panel", () => {
        expect(canAccessDashboard("owner")).toBe(true)
        expect(canAccessDashboard("admin")).toBe(true)
    })

    it("sales y alias operator entran al panel", () => {
        expect(canAccessDashboard("sales")).toBe(true)
        expect(canAccessDashboard("operator")).toBe(true)
        expect(normalizeBusinessRole("operator")).toBe("sales")
        expect(businessRoleFromLabels(["operator"])).toBe("sales")
        expect(resolveBusinessRole({ role: "operator" })).toBe("sales")
    })

    it("viewer / vacío / cliente no entran", () => {
        expect(canAccessDashboard("viewer")).toBe(false)
        expect(canAccessDashboard(null)).toBe(false)
        expect(canAccessDashboard(undefined)).toBe(false)
        expect(canAccessDashboard("")).toBe(false)
        expect(canAccessDashboard("user")).toBe(false)
    })

    it("visibilidad: owner/admin ven compras y proveedores; sales no", () => {
        for (const role of ["owner", "admin"] as const) {
            expect(canAccessRoute(role, "suppliers")).toBe(true)
            expect(canAccessRoute(role, "purchases")).toBe(true)
            expect(canAccessRoute(role, "product")).toBe(true)
            expect(canAccessRoute(role, "sales")).toBe(true)
        }
        expect(canAccessRoute("sales", "suppliers")).toBe(false)
        expect(canAccessRoute("sales", "purchases")).toBe(false)
        expect(canAccessRoute("sales", "product")).toBe(false)
        expect(canAccessRoute("sales", "sales")).toBe(true)
        expect(canAccessRoute("sales", "reservation")).toBe(true)
        expect(canAccessRoute("sales", "support")).toBe(true)
    })
})
