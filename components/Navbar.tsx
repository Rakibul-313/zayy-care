"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User as FirebaseUser } from "firebase/auth";
import {
  Bell,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  User,
  X,
} from "lucide-react";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, database } from "@/firebase/config";
import { getCartCount } from "@/lib/cart";
import { getWishlistItems } from "@/lib/wishlist";

type NavbarProps = {
  cartCount?: number;
  wishlistCount?: number;
  homePremium?: boolean;
};

type UserInfo = {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  membership?: string;
  membershipLevel?: string;
  tier?: string;
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

const shopLinks = [
  { name: "All Products", href: "/shop" },
  { name: "Flash Sale", href: "/flash-sale" },
];

const profileLinks = [
  { name: "My Profile", href: "/profile", icon: User },
  { name: "My Orders", href: "/profile/orders", icon: ShoppingBag },
  { name: "Wishlist", href: "/wishlist", icon: Heart },
  { name: "My Reviews", href: "/profile/reviews", icon: Star },
  { name: "Skincare Routine", href: "/profile/routine", icon: Sparkles },
  { name: "Notifications", href: "/profile/notifications", icon: Bell },
  { name: "Account Settings", href: "/profile/settings", icon: Settings },
];

export default function Navbar({
  cartCount: initialCartCount,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({});

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
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (!currentUser) {
        setUserInfo({});
        return;
      }

      unsubscribeProfile = onValue(
        ref(database, `users/${currentUser.uid}`),
        (snapshot) => {
          const data = snapshot.val() as UserInfo | null;
          setUserInfo(data || {});
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    setProfileOpen(false);
    setMenuOpen(false);
    setMobileShopOpen(false);
    setMobileProfileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const keyword = searchText.trim();

    if (!keyword) return;

    setSearchOpen(false);
    setMenuOpen(false);

    router.push(`/shop?search=${encodeURIComponent(keyword)}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setProfileOpen(false);
      setMenuOpen(false);
      setMobileProfileOpen(false);

      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/shop") {
      return pathname === "/shop";
    }

    if (href === "/profile") {
      return pathname === "/profile";
    }

    return pathname?.startsWith(href);
  };

  const isShopActive =
    pathname === "/shop" || pathname?.startsWith("/flash-sale");

  const isProfileActive =
    pathname?.startsWith("/profile") || pathname === "/wishlist";

  const fullName =
    userInfo.name ||
    `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim() ||
    user?.displayName ||
    "ZAYY User";

  const email = userInfo.email || user?.email || "";

  const membership =
    userInfo.membership ||
    userInfo.membershipLevel ||
    userInfo.tier ||
    "General Member";

  const avatarText = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "ZA";

  return (
    <header className="fixed left-0 right-0 top-0 z-[99999] w-full">
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
            if (link.name === "Shop") {
              return (
                <div key={link.name} className="group relative">
                  <Link
                    href="/shop"
                    prefetch
                    className="relative flex items-center gap-1.5 py-7 text-[14px] font-medium text-white/90 hover:text-white"
                  >
                    Shop

                    <ChevronDown
                      size={14}
                      strokeWidth={2}
                      className="mt-0.5 transition-transform duration-200 group-hover:rotate-180"
                    />

                    <span
                      className={`absolute bottom-5 left-0 h-[1.5px] rounded-full bg-white ${
                        isShopActive
                          ? "w-full opacity-100"
                          : "w-0 opacity-0"
                      }`}
                    />
                  </Link>

                  <div className="invisible absolute left-1/2 top-full z-[100000] min-w-[190px] -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="overflow-hidden rounded-[6px] border border-[#0b3d2e]/10 bg-white p-2 shadow-[0_18px_45px_rgba(5,35,20,0.22)]">
                      {shopLinks.map((shopLink) => {
                        const active = isActive(shopLink.href);

                        return (
                          <Link
                            key={shopLink.name}
                            href={shopLink.href}
                            prefetch
                            className={`block rounded-[6px] px-4 py-3 text-sm font-semibold transition ${
                              active
                                ? "bg-[#0b3d2e] text-white"
                                : "text-[#102015] hover:bg-[#f5f1e8] hover:text-[#0b3d2e]"
                            }`}
                          >
                            {shopLink.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            const active = isActive(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                prefetch
                className="relative flex items-center gap-1.5 py-7 text-[14px] font-medium text-white/90 hover:text-white"
              >
                {link.name}

                <span
                  className={`absolute bottom-5 left-0 h-[1.5px] rounded-full bg-white ${
                    active
                      ? "w-full opacity-100"
                      : "w-0 opacity-0"
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
            onClick={() => {
              setSearchOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 lg:h-11 lg:w-11"
          >
            <Search size={22} strokeWidth={1.8} />
          </button>

          <div
            ref={profileDropdownRef}
            className="relative hidden lg:block"
          >
            <button
              type="button"
              aria-label={user ? "Open profile menu" : "Login"}
              onClick={() => {
                if (!user) {
                  router.push("/login");
                  return;
                }

                setProfileOpen((prev) => !prev);
                setSearchOpen(false);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 lg:h-11 lg:w-11 ${
                isProfileActive ? "bg-white/10" : ""
              }`}
            >
              <User size={23} strokeWidth={1.8} />
            </button>

            {user && profileOpen && (
              <div className="absolute right-0 top-[calc(100%+14px)] z-[100001] hidden w-[310px] overflow-hidden rounded-[8px] border border-[#0b3d2e]/10 bg-white shadow-[0_24px_70px_rgba(5,35,20,0.28)] lg:block">
                <div className="border-b border-[#0b3d2e]/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b3d2e] text-sm font-black text-white">
                      {avatarText}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-[#102015]">
                        {fullName}
                      </p>

                      <p className="truncate text-xs text-[#4f5f49]">
                        {email}
                      </p>

                      <p className="mt-1 text-xs font-black text-[#0b3d2e]">
                        {membership}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  {profileLinks.map(({ name, href, icon: Icon }) => {
                    const active = isActive(href);

                    return (
                      <Link
                        key={name}
                        href={href}
                        onClick={() => setProfileOpen(false)}
                        className={`flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm font-bold transition ${
                          active
                            ? "bg-[#f5f1e8] text-[#0b3d2e]"
                            : "text-[#102015] hover:bg-[#fafaf7] hover:text-[#0b3d2e]"
                        }`}
                      >
                        <Icon size={17} strokeWidth={1.8} />
                        {name}
                      </Link>
                    );
                  })}
                </div>

                <div className="border-t border-[#0b3d2e]/10 p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm font-black text-red-500 transition hover:bg-red-50"
                  >
                    <LogOut size={17} strokeWidth={1.8} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

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
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setProfileOpen(false);

              if (menuOpen) {
                setMobileShopOpen(false);
                setMobileProfileOpen(false);
              }
            }}
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
        <div className="mx-3 mt-3 max-h-[calc(100vh-100px)] overflow-y-auto rounded-[6px] border border-white/15 bg-[#0b3d2e]/98 p-3 shadow-[0_24px_70px_rgba(5,35,20,0.35)] backdrop-blur-2xl lg:hidden">
          {navLinks.map((link) => {
            if (link.name === "Shop") {
              return (
                <div key={link.name}>
                  <button
                    type="button"
                    onClick={() => setMobileShopOpen((prev) => !prev)}
                    className={`flex w-full items-center justify-between rounded-[6px] px-4 py-3 font-semibold ${
                      isShopActive
                        ? "bg-white text-[#0b3d2e]"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Shop

                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${
                        mobileShopOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mobileShopOpen && (
                    <div className="mt-1 space-y-1 pl-4">
                      {shopLinks.map((shopLink) => {
                        const active = isActive(shopLink.href);

                        return (
                          <Link
                            key={shopLink.name}
                            href={shopLink.href}
                            prefetch
                            onClick={() => {
                              setMenuOpen(false);
                              setMobileShopOpen(false);
                            }}
                            className={`block rounded-[6px] px-4 py-3 text-sm font-semibold ${
                              active
                                ? "bg-[#f5f1e8] text-[#0b3d2e]"
                                : "text-white/85 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {shopLink.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActive(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                prefetch
                onClick={() => {
                  setMenuOpen(false);
                  setMobileShopOpen(false);
                  setMobileProfileOpen(false);
                }}
                className={`flex items-center justify-between rounded-[6px] px-4 py-3 font-semibold ${
                  active
                    ? "bg-white text-[#0b3d2e]"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="mt-3 border-t border-white/15 pt-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setMobileProfileOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-[6px] px-4 py-3 font-bold ${
                    isProfileActive
                      ? "bg-white text-[#0b3d2e]"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f1e8] text-xs font-black text-[#0b3d2e]">
                      {avatarText}
                    </span>

                    <span className="min-w-0 text-left">
                      <span className="block truncate text-sm">
                        {fullName}
                      </span>

                      <span
                        className={`block truncate text-[10px] font-medium ${
                          isProfileActive
                            ? "text-[#4f5f49]"
                            : "text-white/65"
                        }`}
                      >
                        {email}
                      </span>
                    </span>
                  </span>

                  <ChevronDown
                    size={16}
                    className={`shrink-0 transition-transform duration-200 ${
                      mobileProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobileProfileOpen && (
                  <div className="mt-2 space-y-1 pl-3">
                    <p className="px-4 py-2 text-xs font-black text-[#f5f1e8]">
                      {membership}
                    </p>

                    {profileLinks.map(({ name, href, icon: Icon }) => {
                      const active = isActive(href);

                      return (
                        <Link
                          key={name}
                          href={href}
                          onClick={() => {
                            setMenuOpen(false);
                            setMobileProfileOpen(false);
                          }}
                          className={`flex items-center gap-3 rounded-[6px] px-4 py-3 text-sm font-bold ${
                            active
                              ? "bg-[#f5f1e8] text-[#0b3d2e]"
                              : "text-white/85 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon size={16} />
                          {name}
                        </Link>
                      );
                    })}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-[6px] px-4 py-3 text-sm font-black text-red-300 hover:bg-white/10"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-[6px] bg-white/10 px-4 py-3 font-bold text-white"
              >
                <User size={18} />
                Login
              </Link>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/15 pt-3">
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
              className="flex items-center justify-center gap-2 rounded-[6px] bg-[#f5f1e8] px-4 py-3 font-black text-[#0b3d2e]"
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