"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import type { User as FirebaseUser } from "firebase/auth";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  Moon,
  Sun,
} from "lucide-react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import { getCartCount } from "@/lib/cart";
import { getWishlistItems } from "@/lib/wishlist";
import TopBar from "@/components/TopBar";

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
  { name: "Contact", href: "/contact" },
];

export default function Navbar({
  cartCount: initialCartCount,
  homePremium = false,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const navbarTextStyle = {
    color: isDark ? "#ffffff" : "rgba(20, 35, 20, 0.78)",
  };

  const desktopIconClass =
    "hidden items-center justify-center rounded-full transition hover:-translate-y-0.5 hover:bg-white/35 sm:flex";

  const alwaysIconClass =
    "flex shrink-0 items-center justify-center rounded-full transition hover:-translate-y-0.5 hover:bg-white/35";

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 80) {
        setShowNavbar(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setShowNavbar(false);
        setMenuOpen(false);
        setSearchOpen(false);
      } else {
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
    <header
      className={`fixed left-0 right-0 top-0 z-50 w-full max-w-full px-3 pt-2 transition-all duration-500 sm:px-8 lg:px-14 ${
        homePremium ? "lg:pt-3" : ""
      } ${
        showNavbar
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto w-full max-w-[1820px]">
        <TopBar />

        <nav
          className={`glass glass-premium mt-2 flex w-full max-w-full items-center justify-between gap-2 border-white/75 px-4 sm:gap-3 sm:px-7 lg:mt-3 lg:px-12 ${
            homePremium
              ? "h-[78px] rounded-[34px] shadow-[0_35px_120px_rgba(31,43,20,0.22)] backdrop-blur-[60px] sm:h-[88px] lg:h-[96px] lg:rounded-[40px]"
              : "h-[72px] rounded-[30px] shadow-[0_18px_65px_rgba(31,43,20,0.15)] sm:h-[82px] lg:h-[90px] lg:rounded-[36px]"
          }`}
        >
          <Link href="/" className="flex h-full min-w-0 shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="ZAYY Care"
              width={190}
              height={95}
              priority
              className={`h-auto object-contain transition-all duration-300 ${
                homePremium
                  ? "w-[78px] sm:w-[130px] lg:w-[170px]"
                  : "w-[72px] sm:w-[120px] lg:w-[155px]"
              }`}
            />
          </Link>

          <div
            className={`hidden items-center lg:flex ${
              homePremium ? "gap-7 xl:gap-10" : "gap-6 xl:gap-9"
            }`}
          >
            {navLinks.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch
                  style={navbarTextStyle}
                  className={`relative flex items-center gap-1.5 py-3 font-semibold transition ${
                    homePremium ? "text-[15px]" : "text-[14px]"
                  }`}
                >
                  {link.name}
                  {link.name === "Shop" && <ChevronDown size={14} />}

                  <span
                    className={`absolute -bottom-0.5 left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-[#556B2F] transition-all ${
                      active ? "w-8 opacity-100" : "w-0 opacity-0"
                    }`}
                  />

                  {active && (
                    <span className="absolute -bottom-[3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#556B2F]" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen((prev) => !prev)}
              style={navbarTextStyle}
              className={`${alwaysIconClass} ${
                homePremium
                  ? "h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                  : "h-10 w-10 lg:h-11 lg:w-11"
              }`}
            >
              <Search size={homePremium ? 24 : 22} strokeWidth={1.9} />
            </button>

            <button
              type="button"
              aria-label="Toggle dark mode"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={navbarTextStyle}
              className={`${desktopIconClass} ${
                homePremium
                  ? "h-11 w-11 lg:h-12 lg:w-12"
                  : "h-10 w-10 lg:h-11 lg:w-11"
              }`}
            >
              {isDark ? (
                <Sun size={homePremium ? 24 : 22} strokeWidth={1.9} />
              ) : (
                <Moon size={homePremium ? 24 : 22} strokeWidth={1.9} />
              )}
            </button>

            <Link
              href={user ? "/profile" : "/login"}
              aria-label={user ? "Profile" : "Login"}
              style={navbarTextStyle}
              className={`${alwaysIconClass} ${
                homePremium
                  ? "h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
                  : "h-10 w-10 lg:h-11 lg:w-11"
              }`}
            >
              <User size={homePremium ? 24 : 22} strokeWidth={1.9} />
            </Link>

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              style={navbarTextStyle}
              className={`relative ${desktopIconClass} ${
                homePremium
                  ? "h-11 w-11 lg:h-12 lg:w-12"
                  : "h-10 w-10 lg:h-11 lg:w-11"
              }`}
            >
              <Heart size={homePremium ? 26 : 24} strokeWidth={1.8} />

              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#31571f] text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              aria-label="Cart"
              style={navbarTextStyle}
              className={`relative ${desktopIconClass} ${
                homePremium
                  ? "h-11 w-11 lg:h-12 lg:w-12"
                  : "h-10 w-10 lg:h-11 lg:w-11"
              }`}
            >
              <ShoppingBag size={homePremium ? 26 : 24} strokeWidth={1.8} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#31571f] text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              style={navbarTextStyle}
              className="glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {searchOpen && (
          <form
            onSubmit={handleSearchSubmit}
            className="glass glass-premium mt-3 flex items-center gap-3 rounded-[24px] p-3"
          >
            <Search className="text-[#31571f]" size={20} />

            <input
              autoFocus
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search skincare products..."
              className="w-full bg-transparent px-2 py-2 font-medium text-[#142012] outline-none placeholder:text-[#62705c]"
            />

            <button
              type="submit"
              className="rounded-full bg-[#31571f] px-5 py-2 font-bold text-white"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/35 text-[#31571f]"
            >
              <X size={18} />
            </button>
          </form>
        )}

        {menuOpen && (
          <div className="glass glass-premium mt-3 flex flex-col gap-1 rounded-[28px] p-3 lg:hidden">
            {navLinks.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch
                  onClick={() => setMenuOpen(false)}
                  style={active ? undefined : navbarTextStyle}
                  className={`rounded-2xl px-4 py-3 font-semibold ${
                    active ? "bg-[#31571f] text-white" : ""
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/40 pt-3">
              <Link
                href={user ? "/profile" : "/login"}
                onClick={() => setMenuOpen(false)}
                className="glass-soft flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-[#31571f]"
              >
                <User size={18} />
                {user ? "Profile" : "Login"}
              </Link>

              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="glass-soft flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-[#31571f]"
              >
                <Heart size={18} />
                Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
              </Link>

              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="glass-soft col-span-2 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-[#31571f]"
              >
                <ShoppingBag size={18} />
                Cart {cartCount > 0 ? `(${cartCount})` : ""}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}