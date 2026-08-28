import type { ProductRepository } from "../../../product/domain/repository/product.repository"
import type { StockMovementRepository } from "../../../inventory/domain/repository/stock-movement.repository"
import { createStockMovement } from "../../../inventory/domain/entity/StockMovement"
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

export type ResolveStaffUserId = () => Promise<string>

export type PurchaseLineInput = {
    productId: string
    quantity: number
    unitCost: number
    concept: PurchaseLineConcept
}

export type RegisterPurchaseEntryInput = {
    supplierId?: string
    /** Alta al vuelo desde factura (nombre obligatorio si no hay supplierId). */
    supplierName?: string
    /** Contacto opcional al crear proveedor desde factura. */
    supplierContact?: string
    reference?: string
    notes?: string
    /** USD (principal) | CUP. Default USD. */
    currency?: string
    entryDateIso?: string
    lines: PurchaseLineInput[]
}

/**
 * Core 2 B3.2 / Core 3 B4 — factura de entrada multi-línea.
 * purchase_entry + lines + existence += + movement entrada + last_unit_cost (si purchase).
 * Moneda: USD es la principal/referencial. CUP solo cuando la compra real fue en CUP.
 * last_unit_cost del producto se guarda en la misma unidad del unitCost de la línea
 * (para compras en CUP el panel debe convertir a USD antes de enviar unitCost — ver POLICY).
 */
export class RegisterPurchaseEntryCaseUse {
    constructor(
        private readonly purchaseEntryRepository: PurchaseEntryRepository,
        private readonly supplierRepository: SupplierRepository,
        private readonly productRepository: ProductRepository,
        private readonly movementRepository: StockMovementRepository,
        private readonly resolveUserId: ResolveStaffUserId = async () => "staff"
    ) {}

    async execute(input: RegisterPurchaseEntryInput): Promise<PurchaseEntry> {
        const linesIn = input.lines ?? []
        if (!Array.isArray(linesIn) || linesIn.length === 0) {
            throw new Error("La factura debe tener al menos una línea")
        }

        const normalized: Array<{
            productId: string
            quantity: number
            unitCost: number
            concept: PurchaseLineConcept
            lineCost: number
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

            const product = await this.productRepository.getById(productId)
            if (!product) throw new Error(`Product with id ${productId} not found`)

            normalized.push({
                productId,
                quantity,
                unitCost,
                concept: raw.concept,
                lineCost: quantity * unitCost,
            })
        }

        const userId = (await this.resolveUserId()).trim() || "staff"
        // Principal del negocio: USD. No default a CUP (bug Core3 B4).
        const currencyRaw = String(input.currency || "USD").trim().toUpperCase()
        const currency = currencyRaw === "CUP" ? "CUP" : "USD"
        const entryDateIso =
            String(input.entryDateIso || "").trim() || new Date().toISOString()
        const totalCost = normalized.reduce((s, l) => s + l.lineCost, 0)

        let supplierId = String(input.supplierId || "").trim() || undefined
        const supplierName = String(input.supplierName || "").trim()
        if (!supplierId && supplierName) {
            const contactRaw = String(input.supplierContact || "").trim()
            const created = await this.supplierRepository.create(
                createSupplier({
                    id: crypto.randomUUID(),
                    name: supplierName,
                    // Appwrite exige contact (required); vacío si solo hay nombre.
                    contact: contactRaw,
                })
            )
            supplierId = created.id
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
        })

        const savedEntry = await this.purchaseEntryRepository.createEntry(entry)

        const savedLines: PurchaseEntryLine[] = []
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
            const savedLine = await this.purchaseEntryRepository.createLine(lineEntity)
            savedLines.push(savedLine)

            const product = await this.productRepository.getById(line.productId)
            if (!product) throw new Error(`Product with id ${line.productId} not found`)

            const reserved = Number(product.reserved) || 0
            const existence = Number(product.existence) || 0
            const nextExistence = existence + line.quantity
            if (nextExistence < reserved) {
                throw new Error(
                    `existence (${nextExistence}) cannot be less than reserved (${reserved}) for ${line.productId}`
                )
            }

            const patch: { existence: number; lastUnitCost?: number } = {
                existence: nextExistence,
            }
            if (shouldUpdateLastUnitCost(line)) {
                // last_unit_cost es el costo referencial en la unidad enviada.
                // Política: unitCost debe llegar ya en USD (si la compra fue CUP, convertir en UI).
                patch.lastUnitCost = line.unitCost
            }
            await this.productRepository.update(line.productId, patch)

            try {
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
                await this.movementRepository.create(movement)
            } catch (err) {
                console.error(
                    `[RegisterPurchaseEntry] stock ok productId=${line.productId}; movement failed`,
                    err
                )
            }
        }

        return { ...savedEntry, lines: savedLines }
    }
}
