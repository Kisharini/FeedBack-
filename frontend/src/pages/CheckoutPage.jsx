import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import {
  clearCart,
  getCartForRole,
  removeCartItem,
  updateCartItemQuantity,
} from "../lib/cart";
import { getCurrentUserFromStorage } from "../lib/auth";
import { checkoutOrder } from "../lib/marketplace";
import { navigateTo } from "../lib/navigation";

const paymentMethods = [
  { id: "FPX", label: "FPX Online Banking" },
  { id: "TOUCH_N_GO", label: "Touch 'n Go eWallet" },
  { id: "GRABPAY", label: "GrabPay" },
  { id: "BOOST", label: "Boost" },
  { id: "SHOPEEPAY", label: "ShopeePay" },
];

const DELIVERY_FEE = 800;

const formatMoney = (amount) => `RM ${(amount / 100).toFixed(2)}`;

export default function CheckoutPage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [items, setItems] = useState(() =>
    currentUser ? getCartForRole(currentUser.role) : []
  );
  const [deliveryOption, setDeliveryOption] = useState("SELF_PICKUP");
  const [paymentMethod, setPaymentMethod] = useState("FPX");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return;
    }

    if (!["INDIVIDUAL", "NGO"].includes(currentUser.role)) {
      setError("Only individual and NGO accounts can use the checkout flow.");
      return;
    }

    setItems(getCartForRole(currentUser.role));
  }, [currentUser]);

  const subtotalAmount = useMemo(
    () =>
      items.reduce((sum, item) => {
        const amount = item.snapshot?.unitPrice?.amount || 0;
        return sum + amount * item.quantity;
      }, 0),
    [items]
  );

  const deliveryFeeAmount = deliveryOption === "DELIVERY" ? DELIVERY_FEE : 0;
  const totalAmount = subtotalAmount + deliveryFeeAmount;

  const handleQuantityChange = (listingId, nextQuantity) => {
    if (!currentUser) return;

    const normalizedQuantity = Math.max(1, nextQuantity);
    const updatedItems = updateCartItemQuantity(
      currentUser.role,
      listingId,
      normalizedQuantity
    );
    setItems(updatedItems);
  };

  const handleRemove = (listingId) => {
    if (!currentUser) return;

    const updatedItems = removeCartItem(currentUser.role, listingId);
    setItems(updatedItems);
  };

  const handleCheckout = async () => {
    if (!currentUser) return;

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await checkoutOrder({
        items: items.map((item) => ({
          listingId: item.listingId,
          quantity: item.quantity,
        })),
        deliveryOption,
        paymentMethod,
        deliveryAddress: deliveryOption === "DELIVERY" ? deliveryAddress : undefined,
      });

      clearCart();
      navigateTo(`/marketplace/orders/${response.data.order.id}`);
    } catch (requestError) {
      setError(requestError.message);
      const nextFieldErrors = requestError.payload?.errors?.fieldErrors || {};
      setFieldErrors(nextFieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigateTo("/marketplace")}
            className="rounded-full border border-[#f59b27] bg-white px-4 py-2 text-sm text-[#445441] transition hover:bg-[#fff0d1]"
          >
            Continue Browsing
          </button>
          <button
            type="button"
            onClick={() => navigateTo("/marketplace/orders")}
           className="rounded-full border border-[#f59b27] bg-white px-4 py-2 text-sm text-[#445441] transition hover:bg-[#fff0d1]"
          >
            Track Order Status
          </button>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-[#e7eddc] bg-white p-6 shadow-level-1">
            <div className="flex flex-col gap-3 border-b border-[#edf1e6] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-label-md text-label-md uppercase tracking-[0.18em] text-[#f59b27]">
                  Checkout
                </p>
                <h1 className="mt-2 text-h1 text-[#213722]">
                  {currentUser?.role === "NGO" ? "Donation request checkout" : "CHECK OUT YOUR CART"}
                </h1>
              </div>
              <div className="rounded-full border border-[#f0d9b3] bg-[#fff6e8] px-4 py-2 text-sm text-[#8b5c16]">
                Mock payment enabled
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</div>
            )}

            {!items.length ? (
              <div className="mt-8 rounded-[1.6rem] border border-dashed border-[#d7dfcb] bg-[#fcfdf9] px-6 py-12 text-center">
                <p className="text-h2 text-[#243523]">Your cart is empty</p>
                <p className="mt-2 text-[#5f6d5b]">
                  Add some listings from the marketplace before checking out.
                </p>
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                {items.map((item) => (
                  <article
                    key={item.listingId}
                    className="rounded-[1.6rem] border border-[#ebefdf] bg-[#fbfdf8] p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.2rem] bg-[linear-gradient(135deg,#b6e67f_0%,#ffe7a2_100%)]">
                          {item.snapshot?.imageUrl ? (
                            <img
                              src={item.snapshot.imageUrl}
                              alt={item.snapshot.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[34px] text-[#335027]">
                              lunch_dining
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-[#213622]">
                            {item.snapshot?.title}
                          </p>
                          <p className="mt-1 text-sm text-[#627160]">
                            {item.snapshot?.vendorName}
                          </p>
                          <p className="mt-1 text-sm text-[#627160]">
                            {item.snapshot?.type === "DISCOUNTED"
                              ? item.snapshot.unitPrice.formatted
                              : "Free donation"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.listingId, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8e4cd]"
                          >
                            -
                          </button>
                          <span className="min-w-[24px] text-center font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.listingId, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8e4cd]"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.listingId)}
                          className="rounded-full border border-[#f1d1d1] px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] border border-[#dfe7d4] bg-[linear-gradient(180deg,#ffffff_0%,#f8fcf2_100%)] p-6 shadow-level-1">
            <h2 className="text-h2 text-[#223623]">Delivery & Payment</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-[1.5rem] border border-[#ebefdf] bg-white p-4">
                <p className="text-sm font-semibold text-[#2a4128]">Delivery Option</p>
                <div className="mt-4 grid gap-3">
                  {[
                    {
                      id: "SELF_PICKUP",
                      title: "Self Pickup",
                      desc:
                        "Pickup is free. After payment, the order status will show pickup readiness and instructions.",
                    },
                    {
                      id: "DELIVERY",
                      title: "Delivery",
                      desc:
                        "Delivery uses mocked rider assignment. Once payment is done, the system will progress through rider states and show a live mock map.",
                    },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`rounded-[1.2rem] border px-4 py-4 transition ${
                        deliveryOption === option.id
                          ? "border-primary bg-[#f4faea]"
                          : "border-[#e7eddc] bg-[#fcfdf9]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="deliveryOption"
                          value={option.id}
                          checked={deliveryOption === option.id}
                          onChange={(event) => {
                            setDeliveryOption(event.target.value);
                            setError("");
                            setFieldErrors({});
                          }}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold text-[#213822]">{option.title}</p>
                          <p className="mt-1 text-sm leading-6 text-[#627160]">{option.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {deliveryOption === "DELIVERY" && (
                <div className="rounded-[1.5rem] border border-[#ebefdf] bg-white p-4">
                  <label className="block text-sm font-semibold text-[#2a4128]">
                    Delivery Address
                  </label>
                  <textarea
                    rows="4"
                    value={deliveryAddress}
                    onChange={(event) => {
                      setDeliveryAddress(event.target.value);
                      setFieldErrors((current) => ({
                        ...current,
                        deliveryAddress: undefined,
                      }));
                    }}
                    className={`mt-3 w-full rounded-xl border bg-[#fbfdf7] px-4 py-3 text-on-surface outline-none transition focus:border-primary ${
                      fieldErrors.deliveryAddress?.length
                        ? "border-red-300"
                        : "border-[#d8e2d2]"
                    }`}
                    placeholder="Enter full address for the rider"
                  />
                  <p className="mt-2 text-xs leading-5 text-[#6a7768]">
                    Use at least 10 characters and include a clear address such as house or
                    unit number, street, and area.
                  </p>
                  {fieldErrors.deliveryAddress?.length ? (
                    <p className="mt-2 text-sm text-red-600">
                      {fieldErrors.deliveryAddress[0]}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="rounded-[1.5rem] border border-[#ebefdf] bg-white p-4">
                <p className="text-sm font-semibold text-[#2a4128]">Payment method</p>
                <div className="mt-4 grid gap-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`rounded-[1.1rem] border px-4 py-3 transition ${
                        paymentMethod === method.id
                          ? "border-primary bg-[#f4faea]"
                          : "border-[#e7eddc] bg-[#fcfdf9]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(event) => setPaymentMethod(event.target.value)}
                        />
                        <span className="text-sm font-medium text-[#263d25]">{method.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#f0d9b3] bg-[linear-gradient(135deg,#fff9ef_0%,#fff4df_100%)] p-5">
                <p className="text-sm font-semibold text-[#8c5d17]">Order summary</p>
                <div className="mt-4 space-y-3 text-sm text-[#6d532c]">
                  <SummaryRow label="Items subtotal" value={formatMoney(subtotalAmount)} />
                  <SummaryRow label="Delivery fee" value={formatMoney(deliveryFeeAmount)} />
                  <SummaryRow
                    label="Total"
                    value={formatMoney(totalAmount)}
                    emphasized
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={submitting || !items.length}
                  className="mt-5 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-[#f59b27] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Processing mock payment..." : "Pay & Confirm Order"}
                </button>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function SummaryRow({ label, value, emphasized = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className={emphasized ? "font-semibold text-[#523810]" : ""}>{label}</span>
      <span className={emphasized ? "font-semibold text-[#523810]" : ""}>{value}</span>
    </div>
  );
}
