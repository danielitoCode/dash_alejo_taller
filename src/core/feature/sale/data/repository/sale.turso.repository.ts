import type { SaleDTO } from "../dto/SaleDTO"
import type { Models } from "appwrite"
import { getTursoClient } from "../../../../infrastructure/turso/turso.client"
import { logger } from "../../../../infrastructure/presentation/util/logger.service"
import { assertBackofficeCannotCreateB2cSale } from "../../domain/policy/BackofficeSalePolicy"

type SaleRow = {
    id: string
    date_iso: string
    amount: number
    verified: string
    currency: string
    user_id: string
    delivery_type: string | null
    products_json: string | null
    created_at: string | null
    updated_at: string | null
}

function parseProducts(raw: string | null): SaleDTO["products"] {
    if (!raw) return []
    try {
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr)) return []
        return arr.map((item: any) => ({
            productId: String(item?.productId ?? item?.product_id ?? ""),
            quantity: Number(item?.quantity) || 0,
            price: Number(item?.unitPrice ?? item?.price ?? 0) || 0,
            productName: item?.productName ?? item?.product_name ?? null,
        })) as SaleDTO["products"]
    } catch {
        return []
    }
}

function rowToDto(row: SaleRow): SaleDTO {
    return {
        $id: row.id,
        $createdAt: row.created_at ?? "",
        $updatedAt: row.updated_at ?? "",
        $permissions: [],
        $databaseId: "turso",
        $collectionId: "sales",
        $sequence: 0,
        date: row.date_iso ?? "",
        amount: Number(row.amount ?? 0) || 0,
        currency: row.currency ?? "CUP",
        buy_state: row.verified ?? "UNVERIFIED",
        verified: row.verified ?? "UNVERIFIED",
        products: parseProducts(row.products_json),
        user_id: row.user_id ?? "",
        delivery_type: row.delivery_type,
        deliveryType: row.delivery_type,
    } as SaleDTO
}

const SELECT = `id, date_iso, amount, verified, currency, user_id, delivery_type,
    products_json, created_at, updated_at`

/**
 * Fuente remota Turso para ventas (backoffice).
 * API compatible con SaleNetRepository (Appwrite).
 */
export class SaleTursoRepository {
    async getAll(): Promise<SaleDTO[]> {
        logger.info("[turso] Cargando ventas (all)")
        const db = getTursoClient()
        const rs = await db.execute(
            `SELECT ${SELECT} FROM sales ORDER BY datetime(created_at) DESC, date_iso DESC`
        )
        const docs = rs.rows.map((r) => rowToDto(r as unknown as SaleRow))
        logger.log({
            scope: "sale.turso.getAll",
            total: docs.length,
            firstDocumentId: docs[0]?.$id ?? null,
        })
        return docs
    }

    async getRemoteTotal(): Promise<number> {
        const db = getTursoClient()
        const rs = await db.execute(`SELECT COUNT(*) AS c FROM sales`)
        const c = Number((rs.rows[0] as any)?.c ?? 0)
        return Number.isFinite(c) ? c : 0
    }

    async getUpdatedSince(sinceIso: string): Promise<SaleDTO[]> {
        const since = String(sinceIso || "").trim()
        if (!since) return this.getAll()
        const db = getTursoClient()
        const rs = await db.execute({
            sql: `SELECT ${SELECT} FROM sales
                  WHERE datetime(updated_at) > datetime(?)
                  ORDER BY datetime(updated_at) DESC`,
            args: [since],
        })
        const docs = rs.rows.map((r) => rowToDto(r as unknown as SaleRow))
        logger.log({
            scope: "sale.turso.getUpdatedSince",
            since,
            documentsLength: docs.length,
        })
        return docs
    }

    async create(_data: Omit<SaleDTO, keyof Models.Document>): Promise<SaleDTO> {
        assertBackofficeCannotCreateB2cSale()
    }

    async getByUser(userId: string): Promise<SaleDTO[]> {
        const db = getTursoClient()
        const rs = await db.execute({
            sql: `SELECT ${SELECT} FROM sales WHERE user_id = ?
                  ORDER BY datetime(created_at) DESC`,
            args: [userId],
        })
        return rs.rows.map((r) => rowToDto(r as unknown as SaleRow))
    }

    async updateVerified(id: string, verified: string): Promise<SaleDTO> {
        const db = getTursoClient()
        await db.execute({
            sql: `UPDATE sales SET verified = ?, updated_at = datetime('now') WHERE id = ?`,
            args: [verified, id],
        })
        const rs = await db.execute({
            sql: `SELECT ${SELECT} FROM sales WHERE id = ? LIMIT 1`,
            args: [id],
        })
        const row = rs.rows[0] as unknown as SaleRow | undefined
        if (!row) throw new Error(`Sale not found: ${id}`)
        logger.info(`[turso] sale ${id.slice(0, 12)}… verified=${verified}`)
        return rowToDto(row)
    }
}
