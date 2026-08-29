import type { ProductRepository } from "../../../product/domain/repository/product.repository"
import { createStockMovement } from "../../../inventory/domain/entity/StockMovement"
import type { StockMovementRepository } from "../../../inventory/domain/repository/stock-movement.repository"
import type { PurchaseEntryRepository } from "../repository/purchase.repository"
import type { TransactionRunner } from "../repository/transaction.repository"

const MAX_APPWRITE_TRANSACTION_OPERATIONS = 100

export type CancelPurchaseEntryResult = {
    entryId: string
    reversedLines: number
}

/**
 * B3.1 — anulación completa y atómica de una entrada.
 *
 * La operación se ejecuta íntegramente mediante Appwrite Client SDK:
 * - lee dentro de la transacción;
 * - valida todas las líneas antes de mutar stock;
 * - revierte existence sin tocar reserved/lastUnitCost;
 * - crea movimientos compensatorios auditables;
 * - marca la entrada CANCELLED;
 * - commit/rollback lo decide AppwriteTransactionRunner.
 */
export class CancelPurchaseEntryCaseUse {
    constructor(
        private readonly purchaseEntryRepository: PurchaseEntryRepository,
        private readonly productRepository: ProductRepository,
        private readonly movementRepository: StockMovementRepository,
        private readonly transactionRunner: TransactionRunner,
        private readonly resolveUserId: () => Promise<string> = async () => "staff"
    ) {}

    async execute(entryIdInput: string): Promise<CancelPurchaseEntryResult> {
        const entryId = String(entryIdInput || "").trim()
        if (!entryId) throw new Error("entryId is required")
        if (!this.purchaseEntryRepository.updateEntry) {
            throw new Error("El adaptador de compras no soporta anulación de entradas")
        }

        return this.transactionRunner.run(async (transactionId) => {
            const entry = await this.purchaseEntryRepository.getEntryById(entryId, transactionId)
            if (!entry) throw new Error(`Purchase entry ${entryId} not found`)
            // Legacy entries without status are ACTIVE by contract.
            if ((entry.status || "ACTIVE") === "CANCELLED") {
                throw new Error(`Purchase entry ${entryId} is already cancelled`)
            }

            const lines = await this.purchaseEntryRepository.listLinesByEntry(entryId, transactionId)
            if (lines.length === 0) throw new Error(`Purchase entry ${entryId} has no lines`)

            // A SKU may occur in more than one line. Aggregate before touching
            // stock so existence is decremented exactly once per product.
            const byProduct = new Map<string, number>()
            for (const line of lines) {
                const productId = String(line.productId || "").trim()
                const quantity = Number(line.quantity)
                if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
                    throw new Error(`Invalid line in purchase entry ${entryId}`)
                }
                byProduct.set(productId, (byProduct.get(productId) ?? 0) + quantity)
            }

            const operationCount = 1 + byProduct.size * 2
            if (operationCount > MAX_APPWRITE_TRANSACTION_OPERATIONS) {
                throw new Error(
                    `La anulación requiere ${operationCount} operaciones Appwrite; máximo ${MAX_APPWRITE_TRANSACTION_OPERATIONS}.`
                )
            }

            const userId = (await this.resolveUserId()).trim() || "staff"
            const reversals: Array<{
                productId: string
                quantity: number
                newExistence: number
            }> = []

            // Validate every affected SKU before staging any stock mutation.
            for (const [productId, quantity] of byProduct) {
                const product = await this.productRepository.getById(productId, transactionId)
                if (!product) throw new Error(`Product with id ${productId} not found`)

                const existence = Number(product.existence) || 0
                const reserved = Number(product.reserved) || 0
                const newExistence = existence - quantity

                if (newExistence < 0) {
                    throw new Error(
                        `No se puede anular ${entryId}: existence (${existence}) < quantity (${quantity}) para ${productId}`
                    )
                }
                if (newExistence < reserved) {
                    throw new Error(
                        `No se puede anular ${entryId}: existence (${newExistence}) < reserved (${reserved}) para ${productId}`
                    )
                }

                reversals.push({ productId, quantity, newExistence })
            }

            for (const reversal of reversals) {
                // Never change reserved or lastUnitCost during purchase reversal.
                await this.productRepository.update(
                    reversal.productId,
                    { existence: reversal.newExistence },
                    transactionId
                )

                // Reuse the existing `ajuste` movement type. The reason provides
                // the explicit reversal semantic without changing the enum/schema.
                await this.movementRepository.create(
                    createStockMovement({
                        id: crypto.randomUUID(),
                        productId: reversal.productId,
                        type: "ajuste",
                        quantity: reversal.quantity,
                        balanceAfter: reversal.newExistence,
                        reason: "purchase_entry_reversal",
                        userId,
                        entryId,
                    }),
                    transactionId
                )
            }

            await this.purchaseEntryRepository.updateEntry(
                entryId,
                { status: "CANCELLED" },
                transactionId
            )

            return {
                entryId,
                reversedLines: lines.length,
            }
        })
    }
}
