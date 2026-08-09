import { describe, it, expect } from "vitest"
import {
    canAccessRoute,
    getFirstAllowedRoute,
    ROLE_ROUTE_ACCESS,
    type /* noop */ ,
} from "../../../../../core/feature/auth/domain/config/RoleConfig"
import type { BusinessRole } from "../../../../../core/feature/auth/domain/entity/BusinessRole"

/** Paths del shell anidado (deben coincidir con nested.router.ts). */
const SHELL_PATHS = [
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
] as const

describe("RoleConfig route gates (Core1 3.1)", () => {
    it("ROLE_ROUTE_ACCESS cubre solo paths del shell", () => {
        const roles = Object.keys(ROLE_ROUTE_ACCESS) as BusinessRole[]
        for (const role of roles) {
            for (const path of ROLE_ROUTE_ACCESS[role]) {
                expect(SHELL_PATHS).toContain(path)
            }
        }
    })

    it("viewer: solo dashboard + support (+ detail)", () => {
        expect(canAccessRoute("viewer", "dashboard")).toBe(true)
        expect(canAccessRoute("viewer", "support")).toBe(true)
        expect(canAccessRoute("viewer", "support-detail")).toBe(true)
        expect(canAccessRoute("viewer", "product")).toBe(false)
        expect(canAccessRoute("viewer", "sales")).toBe(false)
        expect(canAccessRoute("viewer", "users")).toBe(false)
        expect(canAccessRoute("viewer", "settings")).toBe(false)
    })

    it("sales: ventas/reservas sí; catálogo y users no", () => {
        expect(canAccessRoute("sales", "sales")).toBe(true)
        expect(canAccessRoute("sales", "sales-detail")).toBe(true)
        expect(canAccessRoute("sales", "reservation")).toBe(true)
        expect(canAccessRoute("sales", "product")).toBe(false)
        expect(canAccessRoute("sales", "category")).toBe(false)
        expect(canAccessRoute("sales", "users")).toBe(false)
        expect(canAccessRoute("sales", "promo")).toBe(false)
        expect(canAccessRoute("sales", "settings")).toBe(false)
    })

    it("admin y owner: catálogo + users + settings", () => {
        for (const role of ["admin", "owner"] as BusinessRole[]) {
            expect(canAccessRoute(role, "product")).toBe(true)
            expect(canAccessRoute(role, "category")).toBe(true)
            expect(canAccessRoute(role, "users")).toBe(true)
            expect(canAccessRoute(role, "settings")).toBe(true)
            expect(canAccessRoute(role, "promo")).toBe(true)
            expect(canAccessRoute(role, "sales")).toBe(true)
        }
    })

    it("sin rol → deniega cualquier ruta", () => {
        expect(canAccessRoute(null, "dashboard")).toBe(false)
        expect(canAccessRoute(undefined, "dashboard")).toBe(false)
    })

    it("ruta desconocida → deniega", () => {
        expect(canAccessRoute("owner", "super-secret")).toBe(false)
        expect(canAccessRoute("viewer", "not-a-route")).toBe(false)
    })

    it("getFirstAllowedRoute es la primera de la matriz del rol", () => {
        expect(getFirstAllowedRoute("viewer")).toBe(ROLE_ROUTE_ACCESS.viewer[0])
        expect(getFirstAllowedRoute("sales")).toBe(ROLE_ROUTE_ACCESS.sales[0])
        expect(getFirstAllowedRoute(null)).toBe("dashboard")
    })
})
