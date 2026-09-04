import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import logoImg from "../assets/logo.png";

const EyeBtn = ({ show, onToggle }) => (
  <button type="button" onClick={onToggle}
    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
    aria-label="Toggle password">
    {show
      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
      : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    }
  </button>
);

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm]           = useState({ name: "", email: "", phone: "", password: "" });
  const [showPass, setShowPass]   = useState(false);
  const [confirmPass, setConfirmPass] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);
  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (form.password !== confirmPass) { toast.error("Passwords do not match"); return; }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\s+/g, ""))) {
      toast.error("Enter a valid 10-digit Indian mobile number"); return;
    }
    dispatch(registerUser(form));
  };

  const inp = (extra = "") =>
    `w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all ${extra}`;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-5 py-10 sm:px-8">
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">

        {/* Logo — the full stacked lockup, wordmark and all */}
        <Link to="/" className="flex justify-center mb-7">
          <img src={logoImg} alt="Cloud Graphics — Visual Solution For Your Business" className="h-[84px] w-auto block" />
        </Link>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Create account ✨</h1>
          <p className="text-gray-400 text-sm mt-1">Takes less than a minute</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <input type="text" name="name" placeholder="Your full name" required
                value={form.name} onChange={handleChange} className={inp()} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <input type="email" name="email" placeholder="you@example.com" required
                value={form.email} onChange={handleChange} className={inp()} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
              Phone <span className="normal-case font-normal text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <input type="tel" name="phone" placeholder="+91 98765 43210"
                value={form.phone} onChange={handleChange} className={inp()} />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <input type={showPass ? "text" : "password"} name="password"
                placeholder="Min 6 characters" required
                value={form.password} onChange={handleChange} className={inp("pr-11")} />
              <EyeBtn show={showPass} onToggle={() => setShowPass(!showPass)} />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter password" required
                value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                className={inp(`pr-11 ${confirmPass && form.password !== confirmPass ? "!border-brand-400 !bg-brand-50" : ""}`)}
              />
              <EyeBtn show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
            </div>
            {confirmPass && form.password !== confirmPass && (
              <p className="text-brand-500 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-brand-800 hover:bg-brand-900 active:scale-[0.98] text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-200 !mt-5"
          >
            {loading
              ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating account...</>
              : "Create Account →"
            }
          </button>
        </form>

        {/* Terms */}
        <p className="text-gray-400 text-xs text-center mt-3 leading-relaxed">
          By registering you agree to our{" "}
          <Link to="/terms" className="text-brand-700 hover:underline">Terms</Link> &{" "}
          <Link to="/privacy" className="text-brand-700 hover:underline">Privacy Policy</Link>
        </p>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-800 font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
