import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Package, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export default function OrderSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // If someone lands here directly without order state, send them to orders
  useEffect(() => {
    if (!state?.orderId) {
      navigate("/orders", { replace: true });
    }
  }, [state, navigate]);

  const orderId = state?.orderId || "";
  const shortId = orderId ? orderId.slice(-8).toUpperCase() : "";
  const paymentMethod = state?.paymentMethod || "razorpay";
  const totalPrice = state?.totalPrice;

  return (
    <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        {/* Success icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-500 text-base font-medium">
            {paymentMethod === "cod"
              ? "Your order has been placed. Pay on delivery."
              : "Your payment was confirmed and order is placed."}
          </p>
        </div>

        {/* Order ID card */}
        <div className="bg-white border-2 border-dashed border-red-200 rounded-2xl p-6 text-center mb-6 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Order ID</p>
          <p className="text-3xl font-black text-red-700 tracking-widest mb-1">#{shortId}</p>
          <p className="text-xs text-gray-400 font-medium">Save this ID to track your order</p>
          {totalPrice && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Amount Paid</p>
              <p className="text-xl font-black text-gray-900">₹{totalPrice.toLocaleString("en-IN")}</p>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
          <div className="flex gap-3 items-start">
            <Package className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 font-bold text-sm mb-1">What happens next?</p>
              <ul className="text-blue-700 text-xs space-y-1 leading-relaxed">
                <li>✉️ Order confirmation sent to your email</li>
                <li>⚙️ Our team will start processing your order</li>
                <li>🖨️ Your custom print will be prepared</li>
                <li>🚚 You'll receive a shipping update when dispatched</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <Link
            to="/orders"
            className="flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white px-6 py-4 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Package className="w-5 h-5" />
            View My Orders
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold text-base hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
