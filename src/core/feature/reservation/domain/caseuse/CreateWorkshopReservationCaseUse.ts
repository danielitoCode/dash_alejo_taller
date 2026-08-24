import {
    createWorkshopReservation,
    type CreateWorkshopReservationInput,
    type WorkshopReservation,
} from "../entity/WorkshopReservation"
import type { WorkshopReservationRepository } from "../repository/workshop-reservation.repository"

export class CreateWorkshopReservationCaseUse {
    constructor(
        private readonly repo: WorkshopReservationRepository,
        private readonly resolveUserId: () => Promise<string>
    ) {}

    async execute(
        input: Omit<CreateWorkshopReservationInput, "createdBy" | "channel"> & {
            createdBy?: string
            channel?: CreateWorkshopReservationInput["channel"]
        }
    ): Promise<WorkshopReservation> {
        const createdBy = input.createdBy || (await this.resolveUserId())
        const entity = createWorkshopReservation({
            ...input,
            createdBy,
            channel: input.channel ?? "dash",
            status: input.status ?? "requested",
        })
        return this.repo.create(entity)
    }
}
