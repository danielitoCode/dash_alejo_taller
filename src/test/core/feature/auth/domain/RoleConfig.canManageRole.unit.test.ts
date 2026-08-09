import { describe, it, expect } from "vitest"
import {
    assertCanAssignRole,
    assignableRoles,
    canManageRole,
    compareRoles,
} from "../../../../../core/feature/auth/domain/config/RoleConfig"
import type { BusinessRole } from "../../../../../core/feature/auth/domain/entity/BusinessRole"

describe("canManageRole / assertCanAssignRole (Core1 3.2)", () => {
    it("owner gestiona todos los roles", () => {
        for (const r of ["owner", "admin", "sales", "viewer"] as BusinessRole[]) {
            expect(canManageRole("owner", r)).toBe(true)
        }
    })

    it("admin no gestiona owner", () => {
        expect(canManageRole("admin", "owner")).toBe(false)
        expect(canManageRole("admin", "admin")).toBe(true)
        expect(canManageRole("admin", "sales")).toBe(true)
        expect(canManageRole("admin", "viewer")).toBe(true)
    })

    it("sales solo sales y viewer", () => {
        expect(canManageRole("sales", "owner")).toBe(false)
        expect(canManageRole("sales", "admin")).toBe(false)
        expect(canManageRole("sales", "sales")).toBe(true)
        expect(canManageRole("sales", "viewer")).toBe(true)
    })

    it("viewer solo viewer", () => {
        expect(canManageRole("viewer", "viewer")).toBe(true)
        expect(canManageRole("viewer", "sales")).toBe(false)
        expect(canManageRole("viewer", "admin")).toBe(false)
    })

    it("assignableRoles respeta jerarquía", () => {
        expect(assignableRoles("admin")).toEqual(["admin", "sales", "viewer"])
        expect(assignableRoles("sales")).toEqual(["sales", "viewer"])
        expect(assignableRoles("viewer")).toEqual(["viewer"])
    })

    it("assertCanAssignRole: admin no crea owner", () => {
        expect(() => assertCanAssignRole("admin", "owner")).toThrow(/no puede asignar/i)
    })

    it("assertCanAssignRole: admin no modifica un owner existente", () => {
        expect(() => assertCanAssignRole("admin", "viewer", "owner")).toThrow(/no puede modificar/i)
    })

    it("assertCanAssignRole: admin puede bajar sales a viewer", () => {
        expect(() => assertCanAssignRole("admin", "viewer", "sales")).not.toThrow()
    })

    it("compareRoles: owner > admin > sales > viewer", () => {
        expect(compareRoles("owner", "admin")).toBe(1)
        expect(compareRoles("admin", "owner")).toBe(-1)
        expect(compareRoles("sales", "sales")).toBe(0)
    })
})
