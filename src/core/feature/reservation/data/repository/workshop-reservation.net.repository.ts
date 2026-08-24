import { type Databases, ID, Query } from "appwrite"
import { ENV } from "../../../../infrastructure/env"
import { APPWRITE_COLLECTIONS } from "../../../../infrastructure/appwrite/collections"
import type { WorkshopReservation } from "../../domain/entity/WorkshopReservation"
import type { WorkshopReservationStatus } from "../../domain/entity/enums"
import type { WorkshopReservationRepository } from "../../domain/repository/workshop-reservation.repository"
import type { WorkshopReservationDTO } from "../dto/WorkshopReservationDTO"
import {
    workshopReservationFromDTO,
    workshopReservationToDTO,
} from "../mapper/Mappers"

export class WorkshopReservationNetRepository implements WorkshopReservationRepository {
    constructor(private readonly databases: Databases) {}

    private get databaseId(): string {
        const id = ENV.databaseId
        if (!id) throw new Error("Falta configurar VITE_APPWRITE_DATABASE_ID")
        return id
    }

    private get collectionId(): string {
        return APPWRITE_COLLECTIONS.workshopReservation
    }

    async create(reservation: WorkshopReservation): Promise<WorkshopReservation> {
        const write = workshopReservationToDTO(reservation)
        const { $id, ...data } = write
        const doc = await this.databases.createDocument<WorkshopReservationDTO>(
            this.databaseId,
            this.collectionId,
            $id && $id.length > 0 ? $id : ID.unique(),
            data as Omit<WorkshopReservationDTO, keyof import("appwrite").Models.Document>
        )
        return workshopReservationFromDTO(doc)
    }

    async getById(id: string): Promise<WorkshopReservation | null> {
        try {
            const doc = await this.databases.getDocument<WorkshopReservationDTO>(
                this.databaseId,
                this.collectionId,
                id
            )
            return workshopReservationFromDTO(doc)
        } catch {
            return null
        }
    }

    async list(opts?: {
        status?: WorkshopReservationStatus | "all"
        limit?: number
    }): Promise<WorkshopReservation[]> {
        const limit = Math.min(Math.max(1, opts?.limit ?? 50), 100)
        const queries = [Query.orderAsc("scheduled_at"), Query.limit(limit)]
        if (opts?.status && opts.status !== "all") {
            queries.unshift(Query.equal("status", opts.status))
        }
        const res = await this.databases.listDocuments<WorkshopReservationDTO>(
            this.databaseId,
            this.collectionId,
            queries
        )
        return res.documents.map(workshopReservationFromDTO)
    }

    async updateStatus(
        id: string,
        status: WorkshopReservationStatus
    ): Promise<WorkshopReservation> {
        const doc = await this.databases.updateDocument<WorkshopReservationDTO>(
            this.databaseId,
            this.collectionId,
            id,
            { status }
        )
        return workshopReservationFromDTO(doc)
    }

    async update(
        id: string,
        patch: Partial<WorkshopReservation>
    ): Promise<WorkshopReservation> {
        const data: Record<string, unknown> = {}
        if (patch.clientName !== undefined) data.client_name = patch.clientName
        if (patch.clientPhone !== undefined) data.client_phone = patch.clientPhone
        if (patch.clientUserId !== undefined) data.client_user_id = patch.clientUserId
        if (patch.equipment !== undefined) data.equipment = patch.equipment
        if (patch.serviceType !== undefined) data.service_type = patch.serviceType
        if (patch.status !== undefined) data.status = patch.status
        if (patch.scheduledAtIso !== undefined) data.scheduled_at = patch.scheduledAtIso
        if (patch.durationMinutes !== undefined) data.duration_minutes = patch.durationMinutes
        if (patch.notes !== undefined) data.notes = patch.notes
        if (patch.staffUserId !== undefined) data.staff_user_id = patch.staffUserId
        if (patch.channel !== undefined) data.channel = patch.channel
        const doc = await this.databases.updateDocument<WorkshopReservationDTO>(
            this.databaseId,
            this.collectionId,
            id,
            data
        )
        return workshopReservationFromDTO(doc)
    }
}
