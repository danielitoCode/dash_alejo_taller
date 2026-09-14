import type { StockMovement } from "../../domain/entity/StockMovement";
import { createStockMovement } from "../../domain/entity/StockMovement";
import type { StockMovementType } from "../../domain/entity/enums";
import { isStockMovementType } from "../../domain/entity/enums";
import type { StockMovementRepository } from "../../domain/repository/stock-movement.repository";
import { getTursoClient, newId } from "../../../../infrastructure/turso/turso.client";

type TransactionId = string | undefined;

type Row = {
    id: string;
    product_id: string;
    type: string;
    quantity: number;
    balance_after: number;
    reason: string;
    user_id: string;
    sale_id: string | null;
    entry_id: string | null;
    created_at: string | null;
};

function rowToMovement(row: Row): StockMovement {
    const type = isStockMovementType(row.type) ? row.type : "ajuste";
    return createStockMovement({
        id: row.id,
        productId: row.product_id,
        type,
        quantity: Math.max(1, Math.trunc(Number(row.quantity) || 1)),
        balanceAfter: Math.max(0, Math.trunc(Number(row.balance_after) || 0)),
        reason: row.reason ?? "",
        userId: row.user_id ?? "",
        saleId: row.sale_id ?? undefined,
        entryId: row.entry_id ?? undefined,
        createdAtIso: row.created_at ?? undefined,
    });
}

export class StockMovementTursoRepository implements StockMovementRepository {
    async create(movement: StockMovement, _transactionId?: TransactionId): Promise<StockMovement> {
        const id = String(movement.id || "").trim() || newId();
        const now = movement.createdAtIso || new Date().toISOString();
        const db = getTursoClient();
        await db.execute({
            sql: `INSERT INTO stock_movements (
                id, product_id, type, quantity, balance_after, reason, user_id, sale_id, entry_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                movement.productId,
                movement.type,
                movement.quantity,
                movement.balanceAfter,
                movement.reason,
                movement.userId,
                movement.saleId ?? null,
                movement.entryId ?? null,
                now,
            ],
        });
        return createStockMovement({ ...movement, id, createdAtIso: now });
    }

    async listByProduct(productId: string, limit = 50): Promise<StockMovement[]> {
        const pid = String(productId || "").trim();
        if (!pid) return [];
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ?`,
            args: [pid, Math.min(Math.max(1, limit), 100)],
        });
        return rs.rows.map((r) => rowToMovement(r as unknown as Row));
    }

    async listRecent(limit = 50, type?: StockMovementType): Promise<StockMovement[]> {
        const db = getTursoClient();
        const safe = Math.min(Math.max(1, limit), 100);
        const rs = type
            ? await db.execute({
                  sql: `SELECT * FROM stock_movements WHERE type = ? ORDER BY created_at DESC LIMIT ?`,
                  args: [type, safe],
              })
            : await db.execute({
                  sql: `SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT ?`,
                  args: [safe],
              });
        return rs.rows.map((r) => rowToMovement(r as unknown as Row));
    }

    async listByEntry(entryId: string, limit = 100): Promise<StockMovement[]> {
        const eid = String(entryId || "").trim();
        if (!eid) return [];
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT * FROM stock_movements WHERE entry_id = ? ORDER BY created_at DESC LIMIT ?`,
            args: [eid, Math.min(Math.max(1, limit), 100)],
        });
        return rs.rows.map((r) => rowToMovement(r as unknown as Row));
    }
}
