import { products } from "@/data/products";

const WISHLIST_KEY = "zayy_wishlist";
const OLD_WISHLIST_KEYS = ["wishlist", "zayy-wishlist"];

function cleanOldWishlistKeys() {
  if (typeof window === "undefined") return;

  OLD_WISHLIST_KEYS.forEach((key) => {
    if (key !== WISHLIST_KEY) {
      localStorage.removeItem(key);
    }
  });
}

export function getWishlist(): number[] {
  if (typeof window === "undefined") return [];

  cleanOldWishlistKeys();

  try {
    const wishlist = localStorage.getItem(WISHLIST_KEY);
    if (!wishlist) return [];

    const parsed = JSON.parse(wishlist);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => Number(item))
      .filter((id) => Number.isFinite(id));
  } catch {
    localStorage.removeItem(WISHLIST_KEY);
    return [];
  }
}

export function saveWishlist(wishlist: number[]) {
  if (typeof window === "undefined") return;

  const uniqueWishlist = Array.from(new Set(wishlist));

  localStorage.setItem(WISHLIST_KEY, JSON.stringify(uniqueWishlist));
  window.dispatchEvent(new Event("wishlistUpdated"));
}

export function toggleWishlist(id: number) {
  const wishlist = getWishlist();

  const updated = wishlist.includes(id)
    ? wishlist.filter((item) => item !== id)
    : [...wishlist, id];

  saveWishlist(updated);

  return products.filter((product) => updated.includes(product.id));
}

export function isWishlisted(id: number) {
  return getWishlist().includes(id);
}

export function getWishlistCount() {
  return getWishlist().length;
}

export function getWishlistItems() {
  const wishlist = getWishlist();
  return products.filter((product) => wishlist.includes(product.id));
}