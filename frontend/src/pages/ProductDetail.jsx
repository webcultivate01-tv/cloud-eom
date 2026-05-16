import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById, clearSelectedProduct } from "../features/products/productSlice";
import { addToCart } from "../features/cart/cartSlice";
import { toggleFavorite, selectFavoriteIds } from "../features/favorites/favoritesSlice";
import { toast } from "react-toastify";
import { Heart, HeartOff, Palette, Edit3, CheckCircle2, XCircle, Check, Minus, Plus, ShoppingCart, ShoppingBag, Printer, Package, Truck, RotateCcw, Scale, ChevronLeft, ChevronRight, Share2 } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct: product, loading } = useSelector((s) => s.products);
  const favoriteIds = useSelector(selectFavoriteIds);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { dispatch(fetchProductById(id)); return () => dispatch(clearSelectedProduct()); }, [dispatch, id]);
  useEffect(() => { setActiveIdx(0); }, [product?._id]);

  const images = product ? (product.images?.length ? product.images : product.image ? [product.image] : []) : [];

  const advance = useCallback(() => { if (images.length > 1) setActiveIdx((i) => (i + 1) % images.length); }, [images.length]);
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(advance, 3000);
    return () => clearInterval(t);
  }, [advance, images.length]);

  if (loading || !product) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-red-700 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-medium">Loading product details...</p>
    </div>
  );

  const isFav = favoriteIds.has(product._id);
  const hasDiscount = product.originalPrice > 0 && product.originalPrice > product.price;
  const discountPct = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const hasSpecs = product.specifications?.length > 0;
  const TABS = [{ key: "desc", label: "Description" }, ...(hasSpecs ? [{ key: "specs", label: "Specifications" }] : []), { key: "delivery", label: "Delivery & Returns" }];
  const currentImage = images[activeIdx] || "https://placehold.co/500x500/f5f5f5/999?text=Product";

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="w-full mx-auto px-4 md:px-12 py-8 md:py-12 pb-20">
        {/* Breadcrumb */}
        <div className="text-sm font-medium text-gray-500 mb-8 flex flex-wrap gap-2 items-center">
          <Link to="/" className="hover:text-red-700 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link to="/products" className="hover:text-red-700 transition-colors">Products</Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link to={`/products?category=${product.category}`} className="hover:text-red-700 transition-colors">{product.category}</Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="bg-transparent p-6 md:p-10">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* Image Gallery */}
            <div className="w-full lg:w-[500px] shrink-0">
              <div className="relative bg-white rounded-3xl overflow-hidden aspect-square border border-gray-100 shadow-sm group">
                <img src={currentImage} alt={product.name} className="w-full h-full object-cover transition-opacity duration-300" />
                
                {product.requiresCustomImage && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white text-center py-3.5 font-bold text-sm flex items-center justify-center gap-2">
                    <Palette className="w-4 h-4" /> Upload Your Design
                  </div>
                )}
                
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white font-black text-sm px-3 py-1.5 rounded-lg shadow-md">
                    {discountPct}% OFF
                  </div>
                )}
                
                {images.length > 1 && (
                  <>
                    <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 text-gray-900 border-none rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                      onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}>
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 text-gray-900 border-none rounded-full w-10 h-10 flex items-center justify-center shadow-md cursor-pointer z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                      onClick={() => setActiveIdx((i) => (i + 1) % images.length)}>
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {images.map((_, i) => (
                        <span key={i} onClick={() => setActiveIdx(i)} 
                          className={`h-2 rounded-full cursor-pointer transition-all ${i === activeIdx ? "w-6 bg-red-600 shadow-sm" : "w-2 bg-white/80 hover:bg-white shadow-sm"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {images.map((img, i) => (
                    <img key={i} src={img} alt={`view-${i}`} onClick={() => setActiveIdx(i)}
                      className={`w-20 h-20 object-cover rounded-xl cursor-pointer transition-all ${i === activeIdx ? "border-2 border-red-700 ring-2 ring-red-100 shadow-sm" : "border border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100"}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">{product.category}</span>
                {product.brand && <span className="text-red-700 text-sm font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100">by {product.brand}</span>}
                {product.sku && <span className="text-gray-400 text-xs font-medium">SKU: {product.sku}</span>}
              </div>

              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight flex-1 m-0">{product.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <button className="bg-gray-50 border border-gray-200 text-gray-500 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors shadow-sm shrink-0">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { dispatch(toggleFavorite(product)); toast.success(isFav ? "Removed from favourites" : "Added to favourites"); }}
                    className={`bg-gray-50 border rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors shadow-sm shrink-0 ${isFav ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100" : "border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-red-600"}`}>
                    {isFav ? <Heart className="w-5 h-5 fill-current" /> : <Heart className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-4 mb-6 pb-6 border-b border-gray-100">
                <span className="text-red-700 text-4xl font-black">₹{product.price.toLocaleString()}</span>
                {hasDiscount && (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-gray-400 text-xl line-through font-semibold">₹{product.originalPrice.toLocaleString()}</span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider">Save {discountPct}%</span>
                  </div>
                )}
              </div>

              {product.requiresCustomImage && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-4 mb-6">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                    <Palette className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-red-800 text-sm mb-1">Custom Design Required</p>
                    <p className="text-red-700/80 text-sm font-medium leading-relaxed m-0">You will need to upload your custom image or design during checkout.</p>
                  </div>
                </div>
              )}
              {product.allowCustomImage && !product.requiresCustomImage && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-4 mb-6">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-800 text-sm mb-1">Custom Design Optional</p>
                    <p className="text-blue-700/80 text-sm font-medium leading-relaxed m-0">You can upload a custom image during checkout, or proceed without one.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-5 mb-8">
                <div className={`inline-flex items-center gap-2 text-sm font-bold w-fit px-3 py-1.5 rounded-lg ${product.stock > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                  {product.stock > 0 ? <><CheckCircle2 className="w-4 h-4" /> In Stock ({product.stock} available)</> : <><XCircle className="w-4 h-4" /> Out of Stock</>}
                </div>

                {product.highlights?.length > 0 && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
                    {product.highlights.map((h, i) => (
                      <li key={i} className="text-gray-700 text-sm font-medium flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {product.stock > 0 && (
                <div className="flex items-center gap-5 mb-8 bg-gray-50 p-3 rounded-2xl w-fit border border-gray-100">
                  <span className="text-gray-600 font-bold text-sm ml-2">Quantity</span>
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="bg-gray-50/50 w-11 h-11 flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-red-700 transition-colors border-r border-gray-200 active:bg-gray-200">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-14 text-center font-black text-lg text-gray-900">{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="bg-gray-50/50 w-11 h-11 flex items-center justify-center cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-red-700 transition-colors border-l border-gray-200 active:bg-gray-200">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mb-8 mt-auto">
                <button onClick={() => { dispatch(addToCart({ ...product, quantity: qty })); toast.success(`${product.name} added to cart!`); }}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-red-700 text-red-700 bg-white rounded-xl font-bold text-base cursor-pointer hover:bg-red-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                  <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
                <button onClick={() => { dispatch(addToCart({ ...product, quantity: qty })); navigate("/cart"); }}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-red-700 bg-red-700 text-white rounded-xl font-bold text-base cursor-pointer hover:bg-red-800 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                  <ShoppingBag className="w-5 h-5" /> Buy Now
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-gray-100">
                {[
                  { icon: Printer, text: "Premium printing" },
                  { icon: Package, text: "Secure packaging" },
                  { icon: Truck, text: "Fast delivery" },
                  { icon: RotateCcw, text: "Easy returns" }
                ].map((b, i) => (
                  <div key={i} className="flex flex-col items-center justify-center text-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <b.icon className="w-5 h-5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600">{b.text}</span>
                  </div>
                ))}
              </div>

              {product.weight && (
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-xs font-medium">
                  <Scale className="w-3.5 h-3.5" /> Weight: <strong className="text-gray-700">{product.weight}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 bg-transparent p-6 md:p-10">
          <div className="flex border-b-2 border-gray-100 mb-8 overflow-x-auto custom-scrollbar gap-2">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-6 py-4 border-none bg-transparent font-bold text-sm cursor-pointer whitespace-nowrap transition-all relative
                  ${tab === key ? "text-red-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-xl"}`}>
                {label}
                {tab === key && <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-red-700 rounded-t-full" />}
              </button>
            ))}
          </div>
          <div className="max-w-4xl mx-auto">
            {tab === "desc" && (
              <div className="prose prose-sm md:prose-base prose-red max-w-none text-gray-600 leading-loose">
                <p>{product.description}</p>
              </div>
            )}
            
            {tab === "specs" && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {product.specifications.map((sp, i) => (
                      <tr key={i} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-6 py-4 text-gray-900 font-bold w-1/3 md:w-1/4 border-r border-gray-100 align-top">{sp.key}</td>
                        <td className="px-6 py-4 text-gray-600 leading-relaxed">{sp.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {tab === "delivery" && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg m-0">Delivery Details</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed m-0 font-medium">3–5 business days in Amravati. 5–7 days for other Maharashtra locations. Express shipping options available at checkout.</p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg m-0">Return Policy</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed m-0 font-medium">{product.returnPolicy || "Custom printed products are non-returnable unless defective. Standard products can be returned within 7 days in original packaging."}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
