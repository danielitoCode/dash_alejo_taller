import type { Sale } from "../entity/Sale";
import type { SaleRepository } from "../repository/SaleRepository";
import { BuyState } from "../entity/enums";
import { logger } from "../../../../infrastructure/presentation/util/logger.service";

/** Contrato mínimo de stock (paridad operador). */
export interface PanelStockApplicator {
    applyStockDeltas(
        productId: string,
        opts: { confirmed: boolean; qty: number }
    ): Promise<{ existence: number; reserved: number }>;
}

/**
 * Core1 5.1 — Confirmar venta desde panel con semántica de stock = operador.
 *
 * VERIFIED: por línea existence -= qty, reserved -= qty
 * Idempotente: si ya VERIFIED, no vuelve a restar stock.
 * No confirma DELETED.
 *
 * Orden: stock (Appwrite) → buy_state VERIFIED (igual espíritu que operador Core 1).
 */
export class ConfirmSaleFromPanelCaseUse {
    constructor(
        private readonly salesRepository: SaleRepository,
        private readonly stock: PanelStockApplicator
    ) {}

    async execute(saleId: string, saleSnapshot?: Sale | null): Promise<Sale> {
        const sale = await this.resolveSale(saleId, saleSnapshot);

        if (sale.verified === BuyState.VERIFIED) {
            logger.info(`[ConfirmSale] idempotent already VERIFIED saleId=${sale.id}`);
            return sale;
        }

        if (sale.verified === BuyState.DELETED) {
            throw new Error(
                "No se puede confirmar una venta rechazada (DELETED). El reserved ya se liberó."
            );
        }

        if (sale.verified !== BuyState.UNVERIFIED) {
            throw new Error(`Estado de venta no confirmable: ${sale.verified}`);
        }

        await this.applyConfirmStock(sale);

        const updated = await this.salesRepository.updateVerified(sale.id, BuyState.VERIFIED);
        logger.info(`[ConfirmSale] VERIFIED saleId=${sale.id} lines=${sale.products.length}`);
        return updated;
    }

    private async resolveSale(saleId: string, snapshot?: Sale | null): Promise<Sale> {
        if (snapshot && snapshot.id === saleId) return snapshot;

        const all = await this.salesRepository.getAllSales();
        const found = all.find((s) => s.id === saleId);
        if (!found) throw new Error(`Venta no encontrada: ${saleId}`);
        return found;
    }

    private async applyConfirmStock(sale: Sale): Promise<void> {
        if (!sale.products?.length) {
            logger.warn(`[ConfirmSale] empty products saleId=${sale.id}`);
            return;
        }

        for (const item of sale.products) {
            const qty = Math.max(0, Number(item.quantity) || 0);
            if (qty === 0 || !item.productId) continue;

            const after = await this.stock.applyStockDeltas(item.productId, {
                confirmed: true,
                qty,
            });

            logger.info(
                `[ConfirmSale] line saleId=${sale.id} productId=${item.productId} qty=${qty} ` +
                    `existenceAfter=${after.existence} reservedAfter=${after.reserved}`
            );
        }
    }
}
