/** Estados de turno de taller (Core2 B5). */
export const WORKSHOP_RESERVATION_STATUSES = [
    "requested",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
] as const

export type WorkshopReservationStatus = (typeof WORKSHOP_RESERVATION_STATUSES)[number]

export function isWorkshopReservationStatus(v: unknown): v is WorkshopReservationStatus {
    return (
        typeof v === "string" &&
        (WORKSHOP_RESERVATION_STATUSES as readonly string[]).includes(v)
    )
}

export const WORKSHOP_RESERVATION_STATUS_LABELS: Record<WorkshopReservationStatus, string> = {
    requested: "Solicitado",
    confirmed: "Confirmado",
    in_progress: "En taller",
    completed: "Completado",
    cancelled: "Cancelado",
    no_show: "No asistió",
}

/** Canales de origen. */
export const WORKSHOP_RESERVATION_CHANNELS = ["dash", "client_web", "operator"] as const
export type WorkshopReservationChannel = (typeof WORKSHOP_RESERVATION_CHANNELS)[number]

export function isWorkshopReservationChannel(v: unknown): v is WorkshopReservationChannel {
    return (
        typeof v === "string" &&
        (WORKSHOP_RESERVATION_CHANNELS as readonly string[]).includes(v)
    )
}

/** Tipos de servicio sugeridos (texto libre permitido en UI). */
export const WORKSHOP_SERVICE_TYPES = [
    "diagnostico",
    "reparacion",
    "mantenimiento",
    "otro",
] as const
export type WorkshopServiceType = (typeof WORKSHOP_SERVICE_TYPES)[number]

export const WORKSHOP_SERVICE_TYPE_LABELS: Record<WorkshopServiceType, string> = {
    diagnostico: "Diagnóstico",
    reparacion: "Reparación",
    mantenimiento: "Mantenimiento",
    otro: "Otro",
}
