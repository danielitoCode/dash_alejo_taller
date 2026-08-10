import type { Sale } from "../entity/Sale";
import type { SaleRepository } from "../repository/SaleRepository";
import { BuyState } from "../entity/enums";
import type { PanelStockApplicator } from "./ConfirmSaleFromPanelCaseUse";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";

/**
 * Core1 5.2 — Rechazar venta desde panel con semántica de stock = operador.
 *
 * DELETED: por línea reserved -= qty; existence sin cambio
 * Idempotente: si ya DELETED, no vuelve a liberar reserved
 * No rechaza VERIFIED (el consume físico ya ocurrió)
 *
 * Orden: stock (Appwrite) → buy_state DELETED
 */
export class RejectSaleFromPanelCaseUse {
    constructor(
        private readonly salesRepository: SaleRepository,
        private readonly stock: PanelStockApplicator
    ) {}

    async execute(saleId: string, saleSnapshot?: Sale | null): Promise<Sale> {
        const sale = await this.resolveSale(saleId, saleSnapshot);

        if (sale.verified === BuyState.DELETED) {
            logger.info(`[RejectSale] idempotent already DELETED saleId=${sale.id}`);
            return sale;
        }

        if (sale.verified === BuyState.VERIFIED) {
            throw new Error(
                "No se puede rechazar una venta ya confirmada (VERIFIED). " +
                    "El stock físico ya se consumió; no se libera reserved de nuevo."
            );
        }

        if (sale.verified !== BuyState.UNVERIFIED) {
            throw new Error(`Estado de venta no rechazable: ${sale.verified}`);
        }

        await this.applyRejectStock(sale);

        const updated = await this.salesRepository.updateVerified(sale.id, BuyState.DELETED);
        logger.info(`[RejectSale] DELETED saleId=${sale.id} lines=${sale.products.length}`);
        return updated;
    }

    private async resolveSale(saleId: string, snapshot?: Sale | null): Promise<Sale> {
        if (snapshot && snapshot.id === saleId) return snapshot;

        const all = await this.salesRepository.getAllSales();
        const found = all.find((s) => s.id === saleId);
        if (!found) throw new Error(`Venta no encontrada: ${saleId}`);
        return found;
    }

    private async applyRejectStock(sale: Sale): Promise<void> {
        if (!sale.products?.length) {
            logger.warn(`[RejectSale] empty products saleId=${sale.id}`);
            return;
        }

        for (const item of sale.products) {
            const qty = Math.max(0, Number(item.quantity) || 0);
            if (qty === 0 || !item.productId) continue;

            const after = await this.stock.applyStockDeltas(item.productId, {
                confirmed: false,
                qty,
            });

            logger.info(
                `[RejectSale] line saleId=${sale.id} productId=${item.productId} qty=${qty} ` +
                    `existenceAfter=${after.existence} reservedAfter=${after.reserved}`
            );
        }
    }
}
