import type { Models } from "appwrite"

export interface WorkshopReservationDTO extends Models.Document {
    client_name: string
    client_phone?: string
    client_user_id?: string
    equipment: string
    service_type: string
    status: string
    scheduled_at: string
    duration_minutes?: number
    notes?: string
    staff_user_id?: string
    created_by: string
    channel: string
}
