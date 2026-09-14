import type { TransactionRunner } from "../../feature/purchase/domain/repository/transaction.repository";

/**
 * Boundary de transacción para Turso.
 * Por ahora ejecuta el work de forma secuencial (sin transactionId Appwrite).
 * Los repos Turso ignoran transactionId y escriben directo; atomicidad fina = fase siguiente.
 */
export class TursoTransactionRunner implements TransactionRunner {
    async run<T>(work: (transactionId: string) => Promise<T>): Promise<T> {
        return work("turso");
    }
}
