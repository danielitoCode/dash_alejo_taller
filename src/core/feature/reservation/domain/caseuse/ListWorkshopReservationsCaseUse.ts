import type { WorkshopReservation } from "../entity/WorkshopReservation"
import type { WorkshopReservationStatus } from "../entity/enums"
import type { WorkshopReservationRepository } from "../repository/workshop-reservation.repository"

export class ListWorkshopReservationsCaseUse {
    constructor(private readonly repo: WorkshopReservationRepository) {}

    async execute(opts?: {
        status?: WorkshopReservationStatus | "all"
        limit?: number
    }): Promise<WorkshopReservation[]> {
        return this.repo.list(opts)
    }
}
