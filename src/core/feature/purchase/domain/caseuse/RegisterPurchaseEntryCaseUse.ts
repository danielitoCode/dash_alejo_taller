import type { ProductRepository } from "../../../product/domain/repository/product.repository"
import type { StockMovementRepository } from "../../../inventory/domain/repository/stock-movement.repository"
import { createStockMovement } from "../../../inventory/domain/entity/StockMovement"
import {
    cupToUsd,
    decidePriceProtection,
} from "../../../exchange/domain/entity/CupExchange"
import {
    createPurchaseEntry,
    createPurchaseEntryLine,
    shouldUpdateLastUnitCost,
    type PurchaseEntry,
    type PurchaseEntryLine,
} from "../entity/PurchaseEntry"
import type { PurchaseLineConcept } from "../entity/enums"
import { isPurchaseLineConcept } from "../entity/enums"
import { createSupplier } from "../entity/Supplier"
import type {
    PurchaseEntryRepository,
    SupplierRepository,
} from "../repository/purchase.repository"
import type { TransactionRunner } from "../repository/transaction.repository"

export type ResolveStaffUserId = () => Promise<string>

export type PurchaseLineInput = {
    productId: string
    quantity: number
    /** En la moneda de la factura (USD o CUP). */
    unitCost: number
    concept: PurchaseLineConcept
}

export type RegisterPurchaseEntryInput = {
    supplierId?: string
    supplierName?: string
    supplierContact?: string
    reference?: string
    notes?: string
    /** USD (default) | CUP */
    currency?: string
    entryDateIso?: string
    lines: PurchaseLineInput[]
    /**
     * Obligatorio si currency = CUP.
     * CUP por 1 USD (tasa de sesión API o manual del staff).
     */
    exchangeRate?: number
    exchangeRateAt?: string
    exchangeRateSource?: "DIRECTORIO_CUBANO" | "manual"
}

/** Resultado de protección de precio aplicada en el registro. */
export type PriceProtectionApplied = {
    productId: string
    previousPrice: number
    newPrice: number
    unitCostUsd: number
}

export type RegisterPurchaseEntryResult = PurchaseEntry & {
    /** Productos cuyo price se auto-ajustó (+30 % sobre costo USD). */
    priceProtections?: PriceProtectionApplied[]
}

const MAX_APPWRITE_TRANSACTION_OPERATIONS = 100

/**
 * Factura de entrada multi-línea.
 * - USD: last_unit_cost = unitCost
 * - CUP: montos de línea en CUP; last_unit_cost = unitCostCUP / exchangeRate (USD)
 * - Protección precio: si unitCostUsd > price → price = unitCostUsd × 1.30
 *
 * Core 3: todas las escrituras de una entrada se ejecutan dentro de una
 * transacción Appwrite cuando el runner de producción está inyectado.
 * @see .policies/exchange/EXCHANGE_POLICY.md
 */
export class RegisterPurchaseEntryCaseUse {
    constructor(
        private readonly purchaseEntryRepository: PurchaseEntryRepository,
        private readonly supplierRepository: SupplierRepository,
        private readonly productRepository: ProductRepository,
        private readonly movementRepository: StockMovementRepository,
        private readonly resolveUserId: ResolveStaffUserId = async () => "staff",
        private readonly transactionRunner?: TransactionRunner
    ) {}

