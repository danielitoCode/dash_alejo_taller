import { afterAll, describe, expect, it } from "vitest"

/**
 * Live Appwrite B3.1 — must run in vitest project `appwrite` (node, no MSW).
 * CI: npx vitest run --project appwrite
 */

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
            ...(transactionId ? { "X-Appwrite-Transaction-Id": transactionId } : {}),
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
            body: JSON.stringify({
                documentId,
                data,
                ...(transactionId ? { transactionId } : {}),
            }),
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
            body: JSON.stringify({
                data,
                ...(transactionId ? { transactionId } : {}),
            }),
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

async function firstCategoryId(): Promise<string> {
    try {
        const res = await appwriteRequest<{ documents: AppwriteDocument[] }>(
            `/databases/${databaseId}/collections/category/documents?queries[]=${encodeURIComponent("limit(1)")}`,
        )
        const id = res.documents?.[0]?.$id
        if (typeof id === "string" && id) return id
    } catch {
        // category collection may be empty or named differently
    }
    return "b31_uncat"
}

/** Appwrite documentId: max 36 chars, [a-zA-Z0-9._-], no leading special char. */
function fixtureId(prefix: string): string {
    const id = `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    if (id.length > 36 || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(id)) {
        throw new Error(`Invalid Appwrite documentId "${id}" (len=${id.length})`)
    }
    return id
}

describe.skipIf(!enabled)("B3.1 Appwrite transaction integration", () => {
    const productId = fixtureId("b31p_")
    const entryId = fixtureId("b31e_")
    const lineId = fixtureId("b31l_")
    const movementId = fixtureId("b31m_")
    const rollbackProductId = fixtureId("b31rp_")
    const rollbackEntryId = fixtureId("b31re_")

    afterAll(async () => {
        await Promise.allSettled([
            deleteDocument("stock_movements", movementId),
            deleteDocument("purchase_entry_line", lineId),
            deleteDocument("purchase_entry", entryId),
            deleteDocument("product", productId),
            deleteDocument("purchase_entry", rollbackEntryId),
            deleteDocument("product", rollbackProductId),
        ])
    })

    async function seedProduct(id: string, name: string, lastUnitCost: number) {
        const categoryId = await firstCategoryId()
        return createDocument("product", id, {
            name,
            description: "Core3 B3.1 integration fixture",
            existence: 10,
            reserved: 2,
            price: 100,
            photo_url: "",
            category_id: categoryId,
            status: "active",
            last_unit_cost: lastUnitCost,
        })
    }

    it("cancels an entry atomically and persists the compensating movement", async () => {
        await seedProduct(productId, "Core3 B3.1 integration product", 25)
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
            concept: "other",
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
                balance_after: 7,
                reason: "purchase_entry_reversal",
                user_id: "core3-integration",
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
        await seedProduct(rollbackProductId, "Core3 B3.1 rollback product", 30)
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

        const beforeRollback = await getDocument("product", rollbackProductId)
        expect(beforeRollback.existence).toBe(10)

        await finishTransaction(tx.$id, "rollback")

        const product = await getDocument("product", rollbackProductId)
        const entry = await getDocument("purchase_entry", rollbackEntryId)

        expect(product.existence).toBe(10)
        expect(product.reserved).toBe(2)
        expect(product.last_unit_cost).toBe(30)
        expect(entry.status).toBe("ACTIVE")
    })
})
