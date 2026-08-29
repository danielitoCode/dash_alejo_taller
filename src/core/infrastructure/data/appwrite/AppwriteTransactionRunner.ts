import type { Databases } from "appwrite"
import type { TransactionRunner } from "../../../feature/purchase/domain/repository/transaction.repository"

/**
 * Transaction boundary backed by Appwrite Client SDK.
 * No serverless function is required: the authenticated backoffice session
 * performs all staged operations and Appwrite commits them atomically.
 */
export class AppwriteTransactionRunner implements TransactionRunner {
    constructor(
        private readonly databases: Databases,
        private readonly ttlSeconds = 60
    ) {}

    async run<T>(work: (transactionId: string) => Promise<T>): Promise<T> {
        const transaction = await this.databases.createTransaction({
            ttl: this.ttlSeconds,
        })
        const transactionId = transaction.$id
        let committed = false

        try {
            const result = await work(transactionId)
            await this.databases.updateTransaction({
                transactionId,
                commit: true,
            })
            committed = true
            return result
        } catch (error) {
            if (!committed) {
                try {
                    await this.databases.updateTransaction({
                        transactionId,
                        rollback: true,
                    })
                } catch (rollbackError) {
                    console.error(
                        `[AppwriteTransaction] rollback failed transactionId=${transactionId}`,
                        rollbackError
                    )
                }
            }
            throw error
        }
    }
}
