import { infrastructureContainer } from "../../../infrastructure/di/infrastructure.container"
import { authContainer } from "../../auth/di/auth.container"
import { WorkshopReservationNetRepository } from "../data/repository/workshop-reservation.net.repository"
import type { WorkshopReservationRepository } from "../domain/repository/workshop-reservation.repository"
import { ListWorkshopReservationsCaseUse } from "../domain/caseuse/ListWorkshopReservationsCaseUse"
import { CreateWorkshopReservationCaseUse } from "../domain/caseuse/CreateWorkshopReservationCaseUse"
import { UpdateWorkshopReservationStatusCaseUse } from "../domain/caseuse/UpdateWorkshopReservationStatusCaseUse"

const net = new WorkshopReservationNetRepository(
    infrastructureContainer.appwrite.databases
)

async function resolveStaffUserId(): Promise<string> {
    try {
        const user = await authContainer.useCases.accounts.getCurrentUser()
        const id = String(
            (user as { $id?: string })?.$id || (user as { id?: string })?.id || ""
        ).trim()
        return id || "staff"
    } catch {
        return "staff"
    }
}

export const reservationContainer = {
    repositories: {
        workshopReservation: net as WorkshopReservationRepository,
    },
    useCases: {
        list: new ListWorkshopReservationsCaseUse(net),
        create: new CreateWorkshopReservationCaseUse(net, resolveStaffUserId),
        updateStatus: new UpdateWorkshopReservationStatusCaseUse(net),
    },
}