    async execute(input: RegisterPurchaseEntryInput): Promise<RegisterPurchaseEntryResult> {
        const linesIn = input.lines ?? []
        if (!Array.isArray(linesIn) || linesIn.length === 0) {
            throw new Error("La factura debe tener al menos una línea")
        }

        const currencyRaw = String(input.currency || "USD").trim().toUpperCase()
        const currency = currencyRaw === "CUP" ? "CUP" : "USD"

        let exchangeRate: number | undefined
        let exchangeRateAt: string | undefined
        let exchangeRateSource: "DIRECTORIO_CUBANO" | "manual" | undefined

        if (currency === "CUP") {
            const rate = Number(input.exchangeRate)
            if (!Number.isFinite(rate) || rate <= 0) {
                throw new Error(
                    "Compra en CUP requiere tasa de cambio (CUP por 1 USD) > 0. Actualiza la tasa al iniciar sesión o indica una tasa manual."
                )
            }
            exchangeRate = rate
            exchangeRateAt =
                String(input.exchangeRateAt || "").trim() || new Date().toISOString()
            exchangeRateSource =
                input.exchangeRateSource === "manual" ? "manual" : "DIRECTORIO_CUBANO"
        }

        const normalized: Array<{
            productId: string
            quantity: number
            unitCost: number
            concept: PurchaseLineConcept
            lineCost: number
            unitCostUsd: number
        }> = []

        for (const raw of linesIn) {
            const productId = String(raw.productId || "").trim()
            if (!productId) throw new Error("productId is required en cada línea")

            const quantity = Math.floor(Number(raw.quantity))
            if (!Number.isFinite(quantity) || quantity <= 0 || quantity !== Number(raw.quantity)) {
                throw new Error("quantity debe ser un entero > 0 en cada línea")
            }

            const unitCost = Number(raw.unitCost)
            if (!Number.isFinite(unitCost) || unitCost < 0) {
                throw new Error("unitCost debe ser un número >= 0")
            }

            if (!isPurchaseLineConcept(raw.concept)) {
                throw new Error(`concepto inválido: ${String(raw.concept)}`)
            }

            const unitCostUsd =
                currency === "CUP" && exchangeRate
                    ? cupToUsd(unitCost, exchangeRate)
                    : unitCost

            normalized.push({
                productId,
                quantity,
                unitCost,
                concept: raw.concept,
                lineCost: quantity * unitCost,
                unitCostUsd,
            })
        }

        const userId = (await this.resolveUserId()).trim() || "staff"
        const entryDateIso =
            String(input.entryDateIso || "").trim() || new Date().toISOString()
        const totalCost = normalized.reduce((s, l) => s + l.lineCost, 0)

        let supplierId = String(input.supplierId || "").trim() || undefined
        const supplierName = String(input.supplierName || "").trim()
        const createsSupplier = !supplierId && Boolean(supplierName)
        if (createsSupplier) {
            supplierId = crypto.randomUUID()
        }

        const transactionOperations =
            1 +
            normalized.length * 3 +
            (createsSupplier ? 1 : 0)
        if (transactionOperations > MAX_APPWRITE_TRANSACTION_OPERATIONS) {
            throw new Error(
                `La factura tiene demasiadas líneas para una transacción Appwrite (${transactionOperations} operaciones; máximo ${MAX_APPWRITE_TRANSACTION_OPERATIONS}).`
            )
        }

        const entryId = crypto.randomUUID()
        const entry = createPurchaseEntry({
            id: entryId,
            supplierId,
            reference: input.reference ? String(input.reference).trim() : undefined,
            entryDateIso,
            totalCost,
            currency,
            userId,
            notes: input.notes ? String(input.notes).trim() : undefined,
            lineCount: normalized.length,
            exchangeRate,
            exchangeRateAt,
            exchangeRateSource,
        })

        const runAtomic = async (
            transactionId?: string
        ): Promise<RegisterPurchaseEntryResult> => {
            if (createsSupplier) {
                const contactRaw = String(input.supplierContact || "").trim()
                await this.supplierRepository.create(
                    createSupplier({
                        id: supplierId!,
                        name: supplierName,
                        contact: contactRaw,
                    }),
                    transactionId
                )
            }

            const savedEntry = await this.purchaseEntryRepository.createEntry(
                entry,
                transactionId
            )

            const savedLines: PurchaseEntryLine[] = []
            const priceProtections: PriceProtectionApplied[] = []

            for (const line of normalized) {
                const lineEntity = createPurchaseEntryLine({
                    id: crypto.randomUUID(),
                    entryId: savedEntry.id,
                    productId: line.productId,
                    quantity: line.quantity,
                    unitCost: line.unitCost,
                    concept: line.concept,
                    lineCost: line.lineCost,
                })
                const savedLine = await this.purchaseEntryRepository.createLine(
                    lineEntity,
                    transactionId
                )
                savedLines.push(savedLine)

                // Critical: when transactionId exists, Appwrite reads the current
                // transactional state and detects external changes at commit.
                const product = await this.productRepository.getById(
                    line.productId,
                    transactionId
                )
                if (!product) throw new Error(`Product with id ${line.productId} not found`)

                const reserved = Number(product.reserved) || 0
                const existence = Number(product.existence) || 0
                const nextExistence = existence + line.quantity
                if (nextExistence < reserved) {
                    throw new Error(
                        `existence (${nextExistence}) cannot be less than reserved (${reserved}) for ${line.productId}`
                    )
                }

                const patch: {
                    existence: number
                    lastUnitCost?: number
                    price?: number
                    priceProtectedAt?: string
                    priceProtectionEntryId?: string
                } = {
                    existence: nextExistence,
                }

                if (shouldUpdateLastUnitCost(line)) {
                    // Siempre USD (convertido si la factura fue CUP)
                    patch.lastUnitCost = line.unitCostUsd

                    const decision = decidePriceProtection(
                        line.unitCostUsd,
                        Number(product.price) || 0
                    )
                    if (decision.applied) {
                        const protectedAt = new Date().toISOString()
                        patch.price = decision.newPrice
                        patch.priceProtectedAt = protectedAt
                        patch.priceProtectionEntryId = savedEntry.id
                        priceProtections.push({
                            productId: line.productId,
                            previousPrice: decision.previousPrice,
                            newPrice: decision.newPrice,
                            unitCostUsd: decision.unitCostUsd,
                        })
                    }
                }

                await this.productRepository.update(
                    line.productId,
                    patch,
                    transactionId
                )

                const movement = createStockMovement({
                    id: crypto.randomUUID(),
                    productId: line.productId,
                    type: "entrada",
                    quantity: line.quantity,
                    balanceAfter: nextExistence,
                    reason: "purchase_entry",
                    userId,
                    entryId: savedEntry.id,
                })
                // Movement creation is now part of the transaction. Any failure
                // aborts the whole entry instead of leaving stock without audit.
                await this.movementRepository.create(movement, transactionId)
            }

            return {
                ...savedEntry,
                lines: savedLines,
                priceProtections: priceProtections.length > 0 ? priceProtections : undefined,
            }
        }

        const result = this.transactionRunner
            ? await this.transactionRunner.run(runAtomic)
            : await runAtomic()

        // Refresh the offline-first mirror only after a successful commit.
        for (const line of normalized) {
            try {
                await this.productRepository.getById(line.productId)
            } catch {
                // Cache refresh is best-effort; Appwrite remains the source of truth.
            }
        }

        return result
    }
}
