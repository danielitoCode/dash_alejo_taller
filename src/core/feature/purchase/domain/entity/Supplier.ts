export interface Supplier {
    id: string
    name: string
    contact?: string
    notes?: string
}

export function createSupplier(input: Supplier): Supplier {
    const id = String(input.id || "").trim()
    if (!id) throw new Error("supplier id is required")
    const name = String(input.name || "").trim()
    if (!name) throw new Error("supplier name is required")
    return {
        id,
        name,
        // Permitir "" para cumplir required de Appwrite sin forzar datos reales.
        contact:
            input.contact !== undefined && input.contact !== null
                ? String(input.contact)
                : undefined,
        notes: input.notes ? String(input.notes) : undefined,
    }
}
