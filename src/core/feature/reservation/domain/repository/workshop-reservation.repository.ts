import type { WorkshopReservation } from "../entity/WorkshopReservation"
import type { WorkshopReservationStatus } from "../entity/enums"

export interface WorkshopReservationRepository {
    create(reservation: WorkshopReservation): Promise<WorkshopReservation>
    getById(id: string): Promise<WorkshopReservation | null>
    list(opts?: {
        status?: WorkshopReservationStatus | "all"
        limit?: number
    }): Promise<WorkshopReservation[]>
    updateStatus(id: string, status: WorkshopReservationStatus): Promise<WorkshopReservation>
    update(id: string, patch: Partial<WorkshopReservation>): Promise<WorkshopReservation>
}
