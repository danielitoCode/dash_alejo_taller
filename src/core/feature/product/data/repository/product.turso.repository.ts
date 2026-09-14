import type { ProductDTO } from "../dto/ProductDTO";
import type { ProductWriteDTO } from "../mapper/Mappers";
import { getTursoClient, newId } from "../../../../infrastructure/turso/turso.client";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";

type ProductRow = {
    id: string;
    name: string;
    description: string | null;
    existence: number | null;
    reserved: number | null;
    price: number | null;
    photo_url: string | null;
    category_id: string;
    status: string | null;
    rating: number | null;
    last_unit_cost: number | null;
    price_protected_at: string | null;
    price_protection_entry_id: string | null;
    created_at: string | null;
    updated_at: string | null;
};

const SELECT = `id, name, description, existence, reserved, price, photo_url, category_id,
  status, rating, last_unit_cost, price_protected_at, price_protection_entry_id, created_at, updated_at`;

function rowToDto(row: ProductRow): ProductDTO {
    const existence = Math.max(0, Math.floor(Number(row.existence ?? 0)));
    const reserved = Math.max(0, Math.floor(Number(row.reserved ?? 0)));
    return {
        $id: row.id,
        $createdAt: row.created_at ?? "",
        $updatedAt: row.updated_at ?? "",
        $permissions: [],
        $databaseId: "turso",
        $collectionId: "products",
        $sequence: 0,
        id: row.id,
        name: row.name ?? "",
        description: row.description ?? "",
        existence,
        reserved,
        price: Number(row.price ?? 0) || 0,
        photo_url: row.photo_url ?? "",
        category_id: row.category_id ?? "",
        status: row.status === "inactive" ? "inactive" : "active",
        rating: Number(row.rating ?? 0) || 0,
        last_unit_cost:
            row.last_unit_cost != null && Number.isFinite(Number(row.last_unit_cost))
                ? Number(row.last_unit_cost)
                : undefined,
        price_protected_at: row.price_protected_at ?? undefined,
        price_protection_entry_id: row.price_protection_entry_id ?? undefined,
    } as ProductDTO;
}

type TransactionId = string | undefined;

export class ProductTursoRepository {
    async getAll(
        limit: number = 25,
        offset: number = 0,
    ): Promise<{ documents: ProductDTO[]; total: number }> {
        const db = getTursoClient();
        const countRs = await db.execute(`SELECT COUNT(*) AS c FROM products`);
        const total = Number((countRs.rows[0] as { c?: number })?.c ?? 0);
        const rs = await db.execute({
            sql: `SELECT ${SELECT} FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            args: [limit, offset],
        });
        return {
            documents: rs.rows.map((r) => rowToDto(r as unknown as ProductRow)),
            total,
        };
    }

    async getById(id: string, _transactionId?: TransactionId): Promise<ProductDTO> {
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT ${SELECT} FROM products WHERE id = ? LIMIT 1`,
            args: [id],
        });
        const row = rs.rows[0] as unknown as ProductRow | undefined;
        if (!row) throw new Error(`Product not found: ${id}`);
        return rowToDto(row);
    }

