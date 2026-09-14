import type { PurchaseEntry, PurchaseEntryLine } from "../../domain/entity/PurchaseEntry";
import { createPurchaseEntryLine } from "../../domain/entity/PurchaseEntry";
import { isPurchaseLineConcept } from "../../domain/entity/enums";
import type {
    ListPurchaseEntriesOpts,
    PurchaseEntryRepository,
} from "../../domain/repository/purchase.repository";
import { getTursoClient, newId } from "../../../../infrastructure/turso/turso.client";

type TransactionId = string | undefined;

type EntryRow = {
    id: string;
    supplier_id: string | null;
    reference: string | null;
    entry_date_iso: string;
    total_cost: number;
    currency: string;
    user_id: string;
    notes: string | null;
    line_count: number;
    status: string | null;
    exchange_rate: number | null;
    exchange_rate_at: string | null;
    exchange_rate_source: string | null;
};

type LineRow = {
    id: string;
    entry_id: string;
    product_id: string;
    quantity: number;
    unit_cost: number;
    concept: string;
    line_cost: number;
};

function rowToEntry(row: EntryRow): PurchaseEntry {
    const currency = String(row.currency || "USD").toUpperCase() === "CUP" ? "CUP" : "USD";
    const entry: PurchaseEntry = {
        id: row.id,
        supplierId: row.supplier_id ? String(row.supplier_id) : undefined,
        reference: row.reference ? String(row.reference) : undefined,
        entryDateIso: row.entry_date_iso,
        totalCost: Number(row.total_cost) || 0,
        currency,
        userId: row.user_id,
        notes: row.notes ? String(row.notes) : undefined,
        lineCount: Math.trunc(Number(row.line_count) || 0),
        status: row.status === "CANCELLED" ? "CANCELLED" : "ACTIVE",
    };
    if (currency === "CUP" && row.exchange_rate != null && Number(row.exchange_rate) > 0) {
        entry.exchangeRate = Number(row.exchange_rate);
        if (row.exchange_rate_at) entry.exchangeRateAt = String(row.exchange_rate_at);
        entry.exchangeRateSource =
            row.exchange_rate_source === "manual" ? "manual" : "DIRECTORIO_CUBANO";
    }
    return entry;
}

function rowToLine(row: LineRow): PurchaseEntryLine {
    const concept = isPurchaseLineConcept(row.concept) ? row.concept : "other";
    return createPurchaseEntryLine({
        id: row.id,
        entryId: row.entry_id,
        productId: row.product_id,
        quantity: Math.trunc(Number(row.quantity) || 0),
        unitCost: Number(row.unit_cost) || 0,
        concept,
        lineCost: Number(row.line_cost) || 0,
    });
}

export class PurchaseEntryTursoRepository implements PurchaseEntryRepository {
    async createEntry(entry: PurchaseEntry, _transactionId?: TransactionId): Promise<PurchaseEntry> {
        const id = String(entry.id || "").trim() || newId();
        const now = new Date().toISOString();
        const db = getTursoClient();
        await db.execute({
            sql: `INSERT INTO purchase_entries (
                id, supplier_id, reference, entry_date_iso, total_cost, currency,
                user_id, notes, line_count, status, exchange_rate, exchange_rate_at,
                exchange_rate_source, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                entry.supplierId ?? null,
                entry.reference ?? null,
                entry.entryDateIso,
                entry.totalCost,
                entry.currency || "USD",
                entry.userId,
                entry.notes ?? null,
                entry.lineCount,
                entry.status === "CANCELLED" ? "CANCELLED" : "ACTIVE",
                entry.exchangeRate ?? null,
                entry.exchangeRateAt ?? null,
                entry.exchangeRateSource ?? null,
                now,
                now,
            ],
        });
        return (await this.getEntryById(id))!;
    }

    async createLine(
        line: PurchaseEntryLine,
        _transactionId?: TransactionId,
    ): Promise<PurchaseEntryLine> {
        const id = String(line.id || "").trim() || newId();
        const db = getTursoClient();
        await db.execute({
            sql: `INSERT INTO purchase_entry_lines (
                id, entry_id, product_id, quantity, unit_cost, concept, line_cost, line_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                line.entryId,
                line.productId,
                line.quantity,
                line.unitCost,
                line.concept,
                line.lineCost,
                0,
            ],
        });
        return createPurchaseEntryLine({ ...line, id });
    }

    async getEntryById(id: string, _transactionId?: TransactionId): Promise<PurchaseEntry | null> {
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT * FROM purchase_entries WHERE id = ? LIMIT 1`,
            args: [id],
        });
        const row = rs.rows[0] as unknown as EntryRow | undefined;
        return row ? rowToEntry(row) : null;
    }

    async updateEntry(
        id: string,
        patch: Partial<PurchaseEntry>,
        _transactionId?: TransactionId,
    ): Promise<PurchaseEntry> {
        const current = await this.getEntryById(id);
        if (!current) throw new Error(`Purchase entry not found: ${id}`);
        const status =
            patch.status !== undefined
                ? patch.status === "CANCELLED"
                    ? "CANCELLED"
                    : "ACTIVE"
                : current.status === "CANCELLED"
                  ? "CANCELLED"
                  : "ACTIVE";
        const reference =
            patch.reference !== undefined ? patch.reference ?? null : (current.reference ?? null);
        const notes = patch.notes !== undefined ? patch.notes ?? null : (current.notes ?? null);
        const now = new Date().toISOString();
        const db = getTursoClient();
        await db.execute({
            sql: `UPDATE purchase_entries SET status = ?, reference = ?, notes = ?, updated_at = ? WHERE id = ?`,
            args: [status, reference, notes, now, id],
        });
        return (await this.getEntryById(id))!;
    }

    async listEntries(limitOrOpts: number | ListPurchaseEntriesOpts = 50): Promise<PurchaseEntry[]> {
        const opts: ListPurchaseEntriesOpts =
            typeof limitOrOpts === "number" ? { limit: limitOrOpts } : limitOrOpts ?? {};
        const limit = Math.min(Math.max(1, opts.limit ?? 50), 100);
        const sid = String(opts.supplierId || "").trim();
        const db = getTursoClient();
        const rs = sid
            ? await db.execute({
                  sql: `SELECT * FROM purchase_entries WHERE supplier_id = ? ORDER BY entry_date_iso DESC LIMIT ?`,
                  args: [sid, limit],
              })
            : await db.execute({
                  sql: `SELECT * FROM purchase_entries ORDER BY entry_date_iso DESC LIMIT ?`,
                  args: [limit],
              });
        return rs.rows.map((r) => rowToEntry(r as unknown as EntryRow));
    }

    async listLinesByEntry(
        entryId: string,
        _transactionId?: TransactionId,
    ): Promise<PurchaseEntryLine[]> {
        const eid = String(entryId || "").trim();
        if (!eid) return [];
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT * FROM purchase_entry_lines WHERE entry_id = ? LIMIT 100`,
            args: [eid],
        });
        return rs.rows.map((r) => rowToLine(r as unknown as LineRow));
    }

    async listLinesByProduct(productId: string, limit = 50): Promise<PurchaseEntryLine[]> {
        const pid = String(productId || "").trim();
        if (!pid) return [];
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT * FROM purchase_entry_lines WHERE product_id = ? LIMIT ?`,
            args: [pid, Math.min(Math.max(1, limit), 100)],
        });
        return rs.rows.map((r) => rowToLine(r as unknown as LineRow));
    }
}
