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
 * Core2 paridad operador — traza `salida_venta` por línea al confirmar.
 * Soft-fail: no revierte stock si el movement falla.
 */
export interface PanelSalidaMovementWriter {
    recordSalidaVenta(input: {
        productId: string;
        quantity: number;
        balanceAfter: number;
        saleId: string;
        userId: string;
    }): Promise<void>;
}

/**
 * Core1 5.1 + Core2 B4.2 + paridad movements —
 * Confirmar venta desde panel (misma semántica que operador móvil).
 *
 * VERIFIED: por línea existence -= qty, reserved -= qty
 * + stock_movements tipo `salida_venta` (sale_id, balance_after)
 * + sale_finance_event (revenue / COGS / margin)
 * Idempotente: si ya VERIFIED, no vuelve a restar stock ni movements (sí finance si falta).
 * No confirma DELETED.
 */
export class ConfirmSaleFromPanelCaseUse {
    constructor(
        private readonly salesRepository: SaleRepository,
        private readonly stock: PanelStockApplicator,
        private readonly finance?: PanelFinanceRegistrar | null,
        private readonly movements?: PanelSalidaMovementWriter | null,
        private readonly resolveUserId: () => Promise<string> = async () => "staff"
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

        let userId = "staff";
        try {
            userId = (await this.resolveUserId()).trim() || "staff";
        } catch {
            userId = "staff";
        }

        for (const item of sale.products) {
            const qty = Math.max(0, Math.trunc(Number(item.quantity) || 0));
            if (qty === 0 || !item.productId) continue;

            const after = await this.stock.applyStockDeltas(item.productId, {
                confirmed: true,
                qty,
            });

            logger.info(
                `[ConfirmSale] line saleId=${sale.id} productId=${item.productId} qty=${qty} ` +
                    `existenceAfter=${after.existence} reservedAfter=${after.reserved}`
            );

            if (this.movements) {
                try {
                    await this.movements.recordSalidaVenta({
                        productId: item.productId,
                        quantity: qty,
                        balanceAfter: after.existence,
                        saleId: sale.id,
                        userId,
                    });
                } catch (e: any) {
                    // Soft-fail: stock ya aplicado; no bloquear confirmación
                    logger.error(
                        `[ConfirmSale] salida_venta failed saleId=${sale.id} productId=${item.productId}: ${e?.message ?? e}`,
                        e?.stack
                    );
                }
            }
        }
    }
}
