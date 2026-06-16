import { products } from "@/data/products";
import type { Product } from "@/data/products";

export type CartItem = {
  id: number;
  qty: number;
};

export type FirebaseCartProduct = {
  id: number;
  firebaseId?: string;
  name: string;
  image: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock?: number;
  quantity: number;
};

const CART_KEY = "zayy_cart";
const FIREBASE_PRODUCTS_KEY = "zayy_firebase_products";

function normalizeId(id: unknown) {
  const numericId = Number(id);
  return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
}

export function getFirebaseProducts(): FirebaseCartProduct[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(FIREBASE_PRODUCTS_KEY);
    const parsed = data ? JSON.parse(data) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        ...item,
        id: normalizeId(item.id),
      }))
      .filter((item) => item.id !== null) as FirebaseCartProduct[];
  } catch {
    return [];
  }
}

export function saveFirebaseProducts(newProducts: FirebaseCartProduct[]) {
  if (typeof window === "undefined") return;

  const oldProducts = getFirebaseProducts();
  const map = new Map<string, FirebaseCartProduct>();

  [...oldProducts, ...newProducts].forEach((product) => {
    const id = normalizeId(product.id);
    if (!id) return;

    const key = product.firebaseId || String(id);

    map.set(key, {
      ...product,
      id,
      quantity: Number(product.quantity || 0),
    });
  });

  localStorage.setItem(
    FIREBASE_PRODUCTS_KEY,
    JSON.stringify(Array.from(map.values()))
  );

  window.dispatchEvent(new Event("firebaseProductsUpdated"));
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(CART_KEY);
    const parsed = data ? JSON.parse(data) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        id: normalizeId(item.id),
        qty: Number(item.qty || 0),
      }))
      .filter((item) => item.id !== null && item.qty > 0) as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;

  const cleanCart = cart
    .map((item) => ({
      id: normalizeId(item.id),
      qty: Number(item.qty || 0),
    }))
    .filter((item) => item.id !== null && item.qty > 0);

  localStorage.setItem(CART_KEY, JSON.stringify(cleanCart));
  window.dispatchEvent(new Event("cartUpdated"));
}

export function addToCart(id: number) {
  const normalizedId = normalizeId(id);
  if (!normalizedId) return getCart();

  const cart = getCart();
  const existing = cart.find((item) => item.id === normalizedId);

  const product =
    getFirebaseProducts().find((item) => item.id === normalizedId) ||
    products.find((item) => item.id === normalizedId);

  const stock = Number(product?.stock || 0);

  if (stock <= 0) return cart;

  if (existing) {
    existing.qty = Math.min(existing.qty + 1, stock);
  } else {
    cart.push({ id: normalizedId, qty: 1 });
  }

  saveCart(cart);
  return cart;
}

export function getCartCount() {
  return getCart().reduce((total, item) => total + item.qty, 0);
}

export function getCartItems(): Array<
  (Product | FirebaseCartProduct) & { quantity: number }
> {
  const firebaseProducts = getFirebaseProducts();

  return getCart()
    .map((item) => {
      const firebaseProduct = firebaseProducts.find((p) => p.id === item.id);

      if (firebaseProduct) {
        return {
          ...firebaseProduct,
          quantity: item.qty,
        };
      }

      const staticProduct = products.find((p) => p.id === item.id);
      if (!staticProduct) return null;

      return {
        ...staticProduct,
        quantity: item.qty,
      };
    })
    .filter(
      (item): item is (Product | FirebaseCartProduct) & { quantity: number } =>
        item !== null
    );
}

export function updateCartQuantity(id: number, change: number) {
  const normalizedId = normalizeId(id);
  if (!normalizedId) return;

  const cart = getCart();
  const item = cart.find((item) => item.id === normalizedId);

  if (!item) return;

  const product =
    getFirebaseProducts().find((item) => item.id === normalizedId) ||
    products.find((item) => item.id === normalizedId);

  const stock = Number(product?.stock || 0);

  item.qty = Math.min(item.qty + change, stock);

  if (item.qty <= 0) {
    saveCart(cart.filter((item) => item.id !== normalizedId));
    return;
  }

  saveCart(cart);
}

export function removeFromCart(id: number) {
  const normalizedId = normalizeId(id);
  if (!normalizedId) return;

  saveCart(getCart().filter((item) => item.id !== normalizedId));
}

export function clearCart() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cartUpdated"));
}