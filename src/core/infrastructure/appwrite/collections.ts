/**
 * IDs de collections Appwrite (Core 1 + Core 2).
 * Si el ID real en consola difiere, ajústalo aquí (unica fuente).
 */
export const APPWRITE_COLLECTIONS = {
    product: "product",
    sale: "sale",
    category: "category",
    promotions: "promotions",
    supportThreads: "support_threads",
    supportMessages: "support_messages",
    /** Core 2 — plural segun coleccion real en consola */
    stockMovements: "stock_movements",
    supplier: "supplier",
    purchaseEntry: "purchase_entry",
    purchaseEntryLine: "purchase_entry_line",
    saleFinanceEvent: "sale_finance_event",
    /** Core 2 B5 — reservas de taller */
    workshopReservation: "workshop_reservation",
} as const

export type AppwriteCollectionId =
    (typeof APPWRITE_COLLECTIONS)[keyof typeof APPWRITE_COLLECTIONS]
