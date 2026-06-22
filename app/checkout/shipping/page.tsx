"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { auth, database } from "@/firebase/config";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getCartItems,
  getCartCount,
  saveFirebaseProducts,
} from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";

type CartProduct = ReturnType<typeof getCartItems>[number];

type ShippingSettings = {
  enabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingMinAmount: number;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
  noLimitMode: boolean;
};

const defaultShippingSettings: ShippingSettings = {
  enabled: true,
  freeShippingEnabled: true,
  freeShippingMinAmount: 1500,
  insideDhakaCharge: 80,
  outsideDhakaCharge: 120,
  noLimitMode: false,
};

const districtThanas: Record<string, string[]> = {
  Dhaka: ["Dhanmondi", "Mirpur", "Uttara", "Gulshan", "Badda", "Mohammadpur", "Tejgaon", "Paltan", "Savar", "Keraniganj", "Dohar", "Nawabganj"],
  Faridpur: ["Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"],
  Gazipur: ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"],
  Gopalganj: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
  Kishoreganj: ["Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"],
  Madaripur: ["Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar", "Dasar"],
  Manikganj: ["Manikganj Sadar", "Daulatpur", "Ghior", "Harirampur", "Saturia", "Shivalaya", "Singair"],
  Munshiganj: ["Munshiganj Sadar", "Gazaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari"],
  Narayanganj: ["Narayanganj Sadar", "Araihazar", "Bandar", "Rupganj", "Sonargaon"],
  Narsingdi: ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
  Rajbari: ["Rajbari Sadar", "Baliakandi", "Goalanda", "Pangsha", "Kalukhali"],
  Shariatpur: ["Shariatpur Sadar", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zajira"],
  Tangail: ["Tangail Sadar", "Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur"],

  Chattogram: ["Kotwali", "Panchlaish", "Double Mooring", "Halishahar", "Pahartali", "Patenga", "Chandgaon", "Hathazari", "Sitakunda", "Raozan", "Rangunia", "Fatikchhari", "Mirsharai", "Sandwip", "Satkania", "Lohagara"],
  CoxsBazar: ["Cox's Bazar Sadar", "Chakaria", "Kutubdia", "Maheshkhali", "Ramu", "Teknaf", "Ukhiya", "Pekua", "Eidgaon"],
  Bandarban: ["Bandarban Sadar", "Thanchi", "Lama", "Naikhongchhari", "Ali Kadam", "Rowangchhari", "Ruma"],
  Rangamati: ["Rangamati Sadar", "Baghaichhari", "Barkal", "Kawkhali", "Belaichhari", "Kaptai", "Juraichhari", "Langadu", "Naniarchar", "Rajasthali"],
  Khagrachhari: ["Khagrachhari Sadar", "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh", "Guimara"],
  Cumilla: ["Cumilla Sadar", "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Monohorgonj", "Meghna", "Muradnagar", "Nangalkot", "Titas"],
  Brahmanbaria: ["Brahmanbaria Sadar", "Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"],
  Chandpur: ["Chandpur Sadar", "Faridganj", "Haimchar", "Hajiganj", "Kachua", "Matlab North", "Matlab South", "Shahrasti"],
  Feni: ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Fulgazi", "Parshuram", "Sonagazi"],
  Lakshmipur: ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar"],
  Noakhali: ["Noakhali Sadar", "Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirhat", "Senbagh", "Sonaimuri", "Subarnachar"],

  Sylhet: ["Sylhet Sadar", "Beanibazar", "Bishwanath", "Companiganj", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmani Nagar", "Zakiganj"],
  Moulvibazar: ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal"],
  Habiganj: ["Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Shayestaganj"],
  Sunamganj: ["Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Derai", "Dharamapasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sulla", "Tahirpur", "Shantiganj"],

  Rajshahi: ["Rajshahi Sadar", "Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore"],
  Bogura: ["Bogura Sadar", "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatala"],
  Joypurhat: ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"],
  Naogaon: ["Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mahadebpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"],
  Natore: ["Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Singra", "Naldanga"],
  Chapainawabganj: ["Chapainawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj"],
  Pabna: ["Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Santhia", "Sujanagar"],
  Sirajganj: ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullahpara"],

  Khulna: ["Khulna Sadar", "Batiaghata", "Dacope", "Dighalia", "Dumuria", "Koyra", "Paikgachha", "Phultala", "Rupsa", "Terokhada"],
  Bagerhat: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"],
  Chuadanga: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"],
  Jashore: ["Jashore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"],
  Jhenaidah: ["Jhenaidah Sadar", "Harinakunda", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"],
  Kushtia: ["Kushtia Sadar", "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Mirpur"],
  Magura: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
  Meherpur: ["Meherpur Sadar", "Gangni", "Mujibnagar"],
  Narail: ["Narail Sadar", "Kalia", "Lohagara"],
  Satkhira: ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala"],

  Barishal: ["Barishal Sadar", "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"],
  Barguna: ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"],
  Bhola: ["Bhola Sadar", "Borhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
  Jhalokati: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
  Patuakhali: ["Patuakhali Sadar", "Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali"],
  Pirojpur: ["Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Indurkani"],

  Rangpur: ["Rangpur Sadar", "Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"],
  Dinajpur: ["Dinajpur Sadar", "Birampur", "Birganj", "Birol", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"],
  Gaibandha: ["Gaibandha Sadar", "Fulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"],
  Kurigram: ["Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari", "Phulbari", "Nageshwari", "Rajarhat", "Raomari", "Ulipur"],
  Lalmonirhat: ["Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj", "Patgram"],
  Nilphamari: ["Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur"],
  Panchagarh: ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"],
  Thakurgaon: ["Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranisankail"],

  Mymensingh: ["Mymensingh Sadar", "Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail", "Phulpur", "Trishal", "Tara Khanda"],
  Jamalpur: ["Jamalpur Sadar", "Bakshiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari"],
  Netrokona: ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Khaliajuri", "Madan", "Mohanganj", "Purbadhala"],
  Sherpur: ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"],
};

const districts = Object.keys(districtThanas).sort();

function safeImage(src?: string) {
  if (!src || src.trim() === "") return "/products/p1.png";
  const image = src.trim();
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return image;
  return `/${image}`;
}

function formatPrice(price?: number) {
  return `৳${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(Number(price || 0))}`;
}

export default function CheckoutShippingPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(
    defaultShippingSettings
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const loadCart = () => {
    setCartItems(getCartItems());
    setCartCount(getCartCount());
    setWishlistCount(getWishlistCount());
  };

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email || "");

      onValue(
        ref(database, `users/${user.uid}`),
        (snapshot) => {
          const data = snapshot.val();
          if (!data) return;

          setFullName(data.name || user.displayName || "");
          setPhone(data.phone || "");
          setCity(data.city || "");
          setArea(data.area || "");
          setAddress(data.address || "");
        },
        { onlyOnce: true }
      );
    });

    const productsUnsubscribe = onValue(ref(database, "products"), (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const firebaseProducts = Object.entries(data)
          .map(([firebaseId, value], index) => {
            const product = value as any;

            return {
              firebaseId,
              id: Number(product.id || index + 1),
              name: product.name || "Unnamed Product",
              slug: product.slug || "",
              image: safeImage(product.image),
              category: product.category || "Korean Skincare",
              price: Number(product.price || 0),
              oldPrice: Number(product.oldPrice || product.price || 0),
              stock: Number(product.stock || 0),
              quantity: 0,
              codAvailable: product.codAvailable !== false,
              deleted: product.deleted,
              active: product.active,
            };
          })
          .filter(
            (product) => product.deleted !== true && product.active !== false
          );

        saveFirebaseProducts(firebaseProducts);
      }

      loadCart();
    });

    const shippingUnsubscribe = onValue(ref(database, "settings/shipping"), (snapshot) => {
      const data = snapshot.val();

      if (data) {
        setShippingSettings({
          enabled:
            typeof data.enabled === "boolean"
              ? data.enabled
              : defaultShippingSettings.enabled,
          freeShippingEnabled:
            typeof data.freeShippingEnabled === "boolean"
              ? data.freeShippingEnabled
              : defaultShippingSettings.freeShippingEnabled,
          freeShippingMinAmount:
            Number(data.freeShippingMinAmount) ||
            defaultShippingSettings.freeShippingMinAmount,
          insideDhakaCharge:
            Number(data.insideDhakaCharge) ||
            defaultShippingSettings.insideDhakaCharge,
          outsideDhakaCharge:
            Number(data.outsideDhakaCharge) ||
            defaultShippingSettings.outsideDhakaCharge,
          noLimitMode:
            typeof data.noLimitMode === "boolean"
              ? data.noLimitMode
              : defaultShippingSettings.noLimitMode,
        });
      }
    });

    window.addEventListener("cartUpdated", loadCart);
    window.addEventListener("storage", loadCart);

    return () => {
      authUnsubscribe();
      productsUnsubscribe();
      shippingUnsubscribe();
      window.removeEventListener("cartUpdated", loadCart);
      window.removeEventListener("storage", loadCart);
    };
  }, [router]);

  useEffect(() => {
    if (city && !districtThanas[city]?.includes(area)) {
      setArea("");
    }
  }, [city, area]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const isInsideDhaka = city === "Dhaka";

  const normalShippingCharge = isInsideDhaka
    ? shippingSettings.insideDhakaCharge
    : shippingSettings.outsideDhakaCharge;

  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;
    if (!shippingSettings.enabled) return 0;

    if (
      shippingSettings.freeShippingEnabled &&
      !shippingSettings.noLimitMode &&
      subtotal >= shippingSettings.freeShippingMinAmount
    ) {
      return 0;
    }

    return normalShippingCharge;
  }, [subtotal, shippingSettings, normalShippingCharge]);

  const total = subtotal + shipping;

  const deliveryText = !city
    ? "Select district to calculate delivery charge."
    : !shippingSettings.enabled
    ? "Shipping is free for all orders."
    : shipping === 0
    ? "Free Delivery"
    : `${isInsideDhaka ? "Dhaka" : "Outside Dhaka"} delivery charge ${formatPrice(shipping)}`;

  const handleDistrictChange = (value: string) => {
    setCity(value);
    setArea("");
  };

  const handleContinue = () => {
    setError("");

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !city.trim() ||
      !area.trim() ||
      !address.trim()
    ) {
      setError("Please fill in all required shipping information.");
      return;
    }

    localStorage.setItem(
      "zayy_shipping_area",
      isInsideDhaka ? "insideDhaka" : "outsideDhaka"
    );

    localStorage.setItem(
  "zayyCheckoutShipping",
  JSON.stringify({
    fullName: fullName || "",
    phone: phone || "",
    email: email || "",
    city: city || "",
    area: area || "",
    address: address || "",
    note: note || "",
    shippingArea: isInsideDhaka ? "insideDhaka" : "outsideDhaka",
    shippingMethod: "standard",
    shipping: Number(shipping || 0),
  })
);

    router.push("/checkout/payment");
  };

  return (
    <>
      <Navbar cartCount={cartCount} wishlistCount={wishlistCount} />

      <motion.main
        initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 70, damping: 20, mass: 0.9 }}
        className="min-h-screen bg-[#fafaf7]"
      >
        <section className="pt-[105px] lg:pt-[115px]">
          <div className="relative overflow-hidden bg-[#f5f1e8]">
            <div className="absolute inset-0 opacity-45 md:opacity-100">
              <Image
                src="/banners/shop-hero-desktop.png"
                alt="Checkout shipping"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f1e8] via-[#f5f1e8]/85 to-[#f5f1e8]/20" />

            <div className="mx-auto max-w-[1820px] px-4 py-10 sm:px-8 md:py-14 lg:px-14 lg:py-16">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2 text-sm text-[#263421]">
                  <Link href="/">Home</Link>
                  <span>›</span>
                  <span>Checkout</span>
                </div>

                <h1 className="dream-font text-[44px] leading-none text-[#0b3d2e] sm:text-[64px]">
                  Checkout
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-8 lg:px-14">
          <div className="mx-auto grid max-w-[1820px] gap-8 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="mb-7 flex items-center gap-4">
                {["Shipping", "Payment", "Review & Place Order"].map(
                  (label, index) => (
                    <div key={label} className="flex flex-1 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-[6px] text-sm font-black ${
                          index === 0
                            ? "bg-[#0b3d2e] text-white"
                            : "bg-[#e7e7e2] text-[#6b7568]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="hidden text-sm font-bold text-[#102015] sm:block">
                        {label}
                      </span>
                      {index < 2 && (
                        <span className="h-px flex-1 bg-[#0b3d2e]/10" />
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5">
                <h2 className="mb-5 text-xl font-black text-[#102015]">
                  Shipping Information
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name *"
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none"
                  />

                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number *"
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none"
                  />

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address *"
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none sm:col-span-2"
                  />

                  <select
                    value={city}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Select District *</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>

                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    disabled={!city}
                    className="rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {city ? "Select Thana / Upazila *" : "Select district first"}
                    </option>
                    {(districtThanas[city] || []).map((thana) => (
                      <option key={thana} value={thana}>
                        {thana}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full Address *"
                    rows={3}
                    className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none sm:col-span-2"
                  />

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Order Note (optional)"
                    rows={2}
                    className="resize-none rounded-[6px] border border-[#0b3d2e]/10 bg-[#fafaf7] px-4 py-3 text-sm outline-none sm:col-span-2"
                  />
                </div>

                <div className="mt-6 rounded-[6px] border border-[#0b3d2e]/10 bg-[#f5f1e8] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black text-[#102015]">
                        Delivery Charge
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-[#4f5f49]">
                        {deliveryText}
                      </p>
                    </div>

                    <p className="text-xl font-black text-[#0b3d2e]">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </p>
                  </div>
                </div>

                {error && <p className="mt-5 text-sm text-red-500">{error}</p>}

                <button
                  type="button"
                  onClick={handleContinue}
                  className="mt-6 flex h-12 items-center justify-center gap-2 rounded-[6px] bg-[#0b3d2e] px-7 text-sm font-black uppercase text-white"
                >
                  Continue to Payment
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <aside className="h-fit rounded-[6px] border border-[#0b3d2e]/10 bg-white p-5 shadow-[0_10px_28px_rgba(11,61,46,0.08)] lg:sticky lg:top-[120px]">
              <div className="mb-5 flex items-center justify-between border-b border-[#0b3d2e]/10 pb-4">
                <h2 className="text-xl font-black text-[#102015]">
                  Order Summary
                </h2>
                <Link href="/cart" className="text-sm font-bold text-[#0b3d2e]">
                  Edit Cart
                </Link>
              </div>

              <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-[70px_1fr_auto] gap-3">
                    <div className="relative h-[70px] w-[70px] rounded-[6px] bg-[#f5f1e8]">
                      <Image
                        src={safeImage(item.image)}
                        alt={item.name}
                        fill
                        sizes="70px"
                        className="object-contain p-2"
                      />
                    </div>

                    <div>
                      <p className="line-clamp-2 text-sm font-black text-[#102015]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-[#4f5f49]">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-black text-[#102015]">
                      {formatPrice(Number(item.price) * Number(item.quantity))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-t border-[#0b3d2e]/10 pt-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#4f5f49]">Subtotal</span>
                  <span className="font-black">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#4f5f49]">Shipping</span>
                  <span className="font-black">
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>

                <div className="h-px bg-[#0b3d2e]/10" />

                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span className="text-[#0b3d2e]">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-5 flex gap-3 rounded-[6px] bg-[#f5f1e8] p-4">
                <ShieldCheck className="text-[#0b3d2e]" size={22} />
                <div>
                  <h4 className="text-sm font-black text-[#102015]">
                    Secure Checkout
                  </h4>
                  <p className="text-xs text-[#4f5f49]">
                    Your information is safe and secure.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <Footer />
      </motion.main>
    </>
  );
}