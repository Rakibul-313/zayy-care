"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User as FirebaseUser } from "firebase/auth";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import { getCartCount } from "@/lib/cart";
import { getWishlistItems } from "@/lib/wishlist";

type NavbarProps = {
  cartCount?: number;
  wishlistCount?: number;
  homePremium?: boolean;
};

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Brands", href: "/brands" },
  { name: "Skin Quiz", href: "/skin-quiz" },
  { name: "Routine Builder", href: "/routine-builder" },
  { name: "Blog", href: "/blog" },
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar({ cartCount: initialCartCount }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const updateCounts = () => {
      setCartCount(
        typeof initialCartCount === "number"
          ? initialCartCount
          : getCartCount()
      );
      setWishlistCount(getWishlistItems().length);
    };

    updateCounts();

    window.addEventListener("cartUpdated", updateCounts);
    window.addEventListener("wishlistUpdated", updateCounts);
    window.addEventListener("storage", updateCounts);

    return () => {
      window.removeEventListener("cartUpdated", updateCounts);
      window.removeEventListener("wishlistUpdated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, [initialCartCount]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const keyword = searchText.trim();
    if (!keyword) return;

    setSearchOpen(false);
    setMenuOpen(false);
    router.push(`/shop?search=${encodeURIComponent(keyword)}`);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="fixed top-0 left-0 right-0 z-[99999] w-full">
      <nav className="flex h-[74px] w-full items-center justify-between bg-[linear-gradient(90deg,#062a18_0%,#0b3d2e_50%,#062a18_100%)] px-5 shadow-[0_12px_38px_rgba(5,35,20,0.28)] sm:px-8 lg:h-[88px] lg:px-20">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo.png"
            alt="ZAYY Care"
            width={180}
            height={95}
            priority
            className="h-auto w-[92px] object-contain brightness-0 invert sm:w-[115px] lg:w-[145px]"
          />
        </Link>

        <div className="hidden items-center gap-5 lg:flex xl:gap-7">
          {navLinks.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                prefetch
                className="relative flex items-center gap-1.5 py-7 text-[14px] font-medium text-white/90 hover:text-white"
              >
                {link.name}

                {link.name === "Shop" && (
                  <ChevronDown size={14} strokeWidth={2} className="mt-0.5" />
                )}

                <span
                  className={`absolute bottom-5 left-0 h-[1.5px] rounded-full bg-white ${
                    active ? "w-full opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 lg:h-11 lg:w-11"
          >
            <Search size={22} strokeWidth={1.8} />
          </button>

          <Link
            href={user ? "/profile" : "/login"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 lg:h-11 lg:w-11"
          >
            <User size={23} strokeWidth={1.8} />
          </Link>

          <Link
            href="/wishlist"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 sm:flex lg:h-11 lg:w-11"
          >
            <Heart size={24} strokeWidth={1.7} />

            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f5f1e8] text-[10px] font-black text-[#0b3d2e]">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 lg:h-11 lg:w-11"
          >
            <ShoppingBag size={24} strokeWidth={1.7} />

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f5f1e8] text-[10px] font-black text-[#0b3d2e]">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {searchOpen && (
        <form
          onSubmit={handleSearchSubmit}
          className="mx-auto mt-3 flex w-[calc(100%-24px)] max-w-[720px] items-center gap-3 rounded-[6px] border border-white/20 bg-[#0b3d2e]/95 p-3 shadow-[0_20px_60px_rgba(5,35,20,0.3)] backdrop-blur-2xl"
        >
          <Search className="text-white" size={20} />

          <input
            autoFocus
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search skincare products..."
            className="w-full bg-transparent px-2 py-2 font-medium text-white outline-none placeholder:text-white/60"
          />

          <button
            type="submit"
            className="rounded-[6px] bg-[#f5f1e8] px-5 py-2 font-bold text-[#0b3d2e]"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-white/10 text-white"
          >
            <X size={18} />
          </button>
        </form>
      )}

      {menuOpen && (
        <div className="mx-3 mt-3 rounded-[6px] border border-white/15 bg-[#0b3d2e]/98 p-3 shadow-[0_24px_70px_rgba(5,35,20,0.35)] backdrop-blur-2xl lg:hidden">
          {navLinks.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                prefetch
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between rounded-[6px] px-4 py-3 font-semibold ${
                  active
                    ? "bg-white text-[#0b3d2e]"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.name}
                {link.name === "Shop" && <ChevronDown size={15} />}
              </Link>
            );
          })}

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/15 pt-3">
            <Link
              href={user ? "/profile" : "/login"}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-[6px] bg-white/10 px-4 py-3 font-bold text-white"
            >
              <User size={18} />
              {user ? "Profile" : "Login"}
            </Link>

            <Link
              href="/wishlist"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-[6px] bg-white/10 px-4 py-3 font-bold text-white"
            >
              <Heart size={18} />
              Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
            </Link>

            <Link
              href="/cart"
              onClick={() => setMenuOpen(false)}
              className="col-span-2 flex items-center justify-center gap-2 rounded-[6px] bg-[#f5f1e8] px-4 py-3 font-black text-[#0b3d2e]"
            >
              <ShoppingBag size={18} />
              Cart {cartCount > 0 ? `(${cartCount})` : ""}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}