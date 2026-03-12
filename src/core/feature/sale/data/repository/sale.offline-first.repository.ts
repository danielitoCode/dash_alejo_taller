import type {Sale} from "../../domain/entity/Sale";
import type {SaleDTO} from "../dto/SaleDTO";
import {saleFromDTO, saleToDTO} from "../mapper/Mappers";
import type {SaleRepository} from "../../domain/repository/SaleRepository";
import {SaleNetRepository} from "./sale.net.repository";
import {db} from "../../../../infrastructure/di/dexie.db";

function toLocalSaleDTO(sale: Sale): SaleDTO {
    const payload = saleToDTO(sale);
    const now = new Date().toISOString();

    return {
        ...payload,
        $id: payload.$id || crypto.randomUUID(),
        $collectionId: "sales",
        $databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || "",
        $createdAt: now,
        $updatedAt: now,
        $permissions: [],
        $sequence: 0,
    };
}

export class SaleOfflineFirstRepository implements SaleRepository {
    constructor(
        private readonly net: SaleNetRepository) {}

    async getAllSales(): Promise<Sale[]> {
        try {
            const remote = await this.net.getAll()
            await db.sales.bulkPut(remote)
            return remote.map(saleFromDTO)
        } catch {
            const local = await db.sales.toArray()
            return local.map(saleFromDTO)
        }
    }

    async create(sale: Sale): Promise<Sale> {
        try {
            const created = await this.net.create(saleToDTO(sale));
            await db.sales.put(created);
            return saleFromDTO(created);
        } catch {
            const local = toLocalSaleDTO(sale);
            await db.sales.put(local);
            return saleFromDTO(local);
        }
    }

    async getByUser(userId: string): Promise<Sale[]> {
        try {
            const remote = await this.net.getByUser(userId);
            await db.sales.bulkPut(remote);
            return remote.map(saleFromDTO);
        } catch {
            const local = await db.sales.where("userId").equals(userId).toArray();
            return local.map(saleFromDTO);
        }
    }
}