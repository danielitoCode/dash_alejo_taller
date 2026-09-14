import type { Supplier } from "../../domain/entity/Supplier";
import { createSupplier } from "../../domain/entity/Supplier";
import type { SupplierRepository } from "../../domain/repository/purchase.repository";
import { getTursoClient, newId } from "../../../../infrastructure/turso/turso.client";

type TransactionId = string | undefined;

type Row = {
    id: string;
    name: string;
    contact: string | null;
    notes: string | null;
};

function rowToSupplier(row: Row): Supplier {
    return createSupplier({
        id: row.id,
        name: row.name,
        contact: row.contact ?? "",
        notes: row.notes ?? undefined,
    });
}

export class SupplierTursoRepository implements SupplierRepository {
    async create(supplier: Supplier, _transactionId?: TransactionId): Promise<Supplier> {
        const id = String(supplier.id || "").trim() || newId();
        const now = new Date().toISOString();
        const contact =
            supplier.contact != null && String(supplier.contact).trim() !== ""
                ? String(supplier.contact).trim()
                : "";
        const db = getTursoClient();
        await db.execute({
            sql: `INSERT INTO suppliers (id, name, contact, notes, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [id, supplier.name, contact, supplier.notes ?? null, now, now],
        });
        return this.getById(id) as Promise<Supplier>;
    }

    async getById(id: string, _transactionId?: TransactionId): Promise<Supplier | null> {
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT id, name, contact, notes FROM suppliers WHERE id = ? LIMIT 1`,
            args: [id],
        });
        const row = rs.rows[0] as unknown as Row | undefined;
        return row ? rowToSupplier(row) : null;
    }

    async list(limit = 50): Promise<Supplier[]> {
        const safe = Math.min(Math.max(1, Math.trunc(limit) || 50), 100);
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT id, name, contact, notes FROM suppliers ORDER BY name ASC LIMIT ?`,
            args: [safe],
        });
        return rs.rows.map((r) => rowToSupplier(r as unknown as Row));
    }

    async update(
        id: string,
        patch: Partial<Supplier>,
        _transactionId?: TransactionId,
    ): Promise<Supplier> {
        const current = await this.getById(id);
        if (!current) throw new Error(`Supplier not found: ${id}`);
        const name = patch.name !== undefined ? String(patch.name).trim() : current.name;
        const contact =
            patch.contact !== undefined
                ? patch.contact != null && String(patch.contact).trim() !== ""
                    ? String(patch.contact).trim()
                    : ""
                : (current.contact ?? "");
        const notes =
            patch.notes !== undefined
                ? patch.notes != null && String(patch.notes).trim() !== ""
                    ? String(patch.notes).trim()
                    : null
                : (current.notes ?? null);
        const now = new Date().toISOString();
        const db = getTursoClient();
        await db.execute({
            sql: `UPDATE suppliers SET name = ?, contact = ?, notes = ?, updated_at = ? WHERE id = ?`,
            args: [name, contact, notes, now, id],
        });
        return (await this.getById(id))!;
    }
}
