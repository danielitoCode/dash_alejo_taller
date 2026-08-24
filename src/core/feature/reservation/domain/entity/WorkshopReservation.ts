import {
    isWorkshopReservationChannel,
    isWorkshopReservationStatus,
    type WorkshopReservationChannel,
    type WorkshopReservationStatus,
} from "./enums"

/**
 * Reserva de turno de taller (Core2 B5).
 * No es Sale de tienda ni afecta existence/reserved de producto.
 */
export interface WorkshopReservation {
    id: string
    clientName: string
    clientPhone?: string
    clientUserId?: string
    equipment: string
    serviceType: string
    status: WorkshopReservationStatus
    scheduledAtIso: string
    durationMinutes?: number
    notes?: string
    staffUserId?: string
    createdBy: string
    channel: WorkshopReservationChannel
}

export type CreateWorkshopReservationInput = Omit<WorkshopReservation, "id" | "status"> & {
    id?: string
    status?: WorkshopReservationStatus
}

export function createWorkshopReservation(input: CreateWorkshopReservationInput): WorkshopReservation {
    const clientName = String(input.clientName || "").trim()
    if (!clientName) throw new Error("clientName is required")

    const equipment = String(input.equipment || "").trim()
    if (!equipment) throw new Error("equipment is required")

    const serviceType = String(input.serviceType || "").trim()
    if (!serviceType) throw new Error("serviceType is required")

    const scheduledAtIso = String(input.scheduledAtIso || "").trim()
    if (!scheduledAtIso || !Number.isFinite(Date.parse(scheduledAtIso))) {
        throw new Error("scheduledAtIso must be a valid ISO datetime")
    }

    const createdBy = String(input.createdBy || "").trim()
    if (!createdBy) throw new Error("createdBy is required")

    const channel = input.channel ?? "dash"
    if (!isWorkshopReservationChannel(channel)) {
        throw new Error(`invalid channel: ${String(channel)}`)
    }

    const status = input.status ?? "requested"
    if (!isWorkshopReservationStatus(status)) {
        throw new Error(`invalid status: ${String(status)}`)
    }

    let durationMinutes: number | undefined
    if (input.durationMinutes !== undefined && input.durationMinutes !== null) {
        const d = Math.trunc(Number(input.durationMinutes))
        if (!Number.isFinite(d) || d < 15) {
            throw new Error("durationMinutes must be an integer >= 15")
        }
        durationMinutes = d
    }

    const id = String(input.id || "").trim()

    return {
        id: id || "",
        clientName,
        clientPhone: input.clientPhone ? String(input.clientPhone).trim() : undefined,
        clientUserId: input.clientUserId ? String(input.clientUserId).trim() : undefined,
        equipment,
        serviceType,
        status,
        scheduledAtIso,
        durationMinutes,
        notes: input.notes ? String(input.notes).trim() : undefined,
        staffUserId: input.staffUserId ? String(input.staffUserId).trim() : undefined,
        createdBy,
        channel,
    }
}
