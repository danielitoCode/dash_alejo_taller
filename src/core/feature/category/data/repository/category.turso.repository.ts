import type { CategoryDTO } from "../dto/CategoryDTO";
import type { CategoryWriteDTO } from "../mapper/Mappers";
import { getTursoClient, newId } from "../../../../infrastructure/turso/turso.client";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";

type CategoryRow = {
    id: string;
    name: string;
    description: string | null;
    photo_url: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
};

function rowToDto(row: CategoryRow): CategoryDTO {
    return {
        $id: row.id,
        $createdAt: row.created_at ?? "",
        $updatedAt: row.updated_at ?? "",
        $permissions: [],
        $databaseId: "turso",
        $collectionId: "categories",
        $sequence: 0,
        name: row.name ?? "",
        description: row.description ?? "",
        photo_url: row.photo_url,
        status: row.status === "inactive" ? "inactive" : "active",
    } as CategoryDTO;
}

export class CategoryTursoRepository {
    async getAll(): Promise<CategoryDTO[]> {
        logger.info("[turso] Cargando categorías");
        const db = getTursoClient();
        const rs = await db.execute(
            `SELECT id, name, description, photo_url, status, created_at, updated_at
             FROM categories ORDER BY name ASC`,
        );
        return rs.rows.map((r) => rowToDto(r as unknown as CategoryRow));
    }

    async getById(id: string): Promise<CategoryDTO> {
        const db = getTursoClient();
        const rs = await db.execute({
            sql: `SELECT id, name, description, photo_url, status, created_at, updated_at
                  FROM categories WHERE id = ? LIMIT 1`,
            args: [id],
        });
        const row = rs.rows[0] as unknown as CategoryRow | undefined;
        if (!row) throw new Error(`Category not found: ${id}`);
        return rowToDto(row);
    }

    async create(data: {
        name: string;
        description?: string;
        photo_url?: string | null;
        status?: string;
    }): Promise<CategoryDTO> {
        const id = newId();
        const now = new Date().toISOString();
        const status = data.status === "inactive" ? "inactive" : "active";
        const db = getTursoClient();
        await db.execute({
            sql: `INSERT INTO categories (id, name, description, photo_url, status, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                data.name ?? "",
                data.description ?? "",
                data.photo_url ?? null,
                status,
                now,
                now,
            ],
        });
        logger.info(`[turso] category.create id=${id}`);
        return this.getById(id);
    }

    async update(id: string, data: Partial<CategoryWriteDTO>): Promise<CategoryDTO> {
        const current = await this.getById(id);
        const name = data.name !== undefined ? String(data.name) : current.name;
        const description =
            data.description !== undefined ? String(data.description) : current.description;
        const photo_url =
            data.photo_url !== undefined ? data.photo_url : current.photo_url;
        const status =
            data.status !== undefined
                ? data.status === "inactive"
                    ? "inactive"
                    : "active"
                : current.status === "inactive"
                  ? "inactive"
                  : "active";
        const now = new Date().toISOString();
        const db = getTursoClient();
        await db.execute({
            sql: `UPDATE categories SET name = ?, description = ?, photo_url = ?, status = ?, updated_at = ?
                  WHERE id = ?`,
            args: [name, description, photo_url ?? null, status, now, id],
        });
        return this.getById(id);
    }

    async delete(id: string): Promise<void> {
        const db = getTursoClient();
        await db.execute({ sql: `DELETE FROM categories WHERE id = ?`, args: [id] });
    }
}
