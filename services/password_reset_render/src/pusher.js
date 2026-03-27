import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "mt1",
  useTLS: true,
});

/**
 * Publica un evento de confirmación o rechazo de venta al canal Pusher
 * @param userId - ID del usuario/cliente propietario de la venta
 * @param saleId - ID de la venta confirmada/rechazada
 * @param decision - "confirmed" o "rejected"
 * @param saleData - Datos de la venta para notificación inmediata
 */
export async function publishSaleVerificationEvent(
  userId: string,
  saleId: string,
  decision: "confirmed" | "rejected",
  saleData?: { amount: number; productCount: number }
) {
  try {
    const channelName = `sale-verification-${userId}`;
    const eventName = decision === "confirmed" ? "sale:confirmed" : "sale:rejected";

    await pusher.trigger(channelName, eventName, {
      saleId,
      decision,
      timestamp: new Date().toISOString(),
      ...(saleData && {
        amount: saleData.amount,
        productCount: saleData.productCount,
      }),
    });

    console.log(`[Pusher] Published ${eventName} for sale ${saleId} to user ${userId}`);
  } catch (error) {
    console.error(`[Pusher Error] Failed to publish event:`, error);
    throw error;
  }
}

