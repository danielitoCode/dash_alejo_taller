import { updateSaleStatus } from "./appwrite.js";
import { publishSaleVerificationEvent } from "./pusher.js";

/**
 * Verifica una venta: confirma o rechaza
 * @param {string} saleId - ID de la venta a verificar
 * @param {string} decision - "confirmed" o "rejected"
 * @param {string} userId - ID del usuario propietario de la venta
 * @param {Object} saleData - Datos básicos de la venta { amount, products: [{productId, qty, price}] }
 */
export async function verifySale(saleId, decision, userId, saleData) {
  if (!saleId || !decision || !userId) {
    throw new Error("Missing required fields: saleId, decision, userId");
  }

  if (!["confirmed", "rejected"].includes(decision)) {
    throw new Error('decision must be "confirmed" or "rejected"');
  }

  // 1. Actualizar estado en AppWrite
  const newState = decision === "confirmed" ? "VERIFIED" : "DELETED";
  const updated = await updateSaleStatus(saleId, newState);

  // 2. Publicar evento en Pusher
  await publishSaleVerificationEvent(userId, saleId, decision, {
    amount: saleData?.amount || 0,
    productCount: saleData?.products?.length || 0,
  });

  return updated;
}

