import { useDispatch, useSelector } from "react-redux";
import { clearFavorites } from "../features/favorites/favoritesSlice";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Heart, Trash2, HeartOff, ShoppingBag } from "lucide-react";

export default function Favorites() {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.favorites);

  const handleClearAll = () => {
    if (!window.confirm("Remove all favourites?")) return;
    dispatch(clearFavorites());
    toast.success("Favourites cleared");
  };

  return (
    <div className="bg-gray-50 min-h-[80vh]">
      <div className="w-full mx-auto px-4 md:px-12 py-10 pb-16">
        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3 m-0">
                {/* <Heart className="w-8 h-8 text-red-700 fill-red-700" /> */}
                My Favourites
                <span className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full border border-red-200 ml-2 shadow-sm">
                  {items.length}
                </span>
              </h1>
              <p className="text-gray-500 text-sm mt-2 font-medium">Products you have saved for later</p>
            </div>
            <button onClick={handleClearAll} className="flex items-center gap-2 bg-white border border-gray-200 text-red-700 px-5 py-2.5 rounded-xl cursor-pointer font-bold text-sm hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95">
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-24 bg-transparent w-full mx-auto">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <HeartOff className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">No favourites yet</h2>
            <p className="text-gray-500 text-base mb-8 max-w-md mx-auto">Keep track of your favorite designs and products by tapping the heart icon on any item.</p>
            <Link to="/products" className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              <ShoppingBag className="w-5 h-5" />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {items.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
