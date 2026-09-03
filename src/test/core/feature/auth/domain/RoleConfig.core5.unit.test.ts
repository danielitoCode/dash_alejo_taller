import { describe, it, expect } from "vitest"
import {
    canAccessDashboard,
    canViewCore5Reports,
} from "../../../../../core/feature/auth/domain/config/RoleConfig"

describe("RoleConfig Core5 B5 — lectura reportes", () => {
    it("staff (owner/admin/sales) puede ver reportes Core5", () => {
        expect(canViewCore5Reports("owner")).toBe(true)
        expect(canViewCore5Reports("admin")).toBe(true)
        expect(canViewCore5Reports("sales")).toBe(true)
        expect(canViewCore5Reports("operator")).toBe(true) // alias → sales vía normalize en canAccessDashboard path
    })

    it("viewer / vacío / null no ve reportes ni dashboard", () => {
        expect(canViewCore5Reports("viewer")).toBe(false)
        expect(canViewCore5Reports(null)).toBe(false)
        expect(canViewCore5Reports(undefined)).toBe(false)
        expect(canViewCore5Reports("")).toBe(false)
        expect(canAccessDashboard("viewer")).toBe(false)
    })

    it("canViewCore5Reports ≡ canAccessDashboard (paneles en dashboard)", () => {
        for (const role of ["owner", "admin", "sales", "viewer", null, undefined, ""] as const) {
            expect(canViewCore5Reports(role as any)).toBe(canAccessDashboard(role as any))
        }
    })
})
