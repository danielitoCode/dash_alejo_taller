import { describe, it, expect } from "vitest"
import {
    businessRoleFromLabels,
    getRoleLabels,
    normalizeAppwriteLabels,
    resolveBusinessRole,
    ROLE_LABELS,
    ROLE_HIERARCHY,
} from "../../../../../core/feature/auth/domain/config/RoleConfig"
import type { BusinessRole } from "../../../../../core/feature/auth/domain/entity/BusinessRole"

describe("ROLE_LABELS / resolveBusinessRole (Core1 3.3)", () => {
    it("getRoleLabels coincide con ROLE_LABELS (copia)", () => {
        for (const role of ROLE_HIERARCHY) {
            expect(getRoleLabels(role)).toEqual(ROLE_LABELS[role])
            expect(getRoleLabels(role)).not.toBe(ROLE_LABELS[role]) // copia defensiva
        }
    })

    it("owner labels incluyen owner y admin", () => {
        expect(getRoleLabels("owner")).toEqual(["owner", "admin"])
    })

    it("normalizeAppwriteLabels minúsculas y limpia", () => {
        expect(normalizeAppwriteLabels(["Admin", " OWNER ", "", 1])).toEqual([
            "admin",
            "owner",
        ])
    })

    it("businessRoleFromLabels prioriza jerarquía (owner > admin)", () => {
        expect(businessRoleFromLabels(["admin", "owner"])).toBe("owner")
        expect(businessRoleFromLabels(["viewer", "sales"])).toBe("sales")
        expect(businessRoleFromLabels(["Admin"])).toBe("admin")
        expect(businessRoleFromLabels([])).toBeNull()
        expect(businessRoleFromLabels(undefined)).toBeNull()
    })

    it("resolveBusinessRole: labels ganan sobre prefs.role", () => {
        expect(
            resolveBusinessRole({
                labels: ["sales"],
                prefsRole: "owner",
                role: "admin",
            })
        ).toBe("sales")
    })

    it("resolveBusinessRole: sin labels usa role/prefs", () => {
        expect(resolveBusinessRole({ prefsRole: "admin" })).toBe("admin")
        expect(resolveBusinessRole({ role: "sales" })).toBe("sales")
    })

    it("resolveBusinessRole: sin datos → viewer", () => {
        expect(resolveBusinessRole({})).toBe("viewer")
        expect(resolveBusinessRole({ labels: [], role: null })).toBe("viewer")
    })

    it("round-trip: cada rol → labels → mismo rol", () => {
        for (const role of ROLE_HIERARCHY as BusinessRole[]) {
            const labels = getRoleLabels(role)
            expect(businessRoleFromLabels(labels)).toBe(role)
        }
    })
})
