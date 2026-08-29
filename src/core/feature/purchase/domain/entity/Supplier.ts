export interface Supplier {
    id: string
    name: string
    /**
     * Opcional en dominio de UI; en Appwrite el atributo es required.
     * Al persistir, `undefined` / vacío se serializa como "".
     */
    contact?: string
    notes?: string
}

export function createSupplier(input: Supplier): Supplier {
    const id = String(input.id || "").trim()
    if (!id) throw new Error("supplier id is required")
    const name = String(input.name || "").trim()
    if (!name) throw new Error("supplier name is required")

    const contactRaw =
        input.contact !== undefined && input.contact !== null
            ? String(input.contact)
            : undefined
    const contact =
        contactRaw !== undefined && contactRaw.trim() !== ""
            ? contactRaw.trim()
            : contactRaw === ""
              ? ""
              : undefined

    const notesRaw =
        input.notes !== undefined && input.notes !== null
            ? String(input.notes).trim()
            : undefined

    return {
        id,
        name,
        contact,
        notes: notesRaw ? notesRaw : undefined,
    }
}
