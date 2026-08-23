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

/** Core2 B4.2 — registrar sale_finance_event al VERIFIED (idempotente). */
export interface PanelFinanceRegistrar {
    registerFromVerifiedSale(sale: Sale): Promise<void>;
}

/**
 * Core1 5.1 + Core2 B4.2 — Confirmar venta desde panel.
 *
 * VERIFIED: por línea existence -= qty, reserved -= qty
 * + sale_finance_event (revenue / COGS / margin)
 * Idempotente: si ya VERIFIED, no vuelve a restar stock (sí intenta finance si falta).
 * No confirma DELETED.
 */
export class ConfirmSaleFromPanelCaseUse {
    constructor(
        private readonly salesRepository: SaleRepository,
        private readonly stock: PanelStockApplicator,
        private readonly finance?: PanelFinanceRegistrar | null
    ) {}

    async execute(saleId: string, saleSnapshot?: Sale | null): Promise<Sale> {
        const sale = await this.resolveSale(saleId, saleSnapshot);

        if (sale.verified === BuyState.VERIFIED) {
            logger.info(`[ConfirmSale] idempotent already VERIFIED saleId=${sale.id}`);
            await this.ensureFinance(sale);
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
        await this.ensureFinance(updated);
        return updated;
    }

    private async ensureFinance(sale: Sale): Promise<void> {
        if (!this.finance) return;
        try {
            await this.finance.registerFromVerifiedSale(sale);
        } catch (e: any) {
            logger.error(
                `[ConfirmSale] finance event failed saleId=${sale.id}: ${e?.message ?? e}`,
                e?.stack
            );
        }
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
