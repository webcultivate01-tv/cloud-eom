import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import logoImg from "../assets/Cloud Graphics Logo New White.png";

const FEATURES = [
  { icon: "🎨", label: "Custom Designs" },
  { icon: "🚀", label: "Fast Delivery" },
  { icon: "💎", label: "Premium Quality" },
  { icon: "📦", label: "Order Tracking" },
];

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === "admin" ? "/admin/dashboard" : "/");
  }, [user, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="flex min-h-[calc(100vh-64px)]">

      {/* ════════════════════════════════
          LEFT PANEL  — desktop only
      ════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-shrink-0">

        {/* Full-bleed background — person holding custom printed mug */}
        <img
          src="https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=1260"
          alt="Custom gift printing"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Rich dark overlay — bottom-heavy so text pops */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/60 to-transparent" />

        {/* ── Top bar ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-10 pt-9 z-10">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Cloud Graphics" className="h-10 w-auto object-contain drop-shadow-lg" />
          </div>
          {/* Live badge */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-[10px] font-semibold tracking-wide">500+ Happy Customers</span>
          </div>
        </div>

        {/* ── Floating product cards ── */}
        {/* Mug card */}
        <div className="absolute top-24 right-10 z-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/25 rounded-2xl p-2 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
            <img
              src="https://images.pexels.com/photos/1566308/pexels-photo-1566308.jpeg?auto=compress&cs=tinysrgb&w=200"
              alt="Custom mug"
              className="w-20 h-20 rounded-xl object-cover object-center"
            />
            <p className="text-white text-[10px] font-bold text-center mt-1.5 tracking-wide">Custom Mug</p>
          </div>
        </div>

        {/* T-shirt card */}
        <div className="absolute top-52 right-6 z-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/25 rounded-2xl p-2 shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-500">
            <img
              src="https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=200"
              alt="Custom t-shirt"
              className="w-16 h-16 rounded-xl object-cover object-top"
            />
            <p className="text-white text-[10px] font-bold text-center mt-1.5 tracking-wide">Custom Tee</p>
          </div>
        </div>

        {/* ── Bottom content ── */}
          <div className="absolute bottom-0 left-0 right-0 px-10 pb-10 z-10 -translate-y-10">
          <h2 className="text-white text-4xl font-black leading-[1.15] mb-3 drop-shadow-lg">
            Print Your<br />
            <span className="text-red-300">Memories.</span><br />
            Gift Something<br />Special.
          </h2>
          <p className="text-white/65 text-sm leading-relaxed mb-7 max-w-sm">
            Personalized mugs, t-shirts, diaries & more — crafted with love in Amravati.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5">
                <span className="text-sm">{icon}</span>
                <span className="text-white/85 text-xs font-semibold">{label}</span>
              </div>
            ))}
          </div>

          {/* Rating row */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex -space-x-2">
              {[
                "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=60",
                "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60",
                "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=60",
              ].map((src, i) => (
                <img key={i} src={src} alt="customer"
                  className="w-8 h-8 rounded-full border-2 border-white/40 object-cover" />
              ))}
            </div>
            <div>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-xs">★</span>)}
              </div>
              <p className="text-white/55 text-[10px] mt-0.5">Trusted by 500+ customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          RIGHT PANEL — form (all screens)
      ════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center bg-white px-5 py-10 sm:px-8">
        <div className="w-full max-w-[360px]">

          {/* Logo — mobile only (desktop logo is in left panel top bar) */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="bg-red-800 rounded-2xl px-5 py-3 shadow-md">
              <img src={logoImg} alt="Cloud Graphics" className="h-10 w-auto object-contain" />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-full mb-4">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure Login
            </span>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">Welcome back 👋</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your Cloud Graphics account</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); dispatch(loginUser(form)); }} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  type="email" name="email" placeholder="you@example.com" required
                  value={form.email} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[11px] text-red-700 font-semibold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  type={showPass ? "text" : "password"} name="password"
                  placeholder="Enter your password" required
                  value={form.password} onChange={handleChange}
                  className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-red-800 hover:bg-red-900 active:scale-[0.98] text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-200 mt-2"
            >
              {loading
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in...</>
                : "Sign In →"
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-gray-400 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Guest CTA */}
          <Link to="/products"
            className="w-full py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-semibold hover:border-red-200 hover:text-red-700 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
            🛍️ Browse as Guest
          </Link>

          <p className="text-center text-gray-500 text-sm mt-5">
            New here?{" "}
            <Link to="/register" className="text-red-800 font-bold hover:underline">Create free account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
