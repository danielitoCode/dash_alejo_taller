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
 * B3.1 — anulación completa de una entrada.
 *
 * La entrada y sus líneas nunca se eliminan. Cada línea genera un movimiento
 * compensatorio `ajuste` con reason=purchase_entry_reversal y la misma entryId.
 * Stock y estado de la entrada se modifican dentro de una única transacción.
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

        return this.transactionRunner.run(async (transactionId) => {
            const entry = await this.purchaseEntryRepository.getEntryById(
                entryId,
                transactionId
            )
            if (!entry) throw new Error(`Purchase entry ${entryId} not found`)

            if ((entry.status || "ACTIVE") === "CANCELLED") {
                throw new Error(`Purchase entry ${entryId} is already cancelled`)
            }

            const lines = await this.purchaseEntryRepository.listLinesByEntry(
                entryId,
                transactionId
            )
            if (lines.length === 0) {
                throw new Error(`Purchase entry ${entryId} has no lines`)
            }

            const operationCount = 1 + lines.length * 2
            if (operationCount > MAX_APPWRITE_TRANSACTION_OPERATIONS) {
                throw new Error(
                    `La anulación requiere ${operationCount} operaciones Appwrite; máximo ${MAX_APPWRITE_TRANSACTION_OPERATIONS}.`
                )
            }

            const userId = (await this.resolveUserId()).trim() || "staff"

            // First pass: validate every affected product inside the transaction.
            // No product is mutated until every line can be safely reversed.
            const reversals: Array<{
                productId: string
                quantity: number
                newExistence: number
            }> = []

            for (const line of lines) {
                const product = await this.productRepository.getById(
                    line.productId,
                    transactionId
                )
                if (!product) {
                    throw new Error(`Product with id ${line.productId} not found`)
                }

                const existence = Number(product.existence) || 0
                const reserved = Number(product.reserved) || 0
                const newExistence = existence - line.quantity

                if (newExistence < 0) {
                    throw new Error(
                        `No se puede anular ${entryId}: existence (${existence}) < quantity (${line.quantity}) para ${line.productId}`
                    )
                }

                if (newExistence < reserved) {
                    throw new Error(
                        `No se puede anular ${entryId}: existence (${newExistence}) < reserved (${reserved}) para ${line.productId}`
                    )
                }

                reversals.push({
                    productId: line.productId,
                    quantity: line.quantity,
                    newExistence,
                })
            }

            // Second pass: all mutations are staged atomically.
            for (const reversal of reversals) {
                // Deliberately do not modify reserved or lastUnitCost.
                await this.productRepository.update(
                    reversal.productId,
                    { existence: reversal.newExistence },
                    transactionId
                )

                const movement = createStockMovement({
                    id: crypto.randomUUID(),
                    productId: reversal.productId,
                    type: "ajuste",
                    quantity: reversal.quantity,
                    balanceAfter: reversal.newExistence,
                    reason: "purchase_entry_reversal",
                    userId,
                    entryId,
                })
                await this.movementRepository.create(movement, transactionId)
            }

            await this.purchaseEntryRepository.updateEntry(
                entryId,
                { status: "CANCELLED" },
                transactionId
            )

            return {
                entryId,
                reversedLines: reversals.length,
            }
        })
    }
}
