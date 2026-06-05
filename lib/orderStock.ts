import { get, ref, runTransaction, update } from "firebase/database";
import { database } from "@/firebase/config";

type OrderItem = {
  id?: string | number;
  productId?: string;
  firebaseId?: string;
  quantity?: number;
};

const STOCK_REDUCE_STATUSES = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

export async function updateOrderStatusWithStock(
  orderId: string,
  newStatus: string
) {
  const orderRef = ref(database, `orders/${orderId}`);
  const snap = await get(orderRef);

  if (!snap.exists()) {
    throw new Error("Order not found");
  }

  const order = snap.val();
  const items: OrderItem[] = order.items || [];

  const shouldReduce = STOCK_REDUCE_STATUSES.includes(newStatus);
  const alreadyReduced = order.stockUpdated === true;

  if (shouldReduce && !alreadyReduced) {
    for (const item of items) {
      const productKey = item.firebaseId || item.productId || item.id;
      const qty = Number(item.quantity || 1);

      if (!productKey) continue;

      await runTransaction(ref(database, `products/${productKey}/stock`), (stock) => {
        return Math.max(0, Number(stock || 0) - qty);
      });
    }

    await update(orderRef, {
      status: newStatus,
      stockUpdated: true,
      updatedAt: Date.now(),
    });

    return;
  }

  if (newStatus === "cancelled" && alreadyReduced) {
    for (const item of items) {
      const productKey = item.firebaseId || item.productId || item.id;
      const qty = Number(item.quantity || 1);

      if (!productKey) continue;

      await runTransaction(ref(database, `products/${productKey}/stock`), (stock) => {
        return Number(stock || 0) + qty;
      });
    }

    await update(orderRef, {
      status: newStatus,
      stockUpdated: false,
      updatedAt: Date.now(),
    });

    return;
  }

  await update(orderRef, {
    status: newStatus,
    updatedAt: Date.now(),
  });
}