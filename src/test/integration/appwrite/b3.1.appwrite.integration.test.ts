import { afterAll, describe, expect, it } from "vitest"

const endpoint = process.env.APPWRITE_ENDPOINT?.replace(/\/$/, "")
const projectId = process.env.APPWRITE_PROJECT_ID
const databaseId = process.env.APPWRITE_DATABASE_ID
const apiKey = process.env.APPWRITE_API_KEY

const enabled = Boolean(endpoint && projectId && databaseId && apiKey)

type AppwriteDocument = Record<string, unknown> & { $id: string }
type AppwriteTransaction = { $id: string }

async function appwriteRequest<T>(
    path: string,
    init: RequestInit = {},
    transactionId?: string,
): Promise<T> {
    const url = new URL(`${endpoint}${path}`)
    if (transactionId) url.searchParams.set("transactionId", transactionId)

    const response = await fetch(url, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            "X-Appwrite-Project": projectId!,
            "X-Appwrite-Key": apiKey!,
            ...(init.headers ?? {}),
        },
    })

    if (!response.ok) {
        const body = await response.text()
        throw new Error(`Appwrite ${response.status} ${response.statusText}: ${body}`)
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
}

async function createDocument(
    collectionId: string,
    documentId: string,
    data: Record<string, unknown>,
    transactionId?: string,
) {
    return appwriteRequest<AppwriteDocument>(
        `/databases/${databaseId}/collections/${collectionId}/documents`,
        {
            method: "POST",
            body: JSON.stringify({ documentId, data }),
        },
        transactionId,
    )
}

async function updateDocument(
    collectionId: string,
    documentId: string,
    data: Record<string, unknown>,
    transactionId?: string,
) {
    return appwriteRequest<AppwriteDocument>(
        `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
        {
            method: "PATCH",
            body: JSON.stringify({ data }),
        },
        transactionId,
    )
}

async function getDocument(collectionId: string, documentId: string) {
    return appwriteRequest<AppwriteDocument>(
        `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
    )
}

async function deleteDocument(collectionId: string, documentId: string) {
    return appwriteRequest<void>(
        `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
        { method: "DELETE" },
    )
}

async function createTransaction() {
    return appwriteRequest<AppwriteTransaction>("/databases/transactions", {
        method: "POST",
        body: JSON.stringify({ ttl: 60 }),
    })
}

async function finishTransaction(transactionId: string, action: "commit" | "rollback") {
    return appwriteRequest<AppwriteTransaction>(`/databases/transactions/${transactionId}`, {
        method: "PATCH",
        body: JSON.stringify(action === "commit" ? { commit: true } : { rollback: true }),
    })
}

describe.skipIf(!enabled)("B3.1 Appwrite transaction integration", () => {
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const productId = `core3-b31-product-${runId}`
    const entryId = `core3-b31-entry-${runId}`
    const lineId = `core3-b31-line-${runId}`
    const movementId = `core3-b31-movement-${runId}`
    const rollbackProductId = `core3-b31-rollback-product-${runId}`
    const rollbackEntryId = `core3-b31-rollback-entry-${runId}`

    afterAll(async () => {
        // Cleanup is deliberately outside the tested transactions.
        await Promise.allSettled([
            deleteDocument("stock_movements", movementId),
            deleteDocument("purchase_entry_line", lineId),
            deleteDocument("purchase_entry", entryId),
            deleteDocument("product", productId),
            deleteDocument("purchase_entry", rollbackEntryId),
            deleteDocument("product", rollbackProductId),
        ])
    })

    it("cancels an entry atomically and persists the compensating movement", async () => {
        await createDocument("product", productId, {
            name: "Core3 B3.1 integration product",
            existence: 10,
            reserved: 2,
            last_unit_cost: 25,
        })
        await createDocument("purchase_entry", entryId, {
            entry_date: new Date().toISOString(),
            total_cost: 75,
            currency: "USD",
            user_id: "core3-integration",
            line_count: 1,
            status: "ACTIVE",
        })
        await createDocument("purchase_entry_line", lineId, {
            entry_id: entryId,
            product_id: productId,
            quantity: 3,
            unit_cost: 25,
            concept: "integration",
            line_cost: 75,
        })

        const tx = await createTransaction()
        await updateDocument("product", productId, { existence: 7 }, tx.$id)
        await createDocument(
            "stock_movements",
            movementId,
            {
                product_id: productId,
                type: "ajuste",
                quantity: 3,
                reason: "purchase_entry_reversal",
                entry_id: entryId,
            },
            tx.$id,
        )
        await updateDocument("purchase_entry", entryId, { status: "CANCELLED" }, tx.$id)
        await finishTransaction(tx.$id, "commit")

        const product = await getDocument("product", productId)
        const entry = await getDocument("purchase_entry", entryId)
        const movement = await getDocument("stock_movements", movementId)

        expect(product.existence).toBe(7)
        expect(product.reserved).toBe(2)
        expect(product.last_unit_cost).toBe(25)
        expect(entry.status).toBe("CANCELLED")
        expect(movement.entry_id).toBe(entryId)
        expect(movement.reason).toBe("purchase_entry_reversal")
    })

    it("rolls back all staged writes when the transaction is explicitly rolled back", async () => {
        await createDocument("product", rollbackProductId, {
            name: "Core3 B3.1 rollback product",
            existence: 10,
            reserved: 2,
            last_unit_cost: 30,
        })
        await createDocument("purchase_entry", rollbackEntryId, {
            entry_date: new Date().toISOString(),
            total_cost: 90,
            currency: "USD",
            user_id: "core3-integration",
            line_count: 1,
            status: "ACTIVE",
        })

        const tx = await createTransaction()
        await updateDocument("product", rollbackProductId, { existence: 7 }, tx.$id)
        await updateDocument("purchase_entry", rollbackEntryId, { status: "CANCELLED" }, tx.$id)
        await finishTransaction(tx.$id, "rollback")

        const product = await getDocument("product", rollbackProductId)
        const entry = await getDocument("purchase_entry", rollbackEntryId)

        expect(product.existence).toBe(10)
        expect(product.reserved).toBe(2)
        expect(product.last_unit_cost).toBe(30)
        expect(entry.status).toBe("ACTIVE")
    })
})
