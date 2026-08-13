/**
 * IDs de collections Appwrite usadas por el dash.
 * Core 1 + Core 2 — deben coincidir con la consola.
 */
export const APPWRITE_COLLECTIONS = {
    product: "product",
    sale: "sale",
    category: "category",
    // Core 2
    supplier: "supplier",
    purchaseEntry: "purchase_entry",
    purchaseEntryLine: "purchase_entry_line",
    stockMovement: "stock_movement",
    saleFinanceEvent: "sale_finance_event",
} as const

export type AppwriteCollectionId =
    (typeof APPWRITE_COLLECTIONS)[keyof typeof APPWRITE_COLLECTIONS]
