import { writable } from "svelte/store"
import { reservationContainer } from "../../di/reservation.container"
import type { WorkshopReservation } from "../../domain/entity/WorkshopReservation"
import type { WorkshopReservationStatus } from "../../domain/entity/enums"
import type { CreateWorkshopReservationInput } from "../../domain/entity/WorkshopReservation"
import { logger } from "../../../../infrastructure/presentation/util/logger.service"

interface ReservationState {
    items: WorkshopReservation[]
    loading: boolean
    saving: boolean
    error: string | null
    statusFilter: WorkshopReservationStatus | "all"
}

function createReservationStore() {
    const { subscribe, update, set } = writable<ReservationState>({
        items: [],
        loading: false,
        saving: false,
        error: null,
        statusFilter: "all",
    })

    return {
        subscribe,
        async load(status: WorkshopReservationStatus | "all" = "all"): Promise<void> {
            update((s) => ({ ...s, loading: true, error: null, statusFilter: status }))
            try {
                const items = await reservationContainer.useCases.list.execute({
                    status,
                    limit: 80,
                })
                update((s) => ({ ...s, loading: false, items }))
            } catch (e: any) {
                const msg = e instanceof Error ? e.message : String(e)
                logger.error(msg, e?.stack)
                update((s) => ({ ...s, loading: false, error: msg, items: [] }))
                throw e
            }
        },
        async create(
            input: Omit<CreateWorkshopReservationInput, "createdBy" | "channel"> & {
                status?: WorkshopReservationStatus
            }
        ): Promise<WorkshopReservation> {
            update((s) => ({ ...s, saving: true, error: null }))
            try {
                const created = await reservationContainer.useCases.create.execute(input)
                update((s) => ({
                    ...s,
                    saving: false,
                    items: [...s.items, created].sort(
                        (a, b) =>
                            Date.parse(a.scheduledAtIso) - Date.parse(b.scheduledAtIso)
                    ),
                }))
                return created
            } catch (e: any) {
                const msg = e instanceof Error ? e.message : String(e)
                logger.error(msg, e?.stack)
                update((s) => ({ ...s, saving: false, error: msg }))
                throw e
            }
        },
        async setStatus(
            id: string,
            status: WorkshopReservationStatus
        ): Promise<WorkshopReservation> {
            update((s) => ({ ...s, saving: true, error: null }))
            try {
                const updated = await reservationContainer.useCases.updateStatus.execute(
                    id,
                    status
                )
                update((s) => ({
                    ...s,
                    saving: false,
                    items: s.items.map((r) => (r.id === id ? updated : r)),
                }))
                return updated
            } catch (e: any) {
                const msg = e instanceof Error ? e.message : String(e)
                logger.error(msg, e?.stack)
                update((s) => ({ ...s, saving: false, error: msg }))
                throw e
            }
        },
        reset() {
            set({
                items: [],
                loading: false,
                saving: false,
                error: null,
                statusFilter: "all",
            })
        },
    }
}

export const reservationStore = createReservationStore()
