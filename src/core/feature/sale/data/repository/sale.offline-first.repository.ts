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

    /**
     * Espejo completo: si la red responde, reemplaza Dexie con el set remoto
     * (no solo bulkPut parcial, que dejaba el mirror atascado en 25 filas).
     */
    async getAllSales(): Promise<Sale[]> {
        try {
            const remote = await this.net.getAll();

            // Replace mirror: evita que filas viejas/incompletas contaminen un fallback offline.
            await db.transaction("rw", db.sales, async () => {
                await db.sales.clear();
                if (remote.length > 0) {
                    await db.sales.bulkPut(remote);
                }
            });

            logger.log({
                scope: "sale.offlineFirst.getAllSales",
                remoteCount: remote.length,
                dexieReplaced: true,
            });

            return remote.map(saleFromDTO);
        } catch (error) {
            logger.warn(
                `[sale.offlineFirst] net failed, using Dexie: ${error instanceof Error ? error.message : String(error)}`
            );
            const local = await db.sales.toArray();
            logger.log({
                scope: "sale.offlineFirst.getAllSales.fallback",
                localCount: local.length,
            });
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
