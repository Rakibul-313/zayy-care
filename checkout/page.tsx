"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CheckoutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/nature-bg.png')" }}
      />

      <div className="fixed inset-0 -z-10 bg-[#f5f1e8]/70 backdrop-blur-[2px]" />

      <Navbar />

      <div className="pt-[175px] pb-20 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1820px] mx-auto space-y-10">
          <section className="glass rounded-[34px] p-8">
            <p className="text-[#556B2F] font-medium mb-2">Secure Checkout</p>
            <h1 className="dream-font text-[48px] sm:text-[64px] text-black">
              Checkout
            </h1>
          </section>

          <section className="grid lg:grid-cols-[1fr_420px] gap-10">
            <div className="glass rounded-[34px] p-8 space-y-6">
              <h2 className="text-3xl font-bold text-black">Delivery Info</h2>

              <input className="glass-soft w-full rounded-full px-5 py-4 outline-none" placeholder="Full Name" />
              <input className="glass-soft w-full rounded-full px-5 py-4 outline-none" placeholder="Phone Number" />
              <input className="glass-soft w-full rounded-full px-5 py-4 outline-none" placeholder="Email Address" />
              <textarea className="glass-soft w-full rounded-[24px] px-5 py-4 outline-none min-h-[140px]" placeholder="Full Address" />

              <div className="grid sm:grid-cols-2 gap-5">
                <input className="glass-soft rounded-full px-5 py-4 outline-none" placeholder="City" />
                <input className="glass-soft rounded-full px-5 py-4 outline-none" placeholder="Postal Code" />
              </div>
            </div>

            <aside className="glass rounded-[34px] p-8 h-fit sticky top-[150px]">
              <h2 className="text-3xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳0</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>৳120</span>
                </div>

                <div className="border-t border-black/10 pt-5 flex justify-between text-2xl font-bold text-black">
                  <span>Total</span>
                  <span>৳120</span>
                </div>
              </div>

              <button className="mt-8 w-full bg-[#556B2F] text-white rounded-full py-4 font-semibold premium-hover">
                Place Order
              </button>
            </aside>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}