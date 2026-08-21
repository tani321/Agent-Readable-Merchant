"use client";

import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  name: string;
}

export default function RazorpayCheckout({
  orderId,
  amount,
  name,
}: RazorpayCheckoutProps) {
  const handlePayment = () => {
    if (!window.Razorpay) {
      alert("Razorpay Checkout is still loading. Please try again.");
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: "INR",
      name: "Agent-Readable Merchant",
      description: name,
      order_id: orderId,

      handler: async function (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) {
        try {
          const verificationResponse = await fetch(
            "/api/payments/verify",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(response),
            }
          );

          const result = await verificationResponse.json();

          if (result.verified) {
            alert("Payment verified successfully!");
          } else {
            alert("Payment verification failed.");
          }
        } catch (error) {
          console.error(error);
          alert("Could not verify payment.");
        }
      },

      modal: {
        ondismiss: function () {
          console.log("Razorpay checkout closed.");
        },
      },

      theme: {
        color: "#3399cc",
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on(
      "payment.failed",
      function (response: any) {
        console.error("Payment failed:", response.error);
        alert("Payment failed. Please try again.");
      }
    );

    razorpay.open();
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <button
        type="button"
        onClick={handlePayment}
        className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
      >
        Pay ₹{amount}
      </button>
    </>
  );
}