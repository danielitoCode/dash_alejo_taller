import { describe, it, expect } from "vitest"
import { createWorkshopReservation } from "../../../../core/feature/reservation/domain/entity/WorkshopReservation"
import {
    workshopReservationFromDTO,
    workshopReservationToDTO,
} from "../../../../core/feature/reservation/data/mapper/Mappers"
import type { WorkshopReservationDTO } from "../../../../core/feature/reservation/data/dto/WorkshopReservationDTO"

describe("WorkshopReservation mapper (Core2 B5)", () => {
    it("round-trip DTO ↔ domain", () => {
        const entity = createWorkshopReservation({
            id: "r1",
            clientName: "Ana",
            clientPhone: "+53 500",
            equipment: "Laptop HP",
            serviceType: "reparacion",
            status: "confirmed",
            scheduledAtIso: "2026-08-25T14:00:00.000Z",
            durationMinutes: 60,
            notes: "Traer cargador",
            createdBy: "staff1",
            channel: "dash",
        })
        const dto = workshopReservationToDTO(entity)
        expect(dto.client_name).toBe("Ana")
        expect(dto.scheduled_at).toBe("2026-08-25T14:00:00.000Z")
        expect(dto.status).toBe("confirmed")

        const back = workshopReservationFromDTO({
            ...dto,
            $id: "r1",
            $createdAt: "",
            $updatedAt: "",
            $permissions: [],
            $collectionId: "workshop_reservation",
            $databaseId: "db",
        } as WorkshopReservationDTO)
        expect(back.clientName).toBe("Ana")
        expect(back.equipment).toBe("Laptop HP")
        expect(back.status).toBe("confirmed")
        expect(back.channel).toBe("dash")
    })

    it("rechaza clientName vacío", () => {
        expect(() =>
            createWorkshopReservation({
                clientName: "  ",
                equipment: "x",
                serviceType: "otro",
                scheduledAtIso: "2026-08-25T14:00:00.000Z",
                createdBy: "u1",
                channel: "dash",
            })
        ).toThrow(/clientName/)
    })
})
