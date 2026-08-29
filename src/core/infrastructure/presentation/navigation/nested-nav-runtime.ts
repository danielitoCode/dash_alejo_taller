import type { BusinessRole } from "../../../feature/auth/domain/entity/BusinessRole"
import { normalizeBusinessRole } from "../../../feature/auth/domain/entity/BusinessRole"
import { canAccessDashboard, canAccessRoute } from "../../../feature/auth/domain/config/RoleConfig"
import { authContainer } from "../../../feature/auth/di/auth.container"
import { productStore } from "../../../feature/product/presentation/viewmodel/product.store"
import { categoryStore } from "../../../feature/category/presentation/viewmodel/category.store"
import { promotionStore } from "../../../feature/notification/presentation/viewmodel/promotion.store"
import { saleStore } from "../../../feature/sale/presentation/viewmodel/sale.store"
import { supportInboxStore } from "../../../feature/support/presentation/viewmodel/support-inbox.store"
import { toastStore } from "../viewmodel/toast.store"
import { logger } from "../util/logger.service"
import { subscribePulseChannelAll } from "../../data/alset-pulse/pulse.realtime"
import { pulseRefreshTargets } from "../../data/alset-pulse/pulse.refresh-targets"
import {
    parseStockChangedPayload,
    subscribeStockChanged,
} from "../../data/alset-pulse/stock-pulse"
import { client } from "../../di/appwrite.config"
import { ENV } from "../../env"
import { get } from "svelte/store"
import { BuyState } from "../../../feature/sale/domain/entity/enums"
import type { NavController } from "../../../../lib/navigation/NavController"

export type NestedNavRuntimeCtx = {
    getRole: () => BusinessRole
    setRole: (r: BusinessRole) => void
    getPath: () => string
    firstAllowedPath: (role: BusinessRole) => string
    internalNavigate: (path: string) => void
    outerNavigate: NavController
}

