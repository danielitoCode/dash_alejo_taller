import type {Sale} from "../../domain/entity/Sale";
import type {SaleDTO} from "../dto/SaleDTO";
import {saleFromDTO, saleToDTO} from "../mapper/Mappers";
import type {SaleRepository} from "../../domain/repository/SaleRepository";
import {SaleNetRepository} from "./sale.net.repository";
import {db} from "../../../../infrastructure/di/dexie.db";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";

export class SaleOfflineFirstRepository implements SaleRepository {
    constructor(
        private readonly net: SaleNetRepository) {}

    async getAllSales(): Promise<Sale[]> {
        try {
            console.info("[sale-debug][step 3][sale.offlineFirst.getAllSales] trying remote source");
            const remote = await this.net.getAll()
            console.info("[sale-debug][step 4][sale.offlineFirst.getAllSales] remote received", {
                count: remote.length,
                firstDocument: remote[0] ?? null
            });
            await db.sales.bulkPut(remote)
            const mapped = remote.map(saleFromDTO)
            console.info("[sale-debug][step 6][sale.offlineFirst.getAllSales] mapped remote sales", {
                count: mapped.length,
                firstSale: mapped[0] ?? null
            });
            return mapped
        } catch (error: any) {
            console.warn("[sale-debug][step 3x][sale.offlineFirst.getAllSales] remote failed, using local fallback", {
                message: error?.message ?? String(error)
            });
            const local = await db.sales.toArray()
            console.info("[sale-debug][step 4x][sale.offlineFirst.getAllSales] local cache loaded", {
                count: local.length,
                firstDocument: local[0] ?? null
            });
            const mapped = local.map(saleFromDTO)
            console.info("[sale-debug][step 6x][sale.offlineFirst.getAllSales] mapped local sales", {
                count: mapped.length,
                firstSale: mapped[0] ?? null
            });
            return mapped
        }
    }

    async create(sale: Sale): Promise<Sale> {
        try {
            const created = await this.net.create(saleToDTO(sale));
            await db.sales.put(created);
            return saleFromDTO(created);
        } catch (error: any) {
            logger.error(
                `Error al crear venta en Appwrite: ${error?.message ?? "desconocido"}`,
                error?.stack
            );
            throw error;
        }
    }

    async getByUser(userId: string): Promise<Sale[]> {
        try {
            console.debug("[sale-debug][offline.getByUser] trying remote source", { userId });
            const remote = await this.net.getByUser(userId);
            await db.sales.bulkPut(remote);
            const mapped = remote.map(saleFromDTO);
            console.debug("[sale-debug][offline.getByUser] mapped remote sales", {
                userId,
                count: mapped.length
            });
            return mapped;
        } catch (error: any) {
            console.debug("[sale-debug][offline.getByUser] remote failed, using local fallback", {
                userId,
                message: error?.message ?? String(error)
            });
            const local = await db.sales.where("user_id").equals(userId).toArray();
            const mapped = local.map(saleFromDTO);
            console.debug("[sale-debug][offline.getByUser] mapped local sales", {
                userId,
                count: mapped.length
            });
            return mapped;
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
