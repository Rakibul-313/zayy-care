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

export function saveFirebaseProducts(products: FirebaseCartProduct[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FIREBASE_PRODUCTS_KEY, JSON.stringify(products));
}

export function getFirebaseProducts(): FirebaseCartProduct[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(FIREBASE_PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

export function addToCart(id: number) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === id);

  if (existing) existing.qty += 1;
  else cart.push({ id, qty: 1 });

  saveCart(cart);
  return cart;
}

export function getCartCount() {
  return getCart().reduce((total, item) => total + item.qty, 0);
}

export function getCartItems(): Array<(Product | FirebaseCartProduct) & { quantity: number }> {
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
  const cart = getCart();
  const item = cart.find((item) => item.id === id);

  if (!item) return;

  item.qty += change;

  if (item.qty <= 0) {
    saveCart(cart.filter((item) => item.id !== id));
    return;
  }

  saveCart(cart);
}

export function removeFromCart(id: number) {
  saveCart(getCart().filter((item) => item.id !== id));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cartUpdated"));
}