    async getByCategory(categoryId: string): Promise<ProductDTO[]> {
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT ${SELECT} FROM products WHERE category_id = ? ORDER BY name ASC`,
            args: [categoryId],
        });
        return rs.rows.map((r) => rowToDto(r as unknown as ProductRow));
    }

    async create(product: ProductWriteDTO): Promise<ProductDTO> {
        const id = (product.$id && String(product.$id).trim()) || newId();
        const now = new Date().toISOString();
        const existence = Math.max(0, Math.floor(Number(product.existence ?? 0)));
        const reserved = Math.max(0, Math.floor(Number(product.reserved ?? 0)));
        const photo = product.photo_url != null ? String(product.photo_url) : "";
        const status = product.status === "inactive" ? "inactive" : "active";

        logger.info(`[turso] product.create id=${id} name=${product.name}`);

        const db = getTursoClient();
        await db.execute({
            sql: `INSERT INTO products (
                id, name, description, existence, reserved, price, photo_url,
                category_id, status, rating, last_unit_cost,
                price_protected_at, price_protection_entry_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                product.name ?? "",
                product.description ?? "",
                existence,
                reserved,
                Number(product.price ?? 0) || 0,
                photo,
                product.category_id ?? "",
                status,
                Number(product.rating ?? 0) || 0,
                product.last_unit_cost != null ? Number(product.last_unit_cost) : null,
                product.price_protected_at ?? null,
                product.price_protection_entry_id ?? null,
                now,
                now,
            ],
        });
        return this.getById(id);
    }

    async update(
        id: string,
        data: Partial<ProductWriteDTO>,
        _transactionId?: TransactionId,
    ): Promise<ProductDTO> {
        const current = await this.getById(id);
        const name = data.name !== undefined ? String(data.name) : current.name;
        const description =
            data.description !== undefined ? String(data.description) : current.description;
        const existence =
            data.existence !== undefined
                ? Math.max(0, Math.floor(Number(data.existence)))
                : current.existence;
        const reserved =
            data.reserved !== undefined
                ? Math.max(0, Math.floor(Number(data.reserved)))
                : (current.reserved ?? 0);
        if (existence < reserved) {
            throw new Error(`existence (${existence}) cannot be less than reserved (${reserved})`);
        }
        const price =
            data.price !== undefined ? Number(data.price) || 0 : current.price;
        const photo_url =
            data.photo_url !== undefined ? String(data.photo_url ?? "") : current.photo_url;
        const category_id =
            data.category_id !== undefined ? String(data.category_id) : current.category_id;
        const status =
            data.status !== undefined
                ? data.status === "inactive"
                    ? "inactive"
                    : "active"
                : current.status === "inactive"
                  ? "inactive"
                  : "active";
        const rating =
            data.rating !== undefined ? Number(data.rating) || 0 : (current.rating ?? 0);
        const last_unit_cost =
            data.last_unit_cost !== undefined
                ? data.last_unit_cost == null
                    ? null
                    : Number(data.last_unit_cost)
                : (current.last_unit_cost ?? null);
        const price_protected_at =
            data.price_protected_at !== undefined
                ? data.price_protected_at
                : (current.price_protected_at ?? null);
        const price_protection_entry_id =
            data.price_protection_entry_id !== undefined
                ? data.price_protection_entry_id
                : (current.price_protection_entry_id ?? null);
        const now = new Date().toISOString();

        const db = getTursoClient();
        await db.execute({
            sql: `UPDATE products SET
                name = ?, description = ?, existence = ?, reserved = ?, price = ?,
                photo_url = ?, category_id = ?, status = ?, rating = ?,
                last_unit_cost = ?, price_protected_at = ?, price_protection_entry_id = ?,
                updated_at = ?
              WHERE id = ?`,
            args: [
                name,
                description,
                existence,
                reserved,
                price,
                photo_url,
                category_id,
                status,
                rating,
                last_unit_cost,
                price_protected_at,
                price_protection_entry_id,
                now,
                id,
            ],
        });
        return this.getById(id);
    }

    async delete(id: string): Promise<void> {
        const db = getTursoClient();
        await db.execute({ sql: `DELETE FROM products WHERE id = ?`, args: [id] });
    }

    async applyStockDeltas(
        productId: string,
        opts: { confirmed: boolean; qty: number },
    ): Promise<{ existence: number; reserved: number }> {
        const doc = await this.getById(productId);
        const currentExistence = Math.max(0, Math.floor(Number(doc.existence ?? 0)));
        const currentReserved = Math.max(0, Math.floor(Number(doc.reserved ?? 0)));
        const qty = Math.max(0, Math.floor(Number(opts.qty)));
        let nextExistence = currentExistence;
        let nextReserved = currentReserved;
        if (opts.confirmed) {
            nextExistence = Math.max(0, currentExistence - qty);
            nextReserved = Math.max(0, currentReserved - qty);
        } else {
            nextReserved = Math.max(0, currentReserved - qty);
        }
        await this.update(productId, {
            existence: nextExistence,
            reserved: nextReserved,
        } as Partial<ProductWriteDTO>);
        return { existence: nextExistence, reserved: nextReserved };
    }
}
