import { describe, expect, it } from "vitest"
import { Client, Databases, ID, Query } from "appwrite"

const endpoint = process.env.APPWRITE_ENDPOINT
const projectId = process.env.APPWRITE_PROJECT_ID
const databaseId = process.env.APPWRITE_DATABASE_ID
const apiKey = process.env.APPWRITE_API_KEY

const enabled = Boolean(endpoint && projectId && databaseId && apiKey)

describe.skipIf(!enabled)("B3.1 Appwrite transaction integration", () => {
    const client = new Client()
        .setEndpoint(endpoint!)
        .setProject(projectId!)
        .setKey(apiKey!)
    const databases = new Databases(client)

    const productId = `core3-b31-product-${Date.now()}`
    const entryId = `core3-b31-entry-${Date.now()}`
    const lineId = `core3-b31-line-${Date.now()}`
    const movementId = `core3-b31-movement-${Date.now()}`

    it("cancels an entry atomically and persists the compensating movement", async () => {
        await databases.createDocument(databaseId!, "product", productId, {
            name: "Core3 B3.1 integration product",
            existence: 10,
            reserved: 2,
            last_unit_cost: 25,
        })
        await databases.createDocument(databaseId!, "purchase_entry", entryId, {
            entry_date: new Date().toISOString(),
            total_cost: 75,
            currency: "USD",
            user_id: "core3-integration",
            line_count: 1,
            status: "ACTIVE",
        })
        await databases.createDocument(databaseId!, "purchase_entry_line", lineId, {
            entry_id: entryId,
            product_id: productId,
            quantity: 3,
            unit_cost: 25,
            concept: "integration",
            line_cost: 75,
        })

        const tx = await databases.createTransaction()
        await databases.updateDocument(databaseId!, "product", productId, { existence: 7 }, tx.$id)
        await databases.createDocument(databaseId!, "stock_movements", movementId, {
            product_id: productId,
            type: "ajuste",
            quantity: 3,
            reason: "purchase_entry_reversal",
            entry_id: entryId,
        }, undefined, tx.$id)
        await databases.updateDocument(databaseId!, "purchase_entry", entryId, { status: "CANCELLED" }, tx.$id)
        await databases.updateTransaction(tx.$id, "commit")

        const product = await databases.getDocument(databaseId!, "product", productId)
        const entry = await databases.getDocument(databaseId!, "purchase_entry", entryId)
        const movement = await databases.getDocument(databaseId!, "stock_movements", movementId)

        expect(product.existence).toBe(7)
        expect(product.reserved).toBe(2)
        expect(product.last_unit_cost).toBe(25)
        expect(entry.status).toBe("CANCELLED")
        expect(movement.entry_id).toBe(entryId)
        expect(movement.reason).toBe("purchase_entry_reversal")
    })

    it("rolls back all staged writes when commit is intentionally aborted", async () => {
        const rollbackProductId = `core3-b31-rollback-product-${Date.now()}`
        const rollbackEntryId = `core3-b31-rollback-entry-${Date.now()}`
        await databases.createDocument(databaseId!, "product", rollbackProductId, {
            name: "Core3 B3.1 rollback product",
            existence: 10,
            reserved: 2,
            last_unit_cost: 30,
        })
        await databases.createDocument(databaseId!, "purchase_entry", rollbackEntryId, {
            entry_date: new Date().toISOString(),
            total_cost: 90,
            currency: "USD",
            user_id: "core3-integration",
            line_count: 1,
            status: "ACTIVE",
        })

        const tx = await databases.createTransaction()
        await databases.updateDocument(databaseId!, "product", rollbackProductId, { existence: 7 }, tx.$id)
        await databases.updateDocument(databaseId!, "purchase_entry", rollbackEntryId, { status: "CANCELLED" }, tx.$id)
        await databases.updateTransaction(tx.$id, "rollback")

        const product = await databases.getDocument(databaseId!, "product", rollbackProductId)
        const entry = await databases.getDocument(databaseId!, "purchase_entry", rollbackEntryId)
        const movements = await databases.listDocuments(databaseId!, "stock_movements", [
            Query.equal("entry_id", rollbackEntryId),
        ])

        expect(product.existence).toBe(10)
        expect(product.reserved).toBe(2)
        expect(product.last_unit_cost).toBe(30)
        expect(entry.status).toBe("ACTIVE")
        expect(movements.total).toBe(0)
    })
})
