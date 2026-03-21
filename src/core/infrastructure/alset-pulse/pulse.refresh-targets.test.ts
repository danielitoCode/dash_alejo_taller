import { describe, expect, it } from "vitest";
import { pulseRefreshTargets } from "./pulse.refresh-targets";

describe("pulseRefreshTargets", () => {
    it("deduce ambos targets desde el nombre del evento", () => {
        expect(pulseRefreshTargets("support-sales-refresh", null)).toEqual(["support", "sales"]);
    });

    it("interpreta targets desde payload array con alias en español", () => {
        expect(
            pulseRefreshTargets("refresh", {
                targets: ["support", "ventas"]
            })
        ).toEqual(["support", "sales"]);
    });

    it("mezcla nombre del evento y payload sin duplicados", () => {
        expect(
            pulseRefreshTargets("support:refresh", {
                sales: true
            })
        ).toEqual(["support", "sales"]);
    });

    it("retorna vacío cuando no puede inferir recursos", () => {
        expect(pulseRefreshTargets("unknown-event", { target: "other" })).toEqual([]);
    });
});
