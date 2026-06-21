import ProductNetRepository from "./product.net.repository"
import type {ProductRepository} from "../../domain/repository/product.repository";
import type {Product} from "../../domain/entity/Product";
import type {PaginatedResult} from "../../domain/repository/product.repository";
import {db} from "../../../../infrastructure/di/dexie.db";
import {productFromDTO, productToDTO} from "../mapper/Mappers";
import type Dexie from "dexie";
import {logger} from "../../../../infrastructure/presentation/util/logger.service";

export class ProductOfflineFirstRepository implements ProductRepository {
    constructor(
        private readonly net: ProductNetRepository
    ) {}

    async getAll(limit: number = 25, offset: number = 0): Promise<PaginatedResult<Product>> {
        try {
            const remote = await this.net.getAll(limit, offset)
            await db.products.bulkPut(remote.documents)
            return {
                items: remote.documents.map(productFromDTO),
                total: remote.total
            }
        } catch(error: any) {
            logger.error(error.message, error.stack);
            const local = await db.products
                .reverse()
                .sortBy("$createdAt")
            const sorted = local.reverse()
            return {
                items: sorted.slice(offset, offset + limit).map(productFromDTO),
                total: sorted.length
            }
        }
    }

    async getById(id: string): Promise<Product | null> {
        try {
            const remote = await this.net.getById(id)
            await db.products.put(remote)
            return productFromDTO(remote)
        } catch {
            const local = await db.products.get(id)
            return local ? productFromDTO(local) : null
        }
    }

    async getByCategory(categoryId: string): Promise<Product[]> {
        try {
            const remote = await this.net.getByCategory(categoryId)
            await db.products.bulkPut(remote)
            return remote.map(productFromDTO)
        } catch {
            const local = await db.products
                .filter((it: any) => it?.category_id === categoryId)
                .toArray()
            return local.map(productFromDTO)
        }
    }

    async create(product: Product): Promise<Product> {
        try {
            const created = await this.net.create(productToDTO(product))
            await db.products.put(created)
            return productFromDTO(created)
        } catch (error: any) {
            logger.error(
                `Error al crear producto en Appwrite: ${error?.message ?? "desconocido"}`,
                error?.stack
            );
            throw error;
        }
    }

    async update(id: string, product: Partial<Product>): Promise<Product> {
        const current = await this.getById(id)
        if (!current) {
            throw new Error(`Product with id ${id} not found`)
        }

        const merged: Product = {
            ...current,
            ...product,
            id
        }

        try {
            const updated = await this.net.update(id, productToDTO(merged))
            await db.products.put(updated)
            return productFromDTO(updated)
        } catch (error: any) {
            logger.error(
                `Error al actualizar producto en Appwrite: ${error?.message ?? "desconocido"}`,
                error?.stack
            );
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await this.net.delete(id)
            await db.products.delete(id)
        } catch (error: any) {
            logger.error(
                `Error al eliminar producto en Appwrite: ${error?.message ?? "desconocido"}`,
                error?.stack
            );
            throw error;
        }
    }

    async sync(): Promise<void> {
        let allDocs: import("../dto/ProductDTO").ProductDTO[] = []
        let offset = 0
        const batchSize = 100
        let total = 0

        do {
            const batch = await this.net.getAll(batchSize, offset)
            allDocs = allDocs.concat(batch.documents)
            total = batch.total
            offset += batchSize
        } while (allDocs.length < total)

        await db.products.clear()
        await db.products.bulkPut(allDocs)
    }
}
