import type { Sale } from "../../domain/entity/Sale";
import type { SaleDTO } from "../dto/SaleDTO";
import { saleFromDTO } from "../mapper/Mappers";
import type { SaleRepository } from "../../domain/repository/SaleRepository";
import { SaleNetRepository } from "./sale.net.repository";
import { db } from "../../../../infrastructure/di/dexie.db";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";
import { assertBackofficeCannotCreateB2cSale } from "../../domain/policy/BackofficeSalePolicy";

export class SaleOfflineFirstRepository implements SaleRepository {
    constructor(private readonly net: SaleNetRepository) {}

    async getAllSales(): Promise<Sale[]> {
        try {
            const remote = await this.net.getAll();
            await db.sales.bulkPut(remote);
            return remote.map(saleFromDTO);
        } catch {
            const local = await db.sales.toArray();
            return local.map(saleFromDTO);
        }
    }

    /** Core1 4.4: el panel no origina pedidos B2C. */
    async create(_sale: Sale): Promise<Sale> {
        assertBackofficeCannotCreateB2cSale();
    }

    async getByUser(userId: string): Promise<Sale[]> {
        try {
            const remote = await this.net.getByUser(userId);
            await db.sales.bulkPut(remote);
            return remote.map(saleFromDTO);
        } catch {
            const local = await db.sales.where("user_id").equals(userId).toArray();
            return local.map(saleFromDTO);
        }
    }

    async updateVerified(id: string, verified: string): Promise<Sale> {
        try {
            const updated = await this.net.updateVerified(id, verified);
            await db.sales.put(updated);
            return saleFromDTO(updated);
        } catch (error: any) {
            logger.error(
                `Error al actualizar venta en Appwrite: ${error?.message ?? "desconocido"}`,
                error?.stack
            );
            throw error;
        }
    }
}
