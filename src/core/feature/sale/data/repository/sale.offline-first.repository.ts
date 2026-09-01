import type { Sale } from "../../domain/entity/Sale"
import type { SaleDTO } from "../dto/SaleDTO"
import { saleFromDTO } from "../mapper/Mappers"
import type { SaleRepository } from "../../domain/repository/SaleRepository"
import { SaleNetRepository } from "./sale.net.repository"
import { db } from "../../../../infrastructure/di/dexie.db"
import { logger } from "../../../../infrastructure/presentation/util/logger.service"
import { assertBackofficeCannotCreateB2cSale } from "../../domain/policy/BackofficeSalePolicy"

const META_KEY = "sales"

/**
 * Espejo offline de ventas orientado a producción:
 * - Bootstrap / desfase de total → reconcile completo (paginado, newest-first).
 * - Sync habitual → incremental por $updatedAt (solo docs tocados).
 * - Realtime Appwrite → applyDelta (upsert/delete de 1 documento, sin listado).
 */
export class SaleOfflineFirstRepository implements SaleRepository {
    constructor(private readonly net: SaleNetRepository) {}

    async getAllSales(): Promise<Sale[]> {
        try {
            return await this.smartSync()
        } catch (error) {
            logger.warn(
                `[sale.offlineFirst] net failed, Dexie fallback: ${error instanceof Error ? error.message : String(error)}`
            )
            const local = await db.sales.toArray()
            return local.map(saleFromDTO)
        }
    }

    /**
     * Reconcile completo: trae todas las páginas y reemplaza Dexie.
     * Pensado para arranque, desfase de totales o forzado interno.
     */
    async fullReconcile(): Promise<Sale[]> {
        const remote = await this.net.getAll()
        const now = new Date().toISOString()

        await db.transaction("rw", db.sales, db.syncMeta, async () => {
            await db.sales.clear()
            if (remote.length > 0) await db.sales.bulkPut(remote)
            await db.syncMeta.put({
                key: META_KEY,
                lastFullSyncAt: now,
                lastIncrementalAt: now,
                remoteTotal: remote.length,
            })
        })

        logger.log({
            scope: "sale.offlineFirst.fullReconcile",
            count: remote.length,
        })
        return remote.map(saleFromDTO)
    }

    /**
     * Sync inteligente (producción):
     * 1) Si no hay meta o total remoto ≠ local → full.
     * 2) Si hay watermark → solo $updatedAt > watermark + upsert.
     */
    async smartSync(): Promise<Sale[]> {
        const meta = await db.syncMeta.get(META_KEY)
        const localCount = await db.sales.count()

        let remoteTotal: number
        try {
            remoteTotal = await this.net.getRemoteTotal()
        } catch {
            remoteTotal = -1
        }

        const needsFull =
            !meta?.lastIncrementalAt ||
            localCount === 0 ||
            (remoteTotal >= 0 && remoteTotal !== localCount)

        if (needsFull) {
            logger.log({
                scope: "sale.offlineFirst.smartSync",
                mode: "full",
                localCount,
                remoteTotal,
            })
            return this.fullReconcile()
        }

        const changed = await this.net.getUpdatedSince(meta!.lastIncrementalAt!)
        const now = new Date().toISOString()

        if (changed.length > 0) {
            await db.sales.bulkPut(changed)
        }

        await db.syncMeta.put({
            key: META_KEY,
            lastFullSyncAt: meta!.lastFullSyncAt,
            lastIncrementalAt: now,
            remoteTotal: remoteTotal >= 0 ? remoteTotal : meta!.remoteTotal,
        })

        logger.log({
            scope: "sale.offlineFirst.smartSync",
            mode: "incremental",
            changed: changed.length,
            localCount: await db.sales.count(),
        })

        // UI always reads newest-first from the full local mirror
        const local = await db.sales.orderBy("$id").reverse().toArray()
        // Prefer $createdAt ordering when present
        local.sort((a, b) => {
            const ca = String(a.$createdAt || "")
            const cb = String(b.$createdAt || "")
            return cb.localeCompare(ca)
        })
        return local.map(saleFromDTO)
    }

    /**
     * Delta desde Appwrite Realtime (create/update): un solo documento.
     * No requiere listDocuments.
     */
    async applyRemoteDocument(dto: SaleDTO): Promise<Sale> {
        if (!dto?.$id) throw new Error("sale delta missing $id")
        await db.sales.put(dto)
        const meta = await db.syncMeta.get(META_KEY)
        const now = String(dto.$updatedAt || new Date().toISOString())
        await db.syncMeta.put({
            key: META_KEY,
            lastFullSyncAt: meta?.lastFullSyncAt,
            lastIncrementalAt: now,
            remoteTotal: meta?.remoteTotal,
        })
        return saleFromDTO(dto)
    }

    /** Delta delete desde Realtime. */
    async removeRemoteDocument(id: string): Promise<void> {
        const sid = String(id || "").trim()
        if (!sid) return
        await db.sales.delete(sid)
    }

    async create(_sale: Sale): Promise<Sale> {
        assertBackofficeCannotCreateB2cSale()
    }

    async getByUser(userId: string): Promise<Sale[]> {
        try {
            const remote = await this.net.getByUser(userId)
            await db.sales.bulkPut(remote)
            return remote.map(saleFromDTO)
        } catch {
            const local = await db.sales.where("user_id").equals(userId).toArray()
            return local.map(saleFromDTO)
        }
    }

    async updateVerified(id: string, verified: string): Promise<Sale> {
        try {
            const updated = await this.net.updateVerified(id, verified)
            await db.sales.put(updated)
            return saleFromDTO(updated)
        } catch (error: any) {
            logger.error(
                `Error al actualizar venta en Appwrite: ${error?.message ?? "desconocido"}`,
                error?.stack
            )
            throw error
        }
    }
}
