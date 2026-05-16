import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateQuantity, selectCartTotal, makeCartKey } from "../features/cart/cartSlice";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, AlertCircle, CheckCircle2, Minus, Plus, X, ArrowRight, ArrowLeft } from "lucide-react";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((s) => s.cart);
  const total = useSelector(selectCartTotal);
  const { user } = useSelector((s) => s.auth);

  if (items.length === 0) return (
    <div className="bg-gray-50 min-h-[70vh] flex flex-col items-center justify-center px-6 py-20">
      <div className="bg-transparent text-center w-full flex flex-col items-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <ShoppingCart className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 text-base mb-8">Looks like you haven't added any products yet.</p>
        <Link to="/products" className="inline-flex items-center gap-2 bg-red-700 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-red-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
          Start Shopping
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-[80vh]">
      <div className="w-full mx-auto px-4 md:px-10 py-10 pb-20">
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-200">
          <ShoppingCart className="w-8 h-8 text-red-700" />
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 m-0">Shopping Cart</h1>
          <span className="bg-white border border-gray-200 text-gray-600 text-sm font-bold px-3 py-1 rounded-full shadow-sm">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Items */}
          <div className="flex-1 min-w-0 w-full bg-transparent p-2 md:p-6">
            <div className="hidden md:flex items-center gap-4 pb-4 border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest px-4">
              <span className="flex-[2]">Product</span>
              <span className="w-32 text-center">Quantity</span>
              <span className="w-28 text-right">Total</span>
              <span className="w-12" />
            </div>
            
            <div className="flex flex-col divide-y divide-gray-100">
              {items.map((item) => {
                const key = makeCartKey(item._id, item.size);
                return (
                <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-gray-50 transition-colors rounded-2xl">
                  <div className="flex gap-4 flex-[2] min-w-0 w-full sm:w-auto">
                    <img src={item.image || "https://placehold.co/100x100/f5f5f5/999?text=Item"} alt={item.name}
                      className="w-24 h-24 object-cover rounded-2xl bg-gray-100 cursor-pointer shrink-0 border border-gray-200"
                      onClick={() => navigate(`/products/${item._id}`)} />
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="text-gray-900 font-bold text-base cursor-pointer mb-1 truncate hover:text-red-700 transition-colors" onClick={() => navigate(`/products/${item._id}`)}>{item.name}</p>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-gray-500 text-sm font-medium m-0">{item.category}</p>
                        {item.size && (
                          <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Size: {item.size}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm font-semibold">₹{item.price.toLocaleString()} <span className="text-gray-400 font-normal">each</span></p>

                      {item.requiresCustomImage && !item.uploadedImage && (
                        <div className="flex items-center gap-1.5 mt-2 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold w-fit border border-orange-100">
                          <AlertCircle className="w-3 h-3" /> Custom image required
                        </div>
                      )}
                      {item.uploadedImage && (
                        <div className="flex items-center gap-1.5 mt-2 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold w-fit border border-green-100">
                          <CheckCircle2 className="w-3 h-3" /> Custom image ready
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-6 sm:gap-0 mt-2 sm:mt-0">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-32 bg-white shadow-sm">
                      <button className="bg-gray-50 border-r border-gray-200 w-10 h-10 flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-red-700 transition-colors active:bg-gray-200"
                        onClick={() => dispatch(updateQuantity({ key, quantity: Math.max(1, item.quantity - 1) }))}>
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                      <button className="bg-gray-50 border-l border-gray-200 w-10 h-10 flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-red-700 transition-colors active:bg-gray-200"
                        onClick={() => dispatch(updateQuantity({ key, quantity: item.quantity + 1 }))}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="sm:w-28 sm:text-right font-black text-gray-900 text-lg sm:text-base">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>

                    <button className="sm:w-12 flex justify-end text-gray-400 hover:text-red-700 bg-transparent border-none cursor-pointer transition-colors p-2"
                      onClick={() => dispatch(removeFromCart(key))} title="Remove item">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="w-full lg:w-[340px] bg-transparent p-6 lg:sticky lg:top-28 shrink-0">
            <h2 className="text-lg font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Order Summary</h2>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Subtotal</span>
                <span className="text-gray-900 font-bold text-sm">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Shipping</span>
                <span className="text-green-700 font-bold text-sm bg-green-50 px-2 py-0.5 rounded border border-green-100">FREE</span>
              </div>
            </div>
            
            <div className="h-px bg-gray-200 mb-4" />
            
            <div className="flex justify-between items-center mb-8">
              <span className="font-black text-gray-900 text-base">Total</span>
              <span className="text-red-700 font-black text-2xl">₹{total.toLocaleString()}</span>
            </div>
            
            <button onClick={() => user ? navigate("/checkout") : navigate("/login")}
              className="w-full py-4 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-base cursor-pointer border-none transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
              {user ? "Proceed to Checkout" : "Login to Checkout"}
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <Link to="/products" className="flex items-center justify-center gap-2 text-gray-500 font-semibold text-sm mt-6 hover:text-red-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