export function createNestedNavRuntime(ctx: NestedNavRuntimeCtx) {
    let supportSyncTimer: number | null = null
    let salesSyncTimer: number | null = null
    let stockSyncTimer: number | null = null
    let pendingStockIds: string[] = []
    let syncingSupport = false
    let syncingSales = false
    let syncingStock = false
    let queuedSupport = false
    let queuedSales = false
    let stopPulseRefresh: (() => void) | null = null
    let stopStockFanout: (() => void) | null = null
    let stopAppwriteProductRt: (() => void) | null = null

    function scheduleStockRefresh(productIds: string[]) {
        for (const id of productIds) {
            if (id && !pendingStockIds.includes(id)) pendingStockIds.push(id)
        }
        if (stockSyncTimer) window.clearTimeout(stockSyncTimer)
        stockSyncTimer = window.setTimeout(() => {
            stockSyncTimer = null
            void flushStockRefresh()
        }, 180)
    }

    async function flushStockRefresh() {
        if (syncingStock) {
            if (stockSyncTimer) window.clearTimeout(stockSyncTimer)
            stockSyncTimer = window.setTimeout(() => {
                stockSyncTimer = null
                void flushStockRefresh()
            }, 220)
            return
        }
        const ids = pendingStockIds.splice(0, pendingStockIds.length)
        syncingStock = true
        try {
            if (ids.length > 0) {
                await productStore.handleStockChanged(ids)
            } else {
                await productStore.syncAll()
            }
        } catch (e: any) {
            logger.error(`[stock-rt] refresh failed: ${e?.message ?? e}`, e?.stack)
        } finally {
            syncingStock = false
        }
    }

    function scheduleSupportSync() {
        if (supportSyncTimer) window.clearTimeout(supportSyncTimer)
        supportSyncTimer = window.setTimeout(() => {
            supportSyncTimer = null
            void syncSupportInbox()
        }, 220)
    }

    function scheduleSalesSync() {
        if (salesSyncTimer) window.clearTimeout(salesSyncTimer)
        salesSyncTimer = window.setTimeout(() => {
            salesSyncTimer = null
            void syncSales()
        }, 220)
    }

    async function syncSupportInbox() {
        const beforeItems = get(supportInboxStore).items
        const beforePending = beforeItems.filter((m) => m.status === "nuevo").length
        if (syncingSupport) {
            queuedSupport = true
            return
        }
        syncingSupport = true
        queuedSupport = false
        toastStore.info("Actualizando mensajes…", 1200)
        try {
            await supportInboxStore.syncAll()
            const afterItems = get(supportInboxStore).items
            const afterPending = afterItems.filter((m) => m.status === "nuevo").length
            const delta = Math.max(0, afterPending - beforePending)
            toastStore.success(delta > 0 ? `Nuevo mensaje (+${delta})` : "Mensajes actualizados", 1100)
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack)
            toastStore.error("No se pudieron actualizar los mensajes")
        } finally {
            syncingSupport = false
            if (queuedSupport) void syncSupportInbox()
        }
    }

    async function syncSales() {
        const beforeItems = get(saleStore).items
        const beforePending = beforeItems.filter((s) => s.verified === BuyState.UNVERIFIED).length
        if (syncingSales) {
            queuedSales = true
            return
        }
        syncingSales = true
        queuedSales = false
        toastStore.info("Actualizando ventas...", 1200)
        try {
            await saleStore.syncAll()
            const afterItems = get(saleStore).items
            const afterPending = afterItems.filter((s) => s.verified === BuyState.UNVERIFIED).length
            const delta = Math.max(0, afterPending - beforePending)
            toastStore.success(delta > 0 ? `Nueva venta (+${delta})` : "Ventas actualizadas", 1100)
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack)
            toastStore.error("No se pudieron actualizar las ventas")
        } finally {
            syncingSales = false
            if (queuedSales) void syncSales()
        }
    }

    async function refreshUserRole() {
        try {
            logger.info("[NestedNav] Refrescando rol del usuario...")
            const u = await authContainer.useCases.accounts.getCurrentUser()
            const newRole = normalizeBusinessRole(u.role)
            const oldRole = ctx.getRole()
            if (newRole !== oldRole) {
                logger.info(`[NestedNav] Rol actualizado: ${oldRole} → ${newRole}`)
                ctx.setRole(newRole)
                toastStore.success(`✅ Rol actualizado a: ${newRole}`)
                const allowedPath = ctx.firstAllowedPath(newRole)
                if (!canAccessRoute(newRole, ctx.getPath())) {
                    ctx.internalNavigate(allowedPath)
                }
            } else {
                logger.info(`[NestedNav] El rol sigue siendo: ${oldRole}`)
                toastStore.info(`El rol es: ${oldRole}`)
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            const stack = error instanceof Error ? error.stack : undefined
            logger.error(`[NestedNav] Error refrescando rol: ${msg}`, stack)
            toastStore.error("Error al refrescar rol")
        }
    }

    function mount() {
        authContainer.useCases.accounts
            .getCurrentUser()
            .then((u) => {
                const role = normalizeBusinessRole(u.role)
                ctx.setRole(role)
                if (u.role === null || u.role === undefined) {
                    logger.warn(
                        `[NestedNav] Usuario sin rol. Labels: ${JSON.stringify(u.labels ?? [])}`
                    )
                    toastStore.error(
                        "⚠️ Tu cuenta no tiene rol configurado. Contacta al administrador. (viewer por defecto)"
                    )
                }
                if (!canAccessDashboard(role)) {
                    ctx.outerNavigate.navigate("unauthorized", {
                        message: "Tu cuenta no está autorizada para usar el panel de gestión.",
                    })
                    return
                }
                const allowedPath = ctx.firstAllowedPath(role)
                if (!canAccessRoute(role, ctx.getPath())) {
                    logger.info(`[NestedNav] 3.1 entrada bloqueada → ${allowedPath}`)
                    ctx.internalNavigate(allowedPath)
                }
            })
            .catch(() => {
                ctx.outerNavigate.navigate("login")
            })

        productStore.syncAll().catch(() => toastStore.error("Error al sincronizar datos"))
        categoryStore.syncAll().catch(() => toastStore.error("Error al sincronizar datos"))
        promotionStore.syncAll().catch(() => toastStore.error("Error al sincronizar datos"))
        saleStore.syncAll().catch(() => toastStore.error("Error al sincronizar ventas"))

        logger.info(
            `[Pusher] init key=${ENV.pusherKey ? ENV.pusherKey.slice(0, 6) + "…" : "N/A"} cluster=${ENV.pusherCluster ?? "N/A"}`
        )

        stopPulseRefresh = subscribePulseChannelAll((eventName, payload) => {
            try {
                const summary =
                    payload && typeof payload === "object"
                        ? JSON.stringify(payload).slice(0, 800)
                        : String(payload ?? "")
                logger.info(`[Pusher] event=${eventName} payload=${summary}`)
            } catch {
                logger.info(`[Pusher] event=${eventName}`)
            }
            const stockFromPulse = parseStockChangedPayload(payload)
            const name = String(eventName ?? "").toLowerCase()
            if (
                stockFromPulse &&
                (name.includes("stock") || name === "stock:changed" || name === "stock-changed")
            ) {
                scheduleStockRefresh(stockFromPulse.productIds)
            }
            let targets: ("support" | "sales")[] = []
            try {
                targets = pulseRefreshTargets(eventName, payload)
            } catch (e: any) {
                logger.error(`[Pusher] error parsing refresh targets: ${e?.message ?? e}`, e?.stack)
                toastStore.error("Evento realtime inválido")
                return
            }
            if (targets.length === 0) return
            toastStore.info(
                targets.length === 2
                    ? "Evento realtime: sincronizando todo…"
                    : targets[0] === "support"
                      ? "Evento realtime: sincronizando mensajes…"
                      : "Evento realtime: sincronizando ventas…",
                1200
            )
            if (targets.includes("support")) scheduleSupportSync()
            if (targets.includes("sales")) {
                scheduleSalesSync()
                scheduleStockRefresh([])
            }
        })

        stopStockFanout = subscribeStockChanged((body) => {
            logger.info(
                `[stock-rt] fanout reason=${body.reason} products=${body.productIds.join(",")}`
            )
            scheduleStockRefresh(body.productIds)
        })

        if (ENV.databaseId) {
            const db = ENV.databaseId
            const productChannel = `databases.${db}.collections.product.documents`
            const saleChannel = `databases.${db}.collections.sale.documents`
            try {
                stopAppwriteProductRt = client.subscribe(
                    [productChannel, saleChannel],
                    (response) => {
                        try {
                            const events: string[] = Array.isArray((response as any)?.events)
                                ? (response as any).events
                                : []
                            const payload = (response as any)?.payload ?? response
                            const isSaleEvent = events.some(
                                (e) =>
                                    typeof e === "string" && e.includes(".collections.sale.")
                            )
                            if (isSaleEvent) {
                                scheduleStockRefresh([])
                                scheduleSalesSync()
                                return
                            }
                            const id = String(payload?.$id ?? payload?.id ?? "").trim()
                            if (!id) return
                            const existence = Number(payload?.existence)
                            const reserved = Number(payload?.reserved)
                            if (Number.isFinite(existence) && Number.isFinite(reserved)) {
                                productStore.patchLocalStock(id, {
                                    existence: Math.max(0, Math.floor(existence)),
                                    reserved: Math.max(0, Math.floor(reserved)),
                                })
                            } else {
                                scheduleStockRefresh([id])
                            }
                        } catch (e: any) {
                            logger.warn(`[stock-rt][appwrite] ${e?.message ?? e}`)
                        }
                    }
                )
            } catch (e: any) {
                logger.warn(`[stock-rt][appwrite] subscribe failed: ${e?.message ?? e}`)
            }
        }
    }

    function destroy() {
        if (supportSyncTimer) window.clearTimeout(supportSyncTimer)
        if (salesSyncTimer) window.clearTimeout(salesSyncTimer)
        if (stockSyncTimer) window.clearTimeout(stockSyncTimer)
        supportSyncTimer = null
        salesSyncTimer = null
        stockSyncTimer = null
        stopPulseRefresh?.()
        stopPulseRefresh = null
        stopStockFanout?.()
        stopStockFanout = null
        stopAppwriteProductRt?.()
        stopAppwriteProductRt = null
    }

    return { mount, destroy, refreshUserRole }
}
