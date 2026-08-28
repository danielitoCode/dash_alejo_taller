import {
    isPurchaseLineConcept,
    type PurchaseLineConcept,
} from "./enums"

/**
 * Línea de factura de entrada (Core 2).
 */
export interface PurchaseEntryLine {
    id: string
    entryId: string
    productId: string
    quantity: number
    unitCost: number
    concept: PurchaseLineConcept
    lineCost: number
}

/**
 * Cabecera de factura de entrada.
 * Moneda principal del negocio: USD. CUP solo cuando la compra real fue en CUP.
 */
export interface PurchaseEntry {
    id: string
    supplierId?: string
    reference?: string
    entryDateIso: string
    totalCost: number
    currency: string
    userId: string
    notes?: string
    lineCount: number
    lines?: PurchaseEntryLine[]
}

export function createPurchaseEntryLine(input: PurchaseEntryLine): PurchaseEntryLine {
    const id = String(input.id || "").trim()
    if (!id) throw new Error("purchase entry line id is required")
    const entryId = String(input.entryId || "").trim()
    if (!entryId) throw new Error("entryId is required")
    const productId = String(input.productId || "").trim()
    if (!productId) throw new Error("productId is required")

    const quantity = Math.trunc(Number(input.quantity))
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("quantity must be an integer > 0")
    }

    const unitCost = Number(input.unitCost)
    if (!Number.isFinite(unitCost) || unitCost < 0) {
        throw new Error("unitCost must be a number >= 0")
    }

    if (!isPurchaseLineConcept(input.concept)) {
        throw new Error(`invalid concept: ${String(input.concept)}`)
    }

    const lineCost = Number(input.lineCost)
    const expected = quantity * unitCost
    const cost = Number.isFinite(lineCost) ? lineCost : expected

    return {
        id,
        entryId,
        productId,
        quantity,
        unitCost,
        concept: input.concept,
        lineCost: cost,
    }
}

export function createPurchaseEntry(input: PurchaseEntry): PurchaseEntry {
    const id = String(input.id || "").trim()
    if (!id) throw new Error("purchase entry id is required")
    const userId = String(input.userId || "").trim()
    if (!userId) throw new Error("userId is required")
    // Principal: USD. CUP solo si la compra real fue en pesos.
    const currency = String(input.currency || "").trim().toUpperCase() || "USD"
    const entryDateIso = String(input.entryDateIso || "").trim()
    if (!entryDateIso) throw new Error("entryDateIso is required")

    const totalCost = Number(input.totalCost)
    if (!Number.isFinite(totalCost) || totalCost < 0) {
        throw new Error("totalCost must be a number >= 0")
    }

    const lineCount = Math.trunc(Number(input.lineCount))
    if (!Number.isFinite(lineCount) || lineCount < 0) {
        throw new Error("lineCount must be an integer >= 0")
    }

    return {
        id,
        supplierId: input.supplierId ? String(input.supplierId) : undefined,
        reference: input.reference ? String(input.reference) : undefined,
        entryDateIso,
        totalCost,
        currency,
        userId,
        notes: input.notes ? String(input.notes) : undefined,
        lineCount,
        lines: input.lines,
    }
}

/** Si concepto purchase y unitCost > 0 → debe actualizar last_unit_cost del producto. */
export function shouldUpdateLastUnitCost(line: Pick<PurchaseEntryLine, "concept" | "unitCost">): boolean {
    return line.concept === "purchase" && Number(line.unitCost) > 0
}
