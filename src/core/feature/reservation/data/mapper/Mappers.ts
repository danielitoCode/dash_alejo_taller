import type { WorkshopReservation } from "../../domain/entity/WorkshopReservation"
import { createWorkshopReservation } from "../../domain/entity/WorkshopReservation"
import type { WorkshopReservationChannel, WorkshopReservationStatus } from "../../domain/entity/enums"
import type { WorkshopReservationDTO } from "../dto/WorkshopReservationDTO"

export type WorkshopReservationWriteDTO = Pick<
    WorkshopReservationDTO,
    | "client_name"
    | "client_phone"
    | "client_user_id"
    | "equipment"
    | "service_type"
    | "status"
    | "scheduled_at"
    | "duration_minutes"
    | "notes"
    | "staff_user_id"
    | "created_by"
    | "channel"
> & { $id?: string }

export function workshopReservationFromDTO(dto: WorkshopReservationDTO): WorkshopReservation {
    return createWorkshopReservation({
        id: dto.$id,
        clientName: dto.client_name,
        clientPhone: dto.client_phone,
        clientUserId: dto.client_user_id,
        equipment: dto.equipment,
        serviceType: dto.service_type,
        status: dto.status as WorkshopReservationStatus,
        scheduledAtIso: dto.scheduled_at,
        durationMinutes: dto.duration_minutes,
        notes: dto.notes,
        staffUserId: dto.staff_user_id,
        createdBy: dto.created_by,
        channel: dto.channel as WorkshopReservationChannel,
    })
}

export function workshopReservationToDTO(r: WorkshopReservation): WorkshopReservationWriteDTO {
    const dto: WorkshopReservationWriteDTO = {
        $id: r.id || undefined,
        client_name: r.clientName,
        equipment: r.equipment,
        service_type: r.serviceType,
        status: r.status,
        scheduled_at: r.scheduledAtIso,
        created_by: r.createdBy,
        channel: r.channel,
    }
    if (r.clientPhone) dto.client_phone = r.clientPhone
    if (r.clientUserId) dto.client_user_id = r.clientUserId
    if (r.durationMinutes !== undefined) dto.duration_minutes = r.durationMinutes
    if (r.notes) dto.notes = r.notes
    if (r.staffUserId) dto.staff_user_id = r.staffUserId
    return dto
}
