import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";
import { toggleFavorite, selectFavoriteIds } from "../features/favorites/favoritesSlice";
import { toast } from "react-toastify";
import { flyToCart } from "../utils/flyToCart";

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
       strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const Heart = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.7-7.7 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export default function ProductCard({ product, badge }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const imgRef = useRef(null);
  const favoriteIds = useSelector(selectFavoriteIds);
  const isFav = favoriteIds.has(product._id);
  const cardImage = product.images?.[0] || product.image || null;
  const isCustom = product.requiresCustomImage;
  const soldOut = !product.isAvailable;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addToCart({ ...product, quantity: 1 }));
    flyToCart(imgRef.current);
  };

  const handleFav = (e) => {
    e.stopPropagation();
    dispatch(toggleFavorite(product));
    toast.success(isFav ? "Removed from favourites" : "Added to favourites ❤️");
  };

  return (
    <div
      className="group flex flex-col h-full bg-white rounded-[20px] overflow-hidden cursor-pointer ring-1 ring-stone-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:ring-stone-300 hover:shadow-[0_22px_44px_-22px_rgba(0,0,0,0.28)] hover:-translate-y-1.5"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      {/* ── Image ── */}
      <div className="relative overflow-hidden aspect-[4/5] bg-[#F4F3F0]">
        <img
          ref={imgRef}
          src={cardImage || "https://placehold.co/400x500/f4f4f2/999?text=No+Image"}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.04]"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {badge && (
            <span className="bg-red-700 text-white text-[9px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full shadow-sm">
              {badge}
            </span>
          )}
          {isCustom && (
            <span className="bg-white/90 backdrop-blur-md text-red-700 text-[9px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full shadow-sm">
              Custom Print
            </span>
          )}
          {soldOut && (
            <span className="bg-stone-900/85 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Favourite */}
        <button
          onClick={handleFav}
          title={isFav ? "Remove from favourites" : "Add to favourites"}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.10)] flex items-center justify-center border-none cursor-pointer transition-all duration-200 hover:scale-110 ${
            isFav ? "text-red-600" : "text-stone-400 hover:text-red-600"
          }`}
        >
          <Heart filled={isFav} />
        </button>
      </div>

      {/* ── Info ── */}
      <div className="flex flex-col flex-1 px-4 pt-4 pb-4 md:px-5 md:pt-5 md:pb-5">
        <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-[0.16em] mb-2">
          {product.category}
        </p>
        <h3 className="font-display text-stone-900 text-[15px] md:text-[17px] font-bold leading-snug tracking-[-0.01em] line-clamp-2 mb-4">
          {product.name}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-display text-red-700 text-xl md:text-[26px] font-bold leading-none tracking-tight">
            ₹{product.price.toLocaleString()}
          </span>

          {soldOut ? (
            <span className="border border-stone-200 text-stone-400 text-[11px] md:text-xs font-semibold px-3.5 py-2 rounded-full whitespace-nowrap">
              Sold Out
            </span>
          ) : (
            <button
              onClick={isCustom ? (e) => { e.stopPropagation(); navigate(`/products/${product._id}`); } : handleAddToCart}
              className="inline-flex items-center gap-1.5 border border-stone-900 text-stone-900 bg-white text-[11px] md:text-xs font-semibold px-3.5 md:px-4 py-2 rounded-full whitespace-nowrap cursor-pointer transition-all duration-200 hover:bg-stone-900 hover:text-white"
            >
              {isCustom ? "Upload Design" : "Add to Cart"}
              <Chevron />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
