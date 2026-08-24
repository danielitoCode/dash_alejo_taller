import type { WorkshopReservation } from "../entity/WorkshopReservation"
import {
    isWorkshopReservationStatus,
    type WorkshopReservationStatus,
} from "../entity/enums"
import type { WorkshopReservationRepository } from "../repository/workshop-reservation.repository"

export class UpdateWorkshopReservationStatusCaseUse {
    constructor(private readonly repo: WorkshopReservationRepository) {}

    async execute(id: string, status: WorkshopReservationStatus): Promise<WorkshopReservation> {
        const rid = String(id || "").trim()
        if (!rid) throw new Error("reservation id is required")
        if (!isWorkshopReservationStatus(status)) {
            throw new Error(`invalid status: ${String(status)}`)
        }
        return this.repo.updateStatus(rid, status)
    }
}
