import type { Supplier } from "../../domain/entity/Supplier"
import { createSupplier } from "../../domain/entity/Supplier"
import type {
    PurchaseEntry,
    PurchaseEntryLine,
} from "../../domain/entity/PurchaseEntry"
import { createPurchaseEntryLine } from "../../domain/entity/PurchaseEntry"
import { isPurchaseLineConcept } from "../../domain/entity/enums"
import type { SupplierDTO } from "../dto/SupplierDTO"
import type {
    PurchaseEntryDTO,
    PurchaseEntryLineDTO,
} from "../dto/PurchaseEntryDTO"

export type SupplierWriteDTO = {
    $id?: string
    name: string
    contact: string
    notes?: string
}

export function supplierFromDTO(dto: SupplierDTO): Supplier {
    return createSupplier({
        id: dto.$id,
        name: dto.name,
        contact: dto.contact ?? "",
        notes: dto.notes ?? undefined,
    })
}

export function supplierToDTO(s: Supplier): SupplierWriteDTO {
    const contact =
        s.contact != null && String(s.contact).trim() !== ""
            ? String(s.contact).trim()
            : ""
    const dto: SupplierWriteDTO = {
        $id: s.id,
        name: s.name,
        contact,
    }
    if (s.notes != null && String(s.notes).trim() !== "") dto.notes = String(s.notes).trim()
    return dto
}

export type PurchaseEntryWriteDTO = Pick<
    PurchaseEntryDTO,
    | "supplier_id"
    | "reference"
    | "entry_date"
    | "total_cost"
    | "currency"
    | "user_id"
    | "notes"
    | "line_count"
    | "status"
    | "exchange_rate"
    | "exchange_rate_at"
    | "exchange_rate_source"
> & { $id?: string }

export type PurchaseEntryLineWriteDTO = Pick<
    PurchaseEntryLineDTO,
    | "entry_id"
    | "product_id"
    | "quantity"
    | "unit_cost"
    | "concept"
    | "line_cost"
> & { $id?: string }

/**
 * Lectura desde Appwrite: no lanza por exchange_rate faltante.
 * Facturas CUP legacy sin snapshot siguen listándose (tasa undefined).
 * Validación estricta solo en createPurchaseEntry (escritura / RegisterPurchaseEntry).
 */
export function purchaseEntryFromDTO(dto: PurchaseEntryDTO): PurchaseEntry {
    const currency = (dto.currency || "USD").toUpperCase() === "CUP" ? "CUP" : "USD"

    const rawRate =
        (dto as { exchange_rate?: unknown; exchangeRate?: unknown }).exchange_rate ??
        (dto as { exchangeRate?: unknown }).exchangeRate
    let rate: number | undefined
    if (rawRate != null && rawRate !== "") {
        const n = Number(rawRate)
        if (Number.isFinite(n) && n > 0) rate = n
    }

    const rawAt =
        (dto as { exchange_rate_at?: unknown; exchangeRateAt?: unknown }).exchange_rate_at ??
        (dto as { exchangeRateAt?: unknown }).exchangeRateAt
    const rawSource =
        (dto as { exchange_rate_source?: unknown; exchangeRateSource?: unknown })
            .exchange_rate_source ??
        (dto as { exchangeRateSource?: unknown }).exchangeRateSource

    const id = String(dto.$id || "").trim() || "unknown"
    const userId = String(dto.user_id || "").trim() || "unknown"
    const entryDateIso =
        String(dto.entry_date || "").trim() || new Date(0).toISOString()

    const entry: PurchaseEntry = {
        id,
        supplierId: dto.supplier_id ? String(dto.supplier_id) : undefined,
        reference: dto.reference ? String(dto.reference) : undefined,
        entryDateIso,
        totalCost: Number(dto.total_cost) || 0,
        currency,
        userId,
        notes: dto.notes ? String(dto.notes) : undefined,
        lineCount: Math.trunc(Number(dto.line_count) || 0),
        status: dto.status === "CANCELLED" ? "CANCELLED" : "ACTIVE",
    }

    if (currency === "CUP" && rate != null) {
        entry.exchangeRate = rate
        const at = String(rawAt || "").trim()
        if (at) entry.exchangeRateAt = at
        entry.exchangeRateSource =
            rawSource === "manual" ? "manual" : "DIRECTORIO_CUBANO"
    }

    return entry
}

export function purchaseEntryToDTO(e: PurchaseEntry): PurchaseEntryWriteDTO {
    const dto: PurchaseEntryWriteDTO = {
        $id: e.id,
        entry_date: e.entryDateIso,
        total_cost: e.totalCost,
        currency: e.currency || "USD",
        user_id: e.userId,
        line_count: e.lineCount,
        // Appwrite: status es required (ACTIVE|CANCELLED). Siempre enviarlo en create/update.
        status: e.status === "CANCELLED" ? "CANCELLED" : "ACTIVE",
    }
    if (e.supplierId) dto.supplier_id = e.supplierId
    if (e.reference) dto.reference = e.reference
    if (e.notes) dto.notes = e.notes
    if (e.currency === "CUP" && e.exchangeRate != null && e.exchangeRate > 0) {
        dto.exchange_rate = e.exchangeRate
        if (e.exchangeRateAt) dto.exchange_rate_at = e.exchangeRateAt
        if (e.exchangeRateSource) dto.exchange_rate_source = e.exchangeRateSource
    }
    return dto
}

export function purchaseEntryLineFromDTO(dto: PurchaseEntryLineDTO): PurchaseEntryLine {
    const concept = isPurchaseLineConcept(dto.concept) ? dto.concept : "other"
    return createPurchaseEntryLine({
        id: dto.$id,
        entryId: dto.entry_id,
        productId: dto.product_id,
        quantity: Math.trunc(Number(dto.quantity) || 0),
        unitCost: Number(dto.unit_cost) || 0,
        concept,
        lineCost: Number(dto.line_cost) || 0,
    })
}

export function purchaseEntryLineToDTO(line: PurchaseEntryLine): PurchaseEntryLineWriteDTO {
    return {
        $id: line.id,
        entry_id: line.entryId,
        product_id: line.productId,
        quantity: line.quantity,
        unit_cost: line.unitCost,
        concept: line.concept,
        line_cost: line.lineCost,
    }
}
